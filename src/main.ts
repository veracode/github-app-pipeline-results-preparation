import * as core from '@actions/core';
import { parseInputs } from './inputs';
import * as http from './api/http-request';
import { Octokit } from '@octokit/rest';
import * as fs from 'fs/promises';
import * as VeracodePipelineResult from './namespaces/VeracodePipelineResult';
import * as VeracodePolicyResult from './namespaces/VeracodePolicyResult';
import * as VeracodeApplication from './namespaces/VeracodeApplication';
import appConfig from './app-config';

const LINE_NUMBER_SLOP = 3 //adjust to allow for line number movement

export enum Conclusion {
  Success = 'success',
  Failure = 'failure',
  Neutral = 'neutral',
  Cancelled = 'cancelled',
  TimedOut = 'timed_out',
  ActionRequired = 'action_required',
  Skipped = 'skipped',
}

export enum Status {
  Queued = 'queued',
  InProgress = 'in_progress',
  Completed = 'completed',
}

/**
 * Runs the action.
 */
export async function run(): Promise<void> {
  const inputs = parseInputs(core.getInput);
  console.log(inputs.source_repository);

  const repo = inputs.source_repository.split('/');
  const ownership = {
    owner: repo[0],
    repo: repo[1],
  }

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
    const data = {
      owner: ownership.owner,
      repo: ownership.repo,
      check_run_id: inputs.check_run_id,
      status: Status.Completed,
      conclusion: Conclusion.Success,
    }
    await octokit.checks.update(data);
    return;
  }

  const data = {
    owner: ownership.owner,
    repo: ownership.repo,
    check_run_id: inputs.check_run_id,
    status: Status.Completed,
    conclusion: Conclusion.Failure,
  }
  await octokit.checks.update(data);
  
  const getApplicationByNameResource = {
    resourceUri: appConfig.applicationUri,
    queryAttribute: 'name',
    queryValue: encodeURIComponent(inputs.appname),
  };

  const applicationResponse: VeracodeApplication.ResultsData = await http.getResourceByAttribute
    <VeracodeApplication.ResultsData>(inputs.vid, inputs.vkey, getApplicationByNameResource);
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
  }

  const policyFindingsResponse: VeracodePolicyResult.ResultsData = await http.getResourceByAttribute
    <VeracodePolicyResult.ResultsData>(inputs.vid, inputs.vkey, getPolicyFindingsByApplicationResource);

  // What if no policy scan?
  const policyFindings = policyFindingsResponse._embedded.findings;
  core.info(`Policy findings: ${policyFindings.length}`);

  // filter out policy findings based on violates_policy = true and finding_status.status = "CLOSED" and 
  // resolution = "POTENTIAL_FALSE_POSITIVE" or "MITIGATED" and resolution_status = "APPROVED"
  const mitigatedPolicyFindings = policyFindings.filter((finding) => {
    return finding.violates_policy === true 
      && finding.finding_status.status === 'CLOSED' 
      && (finding.finding_status.resolution === 'POTENTIAL_FALSE_POSITIVE' 
        || finding.finding_status.resolution === 'MITIGATED') 
      && finding.finding_status.resolution_status === 'APPROVED';
  });

  core.info(`Mitigated policy findings: ${mitigatedPolicyFindings.length}`);

  // Remove item in findingsArray if there are item in mitigatedPolicyFindings if the file_path and 
  // cwe_id and line_number are the same
  const filteredFindingsArray = findingsArray.filter((finding) => {
    return !mitigatedPolicyFindings.some((mitigatedFinding) => {
      return finding.files.source_file.file === mitigatedFinding.finding_details.file_path 
        && +finding.cwe_id === mitigatedFinding.finding_details.cwe.id 
        && Math.abs(
          finding.files.source_file.line - mitigatedFinding.finding_details.file_line_number
        ) <= LINE_NUMBER_SLOP;
    });
  });

  core.info(`Filtered pipeline findings: ${filteredFindingsArray.length}`);


  // const octokit = new Octokit({
  //   auth: inputs.token,
  // });

  // core.debug('Setting up OctoKit...');
  // // const octokit = github.getOctokit(inputs.token);

  // const ownership = {
  //   owner: 'veracode-github-app-new',
  //   repo: 'veracode'
  // };

  // // get artifacts in a workflow run
  // const { data } = await octokit.actions.listWorkflowRunArtifacts({
  //   owner: ownership.owner,
  //   repo: 'veracode',
  //   run_id: inputs.run_id,
  // });
  // console.log(data);
}
