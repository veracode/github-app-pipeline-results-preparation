import { InputOptions } from '@actions/core';

type GetInput = (name: string, options?: InputOptions | undefined) => string;

interface Inputs {
  token: string;
  run_id: number;
}

export const parseInputs = (getInput: GetInput): Inputs => {
  const token = getInput('token', { required: true });
  const run_id = getInput('run_id', { required: true });

  return { token: token, run_id: +run_id };
};
