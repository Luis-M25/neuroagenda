export const fieldClass =
  'w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100';

export function formatFechaEc(value?: string | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('es-EC', {
    timeZone: 'America/Guayaquil',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function estadoLabel(value: string): string {
  return value.replace(/_/g, ' ');
}

export function estadoVariant(
  estado: string,
): 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple' | 'orange' {
  if (estado === 'ATENDIDA' || estado === 'FIRMADA') return 'success';
  if (estado === 'NO_ASISTIO' || estado === 'CANCELADA') return 'danger';
  if (estado === 'EN_ATENCION') return 'purple';
  if (estado === 'CONFIRMADA' || estado === 'EN_ESPERA') return 'info';
  if (estado === 'PENDIENTE') return 'warning';
  return 'neutral';
}
