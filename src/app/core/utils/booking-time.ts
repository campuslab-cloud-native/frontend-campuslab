import { Booking, BookingStatus } from '../models/booking.model';

export const MAX_BOOKING_HOURS = 2;
export const MAX_BOOKING_MS = MAX_BOOKING_HOURS * 60 * 60 * 1000;

export const PREP_MINUTES = 20;
export const READY_MINUTES = 10;
export const PREP_BUFFER_MINUTES = PREP_MINUTES + READY_MINUTES;

export type DisplayStatus = BookingStatus | 'FINISHED';

export interface BookingAction {
  label: string;
  status: BookingStatus;
}

export const STATUS_LABELS: Record<DisplayStatus, string> = {
  [BookingStatus.Solicitada]: 'Solicitada',
  [BookingStatus.Aprobada]: 'Aprobada',
  [BookingStatus.EnPreparacion]: 'En preparación',
  [BookingStatus.PreparacionLista]: 'Preparación lista',
  [BookingStatus.EnUso]: 'En uso',
  [BookingStatus.Terminada]: 'Terminada',
  [BookingStatus.Devuelta]: 'Terminada',
  [BookingStatus.Cancelada]: 'Cancelada',
  FINISHED: 'Terminada',
};

export const BOOKING_STEPS: { status: DisplayStatus; label: string }[] = [
  { status: BookingStatus.Solicitada, label: 'Solicitada' },
  { status: BookingStatus.Aprobada, label: 'Aprobada' },
  { status: BookingStatus.EnPreparacion, label: 'En preparación' },
  { status: BookingStatus.PreparacionLista, label: 'Preparación lista' },
  { status: BookingStatus.EnUso, label: 'En uso' },
  { status: 'FINISHED', label: 'Terminada' },
];

const ACTIVE_STATUSES: BookingStatus[] = [
  BookingStatus.Solicitada,
  BookingStatus.Aprobada,
  BookingStatus.EnPreparacion,
  BookingStatus.PreparacionLista,
  BookingStatus.EnUso,
];

const RUNNING_STATUSES: BookingStatus[] = [
  BookingStatus.Aprobada,
  BookingStatus.EnPreparacion,
  BookingStatus.PreparacionLista,
  BookingStatus.EnUso,
];

const pad = (n: number): string => String(n).padStart(2, '0');

export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function toLocalInput(date: Date): string {
  return `${toDateKey(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function stepIndex(status: DisplayStatus): number {
  const index = BOOKING_STEPS.findIndex((step) => step.status === status);
  return index < 0 ? 0 : index;
}

export function effectiveStatus(booking: Booking, now: Date = new Date()): DisplayStatus {
  if (booking.status === BookingStatus.Terminada || booking.status === BookingStatus.Devuelta) {
    return 'FINISHED';
  }
  if (RUNNING_STATUSES.includes(booking.status) && now.getTime() >= new Date(booking.endTime).getTime()) {
    return 'FINISHED';
  }
  return booking.status;
}

export function countsAsCupo(booking: Booking, now: Date = new Date()): boolean {
  return ACTIVE_STATUSES.includes(booking.status) && effectiveStatus(booking, now) !== 'FINISHED';
}

export function allowedActions(booking: Booking, now: Date = new Date()): BookingAction[] {
  if (effectiveStatus(booking, now) === 'FINISHED') return [];
  if (now.getTime() >= new Date(booking.startTime).getTime()) return [];

  switch (booking.status) {
    case BookingStatus.Solicitada:
      return [
        { label: 'Aprobar', status: BookingStatus.Aprobada },
        { label: 'Rechazar', status: BookingStatus.Cancelada },
      ];
    case BookingStatus.Aprobada:
    case BookingStatus.EnPreparacion:
    case BookingStatus.PreparacionLista:
      return [{ label: 'Cancelar', status: BookingStatus.Cancelada }];
    default:
      return [];
  }
}