# frontend-campuslab

Frontend web de CampusLab desarrollado con Angular.

## Tecnologías

- Angular
- TypeScript
- MSAL Angular
- Azure AD

## Funcionalidades

- Inicio de sesión corporativo con Microsoft.
- Protección de rutas mediante MSAL.
- Autorización por rol.
- Consumo del backend mediante AWS API Gateway.
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

```text
Usuario
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
```

## Variables de entorno

```env
AZURE_CLIENT_ID=
AZURE_TENANT_ID=
AZURE_AUTHORITY=https://login.microsoftonline.com/<TENANT_ID>/
AZURE_REDIRECT_URI=
API_BASE_URL=
```

## Ejecución local

```bash
npm install
npm start
```

## Build

```bash
npm run build
```
