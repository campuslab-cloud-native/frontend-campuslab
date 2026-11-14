import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { AuthService } from '../auth/auth.service';
import { AppRole } from '../models/role.model';
import { roleGuard } from './role.guard';

describe('roleGuard', () => {
  let currentRoles: AppRole[];

  beforeEach(() => {
    currentRoles = [];
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { hasAnyRole: (...allowed: AppRole[]) => allowed.some((role) => currentRoles.includes(role)) },
        },
      ],
    });
  });

  function run(allowed: AppRole[]): boolean | UrlTree {
    return TestBed.runInInjectionContext(
      () => roleGuard(allowed)({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot) as boolean | UrlTree
    );
  }

  it('permite el acceso cuando el usuario tiene uno de los roles permitidos', () => {
    currentRoles = [AppRole.Admin];

    expect(run([AppRole.Admin, AppRole.Auditor])).toBe(true);
  });

  it('redirige a /forbidden cuando el usuario no tiene el rol', () => {
    currentRoles = [AppRole.Client];

    const result = run([AppRole.Admin]);

    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/forbidden');
  });
});
