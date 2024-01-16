import * as core from '@actions/core';
import { parseInputs } from './inputs';
// import { Octokit } from '@octokit/rest';
import * as fs from 'fs/promises';

// Interface for the data structure in results.json

interface File {
  source_file: {
    file: string;
    line: number;
    function_name: string;
  }
}
interface Finding {
  // Define the properties of a single finding
  title: string;
  issue_id: number;
  severity: number;
  issue_type_id: string;
  issue_type: string;
  cwe_id: string;
  files: File;
}
interface ResultsData {
  scan_id: string;
  modules: string[];
  findings: Finding[]; // Adjust the type of findings array if needed
}

/**
 * Runs the action.
 */
export async function run(): Promise<void> {
  const inputs = parseInputs(core.getInput);
  console.log(inputs);
  console.log(inputs.token);

  try {
    const data = await fs.readFile('filtered_results.json', 'utf-8');
    const parsedData: ResultsData = JSON.parse(data);
    const findingsArray = parsedData.findings;

    console.log(findingsArray.length); // Access and process the findings array
    // iterate findingsArray to display attribute cwe_id
    findingsArray.forEach((finding) => {
      console.log(finding.cwe_id);
      console.log(finding.files);
    });

  } catch (error) {
    console.error('Error reading or parsing filtered_results.json:', error);
  }
  // const octokit = new Octokit({
  //   auth: inputs.token,
  // });

  // core.debug('Setting up OctoKit...');
  // // const octokit = github.getOctokit(inputs.token);

  // const ownership = {
  //   owner: 'veracode-github-app-new',
  //   repo: 'veracode'
  // };

  // // get artifacts in a workflow run
  // const { data } = await octokit.actions.listWorkflowRunArtifacts({
  //   owner: ownership.owner,
  //   repo: 'veracode',
  //   run_id: inputs.run_id,
  // });
  // console.log(data);
}
