import { Component, EventEmitter, OnDestroy, Output, computed, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, interval, takeUntil } from 'rxjs';
import { CatalogService } from '../../../core/services/catalog.service';
import { BookingService } from '../../../core/services/booking.service';
import { CatalogResource, ResourceType } from '../../../core/models/resource.model';
import { Booking } from '../../../core/models/booking.model';
import { backendMessage } from '../../../core/utils/http-errors';
import {
  MAX_BOOKING_HOURS,
  MAX_BOOKING_MS,
  PREP_BUFFER_MINUTES,
  countsAsCupo,
  toDateKey,
  toLocalInput,
} from '../../../core/utils/booking-time';

interface SlotIssue {
  message: string;
}

interface StartOption {
  time: string;
  busy: boolean;
}

export type BookingKind = 'lab' | 'item';

const FIRST_START_HOUR = 8;
const LAST_START_HOUR = 20;
const START_STEP_MINUTES = 30;
const BUFFER_MS = PREP_BUFFER_MINUTES * 60000;
const REFRESH_MS = 15000;

const DURATIONS = [
  { minutes: 30, label: '30 minutos' },
  { minutes: 60, label: '1 hora' },
  { minutes: 90, label: '1 hora 30 min' },
  { minutes: 120, label: '2 horas' },
];

const pad = (n: number): string => String(n).padStart(2, '0');

@Component({
  selector: 'app-booking-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './booking-create.component.html',
  styleUrl: './booking-create.component.css',
  host: { '[class.picker-open]': 'pickerOpen()' }
})
export class BookingCreateComponent implements OnDestroy {
  readonly kind = input<BookingKind>('lab');
  @Output() created = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly catalogService = inject(CatalogService);
  private readonly bookingService = inject(BookingService);
  private readonly destroy$ = new Subject<void>();

  readonly maxHours = MAX_BOOKING_HOURS;
  readonly durations = DURATIONS;
  readonly today = toDateKey(new Date());

  resources = signal<CatalogResource[]>([]);
  existing = signal<Booking[]>([]);
  submitting = signal(false);
  errorMessage = signal<string | null>(null);

  pickerOpen = signal(false);
  pickDate = signal('');
  pickStart = signal('');
  pickDuration = signal(60);
  pickDateError = signal(false);

  isItem = computed(() => this.kind() === 'item');

  options = computed(() =>
    this.resources().filter((r) => (this.isItem() ? r.type !== ResourceType.Lab : r.type === ResourceType.Lab))
  );

  form = this.fb.nonNullable.group({
    resourceId: [null as number | null, Validators.required],
    startTime: ['', Validators.required],
    endTime: ['', Validators.required],
  });

  constructor() {
    this.refresh();
    interval(REFRESH_MS)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.refresh());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  labSelected(): boolean {
    return this.form.getRawValue().resourceId !== null;
  }

  typeLabel(resource: CatalogResource): string {
    return resource.type === ResourceType.Equipment ? 'Equipo' : resource.type === ResourceType.Supply ? 'Insumo' : '';
  }

  cupoFor(lab: CatalogResource): number {
    return Math.max(0, lab.availableQuantity);
  }

  cupoIssue(): SlotIssue | null {
    const options = this.options();
    if (options.length > 0 && options.every((lab) => this.cupoFor(lab) === 0)) {
      return {
        message: this.isItem()
          ? 'No hay insumos ni equipos con cupo disponible en este momento.'
          : 'No hay cupos disponibles en este momento.',
      };
    }
    const selected = options.find((lab) => lab.id === this.form.getRawValue().resourceId);
    if (selected && this.cupoFor(selected) === 0) {
      return {
        message: this.isItem()
          ? 'No hay cupo disponible de este recurso. Elige otro insumo o equipo.'
          : 'No hay cupos disponibles en este laboratorio. Elige otro laboratorio.',
      };
    }
    return null;
  }

  blocked(): boolean {
    return !!this.cupoIssue() || !!this.slotIssue();
  }

  slotLabel(): string {
    const { startTime, endTime } = this.form.getRawValue();
    if (!startTime || !endTime) return '';
    const start = new Date(startTime);
    const end = new Date(endTime);
    return (
      `${pad(start.getDate())}/${pad(start.getMonth() + 1)}/${start.getFullYear()} · ` +
      `${pad(start.getHours())}:${pad(start.getMinutes())} – ${pad(end.getHours())}:${pad(end.getMinutes())}`
    );
  }

  startOptions(): StartOption[] {
    const options: StartOption[] = [];
    const date = this.pickDate();
    const labId = this.form.getRawValue().resourceId;
    const earliest = Date.now() + BUFFER_MS;

    for (let minutes = FIRST_START_HOUR * 60; minutes <= LAST_START_HOUR * 60; minutes += START_STEP_MINUTES) {
      const time = `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
      if (!date) {
        options.push({ time, busy: false });
        continue;
      }
      const start = new Date(`${date}T${time}`);
      if (start.getTime() < earliest) continue;
      const end = new Date(start.getTime() + this.pickDuration() * 60000);
      options.push({ time, busy: labId !== null && this.conflictsWithExisting(labId, start, end) });
    }
    return options;
  }

  togglePicker(): void {
    if (this.pickerOpen()) {
      this.pickerOpen.set(false);
      return;
    }
    const { startTime, endTime } = this.form.getRawValue();
    if (startTime && endTime) {
      this.pickDate.set(startTime.slice(0, 10));
      this.pickStart.set(startTime.slice(11, 16));
      this.pickDuration.set(
        Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000)
      );
    }
    this.pickerOpen.set(true);
  }

  closePicker(): void {
    this.pickerOpen.set(false);
  }

  onPickDate(value: string): void {
    const valid = !!value && value >= this.today;
    this.pickDateError.set(!!value && !valid);
    this.pickDate.set(valid ? value : '');
    this.resetStartIfUnavailable();
  }

  onPickDuration(minutes: number): void {
    this.pickDuration.set(minutes);
    this.resetStartIfUnavailable();
  }

  canAccept(): boolean {
    const option = this.startOptions().find((o) => o.time === this.pickStart());
    return (
      !!this.pickDate() &&
      !!option &&
      !option.busy &&
      this.pickDuration() > 0 &&
      this.pickDuration() * 60000 <= MAX_BOOKING_MS
    );
  }

  acceptPicker(): void {
    if (!this.canAccept()) return;
    const start = new Date(`${this.pickDate()}T${this.pickStart()}`);
    const end = new Date(start.getTime() + this.pickDuration() * 60000);
    this.form.patchValue({ startTime: toLocalInput(start), endTime: toLocalInput(end) });
    this.pickerOpen.set(false);
  }

  slotIssue(): SlotIssue | null {
    const { resourceId, startTime, endTime } = this.form.getRawValue();
    if (!startTime || !endTime) return null;

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start.getTime() < Date.now()) {
      return { message: 'No se puede reservar en una fecha u hora que ya pasó.' };
    }
    if (start.getTime() < Date.now() + BUFFER_MS) {
      return { message: `La reserva debe empezar al menos ${PREP_BUFFER_MINUTES} minutos desde ahora (tiempo de preparación).` };
    }
    if (end <= start) {
      return { message: 'La hora de fin debe ser posterior a la de inicio.' };
    }
    if (end.getTime() - start.getTime() > MAX_BOOKING_MS) {
      return { message: `Una reserva no puede durar más de ${MAX_BOOKING_HOURS} horas.` };
    }

    if (resourceId !== null && this.conflictsWithExisting(resourceId, start, end)) {
      return {
        message: `Ese laboratorio ya está reservado en ese horario o a menos de ${PREP_BUFFER_MINUTES} minutos de otra reserva (tiempo de preparación). Elige otro horario.`,
      };
    }
    return null;
  }

  submit(): void {
    if (this.form.invalid || this.blocked()) return;
    this.submitting.set(true);
    this.errorMessage.set(null);

    const { resourceId, startTime, endTime } = this.form.getRawValue();
    this.bookingService.createBooking({ resourceId: resourceId as number, startTime, endTime }).subscribe({
      next: () => this.onCreated(),
      error: (err: HttpErrorResponse) => {
        if (err.status === 0 || err.status >= 500) {
          this.verifyCreated(resourceId as number, startTime);
          return;
        }
        this.submitting.set(false);
        this.errorMessage.set(this.resolveCreateErrorMessage(err));
      },
    });
  }

  private conflictsWithExisting(labId: number, start: Date, end: Date): boolean {
    // Insumos y equipos se controlan solo por cupo: varias personas pueden pedir el mismo recurso a la misma hora.
    if (this.isItem()) return false;
    const now = new Date();
    return this.existing().some(
      (b) =>
        b.resourceId === labId &&
        countsAsCupo(b, now) &&
        start.getTime() < new Date(b.endTime).getTime() + BUFFER_MS &&
        end.getTime() + BUFFER_MS > new Date(b.startTime).getTime()
    );
  }

  private resetStartIfUnavailable(): void {
    const current = this.pickStart();
    if (!current) return;
    const option = this.startOptions().find((o) => o.time === current);
    if (!option || option.busy) {
      this.pickStart.set('');
    }
  }

  private onCreated(): void {
    this.submitting.set(false);
    this.form.reset();
    this.pickDate.set('');
    this.pickStart.set('');
    this.refresh();
    this.created.emit();
  }

  private verifyCreated(resourceId: number, startTime: string): void {
    const startMs = new Date(startTime).getTime();
    this.bookingService.getAccessibleBookings().subscribe({
      next: (bookings) => {
        const created = bookings.some(
          (b) => b.resourceId === resourceId && new Date(b.startTime).getTime() === startMs
        );
        if (created) {
          this.onCreated();
        } else {
          this.submitting.set(false);
          this.errorMessage.set('No se pudo crear la reserva. Intenta nuevamente.');
        }
      },
      error: () => {
        this.submitting.set(false);
        this.errorMessage.set('No se pudo crear la reserva. Intenta nuevamente.');
      },
    });
  }

  private refresh(): void {
    this.catalogService.getResources().subscribe({
      next: (resources) => this.resources.set(resources),
      error: () => {},
    });
    if (!this.isItem()) {
      this.bookingService.getAccessibleBookings().subscribe({
        next: (bookings) => this.existing.set(bookings),
        error: () => {},
      });
    }
  }

  private resolveCreateErrorMessage(err: HttpErrorResponse): string {
    const message = backendMessage(err);
    if (message && err.status >= 400 && err.status < 500) {
      return message;
    }
    return 'No se pudo crear la reserva. Intenta nuevamente.';
  }
}