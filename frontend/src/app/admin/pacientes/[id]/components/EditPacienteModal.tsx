'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { usePacienteForm, TIPOS_IDENTIFICACION, GENEROS, ESTADOS_CIVIL, TIPOS_SEGURO, GRUPOS_SANGUINEOS, FIELD_SECTION } from '../../hooks/usePacienteForm';
import { ChipsInput } from '../../components/ChipsInput';
import { UbicacionSelector } from '@/components/shared/UbicacionSelector';
import { X, User, Phone, Stethoscope, AlertTriangle, FileText, AlertCircle } from 'lucide-react';
import { usePermisos } from '@/lib/use-permisos';

interface EditPacienteModalProps {
  paciente: any;
  onClose: () => void;
  onSaved: () => void;
}

const CONVENIO_OPTS = ['PUBLICA', 'PRIVADA'];

const sections = [
  { label: 'Datos Personales', icon: User },
  { label: 'Contacto', icon: Phone },
  { label: 'Info Médica', icon: Stethoscope },
  { label: 'Emergencia', icon: AlertTriangle },
  { label: 'Laboral', icon: FileText },
];

export function EditPacienteModal({ paciente, onClose, onSaved }: EditPacienteModalProps) {
  const [section, setSection] = useState(0);
  const { can } = usePermisos();

  const {
    editingId, form, setForm, saving, touched, setTouched, fieldErrors,
    handleChange, handleBlur, validateField,
    openEdit, handleSave,
    idChecking, idError,
    saveError, setSaveError,
    setAlergias, setEnfermedades,
    csvToArray,
  } = usePacienteForm();

  const [initialized, setInitialized] = useState(false);
  if (!initialized) {
    openEdit(paciente);
    setInitialized(true);
  }

  const onUbicacionChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaveError(null);
    if (touched[field]) validateField(field, value);
  };

  const onUbicacionBlur = (field: string, value: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, value);
  };

  const onSave = async () => {
    const ok = await handleSave(onSaved, (field) => setSection(FIELD_SECTION[field] ?? 0));
    if (ok) onClose();
  };

  if (!can('editarPaciente')) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6 text-center">
          <p className="text-neutral-700 mb-4">No tienes permiso para editar pacientes.</p>
          <Button onClick={onClose}>Cerrar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-bold">Editar Paciente</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
        </div>

        <div className="flex border-b overflow-x-auto">
          {sections.map((s, i) => (
            <button
              key={s.label}
              onClick={() => setSection(i)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap',
                section === i ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              <s.icon size={16} /> {s.label}
            </button>
          ))}
        </div>

        {saveError && (
          <div
            role="alert"
            className="mx-6 mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        <form noValidate className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {section === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EditField label="Primer nombre" required name="primerNombre" value={form.primerNombre}
                onChange={handleChange} onBlur={() => handleBlur('primerNombre', form.primerNombre)}
                error={fieldErrors.primerNombre} touched={touched.primerNombre} />
              <EditField label="Segundo nombre" name="segundoNombre" value={form.segundoNombre} onChange={handleChange} />
              <EditField label="Primer apellido" required name="primerApellido" value={form.primerApellido}
                onChange={handleChange} onBlur={() => handleBlur('primerApellido', form.primerApellido)}
                error={fieldErrors.primerApellido} touched={touched.primerApellido} />
              <EditField label="Segundo apellido" name="segundoApellido" value={form.segundoApellido} onChange={handleChange} />
              <EditSelect label="Tipo ID" name="tipoIdentificacion" value={form.tipoIdentificacion}
                onChange={handleChange} options={TIPOS_IDENTIFICACION.map(o => ({ value: o, label: o }))} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número ID <span className="text-red-500">*</span>
                </label>
                <input name="numeroIdentificacion" value={form.numeroIdentificacion} onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 bg-gray-100" disabled />
                {idError && <p className="text-xs text-red-500 mt-1">{idError}</p>}
              </div>
              <EditSelect label="Género" name="genero" value={form.genero}
                onChange={handleChange} options={GENEROS.map(o => ({ value: o, label: o }))} />
              <EditField label="Fecha Nacimiento" required type="date" name="fechaNacimiento" value={form.fechaNacimiento}
                onChange={handleChange} onBlur={() => handleBlur('fechaNacimiento', form.fechaNacimiento)}
                error={fieldErrors.fechaNacimiento} touched={touched.fechaNacimiento} />
              <EditSelect label="Estado Civil" name="estadoCivil" value={form.estadoCivil}
                onChange={handleChange} options={ESTADOS_CIVIL.map(o => ({ value: o, label: o.replace(/_/g, ' ') }))} />
            </div>
          )}

          {section === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EditField label="Teléfono" required name="telefono" value={form.telefono}
                onChange={handleChange} onBlur={() => handleBlur('telefono', form.telefono)}
                error={fieldErrors.telefono} touched={touched.telefono} />
              <EditField label="Teléfono Secundario" name="telefonoSecundario" value={form.telefonoSecundario}
                onChange={handleChange} onBlur={() => handleBlur('telefonoSecundario', form.telefonoSecundario)}
                error={fieldErrors.telefonoSecundario} touched={touched.telefonoSecundario} />
              <div className="md:col-span-2">
                <EditField label="Dirección" required name="direccion" value={form.direccion}
                  onChange={handleChange} onBlur={() => handleBlur('direccion', form.direccion)}
                  error={fieldErrors.direccion} touched={touched.direccion} />
              </div>
              <UbicacionSelector
                provincia={form.provincia}
                canton={form.canton}
                parroquia={form.parroquia}
                zona={form.zona}
                onChange={onUbicacionChange}
                onBlur={onUbicacionBlur}
                errors={fieldErrors}
                touched={touched}
              />
            </div>
          )}

          {section === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EditSelect label="Grupo Sanguíneo" name="grupoSanguineo" value={form.grupoSanguineo}
                onChange={handleChange} options={GRUPOS_SANGUINEOS.map(o => ({ value: o, label: o.replace(/_/g, ' ') }))} />
              <EditSelect label="Tipo Seguro" name="tipoSeguro" value={form.tipoSeguro}
                onChange={handleChange} options={TIPOS_SEGURO.map(o => ({ value: o, label: o }))} />
              <EditSelect label="Convenio" name="nombreConvenio" value={form.nombreConvenio}
                onChange={handleChange} options={CONVENIO_OPTS.map(o => ({ value: o, label: o.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) }))} />
              <ChipsInput
                label="Alergias"
                placeholder="Escribe una alergia y presiona Enter"
                values={form.alergias ? csvToArray(form.alergias) : []}
                onChange={(arr) => setAlergias(arr)}
                helpText="Usa Enter o coma para separar"
              />
              <div className="md:col-span-2">
                <ChipsInput
                  label="Enfermedades Preexistentes"
                  placeholder="Escribe una enfermedad y presiona Enter"
                  values={form.enfermedadesPreexistentes ? csvToArray(form.enfermedadesPreexistentes) : []}
                  onChange={(arr) => setEnfermedades(arr)}
                  helpText="Usa Enter o coma para separar"
                />
              </div>
            </div>
          )}

          {section === 3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EditField label="Nombre Contacto" required name="emergenciaNombre" value={form.emergenciaNombre}
                onChange={handleChange} onBlur={() => handleBlur('emergenciaNombre', form.emergenciaNombre)}
                error={fieldErrors.emergenciaNombre} touched={touched.emergenciaNombre} />
              <EditField label="Teléfono" required name="emergenciaTelefono" value={form.emergenciaTelefono}
                onChange={handleChange} onBlur={() => handleBlur('emergenciaTelefono', form.emergenciaTelefono)}
                error={fieldErrors.emergenciaTelefono} touched={touched.emergenciaTelefono} />
              <EditField label="Parentesco" required name="emergenciaParentesco" value={form.emergenciaParentesco}
                onChange={handleChange} onBlur={() => handleBlur('emergenciaParentesco', form.emergenciaParentesco)}
                error={fieldErrors.emergenciaParentesco} touched={touched.emergenciaParentesco} />
            </div>
          )}

          {section === 4 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EditField label="Empresa" name="laboralEmpresa" value={form.laboralEmpresa} onChange={handleChange} />
              <EditField label="Cargo" name="laboralCargo" value={form.laboralCargo} onChange={handleChange} />
              <EditField label="Dirección Trabajo" name="laboralDireccion" value={form.laboralDireccion} onChange={handleChange} />
              <EditField label="Teléfono Trabajo" name="laboralTelefono" value={form.laboralTelefono}
                onChange={handleChange} onBlur={() => handleBlur('laboralTelefono', form.laboralTelefono)}
                error={fieldErrors.laboralTelefono} touched={touched.laboralTelefono} />
            </div>
          )}
        </form>

        <div className="flex items-center justify-between p-6 border-t">
          <div className="flex gap-2">
            {section > 0 && <button onClick={() => setSection(section - 1)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Anterior</button>}
            {section < sections.length - 1 && <button onClick={() => setSection(section + 1)} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">Siguiente</button>}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button>
            <Button onClick={onSave} disabled={saving}>{saving ? 'Guardando...' : 'Actualizar'}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditField({ type = 'text', label, required, name, value, onChange, onBlur, error, touched }: {
  type?: string; label: string; required?: boolean; name: string; value: any;
  onChange: (e: any) => void; onBlur?: () => void; error?: string; touched?: boolean;
}) {
  return (
    <div>
      <label className={cn('block text-sm font-medium text-gray-700 mb-1', touched && error ? 'text-red-700' : '')}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input type={type} name={name} value={value ?? ''} onChange={onChange} onBlur={onBlur}
          className={cn('w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500', touched && error ? 'border-red-400 bg-red-50 pr-10' : '')} />
        {touched && error && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
      {touched && error && <p role="alert" className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function EditSelect({ label, name, value, onChange, options }: {
  label: string; name: string; value: any; onChange: (e: any) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select name={name} value={value} onChange={onChange} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
