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

  const { data } = await octokit.repos.listForOrg({
    org: 'vincent-deng',
    type: 'public',
  });

  console.log(data);
}
