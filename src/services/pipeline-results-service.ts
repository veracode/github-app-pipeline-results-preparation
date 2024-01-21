import * as core from '@actions/core';
import { Octokit } from '@octokit/rest';
import * as fs from 'fs/promises';
import * as Checks from '../namespaces/Checks';
import * as VeracodePipelineResult from '../namespaces/VeracodePipelineResult';
import { Inputs } from '../inputs';
import { updateChecks } from './check-service';
import { getApplicationByName } from './application-service';
import { getApplicationFindings } from './findings-service';

const LINE_NUMBER_SLOP = 3; //adjust to allow for line number movement

export async function preparePipelineResults(inputs: Inputs): Promise<void> {
  const repo = inputs.source_repository.split('/');
  const ownership = {
    owner: repo[0],
    repo: repo[1],
  };

  const checkStatic: Checks.ChecksStatic = {
    owner: ownership.owner,
    repo: ownership.repo,
    check_run_id: inputs.check_run_id,
    status: Checks.Status.Completed,
  };

  const octokit = new Octokit({
    auth: inputs.token,
  });




  let findingsArray: VeracodePipelineResult.Finding[] = [];

  try {
    const data = await fs.readFile('filtered_results.json', 'utf-8');
    const parsedData: VeracodePipelineResult.ResultsData = JSON.parse(data);
    findingsArray = parsedData.findings;
  } catch (error) {
    core.debug(`Error reading or parsing filtered_results.json:${error}`);
    core.setFailed('Error reading or parsing pipeline scan results.');
    // TODO: Based on the veracode.yml, update the checks status to failure or pass
    await updateChecks(
      octokit, checkStatic, Checks.Conclusion.Failure, [], 'Error reading or parsing pipeline scan results.'
    );
    return;
  }

  core.info(`Pipeline findings: ${findingsArray.length}`);

  if (findingsArray.length === 0) {
    core.info('No pipeline findings, exiting and update the github check status to success');
    // update inputs.check_run_id status to success
    await updateChecks(octokit, checkStatic, Checks.Conclusion.Success, [], 'No pipeline findings');
    return;
  }

  const application = await getApplicationByName(inputs.appname, inputs.vid, inputs.vkey);
  const applicationGuid = application.guid;

  const policyFindings = await getApplicationFindings(applicationGuid, inputs.vid, inputs.vkey);

  // What if no policy scan?
  core.info(`Policy findings: ${policyFindings.length}`);

  // filter out policy findings based on violates_policy = true and finding_status.status = "CLOSED" and
  // resolution = "POTENTIAL_FALSE_POSITIVE" or "MITIGATED" and resolution_status = "APPROVED"
  const mitigatedPolicyFindings = policyFindings.filter((finding) => {
    return (
      finding.violates_policy === true &&
      finding.finding_status.status === 'CLOSED' &&
      (finding.finding_status.resolution === 'POTENTIAL_FALSE_POSITIVE' ||
        finding.finding_status.resolution === 'MITIGATED') &&
      finding.finding_status.resolution_status === 'APPROVED'
    );
  });

  core.info(`Mitigated policy findings: ${mitigatedPolicyFindings.length}`);

  // Remove item in findingsArray if there are item in mitigatedPolicyFindings if the file_path and
  // cwe_id and line_number are the same
  const filteredFindingsArray = findingsArray.filter((finding) => {
    return !mitigatedPolicyFindings.some((mitigatedFinding) => {
      return (
        finding.files.source_file.file === mitigatedFinding.finding_details.file_path &&
        +finding.cwe_id === mitigatedFinding.finding_details.cwe.id &&
        Math.abs(finding.files.source_file.line - mitigatedFinding.finding_details.file_line_number) <= LINE_NUMBER_SLOP
      );
    });
  });

  core.info(`Filtered pipeline findings: ${filteredFindingsArray.length}`);

  if (filteredFindingsArray.length === 0) {
    core.info('No pipeline findings after filtering, exiting and update the github check status to success');
    // update inputs.check_run_id status to success
    await updateChecks(octokit, checkStatic, Checks.Conclusion.Success, [], 'No pipeline findings');
    return;
  } else {

    // use octokit to check the language of the source repository. If it is a java project, then
    // use octokit to check if the source repository is using java maven or java gradle
    // if so, filePathPrefix = 'src/main/java/'
    const repoResponse = await octokit.repos.get(ownership);
    const language = repoResponse.data.language;
    core.info(`Source repository language: ${language}`);

    let filePathPrefix = '';
    let pomFileExists = false;
    let gradleFileExists = false;

    if (language === 'Java') {
      try {
        const [pomResponse, gradleResponse] = await Promise.all([
          octokit.repos.getContent({ ...ownership, path: 'pom.xml' }),
          octokit.repos.getContent({ ...ownership, path: 'build.gradle' }),
        ]);

        pomFileExists = !!pomResponse.data; // Check existence based on response data
        gradleFileExists = !!gradleResponse.data;

        if (pomFileExists || gradleFileExists) {
          filePathPrefix = 'src/main/java'; // Update prefix if either file exists
        }

      } catch (error) {
        core.debug(`Error checking for files: ${error}`);
      }
    }

    // if (language === 'Java') {
    //   let pomFileExists = false;
    //   let gradleFileExists = false;
    //   try {
    //     await octokit.repos.getContent({ ...ownership, path: 'pom.xml' });
    //     pomFileExists = true;
    //   } catch (error) {
    //     core.debug(`Error reading or parsing source repository:${error}`);
    //   }
    //   try {
    //     await octokit.repos.getContent({ ...ownership, path: 'build.gradle' });
    //     gradleFileExists = true;
    //   } catch (error) {
    //     core.debug(`Error reading or parsing source repository:${error}`);
    //   }
    //   if (pomFileExists || gradleFileExists) {
    //     filePathPrefix = 'src/main/java'; // Update prefix if either file exists
    // }

    core.info('Pipeline findings after filtering, continue to update the github check status to failure');
    await updateChecks(
      octokit,
      checkStatic,
      Checks.Conclusion.Failure,
      getAnnotations(filteredFindingsArray, filePathPrefix),
      'Here\'s the summary of the scan result.',
    );
  }
}

function getAnnotations(
  pipelineFindings: VeracodePipelineResult.Finding[], 
  filePathPrefix:string
): Checks.Annotation[] {
  const annotations: Checks.Annotation[] = [];
  pipelineFindings.forEach(function (element) {
    const displayMessage = element.display_text
      .replace(/<span>/g, '')
      .replace(/<\/span> /g, '\n')
      .replace(/<\/span>/g, '');
    const message =
      `Filename: ${filePathPrefix}${element.files.source_file.file}\n` +
      `Line: ${element.files.source_file.line}\n` +
      `CWE: ${element.cwe_id} (${element.issue_type})\n\n${displayMessage}`;

    annotations.push({
      path: `${filePathPrefix}${element.files.source_file.file}`,
      start_line: element.files.source_file.line,
      end_line: element.files.source_file.line,
      annotation_level: 'warning',
      title: element.issue_type,
      message: message,
    });
  });
  return annotations;
}