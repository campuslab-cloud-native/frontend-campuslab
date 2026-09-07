import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import {
  MsalModule,
  MsalInterceptor,
  MsalGuard,
  MSAL_INSTANCE,
  MSAL_GUARD_CONFIG,
  MSAL_INTERCEPTOR_CONFIG,
} from '@azure/msal-angular';
import { PublicClientApplication } from '@azure/msal-browser';

import { routes } from './app.routes';

// Config MSAL
const msalConfig = {
  auth: {
    clientId: '42cb7a41-5cce-4f27-98ce-fac68c486cc9',
    authority: 'https://login.microsoftonline.com/d4cfe04f-033a-4b70-b52f-a215ecc17bfa',
    redirectUri: 'http://localhost:4200',
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level: any, message: string, piiEnabled: boolean) => {