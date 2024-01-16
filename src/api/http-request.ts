import { calculateAuthorizationHeader } from './veracode-hmac';
import appConfig from '../app-config';

interface Resource {
  resourceUri: string;
  queryAttribute: string;
  queryValue: string;
}

export async function getResourceByAttribute<T>(vid: string, vkey: string, resource: Resource): Promise<T> {
  const resourceUri = resource.resourceUri;
  const queryAttribute = resource.queryAttribute;
  const queryValue = resource.queryValue;

  const urlQueryParams = queryAttribute !== '' ? `?${queryAttribute}=${queryValue}` : '';
  const queryUrl = resourceUri + urlQueryParams;
  const headers = {
    Authorization: calculateAuthorizationHeader({
      id: vid,
      key: vkey,
      host: appConfig.hostName,
      url: queryUrl,
      method: 'GET',
    }),
  };
  const appUrl = `https://${appConfig.hostName}${resourceUri}${urlQueryParams}`;
  console.log(appUrl);
  try {
    const response = await fetch(appUrl, { headers });
    const data = await response.json();
    return data as T;
  } catch (error) {
    throw new Error('Failed to fetch resource.');
  }
}
