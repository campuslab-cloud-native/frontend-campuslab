import { TestBed } from '@angular/core/testing';
import { MsalService } from '@azure/msal-angular';
import { AccountInfo } from '@azure/msal-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRole } from '../models/role.model';
import { AuthService } from './auth.service';

function account(roles?: string[]): AccountInfo {
  return {
    homeAccountId: 'home',
    environment: 'login.microsoftonline.com',
    tenantId: 'tenant',
    username: 'alumno@campus.cl',
    localAccountId: 'local',
    name: 'Alumno Demo',
    idTokenClaims: roles ? { roles } : {},
  } as AccountInfo;
}

describe('AuthService', () => {
  let accounts: AccountInfo[];
  const loginRedirect = vi.fn();
  const logoutRedirect = vi.fn();

  beforeEach(() => {
    accounts = [];
    loginRedirect.mockClear();
    logoutRedirect.mockClear();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: MsalService,
          useValue: {
            instance: {
              getAllAccounts: () => accounts,
              getActiveAccount: () => accounts[0] ?? null,
              setActiveAccount: vi.fn(),
            },
            loginRedirect,
            logoutRedirect,
            handleRedirectObservable: vi.fn(),
          },
        },
      ],
    });
  });

  it('sin cuenta no esta autenticado y no tiene roles', () => {
    const service = TestBed.inject(AuthService);

    expect(service.isLoggedIn).toBe(false);
    expect(service.roles).toEqual([]);
  });

  it('lee los roles de las claims del token', () => {
    accounts = [account(['ADMIN', 'AUDITOR'])];
    const service = TestBed.inject(AuthService);

    expect(service.isLoggedIn).toBe(true);
    expect(service.roles).toEqual([AppRole.Admin, AppRole.Auditor]);
    expect(service.hasAnyRole(AppRole.Admin)).toBe(true);
    expect(service.hasAnyRole(AppRole.Operator)).toBe(false);
  });

  it('un usuario sin roles asignados es Cliente por defecto', () => {
    accounts = [account()];
    const service = TestBed.inject(AuthService);

    expect(service.roles).toEqual([AppRole.Client]);
  });

  it('ignora roles desconocidos', () => {
    accounts = [account(['SUPERUSUARIO'])];
    const service = TestBed.inject(AuthService);

    expect(service.roles).toEqual([AppRole.Client]);
  });

  it('muestra el nombre del usuario', () => {
    accounts = [account(['CLIENT'])];

    expect(TestBed.inject(AuthService).displayName).toBe('Alumno Demo');
  });

  it('login redirige a Microsoft pidiendo el ambito de la API', () => {
    TestBed.inject(AuthService).login();

    expect(loginRedirect).toHaveBeenCalledTimes(1);
    expect(loginRedirect.mock.calls[0][0].scopes).toHaveLength(1);
  });

  it('logout cierra la sesion en Microsoft', () => {
    TestBed.inject(AuthService).logout();

    expect(logoutRedirect).toHaveBeenCalledTimes(1);
  });
});
