import * as core from '@actions/core';
import { Octokit } from '@octokit/rest';
import * as fs from 'fs/promises';
import { Inputs } from '../inputs';
import * as VeracodePolicyResult from '../namespaces/VeracodePolicyResult';
import * as Checks from '../namespaces/Checks';
import { updateChecks } from './check-service';

export async function preparePolicyResults(inputs: Inputs): Promise<void> {
  const repo = inputs.source_repository.split('/');
  const ownership = {
    owner: repo[0],
    repo: repo[1],
  };

  const checkStatic: Checks.ChecksStatic = {
    owner: ownership.owner,
    repo: ownership.repo,
    check_run_id: inputs.check_run_id,
    status: Checks.Status.Completed,
  };

  const octokit = new Octokit({
    auth: inputs.token,
  });

  let findingsArray: VeracodePolicyResult.Finding[] = [];
  let resultsUrl: string = '';

  try {
    const data = await fs.readFile('policy_flaws.json', 'utf-8');
    const parsedData: VeracodePolicyResult.Embedded = JSON.parse(data);
    findingsArray = parsedData.findings;
    resultsUrl = await fs.readFile('results_url.txt', 'utf-8');
  } catch (error) {
    core.debug(`Error reading or parsing filtered_results.json:${error}`);
    core.setFailed('Error reading or parsing pipeline scan results.');
    // TODO: Based on the veracode.yml, update the checks status to failure or pass
    await updateChecks(
      octokit,
      checkStatic,
      Checks.Conclusion.Failure,
      [],
      'Error reading or parsing pipeline scan results.',
    );
    return;
  }

  console.log(findingsArray);
  core.info(`Policy findings: ${findingsArray.length}`);
  core.info(`Results URL: ${resultsUrl}`);

}

// function getAnnotations (policyFindings: VeracodePolicyResult.Finding[], javaMaven: boolean): Checks.Annotation[] {
//   const annotations: Checks.Annotation[] = [];
//   policyFindings.forEach(function (element) {
//     if (javaMaven) {
//       element.finding_details.file_path = `src/main/java/${element.finding_details.file_path}`;
//       if (element.finding_details.file_path.includes('WEB-INF'))
//       element.finding_details.file_path = element.finding_details.file_path.replace(
//           /src\/main\/java\//, // Use regular expression for precise replacement
//           'src/main/webapp/',
//         );
//     }

//     const displayMessage = element.description.replace(/<span>/g, '').replace(/<\/span> /g, '\n').replace(/<\/span>/g, '');
//     let filePath = element.finding_details.file_path;
//     if (filePath.startsWith('/')) filePath = filePath.substring(1);
//     const message = `Filename: ${filePath}\nLine: ${element.finding_details.file_line_number}\nCWE: ${element.finding_details.cwe.id} (${element.finding_details.cwe.name})\n\n${displayMessage}`;
//     annotations.push({
//       path: `${filePath}`,
//       start_line: element.finding_details.file_line_number,
//       end_line: element.finding_details.file_line_number,
//       annotation_level: 'warning',
//       title: element.finding_details.cwe.name,
//       message: message,
//     });
//   });
  
//   return annotations;
// }