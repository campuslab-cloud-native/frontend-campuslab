## frontend-campuslab

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

La configuración vive en archivos de entorno de Angular que **no se versionan** (están en `.gitignore`).
Antes de compilar o ejecutar, créalos a partir del ejemplo:

```bash
cp src/environments/environment.example.ts src/environments/environment.ts
cp src/environments/environment.example.ts src/environments/environment.prod.ts
```

Y completa los valores en cada archivo:

| Campo | Descripción |
|---|---|
| `azureAd.clientId` | ID de aplicación (cliente) del registro en Azure Entra ID |
| `azureAd.tenantId` | ID de directorio (inquilino) |
| `azureAd.redirectUri` | URL a la que Microsoft devuelve al usuario (debe estar registrada como SPA) |
| `azureAd.postLogoutRedirectUri` | URL tras cerrar sesión |
| `azureAd.apiScope` | Ámbito de la API, `api://<CLIENT_ID>/access_as_user` |
| `apiBaseUrl` | URL base de la API. En producción, el API Gateway (`https://<id>.execute-api.<region>.amazonaws.com/v1`); en local, el BFF (`http://localhost:8080/api/v1`) |

El `Dockerfile` compila con `ng build --configuration production`, que usa `environment.prod.ts`:
ese archivo debe existir en el contexto de construcción.

## Autenticación

El inicio de sesión usa MSAL (`@azure/msal-browser` 5) con el flujo **Authorization Code con PKCE**
(`code_challenge_method=S256`, `state` y `nonce`), sin flujo Implicit. `MsalInterceptor` adjunta el
`Bearer <access_token>` solo a las llamadas a `apiBaseUrl`.

## Ejecución local

```bash
npm install
npm start
```

## Pruebas

```bash
npm test
```

Cubren las reglas de las reservas (`booking-time`), el guard de roles, `AuthService`,
el componente de login y la protección de las rutas.

## Build

```bash
npm run build
```

