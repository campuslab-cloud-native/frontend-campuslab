export const environment = {
  production: false,
  azureAd: {
    clientId: 'REEMPLAZAR_CON_CLIENT_ID',
    tenantId: 'REEMPLAZAR_CON_TENANT_ID',
    redirectUri: 'http://localhost:4200',
    postLogoutRedirectUri: 'http://localhost:4200/login',
    apiScope: 'api://REEMPLAZAR_CON_CLIENT_ID/access_as_user'
  },
  apiBaseUrl: 'http://localhost:8080/api'
};