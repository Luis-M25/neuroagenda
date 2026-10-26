'use client';

import { useState, useCallback } from 'react';
import { especialistasApi } from '@/lib/api-client';
import { toast } from 'sonner';
import {
  validateNombres,
  validateIdentificacion,
  validatePhoneEcuador,
  validateEmail,
  validateRequired,
  validatePasswordStrength,
  meetsBackendPasswordPolicy,
  BACKEND_PASSWORD_MESSAGE,
} from '@/lib/validators';
import { generatePassword } from '@/lib/utils';

export interface EspecialistaForm {
  email: string;
  password: string;
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
  codigoMsp: string;
  especialidad: string;
  subEspecialidad: string;
  tituloProfesional: string;
  emailInstitucional: string;
  emailSecundario: string;
  emailPersonal: string;
  telefono: string;
  telefonoSecundario: string;
  direccion: string;
  sede: string;
  consultorioPredeterminado: string;
  tienePasantes: boolean;
  colorCalendario: string;
  codigoAlfabetico: string;
}

const emptyForm: EspecialistaForm = {
  email: '',
  password: '',
  nombres: '',
  apellidos: '',
  primerNombre: '',
  segundoNombre: '',
  primerApellido: '',
  segundoApellido: '',
  tipoIdentificacion: 'CEDULA',
  numeroIdentificacion: '',
  genero: 'MASCULINO',
  fechaNacimiento: '',
  estadoCivil: 'SOLTERO',
  codigoMsp: '',
  especialidad: '',
  subEspecialidad: '',
  tituloProfesional: '',
  emailInstitucional: '',
  emailSecundario: '',
  emailPersonal: '',
  telefono: '',
  telefonoSecundario: '',
  direccion: '',
  sede: '',
  consultorioPredeterminado: '',
  tienePasantes: false,
  colorCalendario: '#3B82F6',
  codigoAlfabetico: '',
};

export const GENERO_OPTS = ['MASCULINO', 'FEMENINO', 'OTRO'];
export const TIPO_ID_OPTS = ['CEDULA', 'PASAPORTE'];
export const ESTADO_CIVIL_OPTS = ['SOLTERO', 'CASADO', 'DIVORCIADO', 'VIUDO', 'UNION_LIBRE'];

function joinFirst(...parts: Array<string | undefined | null>): string {
  return parts.filter((p) => !!p && String(p).trim().length > 0).map((p) => String(p).trim()).join(' ');
}

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

export const useEspecialistaForm = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EspecialistaForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const validateField = useCallback(
    (name: string, value: string, isEdit: boolean, currentForm: EspecialistaForm) => {
      let err = '';
      switch (name) {
        case 'primerNombre':
          err = validateNombres(value, 'Primer nombre').message;
          break;
        case 'primerApellido':
          err = validateNombres(value, 'Primer apellido').message;
          break;
        case 'nombres':
        case 'apellidos':
          err = validateNombres(value, name === 'nombres' ? 'Nombres' : 'Apellidos').message;
          break;
        case 'numeroIdentificacion':
          err = validateIdentificacion(currentForm.tipoIdentificacion, value).message;
          break;
        case 'telefono':
          err = validatePhoneEcuador(value, 'Teléfono').message;
          break;
        case 'email':
          if (!isEdit) {
            const r = validateEmail(value);
            if (!r.valid) err = r.message;
          }
          break;
        case 'password':
          if (!isEdit) {
            if (!value) err = 'La contraseña es obligatoria (ISO 27001)';
            else if (!meetsBackendPasswordPolicy(value)) err = BACKEND_PASSWORD_MESSAGE;
            else {
              const s = validatePasswordStrength(value);
              if (s.score < 3) err = 'Contraseña muy débil: ' + s.issues.join('; ');
            }
          }
          break;
        case 'emailInstitucional':
        case 'emailSecundario':
        case 'emailPersonal': {
          if (!value) break;
          const r = validateEmail(value);
          if (!r.valid) err = r.message;
          break;
        }
        case 'codigoMsp': {
          const r = validateRequired(value, 'Código MSP');
          if (!r.valid) err = r.message;
          break;
        }
        case 'especialidad': {
          const r = validateRequired(value, 'Especialidad');
          if (!r.valid) err = r.message;
          break;
        }
        case 'tituloProfesional': {
          const r = validateRequired(value, 'Título Profesional');
          if (!r.valid) err = r.message;
          break;
        }
        case 'sede': {
          const r = validateRequired(value, 'Sede');
          if (!r.valid) err = r.message;
          break;
        }
      }
      setFieldErrors((prev) => ({ ...prev, [name]: err }));
    },
    [],
  );

  const handleBlur = (name: string, value: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, value, !!editingId, form);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let newForm: EspecialistaForm = { ...form, [name]: value };

    if (name === 'primerNombre' || name === 'segundoNombre') {
      newForm = {
        ...newForm,
        nombres: joinFirst(newForm.primerNombre, newForm.segundoNombre),
      };
    }
    if (name === 'primerApellido' || name === 'segundoApellido') {
      newForm = {
        ...newForm,
        apellidos: joinFirst(newForm.primerApellido, newForm.segundoApellido),
      };
    }
    if (name === 'email' || name === 'emailInstitucional' || name === 'emailSecundario' || name === 'emailPersonal') {
      const login = newForm.emailInstitucional || newForm.emailSecundario || newForm.emailPersonal;
      if (login && newForm.email !== login) newForm.email = login;
    }

    setForm(newForm);
    if (touched[name]) {
      validateField(name, value, !!editingId, newForm);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      password: generatePassword(14),
    });
    setShowPassword(false);
    setTouched({});
    setFieldErrors({});
    setShowForm(true);
  };

  const openEdit = (record: any) => {
    const esp = record.especialista || record;
    const nombresSplit = splitFirstFull(esp.primerNombre ?? esp.nombres);
    const apellidosSplit = splitApellido(esp.primerApellido ?? esp.apellidos);
    setEditingId(record.id);
    setForm({
      email: record.email || record.usuario?.email || '',
      password: '',
      nombres: nombresSplit.nombres,
      apellidos: apellidosSplit.apellidos,
      primerNombre: nombresSplit.primerNombre,
      segundoNombre: nombresSplit.segundoNombre,
      primerApellido: apellidosSplit.primerApellido,
      segundoApellido: apellidosSplit.segundoApellido,
      tipoIdentificacion: esp.tipoIdentificacion || 'CEDULA',
      numeroIdentificacion: esp.numeroIdentificacion || '',
      genero: esp.genero || 'MASCULINO',
      fechaNacimiento: esp.fechaNacimiento ? esp.fechaNacimiento.split('T')[0] : '',
      estadoCivil: esp.estadoCivil || 'SOLTERO',
      codigoMsp: esp.codigoMsp || '',
      especialidad: esp.especialidad || '',
      subEspecialidad: esp.subEspecialidad || '',
      tituloProfesional: esp.tituloProfesional || '',
      emailInstitucional: esp.emailInstitucional || '',
      emailSecundario: esp.emailSecundario || '',
      emailPersonal: esp.emailPersonal || '',
      telefono: esp.telefono || '',
      telefonoSecundario: esp.telefonoSecundario || '',
      direccion: esp.direccion || '',
      sede: esp.sede || '',
      consultorioPredeterminado: esp.consultorioPredeterminado || '',
      tienePasantes: esp.tienePasantes ?? false,
      colorCalendario: esp.colorCalendario ?? '#3B82F6',
      codigoAlfabetico: esp.codigoAlfabetico || '',
    });
    setShowPassword(false);
    setTouched({});
    setFieldErrors({});
    setShowForm(true);
  };

  const regeneratePassword = () => {
    setForm((prev) => ({ ...prev, password: generatePassword(14) }));
  };

  const toggleShowPassword = () => setShowPassword((v) => !v);

  const handleSave = async () => {
    const allErrors: Record<string, string> = {};
    const allTouched: Record<string, boolean> = {};
    const isEdit = !!editingId;

    const fieldsToValidate = [
      'primerNombre',
      'primerApellido',
      'numeroIdentificacion',
      'telefono',
      'codigoMsp',
      'especialidad',
      'tituloProfesional',
      'emailInstitucional',
      'sede',
    ];
    if (!isEdit) fieldsToValidate.push('email', 'password');

    fieldsToValidate.forEach((field) => {
      allTouched[field] = true;
      let err = '';
      const value = (form as any)[field];
      switch (field) {
        case 'primerNombre':
        case 'primerApellido':
          err = validateNombres(value, field === 'primerNombre' ? 'Primer nombre' : 'Primer apellido').message;
          break;
        case 'numeroIdentificacion':
          err = validateIdentificacion(form.tipoIdentificacion, value).message;
          break;
        case 'telefono':
          err = validatePhoneEcuador(value, 'Teléfono').message;
          break;
        case 'email': {
          if (!isEdit) {
            const r = validateEmail(value);
            if (!r.valid) err = r.message;
          }
          break;
        }
        case 'password': {
          if (!isEdit) {
            if (!value) err = 'La contraseña es obligatoria (ISO 27001)';
            else if (!meetsBackendPasswordPolicy(value)) err = BACKEND_PASSWORD_MESSAGE;
            else {
              const s = validatePasswordStrength(value);
              if (s.score < 3) err = 'Contraseña muy débil';
            }
          }
          break;
        }
        case 'emailInstitucional': {
          const r = validateEmail(value);
          if (!r.valid) err = r.message;
          break;
        }
        case 'codigoMsp': {
          const r = validateRequired(value, 'Código MSP');
          if (!r.valid) err = r.message;
          break;
        }
        case 'especialidad': {
          const r = validateRequired(value, 'Especialidad');
          if (!r.valid) err = r.message;
          break;
        }
        case 'tituloProfesional': {
          const r = validateRequired(value, 'Título Profesional');
          if (!r.valid) err = r.message;
          break;
        }
        case 'sede': {
          const r = validateRequired(value, 'Sede');
          if (!r.valid) err = r.message;
          break;
        }
      }
      if (err) allErrors[field] = err;
    });

    setTouched((prev) => ({ ...prev, ...allTouched }));
    setFieldErrors((prev) => ({ ...prev, ...allErrors }));

    if (Object.keys(allErrors).length > 0) {
      toast.error('Corrija los errores antes de guardar (ISO 9001)');
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        const payload: any = {
          primerNombre: form.primerNombre,
          segundoNombre: form.segundoNombre || undefined,
          primerApellido: form.primerApellido,
          segundoApellido: form.segundoApellido || undefined,
          nombres: form.nombres,
          apellidos: form.apellidos,
          tipoIdentificacion: form.tipoIdentificacion,
          numeroIdentificacion: form.numeroIdentificacion,
          genero: form.genero,
          fechaNacimiento: form.fechaNacimiento || undefined,
          estadoCivil: form.estadoCivil,
          codigoMsp: form.codigoMsp,
          especialidad: form.especialidad,
          subEspecialidad: form.subEspecialidad || undefined,
          tituloProfesional: form.tituloProfesional,
          emailInstitucional: form.emailInstitucional,
          emailSecundario: form.emailSecundario || undefined,
          emailPersonal: form.emailPersonal || undefined,
          telefono: form.telefono,
          telefonoSecundario: form.telefonoSecundario || undefined,
          direccion: form.direccion,
          sede: form.sede,
          consultorioPredeterminado: form.consultorioPredeterminado || undefined,
          tienePasantes: form.tienePasantes,
          colorCalendario: form.colorCalendario || undefined,
          codigoAlfabetico: form.codigoAlfabetico || undefined,
        };
        await especialistasApi.update(editingId, payload);
        toast.success('Especialista actualizado');
      } else {
        const payload: any = {
          email: form.email,
          password: form.password,
          primerNombre: form.primerNombre,
          segundoNombre: form.segundoNombre || undefined,
          primerApellido: form.primerApellido,
          segundoApellido: form.segundoApellido || undefined,
          nombres: form.nombres,
          apellidos: form.apellidos,
          tipoIdentificacion: form.tipoIdentificacion,
          numeroIdentificacion: form.numeroIdentificacion,
          genero: form.genero,
          fechaNacimiento: form.fechaNacimiento || undefined,
          estadoCivil: form.estadoCivil,
          codigoMsp: form.codigoMsp,
          especialidad: form.especialidad,
          subEspecialidad: form.subEspecialidad || undefined,
          tituloProfesional: form.tituloProfesional,
          emailInstitucional: form.emailInstitucional,
          emailSecundario: form.emailSecundario || undefined,
          emailPersonal: form.emailPersonal || undefined,
          telefono: form.telefono,
          telefonoSecundario: form.telefonoSecundario || undefined,
          direccion: form.direccion,
          sede: form.sede,
          consultorioPredeterminado: form.consultorioPredeterminado || undefined,
          tienePasantes: form.tienePasantes,
          colorCalendario: form.colorCalendario || undefined,
          codigoAlfabetico: form.codigoAlfabetico || undefined,
        };
        await especialistasApi.create(payload);
        toast.success('Especialista creado');
      }
      setShowForm(false);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return {
    showForm,
    setShowForm,
    editingId,
    form,
    setForm,
    saving,
    touched,
    setTouched,
    fieldErrors,
    setFieldErrors,
    handleChange,
    handleBlur,
    validateField,
    openCreate,
    openEdit,
    handleSave,
    generatePassword: regeneratePassword,
    showPassword,
    toggleShowPassword,
  };
};
