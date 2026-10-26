import { useState, useCallback } from 'react';
import { pacientesApi } from '@/lib/api-client';
import { validateNombres, validateIdentificacion, validatePhoneEcuador, validatePastDate } from '@/lib/validators';
import { toast } from 'sonner';

interface QuickPacienteData {
  tipoIdentificacion: string;
  numeroIdentificacion: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  genero: string;
  estadoCivil: string;
  telefono: string;
  email: string;
  direccion: string;
  provincia: string;
  canton: string;
  parroquia: string;
  zona: string;
  grupoSanguineo: string;
  tipoSeguro: string;
}

export function usePacienteQuick(onPacienteCreated?: (p: any) => void) {
  const [showQuickPaciente, setShowQuickPaciente] = useState(false);
  const [quickPaciente, setQuickPaciente] = useState<QuickPacienteData>({
    tipoIdentificacion: 'CEDULA',
    numeroIdentificacion: '',
    nombres: '',
    apellidos: '',
    fechaNacimiento: '',
    genero: 'MASCULINO',
    estadoCivil: 'SOLTERO',
    telefono: '',
    email: '',
    direccion: '',
    provincia: '',
    canton: '',
    parroquia: '',
    zona: '',
    grupoSanguineo: 'O_POSITIVO',
    tipoSeguro: 'PARTICULAR',
  });
  const [savingQuick, setSavingQuick] = useState(false);
  const [quickTouched, setQuickTouched] = useState<Record<string, boolean>>({});
  const [quickErrors, setQuickErrors] = useState<Record<string, string>>({});

  const validateQuickField = useCallback((name: string, value: string, data: QuickPacienteData) => {
    let err = '';
    switch (name) {
      case 'nombres':
        err = validateNombres(value, 'Nombres').message;
        break;
      case 'apellidos':
        err = validateNombres(value, 'Apellidos').message;
        break;
      case 'numeroIdentificacion':
        err = validateIdentificacion(data.tipoIdentificacion, value).message;
        break;
      case 'telefono':
        err = validatePhoneEcuador(value, 'Teléfono').message;
        break;
      case 'fechaNacimiento':
        err = validatePastDate(value, 'Fecha de Nacimiento').message;
        break;
    }
    setQuickErrors((prev) => ({ ...prev, [name]: err }));
  }, []);

  const handleQuickBlur = useCallback((name: string, value: string) => {
    setQuickTouched((prev) => ({ ...prev, [name]: true }));
    validateQuickField(name, value, quickPaciente);
  }, [validateQuickField, quickPaciente]);

  const handleQuickChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setQuickPaciente((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handleQuickSave = useCallback(async () => {
    const allErrors: Record<string, string> = {};
    const allTouched: Record<string, boolean> = {};
    ['nombres', 'apellidos', 'numeroIdentificacion', 'telefono', 'fechaNacimiento'].forEach((f) => {
      allTouched[f] = true;
      let err = '';
      switch (f) {
        case 'nombres':
          err = validateNombres(quickPaciente.nombres, 'Nombres').message;
          break;
        case 'apellidos':
          err = validateNombres(quickPaciente.apellidos, 'Apellidos').message;
          break;
        case 'numeroIdentificacion':
          err = validateIdentificacion(quickPaciente.tipoIdentificacion, quickPaciente.numeroIdentificacion).message;
          break;
        case 'telefono':
          err = validatePhoneEcuador(quickPaciente.telefono, 'Teléfono').message;
          break;
        case 'fechaNacimiento':
          err = validatePastDate(quickPaciente.fechaNacimiento, 'Fecha de Nacimiento').message;
          break;
      }
      if (err) allErrors[f] = err;
    });
    setQuickTouched(allTouched);
    setQuickErrors(allErrors);
    if (Object.keys(allErrors).length > 0) {
      toast.error('Corrija los errores (ISO 9001)');
      return;
    }

    setSavingQuick(true);
    try {
      const p = await pacientesApi.create(quickPaciente);
      if (onPacienteCreated) onPacienteCreated(p);
      setShowQuickPaciente(false);
      setQuickPaciente({
        tipoIdentificacion: 'CEDULA',
        numeroIdentificacion: '',
        nombres: '',
        apellidos: '',
        fechaNacimiento: '',
        genero: 'MASCULINO',
        estadoCivil: 'SOLTERO',
        telefono: '',
        email: '',
        direccion: '',
        provincia: '',
        canton: '',
        parroquia: '',
        zona: '',
        grupoSanguineo: 'O_POSITIVO',
        tipoSeguro: 'PARTICULAR',
      });
      setQuickTouched({});
      setQuickErrors({});
      toast.success('Paciente creado rápidamente');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSavingQuick(false);
    }
  }, [quickPaciente, onPacienteCreated]);

  const setQuickPacienteField = useCallback((field: string, value: string) => {
    setQuickPaciente((prev) => ({ ...prev, [field]: value }));
  }, []);

  const openQuickPaciente = useCallback(() => {
    setQuickPaciente({
      tipoIdentificacion: 'CEDULA',
      numeroIdentificacion: '',
      nombres: '',
      apellidos: '',
      fechaNacimiento: '',
      genero: 'MASCULINO',
      estadoCivil: 'SOLTERO',
      telefono: '',
      email: '',
      direccion: '',
      provincia: '',
      canton: '',
      parroquia: '',
      zona: '',
      grupoSanguineo: 'O_POSITIVO',
      tipoSeguro: 'PARTICULAR',
    });
    setQuickTouched({});
    setQuickErrors({});
    setShowQuickPaciente(true);
  }, []);

  return {
    showQuickPaciente,
    setShowQuickPaciente,
    quickPaciente,
    setQuickPaciente,
    savingQuick,
    setSavingQuick,
    quickTouched,
    setQuickTouched,
    quickErrors,
    setQuickErrors,
    handleQuickChange,
    handleQuickBlur,
    handleQuickSave,
    openQuickPaciente,
    setQuickPacienteField,
  };
}