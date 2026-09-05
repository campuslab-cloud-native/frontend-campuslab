# frontend-campuslab

## Stack

- Angular
- TypeScript
- MSAL Angular
- Azure AD

## Rutas

- `/login`
- `/dashboard`
- `/bookings`
- `/catalog`
- `/reports`
- `/audit`

## Roles

- ADMIN
- OPERATOR
- CLIENT
- AUDITOR

## Seguridad

- Login mediante Azure AD.
- MSAL Angular.
- Rutas protegidas por rol.
- Bearer JWT en llamadas al backend.
- Las llamadas se realizan mediante AWS API Gateway.

## Flujo

Angular → Azure AD → JWT → API Gateway → BFF

## Ejecución

```bash
npm install
npm start
