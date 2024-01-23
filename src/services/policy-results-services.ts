import * as core from '@actions/core';
import * as fs from 'fs/promises';
import { Inputs } from '../inputs';

export async function preparePolicyResults(inputs: Inputs): Promise<void> {
  console.log(inputs);
  let data1;
  let data2;
  try {
    data1 = await fs.readFile('policy_flaws.json', 'utf-8');
    data2 = await fs.readFile('results_url.txt', 'utf-8');
  } catch (error) {
    core.debug(`Error reading or parsing filtered_results.json:${error}`);
    core.setFailed('Error reading or parsing pipeline scan results.');
  }

  console.log(data1);
  console.log(data2);

}