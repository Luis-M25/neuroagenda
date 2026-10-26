const EC_TZ_OFFSET_MINUTES = -5 * 60;

export function ecStartOfDay(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day) - EC_TZ_OFFSET_MINUTES * 60_000);
}

export function ecEndOfDay(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day + 1) - EC_TZ_OFFSET_MINUTES * 60_000 - 1);
}

export function parseEcDate(fecha: string): Date {
  const [y, m, d] = fecha.split('-').map(Number);
  return ecStartOfDay(y, m, d);
}

export function ecDateRange(fecha: string): { gte: Date; lt: Date } {
  const [y, m, d] = fecha.split('-').map(Number);
  return {
    gte: ecStartOfDay(y, m, d),
    lt: ecStartOfDay(y, m, d + 1),
  };
}
