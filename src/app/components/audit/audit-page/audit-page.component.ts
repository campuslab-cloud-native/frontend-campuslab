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

  selectedBookingId = signal<number | null>(null);
  timeline = signal<AuditEvent[]>([]);

  constructor() {
    this.load();
  }

  load(): void {
    this.auditService.getEvents({ type: this.typeFilter || undefined }).subscribe((events) => this.events.set(events));
  }

  viewTimeline(bookingId: number): void {
    this.selectedBookingId.set(bookingId);
    this.auditService.getBookingTimeline(bookingId).subscribe((events) => this.timeline.set(events));
  }

  closeTimeline(): void {
    this.selectedBookingId.set(null);
    this.timeline.set([]);
  }
}