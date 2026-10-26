'use client';

import { toast } from 'sonner';
import { hasPermission } from '@/lib/auth';

const PERMISO_LABELS: Record<string, string> = {
  verEspecialistas: 'ver especialistas',
  crearEspecialista: 'crear especialistas',
  editarEspecialista: 'editar especialistas',
  deshabilitarEspecialista: 'deshabilitar especialistas',
  bloquearEspecialistaGrupal: 'gestionar bloqueos grupales',
  verPacientes: 'ver pacientes',
  crearPaciente: 'crear pacientes',
  editarPaciente: 'editar pacientes',
  verInasistenciasPaciente: 'ver inasistencias',
  bloquearPaciente: 'bloquear pacientes',
  verTodasCitas: 'ver citas',
  crearCita: 'crear citas',
  editarCita: 'editar citas',
  cancelarCita: 'cancelar citas',
  reagendarCita: 'reagendar citas',
  marcarNoAsistio: 'marcar no asistió',
  verCalendario: 'ver calendario',
  verReportes: 'ver reportes',
  gestionarAdmins: 'gestionar administradores',
  gestionarPermisos: 'gestionar permisos',
  verHistoriaClinica: 'ver historias clínicas',
  editarHistoriaClinica: 'editar historias clínicas',
  gestionarModulosHCE: 'gestionar módulos HCE',
};

export function canAccess(permiso: string): boolean {
  return hasPermission(permiso);
}

export function requirePermission(permiso: string): boolean {
  if (!hasPermission(permiso)) {
    const label = PERMISO_LABELS[permiso] || permiso;
    toast.error(`No tienes permiso para ${label}`);
    return false;
  }
  return true;
}
