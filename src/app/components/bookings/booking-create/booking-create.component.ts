import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CatalogService } from '../../../core/services/catalog.service';
import { BookingService } from '../../../core/services/booking.service';
import { CatalogResource, ResourceType } from '../../../core/models/resource.model';
import { Booking } from '../../../core/models/booking.model';
import { MAX_BOOKING_HOURS, MAX_BOOKING_MS, overlaps } from '../../../core/utils/booking-time';

interface SlotIssue {
  message: string;
}

@Component({
  selector: 'app-booking-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './booking-create.component.html',
  styleUrl: './booking-create.component.css'
})
export class BookingCreateComponent {
  @Output() created = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly catalogService = inject(CatalogService);
  private readonly bookingService = inject(BookingService);

  readonly maxHours = MAX_BOOKING_HOURS;

  labs = signal<CatalogResource[]>([]);
  existing = signal<Booking[]>([]);
  submitting = signal(false);
  errorMessage = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    resourceId: [null as number | null, Validators.required],
    startTime: ['', Validators.required],
    endTime: ['', Validators.required],
  });

  constructor() {
    this.catalogService.getResources().subscribe({
      next: (resources) =>
        this.labs.set(resources.filter((r) => r.type === ResourceType.Lab && r.availableQuantity > 0)),
      error: () => {},
    });
    this.loadExisting();
  }

  slotIssue(): SlotIssue | null {
    const { resourceId, startTime, endTime } = this.form.getRawValue();
    if (!startTime || !endTime) return null;

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      return { message: 'La hora de fin debe ser posterior a la de inicio.' };
    }
    if (end.getTime() - start.getTime() > MAX_BOOKING_MS) {
      return { message: `Una reserva no puede durar más de ${MAX_BOOKING_HOURS} horas.` };
    }

    const labs = this.labs();
    if (labs.length > 0 && labs.every((lab) => this.isBusy(lab.id, start, end))) {
      return { message: 'Todos los laboratorios están ocupados en ese horario. Elegí otra fecha u horario.' };
    }
    if (resourceId !== null && this.isBusy(resourceId, start, end)) {
      return { message: 'Ese laboratorio ya está reservado en ese horario. Elegí otra fecha, otro horario u otro laboratorio.' };
    }
    return null;
  }

  submit(): void {
    if (this.form.invalid || this.slotIssue()) return;
    this.submitting.set(true);
    this.errorMessage.set(null);

    const { resourceId, startTime, endTime } = this.form.getRawValue();
    this.bookingService.createBooking({ resourceId: resourceId as number, startTime, endTime }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.form.reset();
        this.loadExisting();
        this.created.emit();
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        this.errorMessage.set(this.resolveCreateErrorMessage(err));
      },
    });
  }

  private isBusy(resourceId: number, start: Date, end: Date): boolean {
    return this.existing().some((b) => b.resourceId === resourceId && overlaps(b, start, end));
  }

  private loadExisting(): void {
    this.bookingService.getBookings().subscribe({
      next: (bookings) => this.existing.set(bookings),
      error: () => {},
    });
  }

  private resolveCreateErrorMessage(err: HttpErrorResponse): string {
    if (err.status === 409) {
      return 'Ese laboratorio ya está reservado en el horario seleccionado. Elegí otra fecha u horario.';
    }
    return 'No se pudo crear la reserva. Intenta nuevamente.';
  }
}