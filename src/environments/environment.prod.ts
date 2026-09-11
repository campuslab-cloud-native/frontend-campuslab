export const environment = {
  production: true,
  azureAd: {
    clientId: 'REEMPLAZAR_CON_CLIENT_ID',
    tenantId: 'REEMPLAZAR_CON_TENANT_ID',
    redirectUri: 'https://campuslab.tudominio.com',
    postLogoutRedirectUri: 'https://campuslab.tudominio.com/login',
    apiScope: 'api://REEMPLAZAR_CON_CLIENT_ID/access_as_user'
  },
  apiBaseUrl: 'https://api.campuslab.tudominio.com/api'
};