'use client';

import { useState, useCallback } from 'react';
import { pacientesApi } from '@/lib/api-client';
import { toast } from 'sonner';
import { validateNombres, validateIdentificacion, validatePhoneEcuador, validatePhoneOptional, validatePastDate } from '@/lib/validators';

export interface PacienteForm {
  nombres: string;
  apellidos: string;
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  tipoIdentificacion: string;
  numeroIdentificacion: string;
  genero: string;
  fechaNacimiento: string;
  estadoCivil: string;

  telefono: string;
  telefonoSecundario: string;
  direccion: string;
  provincia: string;
  canton: string;
  parroquia: string;
  zona: string;

  grupoSanguineo: string;
  tipoSeguro: string;
  nombreConvenio: string;
  alergias: string;
  enfermedadesPreexistentes: string;

  emergenciaNombre: string;
  emergenciaTelefono: string;
  emergenciaParentesco: string;

  laboralEmpresa: string;
  laboralCargo: string;
  laboralDireccion: string;
  laboralTelefono: string;
}

const empty: PacienteForm = {
  nombres: '', apellidos: '', primerNombre: '', segundoNombre: '', primerApellido: '', segundoApellido: '',
  tipoIdentificacion: 'CEDULA', numeroIdentificacion: '', genero: 'MASCULINO', fechaNacimiento: '', estadoCivil: 'SOLTERO',
  telefono: '', telefonoSecundario: '', direccion: '', provincia: '', canton: '', parroquia: '', zona: '',
  grupoSanguineo: 'O_POSITIVO', tipoSeguro: 'PARTICULAR', nombreConvenio: '',
  alergias: '', enfermedadesPreexistentes: '',
  emergenciaNombre: '', emergenciaTelefono: '', emergenciaParentesco: '',
  laboralEmpresa: '', laboralCargo: '', laboralDireccion: '', laboralTelefono: '',
};

function splitFirstFull(value?: string | null): { primerNombre: string; segundoNombre: string; nombres: string } {
  if (!value) return { primerNombre: '', segundoNombre: '', nombres: '' };
  const parts = value.trim().split(/\s+/);
  return {
    primerNombre: parts[0] ?? '',
    segundoNombre: parts.slice(1).join(' '),
    nombres: value.trim(),
  };
}
function splitApellido(value?: string | null): { primerApellido: string; segundoApellido: string; apellidos: string } {
  if (!value) return { primerApellido: '', segundoApellido: '', apellidos: '' };
  const parts = value.trim().split(/\s+/);
  return {
    primerApellido: parts[0] ?? '',
    segundoApellido: parts.slice(1).join(' '),
    apellidos: value.trim(),
  };
}
function joinFirst(...parts: Array<string | undefined | null>): string {
  return parts.filter((p) => !!p && String(p).trim().length > 0).map((p) => String(p).trim()).join(' ');
}
function csvToArray(value: string): string[] {
  return value.split(/,|;/).map((s) => s.trim()).filter(Boolean);
}
function arrayToCsv(arr: string[]): string {
  return arr.join(', ');
}

export const TIPOS_IDENTIFICACION = ['CEDULA', 'PASAPORTE'] as const;
export const GENEROS = ['MASCULINO', 'FEMENINO', 'OTRO'] as const;
export const ESTADOS_CIVIL = ['SOLTERO', 'CASADO', 'DIVORCIADO', 'VIUDO', 'UNION_LIBRE'] as const;
export const TIPOS_SEGURO = ['PARTICULAR', 'PUBLICO', 'CONVENIO'] as const;
export const GRUPOS_SANGUINEOS = [
  'O_POSITIVO', 'O_NEGATIVO', 'A_POSITIVO', 'A_NEGATIVO',
  'B_POSITIVO', 'B_NEGATIVO', 'AB_POSITIVO', 'AB_NEGATIVO',
] as const;

export function usePacienteForm() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PacienteForm>(empty);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [idChecking, setIdChecking] = useState(false);
  const [idError, setIdError] = useState('');

  const validateField = useCallback((name: string, value: string) => {
    let err = '';
    switch (name) {
      case 'primerNombre':
      case 'nombres':
        err = validateNombres(value, 'Primer nombre').message; break;
      case 'primerApellido':
      case 'apellidos':
        err = validateNombres(value, 'Primer apellido').message; break;
      case 'numeroIdentificacion':
        err = validateIdentificacion(form.tipoIdentificacion, value).message; break;
      case 'telefono':
        err = validatePhoneEcuador(value, 'Teléfono').message; break;
      case 'telefonoSecundario':
        err = validatePhoneOptional(value).message; break;
      case 'fechaNacimiento':
        err = validatePastDate(value, 'Fecha de Nacimiento').message; break;
      case 'emergenciaTelefono':
        err = validatePhoneEcuador(value, 'Teléfono de emergencia').message; break;
      case 'emergenciaNombre':
        err = validateNombres(value, 'Nombre de contacto').message; break;
      case 'emergenciaParentesco':
        err = validateNombres(value, 'Parentesco').message; break;
      case 'laboralTelefono':
        err = validatePhoneOptional(value).message; break;
    }
    setFieldErrors((prev) => ({ ...prev, [name]: err }));
  }, [form.tipoIdentificacion]);

  const handleBlur = (name: string, value: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let newForm: PacienteForm = { ...form, [name]: value };
    if (name === 'primerNombre' || name === 'segundoNombre') {
      newForm = { ...newForm, nombres: joinFirst(newForm.primerNombre, newForm.segundoNombre) };
    }
    if (name === 'primerApellido' || name === 'segundoApellido') {
      newForm = { ...newForm, apellidos: joinFirst(newForm.primerApellido, newForm.segundoApellido) };
    }
    setForm(newForm);
    if (touched[name]) {
      validateField(name, value);
    }
  };

  const buildPayload = (current: PacienteForm) => {
    const alergiasArr = current.alergias ? csvToArray(current.alergias) : [];
    const enfArr = current.enfermedadesPreexistentes ? csvToArray(current.enfermedadesPreexistentes) : [];
    const omitIfEmpty = <T extends string | undefined>(v: T): T | undefined => (v && v.trim().length > 0 ? v : undefined);
    return {
      primerNombre: current.primerNombre,
      segundoNombre: omitIfEmpty(current.segundoNombre),
      primerApellido: current.primerApellido,
      segundoApellido: omitIfEmpty(current.segundoApellido),
      nombres: current.nombres,
      apellidos: current.apellidos,
      tipoIdentificacion: current.tipoIdentificacion,
      numeroIdentificacion: current.numeroIdentificacion,
      genero: current.genero,
      fechaNacimiento: current.fechaNacimiento,
      estadoCivil: current.estadoCivil,
      telefono: current.telefono,
      telefonoSecundario: omitIfEmpty(current.telefonoSecundario),
      direccion: current.direccion,
      provincia: current.provincia,
      canton: current.canton,
      parroquia: omitIfEmpty(current.parroquia),
      zona: current.zona,
      grupoSanguineo: current.grupoSanguineo,
      tipoSeguro: current.tipoSeguro,
      nombreConvenio: omitIfEmpty(current.nombreConvenio),
      alergias: alergiasArr,
      enfermedadesPreexistentes: enfArr,
      emergenciaNombre: current.emergenciaNombre,
      emergenciaTelefono: current.emergenciaTelefono,
      emergenciaParentesco: current.emergenciaParentesco,
      laboralEmpresa: omitIfEmpty(current.laboralEmpresa),
      laboralCargo: omitIfEmpty(current.laboralCargo),
      laboralDireccion: omitIfEmpty(current.laboralDireccion),
      laboralTelefono: omitIfEmpty(current.laboralTelefono),
    };
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(empty);
    setTouched({});
    setFieldErrors({});
    setIdError('');
    setIdChecking(false);
    setShowForm(true);
  };

  const openEdit = (record: any) => {
    const p = record;
    const nombresSplit = splitFirstFull(p.primerNombre ?? p.nombres);
    const apellidosSplit = splitApellido(p.primerApellido ?? p.apellidos);
    const alergiasCsv = Array.isArray(p.alergias)
      ? arrayToCsv(p.alergias)
      : (p.alergias || '');
    const enfCsv = Array.isArray(p.enfermedadesPreexistentes)
      ? arrayToCsv(p.enfermedadesPreexistentes)
      : (p.enfermedadesPreexistentes || '');
    setEditingId(p.id);
    setForm({
      nombres: nombresSplit.nombres,
      apellidos: apellidosSplit.apellidos,
      primerNombre: nombresSplit.primerNombre,
      segundoNombre: nombresSplit.segundoNombre,
      primerApellido: apellidosSplit.primerApellido,
      segundoApellido: apellidosSplit.segundoApellido,
      tipoIdentificacion: p.tipoIdentificacion || 'CEDULA',
      numeroIdentificacion: p.numeroIdentificacion || '',
      genero: p.genero || 'MASCULINO',
      fechaNacimiento: p.fechaNacimiento ? p.fechaNacimiento.split('T')[0] : '',
      estadoCivil: p.estadoCivil || 'SOLTERO',
      telefono: p.telefono || '',
      telefonoSecundario: p.telefonoSecundario || '',
      direccion: p.direccion || '',
      provincia: p.provincia || '',
      canton: p.canton || '',
      parroquia: p.parroquia || '',
      zona: p.zona || '',
      grupoSanguineo: p.grupoSanguineo || 'O_POSITIVO',
      tipoSeguro: p.tipoSeguro || 'PARTICULAR',
      nombreConvenio: p.nombreConvenio || '',
      alergias: alergiasCsv,
      enfermedadesPreexistentes: enfCsv,
      emergenciaNombre: p.emergenciaNombre || '',
      emergenciaTelefono: p.emergenciaTelefono || '',
      emergenciaParentesco: p.emergenciaParentesco || '',
      laboralEmpresa: p.laboralEmpresa || '',
      laboralCargo: p.laboralCargo || '',
      laboralDireccion: p.laboralDireccion || '',
      laboralTelefono: p.laboralTelefono || '',
    });
    setTouched({});
    setFieldErrors({});
    setIdError('');
    setShowForm(true);
  };

  const setAlergias = (lista: string[]) => setForm((p) => ({ ...p, alergias: arrayToCsv(lista) }));
  const setEnfermedades = (lista: string[]) => setForm((p) => ({ ...p, enfermedadesPreexistentes: arrayToCsv(lista) }));

  const handleSave = async (onSuccess: () => void) => {
    const allErrors: Record<string, string> = {};
    const allTouched: Record<string, boolean> = {};
    const fields = ['primerNombre', 'primerApellido', 'numeroIdentificacion', 'telefono', 'fechaNacimiento',
      'emergenciaNombre', 'emergenciaTelefono', 'emergenciaParentesco'];
    fields.forEach((f) => {
      allTouched[f] = true;
      const v = (form as any)[f];
      let err = '';
      switch (f) {
        case 'primerNombre': err = validateNombres(v, 'Primer nombre').message; break;
        case 'primerApellido': err = validateNombres(v, 'Primer apellido').message; break;
        case 'numeroIdentificacion':
          err = validateIdentificacion(form.tipoIdentificacion, v).message;
          break;
        case 'telefono': err = validatePhoneEcuador(v, 'Teléfono').message; break;
        case 'fechaNacimiento': err = validatePastDate(v, 'Fecha de Nacimiento').message; break;
        case 'emergenciaTelefono': err = validatePhoneEcuador(v, 'Teléfono de emergencia').message; break;
        case 'emergenciaNombre': err = validateNombres(v, 'Nombre de contacto').message; break;
        case 'emergenciaParentesco': err = validateNombres(v, 'Parentesco').message; break;
      }
      if (err) allErrors[f] = err;
    });
    setTouched(allTouched);
    setFieldErrors(allErrors);
    if (Object.keys(allErrors).length > 0) {
      toast.error('Corrija los errores antes de guardar');
      return false;
    }
    if (idError) {
      toast.error(idError);
      return false;
    }
    setSaving(true);
    try {
      const payload = buildPayload(form);
      if (editingId) {
        await pacientesApi.update(editingId, payload as any);
        toast.success('Paciente actualizado');
      } else {
        await pacientesApi.create(payload as any);
        toast.success('Paciente creado');
      }
      setShowForm(false);
      onSuccess();
      return true;
    } catch (e: any) {
      toast.error(e.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    showForm, setShowForm, editingId, form, setForm,
    saving, touched, setTouched, fieldErrors, setFieldErrors,
    handleChange, handleBlur, validateField,
    openCreate, openEdit, handleSave,
    idChecking, setIdChecking, idError, setIdError,
    setAlergias, setEnfermedades,
    parseList: (s: string) => csvToArray(s),
    csvToArray, arrayToCsv,
  };
}
