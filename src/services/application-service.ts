import * as core from '@actions/core';
import appConfig from '../app-config';
import * as VeracodeApplication from '../namespaces/VeracodeApplication';
import * as http from '../api/http-request';

export async function getApplicationByName(
  appname: string,
  vid: string,
  vkey: string,
): Promise<VeracodeApplication.Application> {
  const getApplicationByNameResource = {
    resourceUri: appConfig.applicationUri,
    queryAttribute: 'name',
    queryValue: encodeURIComponent(appname),
  };

  const applicationResponse: VeracodeApplication.ResultsData =
    await http.getResourceByAttribute<VeracodeApplication.ResultsData>(vid, vkey, getApplicationByNameResource);

  const applications = applicationResponse._embedded.applications;
  if (applications.length === 0) {
    core.setFailed(`No application found with name ${appname}`);
    throw new Error(`No application found with name ${appname}`);
  } else if (applications.length > 1) {
    core.info(`Multiple applications found with name ${appname}, selecting the first found`);
  }

  return applications[0];
}
