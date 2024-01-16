import { InputOptions } from '@actions/core';

type GetInput = (name: string, options?: InputOptions | undefined) => string;

type Inputs = {
  token: string;
  vid: string;
  vkey: string;
  check_run_id: number;
  appname: string;
  source_repository: string;
};

export const parseInputs = (getInput: GetInput): Inputs => {
  const token = getInput('token', { required: true });
  const check_run_id = getInput('check_run_id', { required: true });
  const vid = getInput('vid', { required: true });
  const vkey = getInput('vkey', { required: true });
  const appname = getInput('appname', { required: true });
  const source_repository = getInput('source_repository', { required: true });

  if (source_repository && source_repository.split('/').length !== 2) {
    throw new Error('source_repository needs to be in the {owner}/{repo} format');
  }

  return { token, check_run_id: +check_run_id, vid, vkey, appname, source_repository };
};
