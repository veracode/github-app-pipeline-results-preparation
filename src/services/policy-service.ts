import * as core from '@actions/core';
// import { Octokit } from '@octokit/rest';
import * as InputService from '../inputs';
import * as ApplicationService from '../services/application-service';
// import * as Checks from '../namespaces/Checks';
// import { updateChecks } from './check-service';

export async function getPolicyNameByProfileName(inputs: InputService.Inputs): Promise<void> {
  const appname = inputs.appname;
  const vid = inputs.vid;
  const vkey = inputs.vkey;

  try {
    const application = await ApplicationService.getApplicationByName(appname, vid, vkey);
    core.setOutput('policy_name', application.profile.policies[0].name);
  } catch (error) {
    core.setFailed(`No application found with name ${appname}`);
    core.setOutput('policy_name', '');
    // if (inputs.source_repository && inputs.token && inputs.check_run_id) {
    //   const repo = inputs.source_repository.split('/');
    //   const ownership = {
    //     owner: repo[0],
    //     repo: repo[1],
    //   };
    //   const octokit = new Octokit({
    //     auth: inputs.token,
    //   });
    //   const checkStatic: Checks.ChecksStatic = {
    //     owner: ownership.owner,
    //     repo: ownership.repo,
    //     check_run_id: inputs.check_run_id,
    //     status: Checks.Status.Completed,
    //   };
    //   await updateChecks(
    //     octokit,
    //     checkStatic,
    //     inputs.fail_checks_on_error ? Checks.Conclusion.Failure: Checks.Conclusion.Success,
    //     [],
    //     `No application found with name ${appname}`,
    //   );
    }
}