frontend-campuslab

CampusLab frontend web application developed with Angular.

Technologies
Angular
TypeScript
MSAL Angular
Azure AD
Features
Corporate sign-in with Microsoft.
Route protection using MSAL.
Role-based authorization.
Backend integration through AWS API Gateway.
Automatic JWT attachment to HTTP requests.
Roles
ADMIN
OPERATOR
CLIENT
AUDITOR
Routes
/login
/dashboard
/bookings
/catalog
/reports
/audit
Authentication Flow
text
User
↓
Angular
↓
MSAL
↓
Azure AD
↓
Access Token JWT
↓
Angular
↓
AWS API Gateway
↓
ms-campuslab-bff

Environment Variables

Configuration is stored in Angular environment files that are not committed to version control (they are included in .gitignore).

Before building or running the application, create them from the example file:

bash
cp src/environments/environment.example.ts src/environments/environment.ts
cp src/environments/environment.example.ts src/environments/environment.prod.ts


Then configure the values in each file:

Field	Description
azureAd.clientId	Application (client) ID from the Azure Entra ID app registration
azureAd.tenantId	Directory (tenant) ID
azureAd.redirectUri	URL where Microsoft redirects the user after authentication (must be registered as an SPA)
azureAd.postLogoutRedirectUri	URL to redirect to after signing out
azureAd.apiScope	API scope, api://<CLIENT_ID>/access_as_user
apiBaseUrl	API base URL. In production, the API Gateway (https://<id>.execute-api.<region>.amazonaws.com/v1); locally, the BFF (http://localhost:8080/api/v1)

The Dockerfile builds the application using ng build --configuration production, which uses environment.prod.ts. This file must exist in the build context.

Authentication

Authentication is implemented using MSAL (@azure/msal-browser 5) with the Authorization Code Flow with PKCE (code_challenge_method=S256, state, and nonce), without using the Implicit Flow.

MsalInterceptor automatically attaches the Bearer <access_token> header only to requests targeting apiBaseUrl.

Local Development
bash
npm install
npm start

Tests
bash
npm test


Tests cover booking rules (booking-time), the role guard, AuthService, the login component, and route protection.

Build
bash
npm run build
