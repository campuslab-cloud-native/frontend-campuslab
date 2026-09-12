import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditService, AuditEvent } from '../../../core/services/audit.service';

@Component({
  selector: 'app-audit-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './audit-page.component.html',
  styleUrl: './audit-page.component.css'
})
export class AuditPageComponent {
  private readonly auditService = inject(AuditService);

  events = signal<AuditEvent[]>([]);
  typeFilter = '';

  constructor() {
    this.load();
  }

  load(): void {
    this.auditService.getEvents({ type: this.typeFilter || undefined }).subscribe((events) => this.events.set(events));
  }
}