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

export function effectiveStatus(booking: Booking, now: Date = new Date()): DisplayStatus {
  if (booking.status === BookingStatus.Devuelta) return 'FINISHED';
  if (!RUNNING_STATUSES.includes(booking.status)) return booking.status;

  const start = new Date(booking.startTime).getTime();
  const end = new Date(booking.endTime).getTime();
  const current = now.getTime();

  if (current >= end) return 'FINISHED';
  if (booking.status === BookingStatus.Aprobada && current >= start) return BookingStatus.EnUso;
  return booking.status;
}

export function countsAsCupo(booking: Booking, now: Date = new Date()): boolean {
  return ACTIVE_STATUSES.includes(booking.status) && effectiveStatus(booking, now) !== 'FINISHED';
}

export function allowedActions(booking: Booking, now: Date = new Date()): BookingAction[] {
  if (effectiveStatus(booking, now) === 'FINISHED') return [];

  switch (booking.status) {
    case BookingStatus.Solicitada:
      return [
        { label: 'Aprobar', status: BookingStatus.Aprobada },
        { label: 'Rechazar', status: BookingStatus.Cancelada },
      ];
    case BookingStatus.Aprobada:
      return [
        { label: 'Preparar laboratorio', status: BookingStatus.EnPreparacion },
        { label: 'Cancelar', status: BookingStatus.Cancelada },
      ];
    case BookingStatus.EnPreparacion:
      return [{ label: 'Cancelar', status: BookingStatus.Cancelada }];
    case BookingStatus.PreparacionLista:
      return [
        { label: 'Iniciar uso', status: BookingStatus.EnUso },
        { label: 'Cancelar', status: BookingStatus.Cancelada },
      ];
    case BookingStatus.EnUso:
      return [{ label: 'Terminar', status: BookingStatus.Devuelta }];
    default:
      return [];
  }
}