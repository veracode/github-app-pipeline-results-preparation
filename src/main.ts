import * as core from '@actions/core';
import { parseInputs } from './inputs';

/**
 * Runs the action.
 */
export async function run(): Promise<void> {
  const inputs = parseInputs(core.getInput);
  console.log(inputs);
  console.log(inputs.token);
}
