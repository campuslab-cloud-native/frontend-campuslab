export const environment = {
  production: false,
  azureAd: {
    clientId: '42cb7a41-5cce-4f27-98ce-fac68c486cc9',
    tenantId: 'd4cfe04f-033a-4b70-b52f-a215ecc17bfa',
    redirectUri: 'http://localhost:4200',
    postLogoutRedirectUri: 'http://localhost:4200/login',
    apiScope: 'api://42cb7a41-5cce-4f27-98ce-fac68c486cc9/access_as_user'
  },
  apiBaseUrl: 'http://localhost:8080/api/v1'
};
