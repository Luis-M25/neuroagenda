import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-EC', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateTime(date: Date | string, time: string): string {
  return `${formatDate(date)} ${time}`;
}

export function getSeverityColor(contador: number): string {
  if (contador === 0) return 'bg-success-100 text-success-600';
  if (contador === 1) return 'bg-warning-100 text-warning-600';
  if (contador <= 3) return 'bg-orange-100 text-orange-800';
  return 'bg-danger-100 text-danger-600';
}

export function getEstadoCitaColor(estado: string): string {
  const colores: Record<string, string> = {
    PENDIENTE: 'bg-amber-100 text-amber-700',
    CONFIRMADA: 'bg-blue-100 text-blue-700',
    EN_ESPERA: 'bg-purple-100 text-purple-700',
    EN_ATENCION: 'bg-green-100 text-green-700',
    ATENDIDA: 'bg-neutral-200 text-neutral-700',
    NO_ASISTIO: 'bg-orange-100 text-orange-700',
    CANCELADA: 'bg-red-100 text-red-700',
    REAGENDADA: 'bg-purple-100 text-purple-700',
  };
  return colores[estado] || 'bg-neutral-100 text-neutral-600';
}

export const ESTADO_CITA_COLORS: Record<string, string> = {
  PENDIENTE: '#F59E0B',
  CONFIRMADA: '#2563EB',
  EN_ESPERA: '#8B5CF6',
  EN_ATENCION: '#16A34A',
  ATENDIDA: '#4B5563',
  NO_ASISTIO: '#F97316',
    CANCELADA: '#DC2626',
    REAGENDADA: '#A855F7',
  };

export function getEstadoCitaBorderColor(estado: string): string {
  const borders: Record<string, string> = {
    PENDIENTE: 'border-l-4 border-l-amber-400',
    CONFIRMADA: 'border-l-4 border-l-blue-400',
    EN_ESPERA: 'border-l-4 border-l-purple-400',
    EN_ATENCION: 'border-l-4 border-l-green-400',
    ATENDIDA: 'border-l-4 border-l-neutral-300',
    NO_ASISTIO: 'border-l-4 border-l-orange-400',
    CANCELADA: 'border-l-4 border-l-red-500',
    REAGENDADA: 'border-l-4 border-l-purple-400',
  };
  return borders[estado] || '';
}

export function getEstadoEspecialistaColor(estado: string): string {
  const colores: Record<string, string> = {
    HABILITADO: 'bg-success-100 text-success-600',
    DESHABILITADO: 'bg-danger-100 text-danger-600',
    SUSPENDIDO_TEMPORAL: 'bg-warning-100 text-warning-600',
  };
  return colores[estado] || 'bg-neutral-100 text-neutral-600';
}

export const DIAS_SEMANA = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles',
  'Jueves', 'Viernes', 'Sábado',
];

export const ESTADOS_CITA = [
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'CONFIRMADA', label: 'Confirmada' },
  { value: 'EN_ESPERA', label: 'En espera' },
  { value: 'EN_ATENCION', label: 'En atención' },
  { value: 'ATENDIDA', label: 'Atendida' },
  { value: 'NO_ASISTIO', label: 'No asistió' },
  { value: 'CANCELADA', label: 'Cancelada' },
];

/**
 * Retorna la fecha de hoy en formato YYYY-MM-DD
 * @example
 * todayStr() // "2026-07-13"
 */
export function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Formatea una fecha string (YYYY-MM-DD) en español.
 * @example
 * formatDateEs('2026-07-13') // "domingo, 13 de julio de 2026"
 */
export function formatDateEs(fechaStr: string): string {
  const [y, m, d] = fechaStr.split('-').map(Number);
  const fecha = new Date(y, m - 1, d);
  return fecha.toLocaleDateString('es-EC', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Suma o resta días a una fecha string (YYYY-MM-DD).
 * @example
 * addDaysStr('2026-07-13', 1) // "2026-07-14"
 * addDaysStr('2026-07-13', -1) // "2026-07-12"
 */
export function addDaysStr(fechaStr: string, dias: number): string {
  const [y, m, d] = fechaStr.split('-').map(Number);
  const fecha = new Date(y, m - 1, d);
  fecha.setDate(fecha.getDate() + dias);
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
}

/**
 * Valida si un string es una fecha válida en formato YYYY-MM-DD.
 * @example
 * isValidDate('2026-07-13') // true
 * isValidDate('2026-13-01') // false (mes inválido)
 * isValidDate('invalid') // false
 */
export function isValidDate(str: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const [y, m, d] = str.split('-').map(Number);
  const fecha = new Date(y, m - 1, d);
  return (
    fecha.getFullYear() === y &&
    fecha.getMonth() === m - 1 &&
    fecha.getDate() === d
  );
}

const PASSWORD_ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const PASSWORD_NUM = '23456789';
const PASSWORD_SYM = '!@#$%&*?_+-=';

export function generatePassword(length = 14): string {
  const chars = PASSWORD_ALPHA + PASSWORD_NUM + PASSWORD_SYM;
  const generated = new Array(length);
  generated[0] = PASSWORD_ALPHA[Math.floor(Math.random() * PASSWORD_ALPHA.length)];
  generated[1] = PASSWORD_NUM[Math.floor(Math.random() * PASSWORD_NUM.length)];
  generated[2] = PASSWORD_SYM[Math.floor(Math.random() * PASSWORD_SYM.length)];
  for (let i = 3; i < length; i++) {
    generated[i] = chars[Math.floor(Math.random() * chars.length)];
  }
  for (let i = generated.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [generated[i], generated[j]] = [generated[j], generated[i]];
  }
  return generated.join('');
}
