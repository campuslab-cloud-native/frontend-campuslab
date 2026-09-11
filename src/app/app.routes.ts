import { Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';
import { roleGuard } from './core/guards/role.guard';
import { AppRole } from './core/models/role.model';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [MsalGuard] },
  {
    path: 'bookings',
    canActivate: [MsalGuard, roleGuard([AppRole.Client, AppRole.Admin, AppRole.Operator])],
    loadComponent: () =>
      import('./components/bookings/bookings-page/bookings-page.component').then((m) => m.BookingsPageComponent),
  },
  {
    path: 'catalog',
    canActivate: [MsalGuard, roleGuard([AppRole.Admin, AppRole.Operator])],
    loadComponent: () =>
      import('./components/catalog/catalog-page/catalog-page.component').then((m) => m.CatalogPageComponent),
  },
  {
    path: 'reports',
    canActivate: [MsalGuard, roleGuard([AppRole.Admin])],
    loadComponent: () =>
      import('./components/reports/reports-page/reports-page.component').then((m) => m.ReportsPageComponent),
  },
  {
    path: 'audit',
    canActivate: [MsalGuard, roleGuard([AppRole.Admin, AppRole.Auditor])],
    loadComponent: () =>
      import('./components/audit/audit-page/audit-page.component').then((m) => m.AuditPageComponent),
  },
  {
    path: 'forbidden',
    loadComponent: () => import('./components/forbidden/forbidden.component').then((m) => m.ForbiddenComponent),
  },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: '**', redirectTo: 'login' },
];