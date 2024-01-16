import * as core from '@actions/core';
import { parseInputs } from './inputs';
// import { Octokit } from '@octokit/rest';
import * as fs from 'fs/promises';
import * as VeracodePipelineResult from './namespaces/VeracodePipelineResult';
import * as http from './api/http-request';

/**
 * Runs the action.
 */
export async function run(): Promise<void> {
  const inputs = parseInputs(core.getInput);
  console.log(inputs.token);

  try {
    const data = await fs.readFile('filtered_results.json', 'utf-8');
    const parsedData: VeracodePipelineResult.ResultsData = JSON.parse(data);
    const findingsArray = parsedData.findings;

    console.log(findingsArray.length); // Access and process the findings array
    findingsArray.forEach((finding) => {
      console.log(finding.cwe_id);
      console.log(finding.files);
    });
  } catch (error) {
    core.debug(`Error reading or parsing filtered_results.json:${error}`);
    core.setFailed('Error reading or parsing pipeline scan results.');
  }

  const resource = {
    resourceUri: '/appsec/v1/applications',
    queryAttribute: 'name',
    queryValue: encodeURIComponent(inputs.appname),
  };

  await http.getResourceByAttribute(inputs.vid, inputs.vkey, resource);

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
