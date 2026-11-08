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

/** Sección del formulario (wizard) a la que pertenece cada campo. */
export const FIELD_SECTION: Record<string, number> = {
  primerNombre: 0, segundoNombre: 0, primerApellido: 0, segundoApellido: 0,
  tipoIdentificacion: 0, numeroIdentificacion: 0, genero: 0, fechaNacimiento: 0, estadoCivil: 0,
  telefono: 1, telefonoSecundario: 1, direccion: 1, provincia: 1, canton: 1, parroquia: 1, zona: 1,
  grupoSanguineo: 2, tipoSeguro: 2, nombreConvenio: 2, alergias: 2, enfermedadesPreexistentes: 2,
  emergenciaNombre: 3, emergenciaTelefono: 3, emergenciaParentesco: 3,
  laboralEmpresa: 4, laboralCargo: 4, laboralDireccion: 4, laboralTelefono: 4,
};

/** Campos que el formulario marca con asterisco y que no pueden quedar vacíos. */
const REQUIRED_FIELDS = [
  'primerNombre',
  'primerApellido',
  'numeroIdentificacion',
  'fechaNacimiento',
  'telefono',
  'direccion',
  'provincia',
  'canton',
  'emergenciaNombre',
  'emergenciaTelefono',
  'emergenciaParentesco',
] as const;

interface ApiFieldError {
  field?: string;
  messages?: string[];
}

/**
 * Extrae los errores estructurados que envía el backend
 * (`errors: [{ field, messages }]` o `{ field, message }`) y, si el backend
 * no los adjunta, intenta deducir el campo por el texto del mensaje.
 */
function extractApiErrors(err: any): { fields: Record<string, string>; general: string | null } {
  const data = err?.data ?? {};
  const fields: Record<string, string> = {};

  if (Array.isArray(data.errors)) {
    for (const item of data.errors as ApiFieldError[]) {
      if (typeof item?.field === 'string' && Array.isArray(item.messages) && item.messages.length > 0) {
        fields[item.field] = item.messages[0];
      }
    }
  }

  if (typeof data.field === 'string' && typeof data.message === 'string') {
    fields[data.field] = data.message;
  }

  if (Object.keys(fields).length === 0 && typeof data.message === 'string') {
    const msg = data.message;
    const lower = msg.toLowerCase();
    if (/c[ée]dula|identificaci[oó]n|identificador|pasaporte/.test(lower)) fields.numeroIdentificacion = msg;
    else if (/tel[eé]fono de emergencia/.test(lower)) fields.emergenciaTelefono = msg;
    else if (/tel[eé]fono/.test(lower)) fields.telefono = msg;
    else if (/fecha de nacimiento/.test(lower)) fields.fechaNacimiento = msg;
    else if (/direcci[oó]n de trabajo|laboral/.test(lower)) fields.laboralDireccion = msg;
    else if (/direcci[oó]n/.test(lower)) fields.direccion = msg;
    else if (/provincia/.test(lower)) fields.provincia = msg;
    else if (/cant[oó]n/.test(lower)) fields.canton = msg;
    else if (/nombre de contacto/.test(lower)) fields.emergenciaNombre = msg;
    else if (/parentesco/.test(lower)) fields.emergenciaParentesco = msg;
    else if (/nombre/.test(lower)) fields.primerNombre = msg;
    else if (/apellido/.test(lower)) fields.primerApellido = msg;
  }

  const general = Object.keys(fields).length === 0
    ? (typeof data.message === 'string' ? data.message : err?.message ?? null)
    : null;
  return { fields, general };
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
  const [saveError, setSaveError] = useState<string | null>(null);

  const getFieldError = useCallback((name: string, value: string) => {
    switch (name) {
      case 'primerNombre':
      case 'nombres':
        return validateNombres(value, 'Primer nombre').message;
      case 'primerApellido':
      case 'apellidos':
        return validateNombres(value, 'Primer apellido').message;
      case 'numeroIdentificacion':
        return validateIdentificacion(form.tipoIdentificacion, value).message;
      case 'telefono':
        return validatePhoneEcuador(value, 'Teléfono').message;
      case 'telefonoSecundario':
        return validatePhoneOptional(value).message;
      case 'fechaNacimiento':
        return validatePastDate(value, 'Fecha de Nacimiento').message;
      case 'emergenciaTelefono':
        return validatePhoneEcuador(value, 'Teléfono de emergencia').message;
      case 'emergenciaNombre':
        return validateNombres(value, 'Nombre de contacto').message;
      case 'emergenciaParentesco':
        return validateNombres(value, 'Parentesco').message;
      case 'laboralTelefono':
        return validatePhoneOptional(value).message;
      case 'direccion':
        return value.trim() ? '' : 'La dirección es obligatoria';
      case 'provincia':
        return value.trim() ? '' : 'La provincia es obligatoria';
      case 'canton':
        return value.trim() ? '' : 'El cantón es obligatorio';
      default:
        return '';
    }
  }, [form.tipoIdentificacion]);

  const validateField = useCallback((name: string, value: string) => {
    const err = getFieldError(name, value);
    setFieldErrors((prev) => ({ ...prev, [name]: err }));
  }, [getFieldError]);

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
    setSaveError(null);
    if (touched[name]) {
      validateField(name, value);
    }
  };

  const buildPayload = (current: PacienteForm) => {
    const alergiasArr = current.alergias ? csvToArray(current.alergias) : [];
    const enfArr = current.enfermedadesPreexistentes ? csvToArray(current.enfermedadesPreexistentes) : [];
    const omitIfEmpty = <T extends string | undefined>(v: T): T | undefined => (v && v.trim().length > 0 ? v : undefined);
    const normalizePhone = (v: string) => v.replace(/[\s-]/g, '');
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
      telefono: normalizePhone(current.telefono),
      telefonoSecundario: omitIfEmpty(normalizePhone(current.telefonoSecundario)),
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
      emergenciaTelefono: normalizePhone(current.emergenciaTelefono),
      emergenciaParentesco: current.emergenciaParentesco,
      laboralEmpresa: omitIfEmpty(current.laboralEmpresa),
      laboralCargo: omitIfEmpty(current.laboralCargo),
      laboralDireccion: omitIfEmpty(current.laboralDireccion),
      laboralTelefono: omitIfEmpty(normalizePhone(current.laboralTelefono)),
    };
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(empty);
    setTouched({});
    setFieldErrors({});
    setIdError('');
    setIdChecking(false);
    setSaveError(null);
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
    setSaveError(null);
    setShowForm(true);
  };

  const setAlergias = (lista: string[]) => setForm((p) => ({ ...p, alergias: arrayToCsv(lista) }));
  const setEnfermedades = (lista: string[]) => setForm((p) => ({ ...p, enfermedadesPreexistentes: arrayToCsv(lista) }));

  const handleSave = async (onSuccess: () => void, onFieldError?: (field: string) => void) => {
    const allErrors: Record<string, string> = {};
    const allTouched: Record<string, boolean> = {};

    REQUIRED_FIELDS.forEach((f) => {
      allTouched[f] = true;
      const err = getFieldError(f, (form as any)[f] ?? '');
      if (err) allErrors[f] = err;
    });

    setTouched((prev) => ({ ...prev, ...allTouched }));
    setFieldErrors(allErrors);

    if (Object.keys(allErrors).length > 0) {
      const firstField = REQUIRED_FIELDS.find((f) => allErrors[f])!;
      const extra = Object.keys(allErrors).length - 1;
      setSaveError(
        extra > 0
          ? `${allErrors[firstField]} (y ${extra} campo${extra === 1 ? '' : 's'} más con error)`
          : allErrors[firstField],
      );
      onFieldError?.(firstField);
      toast.error('Corrija los errores antes de guardar');
      return false;
    }

    if (idError) {
      setSaveError(idError);
      onFieldError?.('numeroIdentificacion');
      toast.error(idError);
      return false;
    }

    setSaving(true);
    setSaveError(null);
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
      const { fields, general } = extractApiErrors(e);
      const fieldNames = Object.keys(fields);

      if (fieldNames.length > 0) {
        const firstField = fieldNames[0];
        const extra = fieldNames.length - 1;
        setFieldErrors((prev) => ({ ...prev, ...fields }));
        setTouched((prev) => {
          const next = { ...prev };
          fieldNames.forEach((f) => { next[f] = true; });
          return next;
        });
        setSaveError(
          extra > 0
            ? `${fields[firstField]} (y ${extra} campo${extra === 1 ? '' : 's'} más con error)`
            : fields[firstField],
        );
        onFieldError?.(firstField);
      } else {
        setSaveError(general ?? e.message);
      }

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
    saveError, setSaveError,
    setAlergias, setEnfermedades,
    parseList: (s: string) => csvToArray(s),
    csvToArray, arrayToCsv,
  };
}
