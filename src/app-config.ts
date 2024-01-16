interface AppConfig {
  hostName: string;
  applicationUri: string;
  findingsUri: string;
}

const appConfig: AppConfig = {
  hostName: 'api.veracode.com',
  applicationUri: '/appsec/v1/applications',
  findingsUri: '/appsec/v2/applications',
};

export default appConfig;
