import { InputOptions } from '@actions/core';

type GetInput = (name: string, options?: InputOptions | undefined) => string;

type Inputs = {
  token: string;
  vid: string;
  vkey: string;
  run_id: number;
  appname: string;
};

export const parseInputs = (getInput: GetInput): Inputs => {
  const token = getInput('token', { required: true });
  const run_id = getInput('run_id', { required: true });
  const vid = getInput('vid', { required: true });
  const vkey = getInput('vkey', { required: true });
  const appname = getInput('appname', { required: true });

  return { token: token, run_id: +run_id, vid: vid, vkey: vkey, appname: appname };
};
