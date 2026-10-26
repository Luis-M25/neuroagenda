import type { LucideIcon } from 'lucide-react';
import {
  Stethoscope, BookOpen, AlertTriangle, Activity, ScanEye, FlaskConical,
  Microscope, ClipboardList, Pill, Syringe, FilePenLine, FileSignature,
  CalendarCheck, MessageSquareText,
} from 'lucide-react';

export const MODULO_ICONS: Record<string, LucideIcon> = {
  consulta: Stethoscope,
  antecedentes: BookOpen,
  alergias: AlertTriangle,
  signos_vitales: Activity,
  examen_fisico: ScanEye,
  diagnosticos: FlaskConical,
  examenes: Microscope,
  pedidos: ClipboardList,
  prescripcion: Pill,
  tratamiento: Syringe,
  evolucion: FilePenLine,
  vacunas: Syringe,
  consentimientos: FileSignature,
  proxima_cita: CalendarCheck,
  observaciones: MessageSquareText,
};

export const MODULO_COLORS: Record<string, string> = {
  consulta: 'text-sky-600 bg-sky-50',
  diagnosticos: 'text-purple-600 bg-purple-50',
  prescripcion: 'text-emerald-600 bg-emerald-50',
  evolucion: 'text-amber-600 bg-amber-50',
  signos_vitales: 'text-rose-600 bg-rose-50',
  pedidos: 'text-orange-600 bg-orange-50',
  tratamiento: 'text-teal-600 bg-teal-50',
  vacunas: 'text-cyan-600 bg-cyan-50',
  examenes: 'text-pink-600 bg-pink-50',
  consentimientos: 'text-indigo-600 bg-indigo-50',
  examen_fisico: 'text-violet-600 bg-violet-50',
  antecedentes: 'text-blue-600 bg-blue-50',
  alergias: 'text-red-600 bg-red-50',
  observaciones: 'text-slate-600 bg-slate-50',
  proxima_cita: 'text-lime-600 bg-lime-50',
};

export function getModuloIcon(modulo: string) {
  const Icon = MODULO_ICONS[modulo] || ClipboardList;
  return Icon;
}

export function getModuloColor(modulo: string) {
  return MODULO_COLORS[modulo] || 'text-slate-600 bg-slate-50';
}
