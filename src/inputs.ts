import { InputOptions } from '@actions/core';

type GetInput = (name: string, options?: InputOptions | undefined) => string;

enum Actions {
  GetPolicyNameByProfileName = 'getPolicyNameByProfileName',
  PreparePipelineResults = 'preparePipelineResults',
  PreparePolicyResults = 'preparePolicyResults',
}

export type Inputs = {
  action: Actions;
  vid: string;
  vkey: string;
  appname: string;
  token: string;
  check_run_id: number;
  source_repository: string;
};

export const parseInputs = (getInput: GetInput): Inputs => {
  const action = getInput('action', { required: true }) as Actions;

  // Validate the action value
  if (!Object.values(Actions).includes(action)) {
    throw new Error(`Invalid action: ${action}. It must be one of '${Object.values(Actions).join('\' or \'')}'.`);
  }

  const vid = getInput('vid', { required: true });
  const vkey = getInput('vkey', { required: true });
  const appname = getInput('appname', { required: true });

  const token = getInput('token');
  const check_run_id = getInput('check_run_id');
  const source_repository = getInput('source_repository');

  if (source_repository && source_repository.split('/').length !== 2) {
    throw new Error('source_repository needs to be in the {owner}/{repo} format');
  }

  return { action, token, check_run_id: +check_run_id, vid, vkey, appname, source_repository };
};
