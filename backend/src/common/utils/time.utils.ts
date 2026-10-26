export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function normalizeTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function hasOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return timeToMinutes(aStart) < timeToMinutes(bEnd) && timeToMinutes(aEnd) > timeToMinutes(bStart);
}

export function dateToISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

import { ecStartOfDay } from './date-ec.utils';

export function parseDateSafe(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return ecStartOfDay(y, m, d);
}
