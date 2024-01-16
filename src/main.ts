import * as core from '@actions/core';
import { parseInputs } from './inputs';
import * as http from './api/http-request';
// import { Octokit } from '@octokit/rest';
import * as fs from 'fs/promises';
import * as VeracodePipelineResult from './namespaces/VeracodePipelineResult';
import * as VeracodePolicyResult from './namespaces/VeracodePolicyResult';
import * as VeracodeApplication from './namespaces/VeracodeApplication';
import appConfig from './app-config';

/**
 * Runs the action.
 */
export async function run(): Promise<void> {
  const inputs = parseInputs(core.getInput);
  console.log(inputs.token);

  let findingsArray: VeracodePipelineResult.Finding[] = [];

  try {
    const data = await fs.readFile('filtered_results.json', 'utf-8');
    const parsedData: VeracodePipelineResult.ResultsData = JSON.parse(data);
    findingsArray = parsedData.findings;
  } catch (error) {
    core.debug(`Error reading or parsing filtered_results.json:${error}`);
    core.setFailed('Error reading or parsing pipeline scan results.');
  }

  // TODO: if no findings, update the checks status to success
  console.log(findingsArray.length); // Access and process the findings array
  
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
    core.setFailed(`Multiple applications found with name ${inputs.appname}`);
    return;
  }

  const applicationGuid = applications[0].guid;
  const getPolicyFindingsByApplicationResource = {
    resourceUri: `${appConfig.findingsUri}/${applicationGuid}/findings`,
    queryAttribute: 'size',
    queryValue: '500',
  }

  const policyFindingsResponse: VeracodePolicyResult.ResultsData = await http.getResourceByAttribute
    <VeracodePolicyResult.ResultsData>(inputs.vid, inputs.vkey, getPolicyFindingsByApplicationResource);

  // What if no policy scan?
  const policyFindings = policyFindingsResponse._embedded.findings;
  core.info(`Policy findings: ${policyFindings.length}`);

  // filter out policy findings based on violates_policy = true and finding_status.status = "CLOSED" and resolution = "POTENTIAL_FALSE_POSITIVE" or "MITIGATED" and resolution_status = "APPROVED"
  const filteredFindings = policyFindings.filter((finding) => {
    return finding.violates_policy === true && finding.finding_status.status === 'CLOSED' && (finding.finding_status.resolution === 'POTENTIAL_FALSE_POSITIVE' || finding.finding_status.resolution === 'MITIGATED') && finding.finding_status.resolution_status === 'APPROVED';
  });

  filteredFindings.forEach((finding) => {
    console.log(finding);
  });

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
