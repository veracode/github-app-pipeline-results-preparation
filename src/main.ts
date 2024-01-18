import * as core from '@actions/core';
import { Octokit } from '@octokit/rest';
import * as fs from 'fs/promises';
import * as VeracodePipelineResult from './namespaces/VeracodePipelineResult';
import * as VeracodePolicyResult from './namespaces/VeracodePolicyResult';
import * as VeracodeApplication from './namespaces/VeracodeApplication';
import * as Checks from './namespaces/Checks';
import { updateChecks } from './checks';
import { parseInputs } from './inputs';
import * as http from './api/http-request';
import appConfig from './app-config';

const LINE_NUMBER_SLOP = 3; //adjust to allow for line number movement

/**
 * Runs the action.
 */
export async function run(): Promise<void> {
  const inputs = parseInputs(core.getInput);
  console.log(inputs.event_trigger);

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

  let findingsArray: VeracodePipelineResult.Finding[] = [];

  try {
    const data = await fs.readFile('filtered_results.json', 'utf-8');
    const parsedData: VeracodePipelineResult.ResultsData = JSON.parse(data);
    findingsArray = parsedData.findings;
  } catch (error) {
    core.debug(`Error reading or parsing filtered_results.json:${error}`);
    core.setFailed('Error reading or parsing pipeline scan results.');
    return;
  }

  const octokit = new Octokit({
    auth: inputs.token,
  });

  // TODO: if no findings, update the checks status to success
  core.info(`Pipeline findings: ${findingsArray.length}`);

  if (findingsArray.length === 0) {
    core.info('No pipeline findings, exiting and update the github check status to success');
    // update inputs.check_run_id status to success
    await updateChecks(octokit, checkStatic, Checks.Conclusion.Success, [], 'No pipeline findings');
    return;
  }

  const getApplicationByNameResource = {
    resourceUri: appConfig.applicationUri,
    queryAttribute: 'name',
    queryValue: encodeURIComponent(inputs.appname),
  };

  const applicationResponse: VeracodeApplication.ResultsData =
    await http.getResourceByAttribute<VeracodeApplication.ResultsData>(
      inputs.vid,
      inputs.vkey,
      getApplicationByNameResource,
    );
  const applications = applicationResponse._embedded.applications;
  if (applications.length === 0) {
    core.setFailed(`No application found with name ${inputs.appname}`);
    return;
  } else if (applications.length > 1) {
    core.info(`Multiple applications found with name ${inputs.appname}, selecting the first found`);
  }

  const applicationGuid = applications[0].guid;

  // TODO: consider the number of findings spreads more than 1 page
  const getPolicyFindingsByApplicationResource = {
    resourceUri: `${appConfig.findingsUri}/${applicationGuid}/findings`,
    queryAttribute: 'size',
    queryValue: '1000',
  };

  const policyFindingsResponse: VeracodePolicyResult.ResultsData =
    await http.getResourceByAttribute<VeracodePolicyResult.ResultsData>(
      inputs.vid,
      inputs.vkey,
      getPolicyFindingsByApplicationResource,
    );

  // What if no policy scan?
  const policyFindings = policyFindingsResponse._embedded.findings;
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
    core.info('Pipeline findings after filtering, continue to update the github check status to failure');
    await updateChecks(
      octokit,
      checkStatic,
      Checks.Conclusion.Failure,
      getAnnotations(filteredFindingsArray),
      'Here\'s the summary of the scan result.',
    );
  }
}

function getAnnotations(pipelineFindings: VeracodePipelineResult.Finding[]): Checks.Annotation[] {
  const filePathPrefix = 'src/main/java/';
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
