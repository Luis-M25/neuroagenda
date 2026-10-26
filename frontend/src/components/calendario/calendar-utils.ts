import type { EstadoCita, Cita, CitaFallback } from '@/types/api';

export const HOURS = Array.from({ length: 21 }, (_, i) => {
  const h = 8 + Math.floor(i / 2);
  const m = (i % 2) * 30;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
});

export const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

export const STATUS_COLORS: Record<EstadoCita, string> = {
  PENDIENTE: '#F59E0B', CONFIRMADA: '#2563EB', EN_ESPERA: '#8B5CF6', EN_ATENCION: '#16A34A',
  ATENDIDA: '#4B5563', NO_ASISTIO: '#F97316', CANCELADA: '#DC2626', REAGENDADA: '#A855F7', RESERVADO: '#06B6D4',
};

export const BLOQUEADO_COLOR = '#6B21A8';
export const BLOQUEADO_BG = '#F3E8FF';
export const BLOQUEADO_BORDER = '#D8B4FE';

export const STATUS_LABELS: Record<EstadoCita, string> = {
  PENDIENTE: 'Pendiente', CONFIRMADA: 'Confirmada', EN_ESPERA: 'En espera', EN_ATENCION: 'En atención',
  ATENDIDA: 'Atendida', NO_ASISTIO: 'No asistió', CANCELADA: 'Cancelada', REAGENDADA: 'Reagendada', RESERVADO: 'Reservado',
};

const SPECIALIST_COLORS = [
  '#4f46e5', '#db2777', '#0891b2', '#ea580c', '#7c3aed',
  '#059669', '#ca8a04', '#dc2626', '#2563eb', '#9333ea',
];

export function hashColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash) + id.charCodeAt(i);
  return SPECIALIST_COLORS[Math.abs(hash) % SPECIALIST_COLORS.length];
}

export function initials(nombres: string, apellidos: string): string {
  return `${nombres.charAt(0)}${apellidos.charAt(0)}`.toUpperCase();
}

export function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function roundToSlot(h: number, m: number): string {
  if (h < 8) return '08:00';
  if (h >= 19) return '18:00';
  return m >= 30
    ? `${String(h).padStart(2, '0')}:30`
    : `${String(h).padStart(2, '0')}:00`;
}

export function getClampInfo(isoStart: string): { slot: string; clamped: boolean; originalTime: string | null } {
  const date = new Date(isoStart);
  if (!isNaN(date.getTime())) {
    const h = date.getHours();
    const m = date.getMinutes();
    const clamped = h < 8 || h >= 19;
    return {
      slot: roundToSlot(h, m),
      clamped,
      originalTime: clamped ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}` : null,
    };
  }
  const match = isoStart.match(/[T ](\d{1,2}):(\d{2})/);
  if (!match) return { slot: '08:00', clamped: true, originalTime: isoStart };
  const h = parseInt(match[1]);
  const m = parseInt(match[2]);
  const clamped = h < 8 || h >= 19;
  return {
    slot: roundToSlot(h, m),
    clamped,
    originalTime: clamped ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}` : null,
  };
}

export function extractHour(isoStart: string): string {
  return getClampInfo(isoStart).slot;
}

export function formatDateEs(fecha: Date | string): string {
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha;
  return d.toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function inputDateStr(fecha: Date | string): string {
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export type TabKey = 'estado' | 'cita' | 'paciente';

export function isCita(obj: Cita | CitaFallback | null): obj is Cita {
  return obj !== null && typeof (obj as any).paciente === 'object' && 'nombres' in (obj as any).paciente;
}
