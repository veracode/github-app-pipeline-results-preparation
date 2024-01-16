import * as core from '@actions/core';
import { parseInputs } from './inputs';
import { Octokit } from '@octokit/rest';

/**
 * Runs the action.
 */
export async function run(): Promise<void> {
  const inputs = parseInputs(core.getInput);
  console.log(inputs);
  console.log(inputs.token);
  const octokit = new Octokit({
    auth: inputs.token,
  });

  core.debug('Setting up OctoKit...');
  // const octokit = github.getOctokit(inputs.token);

  const ownership = {
    owner: 'veracode-github-app-new',
    repo: 'veracode'
  };

  // get artifacts in a workflow run
  const { data } = await octokit.actions.listWorkflowRunArtifacts({
    owner: ownership.owner,
    repo: 'veracode',
    run_id: inputs.run_id,
  });
  console.log(data);


  // const { data } = await octokit.repos.listForOrg({
  //   org: 'vincent-deng',
  //   type: 'public',
  // });
}
