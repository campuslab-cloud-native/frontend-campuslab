import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CatalogService } from '../../../core/services/catalog.service';
import { BookingService } from '../../../core/services/booking.service';
import { CatalogResource, ResourceType } from '../../../core/models/resource.model';

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

  labs = signal<CatalogResource[]>([]);
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
      error: () => this.errorMessage.set('No se pudo cargar el catálogo de laboratorios.'),
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.submitting.set(true);
    this.errorMessage.set(null);

    const { resourceId, startTime, endTime } = this.form.getRawValue();
    this.bookingService.createBooking({ resourceId: resourceId as number, startTime, endTime }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.form.reset();
        this.created.emit();
      },
      error: () => {
        this.submitting.set(false);
        this.errorMessage.set('No se pudo crear la reserva. Intenta nuevamente.');
      },
    });
  }
}