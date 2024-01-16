import { InputOptions } from '@actions/core';

type GetInput = (name: string, options?: InputOptions | undefined) => string;

interface Inputs {
  token: string;
}

export const parseInputs = (getInput: GetInput): Inputs => {
  const token = getInput('token', { required: true });
  console.log(token);

  return { token: token };
};
