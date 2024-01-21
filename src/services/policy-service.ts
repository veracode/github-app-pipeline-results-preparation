import * as core from '@actions/core';
import * as InputService from '../inputs';
import * as ApplicationService from '../services/application-service';

export async function getPolicyNameByProfileName(inputs: InputService.Inputs): Promise<void> {
  const application = await ApplicationService.getApplicationByName(inputs.appname, inputs.vid, inputs.vkey);
  core.setOutput('policy_name', application.profile.policies[0].name);
}