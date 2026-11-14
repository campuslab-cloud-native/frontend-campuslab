import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../core/auth/auth.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  const login = vi.fn();

  beforeEach(async () => {
    login.mockClear();
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [{ provide: AuthService, useValue: { login } }],
    }).compileComponents();
  });

  it('muestra el boton para iniciar sesion con Microsoft', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    const button = (fixture.nativeElement as HTMLElement).querySelector('button');

    expect(button?.textContent).toContain('Iniciar sesión con Microsoft');
  });

  it('al pulsar el boton inicia el flujo de login', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement).querySelector('button')?.click();

    expect(login).toHaveBeenCalledTimes(1);
  });
});
