import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { AppRole } from '../models/role.model';

export function roleGuard(allowedRoles: AppRole[]): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    return authService.hasAnyRole(...allowedRoles) ? true : router.createUrlTree(['/forbidden']);
  };
}