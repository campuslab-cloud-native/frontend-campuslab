import { HttpErrorResponse } from '@angular/common/http';

export function backendMessage(err: HttpErrorResponse): string | null {
  const body: unknown = err.error;
  if (body && typeof body === 'object' && 'message' in body) {
    const message = (body as { message: unknown }).message;
    return typeof message === 'string' && message.trim() ? message : null;
  }
  return null;
}
