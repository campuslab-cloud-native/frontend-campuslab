const keyFor = (userKey: string): string => `campuslab.myBookings.${userKey}`;

export function readMyBookingIds(userKey: string): Set<number> {
  if (!userKey) return new Set();
  try {
    const raw = localStorage.getItem(keyFor(userKey));
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((v): v is number => typeof v === 'number') : []);
  } catch {
    return new Set();
  }
}

export function rememberMyBooking(userKey: string, bookingId: number): void {
  if (!userKey) return;
  const ids = readMyBookingIds(userKey);
  ids.add(bookingId);
  try {
    localStorage.setItem(keyFor(userKey), JSON.stringify([...ids]));
  } catch {
    // sin almacenamiento disponible
  }
}