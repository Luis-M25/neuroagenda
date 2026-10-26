'use client';

import { useState, useCallback } from 'react';
import { validateCedulaEcuador } from '@/lib/validators';
import { citasApi } from '@/lib/api-client';
import { toast } from 'sonner';

export interface EspecialistaCita {
  id: string;
  nombre: string;
  especialidad: string;
  tienePasantes: boolean;
  sede: string;
  consultorio: string;
  citasCount: number;
  fechas: CitaFecha[];
}

export interface CitaFecha {
  fecha: string;
  horaInicio: string;
  horaFin: string;
  duracionMinutos: number;
  consultorio: string;
}

export const PROTOCOLOS = [
  { value: 'UNICA', label: 'Única', citas: 1, desc: 'Consulta sin seguimiento programado' },
  { value: 'CONTROL', label: 'Control', citas: 3, desc: 'Seguimiento de tratamiento' },
  { value: 'EVALUACION', label: 'Evaluación', citas: 4, desc: 'Primera consulta o valoración inicial' },
  { value: 'MANTENIMIENTO', label: 'Mantenimiento', citas: 5, desc: 'Consulta de mantenimiento periódico' },
];

export interface WizardState {
  pacienteId: string;
  pacienteNombre: string;
  pacienteIdentificacion: string;
  tipo: string;
  totalCitas: number;
  motivo: string;
  especialidad: string;
  especialistas: EspecialistaCita[];
  notificarWhatsapp: boolean;
  quienAtiende: 'especialista' | 'pasante';
  pasanteNombre: string;
  pasanteCedula: string;
}

export const INITIAL_WIZARD: WizardState = {
  pacienteId: '',
  pacienteNombre: '',
  pacienteIdentificacion: '',
  tipo: '',
  totalCitas: 0,
  motivo: '',
  especialidad: '',
  especialistas: [],
  notificarWhatsapp: false,
  quienAtiende: 'especialista',
  pasanteNombre: '',
  pasanteCedula: '',
};

export function useAppointmentWizard() {
  const [wizard, setWizardState] = useState<WizardState>({ ...INITIAL_WIZARD });
  const [wizardErrors, setWizardErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const setWizard = useCallback(
    (updater: WizardState | ((prev: WizardState) => WizardState)) => {
      setWizardState((prev) => (typeof updater === 'function' ? (updater as (p: WizardState) => WizardState)(prev) : updater));
    },
    [],
  );

  const totalCitasAgendadas = wizard.especialistas.reduce(
    (sum, esp) => sum + esp.fechas.length, 0,
  );

  const validateStep2 = useCallback((): boolean => {
    const errs: Record<string, string> = {};
    if (!wizard.tipo) errs.tipo = 'Seleccione un protocolo';
    if (!wizard.especialidad) errs.especialidad = 'Seleccione una especialidad';
    if (wizard.especialistas.length === 0) errs.especialistas = 'Seleccione al menos un especialista';
    setWizardErrors(errs);
    return Object.keys(errs).length === 0;
  }, [wizard.tipo, wizard.especialidad, wizard.especialistas]);

  const validateStep3 = useCallback((): boolean => {
    const errs: Record<string, string> = {};
    const totalAsignadas = wizard.especialistas.reduce((s, e) => s + e.citasCount, 0);
    if (totalAsignadas !== wizard.totalCitas) {
      errs.citasCount = `El total de citas asignadas (${totalAsignadas}) debe coincidir con el protocolo (${wizard.totalCitas})`;
    }
    if (totalCitasAgendadas < wizard.totalCitas) {
      errs.fechas = `Debe agendar las ${wizard.totalCitas} citas (faltan ${wizard.totalCitas - totalCitasAgendadas})`;
    }
    if (wizard.quienAtiende === 'pasante') {
      if (!wizard.pasanteNombre.trim()) errs.pasanteNombre = 'Ingrese el nombre del pasante';
      const cedulaResult = validateCedulaEcuador(wizard.pasanteCedula);
      if (!cedulaResult.valid) errs.pasanteCedula = cedulaResult.message;
    }
    setWizardErrors(errs);
    return Object.keys(errs).length === 0;
  }, [wizard.especialistas, wizard.totalCitas, totalCitasAgendadas, wizard.quienAtiende, wizard.pasanteNombre, wizard.pasanteCedula]);

  const handleSaveAll = useCallback(
    async (onSuccess: () => void) => {
      if (!validateStep3()) return;
      setSaving(true);
      try {
        const payloads = wizard.especialistas.flatMap((esp) =>
          esp.fechas.map((f) => ({
            pacienteId: wizard.pacienteId,
            especialistaId: esp.id,
            especialidad: esp.especialidad,
            fecha: f.fecha,
            horaInicio: f.horaInicio,
            horaFin: f.horaFin,
            duracionMinutos: f.duracionMinutos,
            motivo: wizard.motivo,
            tipo: wizard.tipo,
            lugar: f.consultorio && esp.sede ? `${f.consultorio} (${esp.sede})` : `${esp.consultorio} (${esp.sede})`,
            notificarWhatsapp: wizard.notificarWhatsapp,
            atendidoPorNombre: wizard.quienAtiende === 'pasante' ? wizard.pasanteNombre.trim() : undefined,
            atendidoPorCedula: wizard.quienAtiende === 'pasante' ? wizard.pasanteCedula.trim() : undefined,
          })),
        );

        for (const payload of payloads) {
          await citasApi.create(payload as any);
        }
        toast.success(`${payloads.length} cita(s) creada(s) exitosamente`);
        onSuccess();
      } catch (e: any) {
        toast.error(e.message);
      } finally {
        setSaving(false);
      }
    },
    [wizard, validateStep3],
  );

  return {
    wizard,
    setWizard,
    wizardErrors,
    setWizardErrors,
    saving,
    totalCitasAgendadas,
    validateStep2,
    validateStep3,
    handleSaveAll,
    INITIAL_WIZARD,
  };
}
