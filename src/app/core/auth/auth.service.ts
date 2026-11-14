import { Injectable, inject } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { AccountInfo, AuthenticationResult } from '@azure/msal-browser';
import { Observable } from 'rxjs';
import { AppRole } from '../models/role.model';
import { environment } from '../../../environments/environment';


@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly msalService = inject(MsalService);

  get isLoggedIn(): boolean {
    return this.msalService.instance.getAllAccounts().length > 0;
  }

  get activeAccount(): AccountInfo | null {
    return (
      this.msalService.instance.getActiveAccount() ??
      this.msalService.instance.getAllAccounts()[0] ??
      null
    );
  }

  get displayName(): string {
    return this.activeAccount?.name ?? this.activeAccount?.username ?? '';
  }

   get roles(): AppRole[] {
    if (!this.activeAccount) {
      return [];
    }

    const claims = this.activeAccount.idTokenClaims as { roles?: string[] } | undefined;
    const raw = claims?.roles ?? [];
    const matched = raw.filter((role): role is AppRole => Object.values(AppRole).includes(role as AppRole));

    
    return matched.length > 0 ? matched : [AppRole.Client];
  }

  hasAnyRole(...allowed: AppRole[]): boolean {
    return allowed.some((role) => this.roles.includes(role));
  }

  setActiveAccountFromCache(): void {
    const accounts = this.msalService.instance.getAllAccounts();
    if (accounts.length > 0 && !this.msalService.instance.getActiveAccount()) {
      this.msalService.instance.setActiveAccount(accounts[0]);
    }
  }

  handleRedirect(): Observable<AuthenticationResult | null> {
    return this.msalService.handleRedirectObservable();
  }

    login(): void {
    this.msalService.loginRedirect({
      scopes: [environment.azureAd.apiScope],
      redirectStartPage: `${window.location.origin}/dashboard`,
    });
  }

  logout(): void {
    this.msalService.logoutRedirect();
  }
}