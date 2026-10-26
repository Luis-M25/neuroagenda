'use client';

import { useMemo } from 'react';
import { User, Briefcase, Phone, Lock, MapPin } from 'lucide-react';
import { cn, getEstadoEspecialistaColor, formatDate } from '@/lib/utils';

const TIPO_ID_OPTS = ['CEDULA', 'PASAPORTE'];
const GENERO_OPTS = ['MASCULINO', 'FEMENINO', 'OTRO'];
const ESTADO_OPTS = ['HABILITADO', 'DESHABILITADO', 'SUSPENDIDO_TEMPORAL'];
import { validateNombres, validateIdentificacion, validateEmail, validatePhoneEcuador, validatePastDate, validatePasswordStrength, validateUrl, validateRequired } from '@/lib/validators';

export const useEspecialistaUI = () => {
  const sections = useMemo(() => [
    { key: 'datos', label: 'Datos Personales', icon: User },
    { key: 'prof', label: 'Datos Profesionales', icon: Briefcase },
    { key: 'contacto', label: 'Contacto', icon: Phone },
    { key: 'creds', label: 'Credenciales', icon: Lock },
    { key: 'ubicacion', label: 'Ubicación', icon: MapPin },
  ], []);

  const getEstadoOptions = useMemo(() => ESTADO_OPTS.map((o) => 
    o === 'SUSPENDIDO_TEMPORAL' ? 'Suspendido Temporal' : 
    o === 'DESHABILITADO' ? 'Deshabilitado' : 'Habilitado'
  ), []);

  const fieldCn = (name: string, hasError?: boolean, touched?: Record<string, boolean>, fieldErrors?: Record<string, string>) => cn(
    'w-full border rounded-lg px-3 py-2 outline-none transition-all duration-200 text-sm',
    'focus:ring-2 focus:border-transparent',
    (touched && touched[name] && fieldErrors && fieldErrors[name]) || hasError
      ? 'border-red-400 bg-red-50 focus:ring-red-400 pr-10'
      : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
  );

  const labelCn = (name: string, touched?: Record<string, boolean>, fieldErrors?: Record<string, string>) => cn(
    'block text-sm font-medium mb-1 transition-colors duration-200',
    touched && touched[name] && fieldErrors && fieldErrors[name] ? 'text-red-700' : 'text-gray-700'
  );

  const errorIcon = (name: string, touched?: Record<string, boolean>, fieldErrors?: Record<string, string>) => 
    touched && touched[name] && fieldErrors && fieldErrors[name] ? (
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      </div>
    ) : null;

  const errorMsg = (name: string, touched?: Record<string, boolean>, fieldErrors?: Record<string, string>) => 
    touched && touched[name] && fieldErrors && fieldErrors[name] ? (
      <p role="alert" className="mt-1 text-xs text-red-600 flex items-center gap-1 animate-fadeIn">{fieldErrors[name]}</p>
    ) : null;

  const renderField = (
    name: string, 
    label: string, 
    required: boolean, 
    children: React.ReactNode,
    touched?: Record<string, boolean>, 
    fieldErrors?: Record<string, string>
  ) => (
    <div>
      <label className={labelCn(name, touched, fieldErrors)}>
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        {children}
        {errorIcon(name, touched, fieldErrors)}
      </div>
      {errorMsg(name, touched, fieldErrors)}
    </div>
  );

  const getEstadoSelectOption = (estado: string) => {
    return estado === 'SUSPENDIDO_TEMPORAL' ? 'Suspendido Temporal' : 
           estado === 'DESHABILITADO' ? 'Deshabilitado' : 'Habilitado';
  };

  const getEstadoColor = (estado: string) => getEstadoEspecialistaColor(estado);

  const getSectionIcon = (icon: React.ComponentType<{size?: number, className?: string}>) => icon;

  const getFormattedDate = (dateStr: string) => dateStr ? formatDate(dateStr) : null;

  return {
    sections,
    getEstadoOptions,
    fieldCn,
    labelCn,
    errorIcon,
    errorMsg,
    renderField,
    getEstadoSelectOption,
    getEstadoColor,
    getSectionIcon,
    getFormattedDate,
  };
};