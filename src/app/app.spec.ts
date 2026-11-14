import { MsalGuard } from '@azure/msal-angular';
import { describe, expect, it } from 'vitest';
import { routes } from './app.routes';

describe('rutas de la aplicacion', () => {
  const route = (path: string) => routes.find((r) => r.path === path);

  it('el login es publico', () => {
    expect(route('login')?.canActivate).toBeUndefined();
  });

  it('las pantallas protegidas exigen autenticacion con MSAL', () => {
    for (const path of ['dashboard', 'bookings', 'catalog', 'reports', 'audit']) {
      expect(route(path)?.canActivate, path).toContain(MsalGuard);
    }
  });

  it('las pantallas restringidas por rol agregan el guard de rol', () => {
    for (const path of ['bookings', 'catalog', 'reports', 'audit']) {
      expect(route(path)?.canActivate, path).toHaveLength(2);
    }
  });

  it('una ruta desconocida redirige al login', () => {
    expect(routes.at(-1)).toMatchObject({ path: '**', redirectTo: 'login' });
  });
});
