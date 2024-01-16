import { InputOptions } from '@actions/core';

type GetInput = (name: string, options?: InputOptions | undefined) => string;

type Inputs = {
  token: string;
  vid: string;
  vkey: string;
  check_run_id: number;
  appname: string;
};

export const parseInputs = (getInput: GetInput): Inputs => {
  const token = getInput('token', { required: true });
  const check_run_id = getInput('check_run_id', { required: true });
  const vid = getInput('vid', { required: true });
  const vkey = getInput('vkey', { required: true });
  const appname = getInput('appname', { required: true });

  return { token: token, check_run_id: +check_run_id, vid: vid, vkey: vkey, appname: appname };
};
