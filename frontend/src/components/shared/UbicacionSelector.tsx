'use client';

import { cn } from '@/lib/utils';
import { getProvincias, getCantones, getParroquias, getProvinciaByNombre } from '@/lib/ubicaciones';

interface UbicacionSelectorProps {
  provincia: string;
  canton: string;
  parroquia: string;
  zona: string;
  onChange: (field: string, value: string) => void;
  onBlur?: (field: string, value: string) => void;
  errors?: Record<string, string>;
  touched?: Record<string, boolean>;
}

export function UbicacionSelector({
  provincia,
  canton,
  parroquia,
  zona,
  onChange,
  onBlur,
  errors,
  touched,
}: UbicacionSelectorProps) {
  const provinciasList = getProvincias();
  const cantonesList = provincia ? getCantones(provincia) : [];
  const parroquiasList = provincia && canton ? getParroquias(provincia, canton) : [];

  const currentProvincia = provinciasList.find((p) => p.nombre === provincia);
  const currentProvinciaCodigo = currentProvincia?.codigo || '';
  const filteredCantones = currentProvinciaCodigo ? getCantones(currentProvinciaCodigo) : [];
  const currentCanton = filteredCantones.find((c) => c.nombre === canton);
  const filteredParroquias = currentProvinciaCodigo && currentCanton?.codigo
    ? getParroquias(currentProvinciaCodigo, currentCanton.codigo) : [];

  const getProvinciaNameFromCode = (code: string) => provinciasList.find((p) => p.codigo === code)?.nombre || '';

  const handleProvinciaChange = (code: string) => {
    onChange('provincia', getProvinciaNameFromCode(code));
    onChange('canton', '');
    onChange('parroquia', '');
  };

  const getCantonNameFromCode = (provCode: string, code: string) =>
    getCantones(provCode).find((c) => c.codigo === code)?.nombre || '';

  const handleCantonChange = (provCode: string, code: string) => {
    onChange('canton', getCantonNameFromCode(provCode, code));
    onChange('parroquia', '');
  };

  const getParroquiaNameFromCode = (provCode: string, cantCode: string, code: string) =>
    getParroquias(provCode, cantCode).find((p) => p.codigo === code)?.nombre || '';

  const provinciaError = touched?.provincia && errors?.provincia;
  const cantonError = touched?.canton && errors?.canton;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className={cn('block text-sm font-medium mb-1', provinciaError ? 'text-red-700' : 'text-gray-700')}>
          Provincia <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <select
            value={currentProvinciaCodigo}
            onChange={(e) => handleProvinciaChange(e.target.value)}
            onBlur={() => onBlur?.('provincia', provincia)}
            className={cn(
              'w-full border rounded-lg px-3 py-2 outline-none transition-all duration-200 text-sm appearance-none bg-white',
              'focus:ring-2 focus:border-transparent',
              provinciaError ? 'border-red-400 bg-red-50 focus:ring-red-400' : 'border-gray-300 focus:ring-primary-500',
            )}
          >
            <option value="">Seleccione provincia...</option>
            {provinciasList.map((p) => (
              <option key={p.codigo} value={p.codigo}>
                {p.nombre}
              </option>
            ))}
          </select>
          {provinciaError && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
        {provinciaError && <p role="alert" className="text-xs text-red-500 mt-1">{errors.provincia}</p>}
      </div>

      <div>
        <label className={cn('block text-sm font-medium mb-1', cantonError ? 'text-red-700' : 'text-gray-700')}>
          Cantón <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <select
            value={currentCanton?.codigo || ''}
            onChange={(e) => handleCantonChange(currentProvinciaCodigo, e.target.value)}
            onBlur={() => onBlur?.('canton', canton)}
            disabled={!currentProvinciaCodigo}
            className={cn(
              'w-full border rounded-lg px-3 py-2 outline-none transition-all duration-200 text-sm appearance-none bg-white',
              'focus:ring-2 focus:border-transparent',
              cantonError ? 'border-red-400 bg-red-50 focus:ring-red-400' : 'border-gray-300 focus:ring-primary-500',
              !currentProvinciaCodigo && 'bg-gray-100 cursor-not-allowed',
            )}
          >
            <option value="">Seleccione cantón...</option>
            {filteredCantones.map((c) => (
              <option key={c.codigo} value={c.codigo}>
                {c.nombre}
              </option>
            ))}
          </select>
          {cantonError && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
        {cantonError && <p role="alert" className="text-xs text-red-500 mt-1">{errors.canton}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Parroquia
        </label>
        <select
          value={filteredParroquias.find((p) => p.nombre === parroquia)?.codigo || ''}
          onChange={(e) => {
            const name = getParroquiaNameFromCode(currentProvinciaCodigo, currentCanton?.codigo || '', e.target.value);
            onChange('parroquia', name);
          }}
          onBlur={() => onBlur?.('parroquia', parroquia)}
          disabled={!currentCanton?.codigo}
          className={cn(
            'w-full border rounded-lg px-3 py-2 outline-none transition-all duration-200 text-sm appearance-none bg-white',
            'focus:ring-2 focus:border-transparent border-gray-300 focus:ring-primary-500',
            !currentCanton?.codigo && 'bg-gray-100 cursor-not-allowed',
          )}
        >
          <option value="">Seleccione parroquia...</option>
          {filteredParroquias.map((p) => (
            <option key={p.codigo} value={p.codigo}>
              {p.nombre}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Zona</label>
        <select
          value={zona}
          onChange={(e) => onChange('zona', e.target.value)}
          onBlur={() => onBlur?.('zona', zona)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none text-sm appearance-none bg-white"
        >
          <option value="">Seleccione zona...</option>
          <option value="URBANA">Urbana</option>
          <option value="RURAL">Rural</option>
        </select>
      </div>
    </div>
  );
}
