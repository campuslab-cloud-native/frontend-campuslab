import { describe, expect, it } from 'vitest';
import { Booking, BookingStatus } from '../models/booking.model';
import {
  BOOKING_STEPS,
  STATUS_LABELS,
  adminActions,
  allowedActions,
  countsAsCupo,
  effectiveStatus,
  stepIndex,
  toDateKey,
  toLocalInput,
} from './booking-time';

const HOUR = 60 * 60 * 1000;
const now = new Date(2026, 9, 18, 12, 0, 0);

function booking(status: BookingStatus, startOffsetHours: number, durationHours = 1): Booking {
  const start = new Date(now.getTime() + startOffsetHours * HOUR);
  return {
    id: 1,
    resourceId: 1,
    userId: 'alumno@campus.cl',
    startTime: start.toISOString(),
    endTime: new Date(start.getTime() + durationHours * HOUR).toISOString(),
    status,
    createdAt: now.toISOString(),
  };
}

describe('booking-time', () => {
  it('formatea fechas locales', () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(toLocalInput(new Date(2026, 9, 18, 9, 5))).toBe('2026-10-18T09:05');
  });

  it('una reserva devuelta se muestra como terminada y el resto conserva su estado', () => {
    expect(effectiveStatus(booking(BookingStatus.Devuelta, -3), now)).toBe('FINISHED');
    expect(effectiveStatus(booking(BookingStatus.Solicitada, 2), now)).toBe(BookingStatus.Solicitada);
  });

  it('una reserva en uso sigue en uso aunque haya pasado su hora de fin, hasta que se registre la devolucion', () => {
    expect(effectiveStatus(booking(BookingStatus.EnUso, -5, 1), now)).toBe(BookingStatus.EnUso);
  });

  it('solo las reservas activas ocupan cupo', () => {
    expect(countsAsCupo(booking(BookingStatus.Solicitada, 2), now)).toBe(true);
    expect(countsAsCupo(booking(BookingStatus.EnUso, -1, 2), now)).toBe(true);
    expect(countsAsCupo(booking(BookingStatus.Devuelta, -3), now)).toBe(false);
    expect(countsAsCupo(booking(BookingStatus.Cancelada, 2), now)).toBe(false);
  });

  it('una solicitud futura se puede aprobar o rechazar', () => {
    const actions = allowedActions(booking(BookingStatus.Solicitada, 2), now);
    expect(actions.map((a) => a.status)).toEqual([BookingStatus.Aprobada, BookingStatus.Cancelada]);
  });

  it('una reserva aprobada o en preparacion solo se puede cancelar antes de empezar', () => {
    expect(allowedActions(booking(BookingStatus.Aprobada, 2), now).map((a) => a.status)).toEqual([
      BookingStatus.Cancelada,
    ]);
    expect(allowedActions(booking(BookingStatus.EnPreparacion, 1), now).map((a) => a.status)).toEqual([
      BookingStatus.Cancelada,
    ]);
    expect(allowedActions(booking(BookingStatus.Aprobada, -1), now)).toEqual([]);
  });

  it('una reserva en uso solo permite registrar la devolucion, en cualquier momento', () => {
    const actions = allowedActions(booking(BookingStatus.EnUso, -6), now);
    expect(actions).toHaveLength(1);
    expect(actions[0].status).toBe(BookingStatus.Devuelta);
  });

  it('una reserva devuelta o cancelada no tiene acciones', () => {
    expect(allowedActions(booking(BookingStatus.Devuelta, -3), now)).toEqual([]);
    expect(allowedActions(booking(BookingStatus.Cancelada, 2), now)).toEqual([]);
  });

  it('el administrador puede pasar la reserva a cualquier otro estado', () => {
    const actions = adminActions(booking(BookingStatus.Solicitada, 2));
    const statuses = actions.map((a) => a.status);

    expect(statuses).not.toContain(BookingStatus.Solicitada);
    expect(statuses).toHaveLength(Object.values(BookingStatus).length - 1);
    expect(statuses).toContain(BookingStatus.Devuelta);
  });

  it('los estados del backend tienen etiqueta y paso en la linea de tiempo', () => {
    for (const status of Object.values(BookingStatus)) {
      expect(STATUS_LABELS[status]).toBeTruthy();
    }
    expect(BOOKING_STEPS.map((s) => s.label)).toEqual([
      'Solicitada',
      'Aprobada',
      'En preparación',
      'En uso',
      'Devuelta',
    ]);
    expect(stepIndex(BookingStatus.EnUso)).toBe(3);
    expect(stepIndex('FINISHED')).toBe(4);
  });
});
