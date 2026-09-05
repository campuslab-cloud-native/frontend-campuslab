# frontend-campuslab

Frontend web de CampusLab desarrollado con Angular.

## Tecnologías

- Angular
- TypeScript
- MSAL Angular
- Azure AD
- HTML
- CSS

## Funcionalidades

- Inicio de sesión corporativo con Microsoft.
- Protección de rutas mediante MSAL.
- Autorización por rol.
- Consumo de APIs mediante AWS API Gateway.
- Envío automático del JWT en las solicitudes HTTP.

## Roles

- ADMIN
- OPERATOR
- CLIENT
- AUDITOR

## Rutas

- `/login`
- `/dashboard`
- `/bookings`
- `/catalog`
- `/reports`
- `/audit`

## Flujo de autenticación

Angular → Azure AD → Access Token JWT → AWS API Gateway → BFF

## Variables de entorno

```env
AZURE_CLIENT_ID=
AZURE_TENANT_ID=
AZURE_AUTHORITY=https://login.microsoftonline.com/<TENANT_ID>/
AZURE_REDIRECT_URI=
API_BASE_URL=
