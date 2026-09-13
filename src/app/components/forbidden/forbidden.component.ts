import { Component } from '@angular/core';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [],
  template: `
    <div class="container mt-5 text-center">
      <h2>Acceso no autorizado</h2>
      <p>Tu rol no tiene permisos para ver esta pantalla.</p>
    </div>
  `
})
export class ForbiddenComponent {}