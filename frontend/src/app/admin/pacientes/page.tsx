'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { pacientesApi, citasApi } from '@/lib/api-client';
import { getUser } from '@/lib/auth';
import { cn, getSeverityColor, formatDate, getEstadoCitaColor } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';
import { requirePermission } from '@/lib/use-permission';
import { usePacienteForm, TIPOS_IDENTIFICACION, GENEROS, ESTADOS_CIVIL, TIPOS_SEGURO, GRUPOS_SANGUINEOS } from './hooks/usePacienteForm';
import { ChipsInput } from './components/ChipsInput';
import {
  Plus, Pencil, Search, X, User, Phone, Stethoscope,
  AlertTriangle, Ban, CheckCircle, Eye, FileText, Calendar,
} from 'lucide-react';
import { PageSkeleton } from '@/components/ui/skeleton';
import { UbicacionSelector } from '@/components/shared/UbicacionSelector';

const CONVENIO_OPTS = ['PUBLICA', 'PRIVADA'];

function FieldErrorIcon() {
  return (
    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
      <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    </div>
  );
}

export default function PacientesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pacienteIdFromUrl = searchParams.get('pacienteId');
  const accionFromUrl = searchParams.get('accion');

  const [pacientes, setPacientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('TODOS');
  const [citaFilter, setCitaFilter] = useState('TODOS');
  const [proximasCitas, setProximasCitas] = useState<Record<string, { fecha: string; especialidad?: string } | null>>({});
  const [section, setSection] = useState(0);
  const [showDetail, setShowDetail] = useState<any>(null);
  const [historial, setHistorial] = useState<any[]>([]);
  const [showInasistencias, setShowInasistencias] = useState<any>(null);
  const [inasistenciasData, setInasistenciasData] = useState<any[]>([]);
  const [bloqueoTarget, setBloqueoTarget] = useState<any | null>(null);
  const [bloqueoMotivo, setBloqueoMotivo] = useState('');
  const [bloqueoEspecialidad, setBloqueoEspecialidad] = useState('');
  const [bloqueoSaving, setBloqueoSaving] = useState(false);
  const idCheckRef = useRef(0);
  const user = getUser();

  const {
    showForm, setShowForm, editingId, form, setForm,
    saving, touched, setTouched, fieldErrors,
    handleChange, handleBlur, validateField,
    openCreate: hookOpenCreate, openEdit: hookOpenEdit, handleSave,
    idChecking, setIdChecking, idError, setIdError,
    setAlergias, setEnfermedades,
    csvToArray, arrayToCsv,
  } = usePacienteForm();

  const formatLabel = (val?: string) => {
    if (!val) return '-';
    return val.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const checkIdentificacionExists = useCallback(async (numero: string) => {
    if (!numero || editingId) return;
    const seq = ++idCheckRef.current;
    setIdError('');
    setIdChecking(true);
    try {
      const result = await pacientesApi.findByIdentificacion(numero);
      if (seq !== idCheckRef.current) return;
      if (result) setIdError('Ya existe un paciente registrado con esta cédula');
    } catch {
      if (seq === idCheckRef.current) setIdError('');
    } finally {
      if (seq === idCheckRef.current) setIdChecking(false);
    }
  }, [editingId, setIdError, setIdChecking]);

  const calcEdad = (fechaNac?: string) => {
    if (!fechaNac) return '-';
    const nac = new Date(fechaNac);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
    return `${edad} años`;
  };

  const sections = [
    { label: 'Datos Personales', icon: User },
    { label: 'Contacto', icon: Phone },
    { label: 'Info Médica', icon: Stethoscope },
    { label: 'Emergencia', icon: AlertTriangle },
    { label: 'Laboral', icon: FileText },
  ];

  const loadList = useCallback(() => {
    Promise.all([
      pacientesApi.getAll(),
      citasApi.getAll({ estado: 'CONFIRMADA' }).catch(() => []),
    ])
      .then(([pacientes, citas]) => {
        setPacientes(pacientes);
        const now = new Date().toISOString();
        const map: Record<string, { fecha: string; especialidad?: string } | null> = {};
        for (const p of pacientes) {
          const pacienteCitas = citas
            .filter((c: any) => c.pacienteId === p.id && c.fecha >= now)
            .sort((a: any, b: any) => a.fecha.localeCompare(b.fecha));
          map[p.id] = pacienteCitas.length > 0 ? { fecha: pacienteCitas[0].fecha, especialidad: pacienteCitas[0].especialidad } : null;
        }
        setProximasCitas(map);
      })
      .catch((e) => toast.error(e.message));
  }, []);

  useEffect(() => {
    loadList();
    setLoading(false);
    if (pacienteIdFromUrl) {
      pacientesApi.getById(pacienteIdFromUrl)
        .then((p: any) => {
          if (accionFromUrl === 'editar') {
            hookOpenEdit(p);
          } else {
            setShowDetail(p);
            pacientesApi.getHistorial(p.id).then(setHistorial).catch(() => setHistorial([]));
          }
        })
        .catch(() => toast.error('Paciente no encontrado'));
    }
  }, []);

  const openCreate = () => {
    if (!requirePermission('crearPaciente')) return;
    setSection(0);
    hookOpenCreate();
  };

  const openEdit = (p: any) => {
    if (!requirePermission('editarPaciente')) return;
    setSection(0);
    hookOpenEdit(p);
  };

  const handleBloquear = (p: any) => {
    setBloqueoTarget(p);
    setBloqueoMotivo('');
    setBloqueoEspecialidad('');
  };

  async function submitBloqueo() {
    if (!bloqueoTarget || !bloqueoMotivo.trim()) return;
    setBloqueoSaving(true);
    try {
      await pacientesApi.bloquear(bloqueoTarget.id, bloqueoMotivo.trim(), bloqueoEspecialidad || undefined);
      toast.success('Paciente bloqueado');
      setBloqueoTarget(null);
      loadList();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBloqueoSaving(false);
    }
  }

  const handleDesbloquear = async (p: any) => {
    if (!window.confirm('¿Desbloquear este paciente?')) return;
    try {
      await pacientesApi.desbloquear(p.id);
      toast.success('Paciente desbloqueado');
      loadList();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const openDetalle = async (p: any) => {
    try {
      const full = await pacientesApi.getById(p.id);
      setShowDetail(full);
      const h = await pacientesApi.getHistorial(p.id);
      setHistorial(h);
    } catch {
      setShowDetail(p);
      setHistorial([]);
    }
  };

  const openInasistencias = async (p: any) => {
    setShowInasistencias(p);
    try {
      const data = await pacientesApi.getInasistencias(p.id);
      setInasistenciasData(data);
    } catch {
      setInasistenciasData([]);
    }
  };

  const onUbicacionChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) validateField(field, value);
  };

  const onUbicacionBlur = (field: string, value: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, value);
  };

  const onSave = () => handleSave(loadList);

  const filtered = pacientes
    .filter((p) => {
      const matchSearch = `${p.nombres} ${p.apellidos} ${p.numeroIdentificacion} ${p.telefono}`
        .toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      if (estadoFilter === 'ACTIVO' && p.bloqueado) return false;
      if (estadoFilter === 'BLOQUEADO' && !p.bloqueado) return false;
      if (citaFilter === 'CON_CITA' && !proximasCitas[p.id]) return false;
      if (citaFilter === 'SIN_CITA' && proximasCitas[p.id]) return false;
      return true;
    })
    .sort((a, b) => {
      const citaA = proximasCitas[a.id];
      const citaB = proximasCitas[b.id];
      if (!citaA && !citaB) return 0;
      if (!citaA) return 1;
      if (!citaB) return -1;
      return citaA.fecha.localeCompare(citaB.fecha);
    });

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Pacientes" description="Gestión de pacientes" actions={
        <Button onClick={openCreate} icon={<Plus size={18} />}>Nuevo Paciente</Button>
      } />

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-3 sm:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre, identificación, teléfono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
            />
          </div>
          <div>
            <select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm text-neutral-700"
            >
              <option value="TODOS">Todos los estados</option>
              <option value="ACTIVO">Activo</option>
              <option value="BLOQUEADO">Bloqueado</option>
            </select>
          </div>
          <div>
            <select
              value={citaFilter}
              onChange={(e) => setCitaFilter(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm text-neutral-700"
            >
              <option value="TODOS">Todas las citas</option>
              <option value="CON_CITA">Con próxima cita</option>
              <option value="SIN_CITA">Sin próxima cita</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-fixed min-w-[760px]">
            <colgroup>
              <col className="w-[30%]" />
              <col className="w-[18%]" />
              <col className="w-[16%]" />
              <col className="w-[16%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
            </colgroup>
            <thead>
              <tr className="text-left text-neutral-400 border-b bg-neutral-50/50">
                <th className="p-3.5 font-medium text-xs uppercase tracking-wider">Nombre</th>
                <th className="p-3.5 font-medium text-xs uppercase tracking-wider">Identificación</th>
                <th className="p-3.5 font-medium text-xs uppercase tracking-wider">Teléfono</th>
                <th className="p-3.5 font-medium text-xs uppercase tracking-wider">Próxima Cita</th>
                <th className="p-3.5 font-medium text-xs uppercase tracking-wider">Estado</th>
                <th className="p-3.5 font-medium text-xs uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-neutral-50/60 transition-colors">
                  <td className="p-3.5 font-medium text-neutral-900 truncate">
                    <button onClick={() => router.push(`/admin/pacientes/${p.id}`)} className="hover:underline text-left truncate block w-full" title={`${p.nombres} ${p.apellidos}`}>
                      {p.nombres} {p.apellidos}
                    </button>
                  </td>
                  <td className="p-3.5 text-neutral-600 font-mono text-xs truncate" title={p.numeroIdentificacion}>{p.numeroIdentificacion}</td>
                  <td className="p-3.5 text-neutral-600 truncate" title={p.telefono}>{p.telefono}</td>
                  <td className="p-3.5 whitespace-nowrap">
                    {proximasCitas[p.id] ? (
                      <span className="text-xs text-neutral-600">{formatDate(proximasCitas[p.id]!.fecha)}</span>
                    ) : (
                      <span className="text-xs text-neutral-400">-</span>
                    )}
                  </td>
                  <td className="p-3.5 whitespace-nowrap">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', p.bloqueado ? 'bg-danger-50 text-danger-700 border border-danger-200' : 'bg-success-50 text-success-700 border border-success-200')}>
                      {p.bloqueado ? 'Bloqueado' : 'Activo'}
                    </span>
                  </td>
                  <td className="p-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => router.push(`/admin/pacientes/${p.id}`)} className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg" title="Ver detalle"><Eye size={16} /></button>
                      <button onClick={() => openEdit(p)} className="p-1.5 text-neutral-500 hover:bg-neutral-100 rounded-lg" title="Editar"><Pencil size={16} /></button>
                      {p.bloqueado ? (
                        <button onClick={() => handleDesbloquear(p)} className="p-1.5 text-success-600 hover:bg-success-50 rounded-lg" title="Desbloquear"><CheckCircle size={16} /></button>
                      ) : (
                        <button onClick={() => handleBloquear(p)} className="p-1.5 text-danger-600 hover:bg-danger-50 rounded-lg" title="Bloquear"><Ban size={16} /></button>
                      )}
                      <button onClick={() => openInasistencias(p)} className="p-1.5 text-warning-600 hover:bg-warning-50 rounded-lg" title="Inasistencias"><AlertTriangle size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">No se encontraron pacientes</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">{editingId ? 'Editar Paciente' : 'Nuevo Paciente'}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
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

            <form noValidate className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {section === 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FieldInput
                    label="Primer nombre" required name="primerNombre" value={form.primerNombre}
                    onChange={handleChange} onBlur={() => handleBlur('primerNombre', form.primerNombre)}
                    error={fieldErrors.primerNombre} touched={touched.primerNombre}
                  />
                  <FieldInput
                    label="Segundo nombre" name="segundoNombre" value={form.segundoNombre}
                    onChange={handleChange}
                  />
                  <FieldInput
                    label="Primer apellido" required name="primerApellido" value={form.primerApellido}
                    onChange={handleChange} onBlur={() => handleBlur('primerApellido', form.primerApellido)}
                    error={fieldErrors.primerApellido} touched={touched.primerApellido}
                  />
                  <FieldInput
                    label="Segundo apellido" name="segundoApellido" value={form.segundoApellido}
                    onChange={handleChange}
                  />
                  <FieldSelect
                    label="Tipo ID" required name="tipoIdentificacion" value={form.tipoIdentificacion}
                    onChange={handleChange} options={TIPOS_IDENTIFICACION.map(o => ({ value: o, label: o }))}
                  />
                  <div>
                    <label className={cn('block text-sm font-medium text-gray-700 mb-1', (touched.numeroIdentificacion && fieldErrors.numeroIdentificacion) || idError ? 'text-red-700' : '')}>
                      Número ID <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        name="numeroIdentificacion"
                        value={form.numeroIdentificacion}
                        onChange={(e) => { handleChange(e); checkIdentificacionExists(e.target.value); }}
                        onBlur={() => { handleBlur('numeroIdentificacion', form.numeroIdentificacion); checkIdentificacionExists(form.numeroIdentificacion); }}
                        className={cn('w-full border rounded-lg px-3 py-2 pr-10', (touched.numeroIdentificacion && fieldErrors.numeroIdentificacion) || idError ? 'border-red-400 bg-red-50' : '')}
                      />
                      {(touched.numeroIdentificacion && fieldErrors.numeroIdentificacion) || idError
                        ? <FieldErrorIcon />
                        : idChecking
                          ? <div className="absolute inset-y-0 right-0 flex items-center pr-3"><svg className="animate-spin h-4 w-4 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>
                          : null}
                    </div>
                    {touched.numeroIdentificacion && fieldErrors.numeroIdentificacion && <p role="alert" className="text-xs text-red-500 mt-1">{fieldErrors.numeroIdentificacion}</p>}
                    {idError && <p role="alert" className="text-xs text-red-500 mt-1">{idError}</p>}
                    {idChecking && <p className="text-xs text-primary-500 mt-1">Verificando cédula...</p>}
                  </div>
                  <FieldSelect
                    label="Género" required name="genero" value={form.genero}
                    onChange={handleChange} options={GENEROS.map(o => ({ value: o, label: o }))}
                  />
                  <FieldInput
                    label="Fecha Nacimiento" required type="date" name="fechaNacimiento" value={form.fechaNacimiento}
                    onChange={handleChange} onBlur={() => handleBlur('fechaNacimiento', form.fechaNacimiento)}
                    error={fieldErrors.fechaNacimiento} touched={touched.fechaNacimiento}
                  />
                  <FieldSelect
                    label="Estado Civil" required name="estadoCivil" value={form.estadoCivil}
                    onChange={handleChange} options={ESTADOS_CIVIL.map(o => ({ value: o, label: o.replace(/_/g, ' ') }))}
                  />
                </div>
              )}

              {section === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FieldInput
                    label="Teléfono" required name="telefono" value={form.telefono}
                    onChange={handleChange} onBlur={() => handleBlur('telefono', form.telefono)}
                    error={fieldErrors.telefono} touched={touched.telefono}
                  />
                  <FieldInput
                    label="Teléfono Secundario" name="telefonoSecundario" value={form.telefonoSecundario}
                    onChange={handleChange} onBlur={() => handleBlur('telefonoSecundario', form.telefonoSecundario)}
                    error={fieldErrors.telefonoSecundario} touched={touched.telefonoSecundario}
                  />
                  <div className="md:col-span-2">
                    <FieldInput
                      label="Dirección" required name="direccion" value={form.direccion}
                      onChange={handleChange} onBlur={() => handleBlur('direccion', form.direccion)}
                      error={fieldErrors.direccion} touched={touched.direccion}
                    />
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
                  <FieldSelect
                    label="Grupo Sanguíneo" required name="grupoSanguineo" value={form.grupoSanguineo}
                    onChange={handleChange} options={GRUPOS_SANGUINEOS.map(o => ({ value: o, label: o.replace(/_/g, ' ') }))}
                  />
                  <FieldSelect
                    label="Tipo Seguro" required name="tipoSeguro" value={form.tipoSeguro}
                    onChange={handleChange} options={TIPOS_SEGURO.map(o => ({ value: o, label: o }))}
                  />
                  <FieldSelect
                    label="Convenio" name="nombreConvenio" value={form.nombreConvenio}
                    onChange={handleChange} options={CONVENIO_OPTS.map(o => ({ value: o, label: o.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) }))}
                  />
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
                  <FieldInput
                    label="Nombre Contacto" required name="emergenciaNombre" value={form.emergenciaNombre}
                    onChange={handleChange} onBlur={() => handleBlur('emergenciaNombre', form.emergenciaNombre)}
                    error={fieldErrors.emergenciaNombre} touched={touched.emergenciaNombre}
                  />
                  <FieldInput
                    label="Teléfono" required name="emergenciaTelefono" value={form.emergenciaTelefono}
                    onChange={handleChange} onBlur={() => handleBlur('emergenciaTelefono', form.emergenciaTelefono)}
                    error={fieldErrors.emergenciaTelefono} touched={touched.emergenciaTelefono}
                  />
                  <FieldInput
                    label="Parentesco" required name="emergenciaParentesco" value={form.emergenciaParentesco}
                    onChange={handleChange} onBlur={() => handleBlur('emergenciaParentesco', form.emergenciaParentesco)}
                    error={fieldErrors.emergenciaParentesco} touched={touched.emergenciaParentesco}
                  />
                </div>
              )}

              {section === 4 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FieldInput label="Empresa" name="laboralEmpresa" value={form.laboralEmpresa} onChange={handleChange} />
                  <FieldInput label="Cargo" name="laboralCargo" value={form.laboralCargo} onChange={handleChange} />
                  <FieldInput label="Dirección Trabajo" name="laboralDireccion" value={form.laboralDireccion} onChange={handleChange} />
                  <FieldInput
                    label="Teléfono Trabajo" name="laboralTelefono" value={form.laboralTelefono}
                    onChange={handleChange} onBlur={() => handleBlur('laboralTelefono', form.laboralTelefono)}
                    error={fieldErrors.laboralTelefono} touched={touched.laboralTelefono}
                  />
                </div>
              )}
            </form>

            <div className="flex items-center justify-between p-6 border-t">
              <div className="flex gap-2">
                {section > 0 && <button onClick={() => setSection(section - 1)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Anterior</button>}
                {section < sections.length - 1 && <button onClick={() => setSection(section + 1)} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">Siguiente</button>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button>
                <button onClick={onSave} disabled={saving} className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
                  {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detalle Modal */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold">{showDetail.nombres} {showDetail.apellidos}</h2>
              <button onClick={() => { setShowDetail(null); setHistorial([]); }} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><User size={16} className="text-primary-600" /> Datos Personales</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div><span className="text-gray-500 block">Tipo Identificación</span><span className="font-medium">{formatLabel(showDetail.tipoIdentificacion)}</span></div>
                  <div><span className="text-gray-500 block">Número Identificación</span><span className="font-medium">{showDetail.numeroIdentificacion}</span></div>
                  <div><span className="text-gray-500 block">Género</span><span className="font-medium">{formatLabel(showDetail.genero)}</span></div>
                  <div><span className="text-gray-500 block">Fecha de Nacimiento</span><span className="font-medium">{showDetail.fechaNacimiento ? formatDate(showDetail.fechaNacimiento) : '-'}</span></div>
                  <div><span className="text-gray-500 block">Edad</span><span className="font-medium">{calcEdad(showDetail.fechaNacimiento)}</span></div>
                  <div><span className="text-gray-500 block">Estado Civil</span><span className="font-medium">{formatLabel(showDetail.estadoCivil)}</span></div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Phone size={16} className="text-primary-600" /> Contacto y Dirección</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div><span className="text-gray-500 block">Teléfono</span><span className="font-medium">{showDetail.telefono || '-'}</span></div>
                  <div><span className="text-gray-500 block">Teléfono Secundario</span><span className="font-medium">{showDetail.telefonoSecundario || '-'}</span></div>
                  <div><span className="text-gray-500 block">Dirección</span><span className="font-medium">{showDetail.direccion || '-'}</span></div>
                  <div><span className="text-gray-500 block">Provincia</span><span className="font-medium">{showDetail.provincia || '-'}</span></div>
                  <div><span className="text-gray-500 block">Cantón</span><span className="font-medium">{showDetail.canton || '-'}</span></div>
                  <div><span className="text-gray-500 block">Parroquia</span><span className="font-medium">{showDetail.parroquia || '-'}</span></div>
                  <div><span className="text-gray-500 block">Zona</span><span className="font-medium">{showDetail.zona || '-'}</span></div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Stethoscope size={16} className="text-primary-600" /> Información Médica</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div><span className="text-gray-500 block">Grupo Sanguíneo</span><span className="font-medium">{formatLabel(showDetail.grupoSanguineo)}</span></div>
                  <div><span className="text-gray-500 block">Tipo Seguro</span><span className="font-medium">{showDetail.tipoSeguro || '-'}</span></div>
                  <div><span className="text-gray-500 block">Convenio</span><span className="font-medium">{showDetail.nombreConvenio || '-'}</span></div>
                  <div><span className="text-gray-500 block">Alergias</span><span className="font-medium">{showDetail.alergias || '-'}</span></div>
                  <div className="md:col-span-2"><span className="text-gray-500 block">Enfermedades Preexistentes</span><span className="font-medium">{showDetail.enfermedadesPreexistentes || '-'}</span></div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><AlertTriangle size={16} className="text-primary-600" /> Contacto de Emergencia</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div><span className="text-gray-500 block">Nombre</span><span className="font-medium">{showDetail.emergenciaNombre || '-'}</span></div>
                  <div><span className="text-gray-500 block">Teléfono</span><span className="font-medium">{showDetail.emergenciaTelefono || '-'}</span></div>
                  <div><span className="text-gray-500 block">Parentesco</span><span className="font-medium">{showDetail.emergenciaParentesco || '-'}</span></div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><FileText size={16} className="text-primary-600" /> Información Laboral</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div><span className="text-gray-500 block">Empresa</span><span className="font-medium">{showDetail.laboralEmpresa || '-'}</span></div>
                  <div><span className="text-gray-500 block">Cargo</span><span className="font-medium">{showDetail.laboralCargo || '-'}</span></div>
                  <div><span className="text-gray-500 block">Dirección</span><span className="font-medium">{showDetail.laboralDireccion || '-'}</span></div>
                  <div><span className="text-gray-500 block">Teléfono</span><span className="font-medium">{showDetail.laboralTelefono || '-'}</span></div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><CheckCircle size={16} className="text-primary-600" /> Estado de Cuenta</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 block">Estado</span>
                    <span className={cn('inline-block px-2 py-1 rounded-full text-xs font-medium', showDetail.bloqueado ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800')}>
                      {showDetail.bloqueado ? 'Bloqueado' : 'Activo'}
                    </span>
                  </div>
                  {showDetail.bloqueado && (
                    <>
                      <div><span className="text-gray-500 block">Motivo</span><span className="font-medium">{showDetail.motivoBloqueo || '-'}</span></div>
                      <div><span className="text-gray-500 block">Fecha Bloqueo</span><span className="font-medium">{showDetail.fechaBloqueo ? formatDate(showDetail.fechaBloqueo) : '-'}</span></div>
                      {showDetail.fechaDesbloqueo && <div><span className="text-gray-500 block">Fecha Desbloqueo</span><span className="font-medium">{formatDate(showDetail.fechaDesbloqueo)}</span></div>}
                    </>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><FileText size={16} className="text-primary-600" /> Historial Clínico por Especialidad</h3>
                {historial.length === 0 ? (
                  <p className="text-sm text-gray-500">Sin historial registrado</p>
                ) : (
                  <div className="space-y-3">
                    {historial.map((h: any, i: number) => (
                      <div key={i} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                        <p className="font-medium text-sm">{h.especialidad}</p>
                        <span className="text-xs text-gray-500">{h.citas.length} {h.citas.length === 1 ? 'cita' : 'citas'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {showDetail.citas && showDetail.citas.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Calendar size={16} className="text-primary-600" /> Últimas Citas</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500 border-b">
                          <th className="pb-2 pr-4 font-medium">Fecha</th>
                          <th className="pb-2 pr-4 font-medium">Hora</th>
                          <th className="pb-2 pr-4 font-medium">Especialidad</th>
                          <th className="pb-2 pr-4 font-medium">Estado</th>
                          <th className="pb-2 font-medium">Especialista</th>
                        </tr>
                      </thead>
                      <tbody>
                        {showDetail.citas.slice(0, 10).map((c: any) => (
                          <tr key={c.id} className="border-b last:border-0">
                            <td className="py-2 pr-4">{c.fecha ? formatDate(c.fecha) : '-'}</td>
                            <td className="py-2 pr-4 text-nowrap">{c.horaInicio ? `${c.horaInicio.slice(0, 5)} - ${c.horaFin ? c.horaFin.slice(0, 5) : ''}` : '-'}</td>
                            <td className="py-2 pr-4">{c.especialidad || '-'}</td>
                            <td className="py-2 pr-4">
                              <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', getEstadoCitaColor(c.estado))}>
                                {formatLabel(c.estado)}
                              </span>
                            </td>
                            <td className="py-2">{c.especialista ? `${c.especialista.nombres} ${c.especialista.apellidos}` : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t flex justify-end">
              <button onClick={() => { setShowDetail(null); setHistorial([]); }} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Bloqueo Modal */}
      {bloqueoTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setBloqueoTarget(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold">Bloquear Paciente</h2>
            <p className="text-sm text-neutral-500">{bloqueoTarget.nombres} {bloqueoTarget.apellidos} · {bloqueoTarget.numeroIdentificacion}</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Motivo <span className="text-red-500">*</span></label>
                <textarea value={bloqueoMotivo} onChange={(e) => setBloqueoMotivo(e.target.value)}
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500 min-h-[80px]"
                  placeholder="Motivo del bloqueo..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Especialidad (opcional)</label>
                <input type="text" value={bloqueoEspecialidad} onChange={(e) => setBloqueoEspecialidad(e.target.value)}
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Ej: NEUROLOGIA" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setBloqueoTarget(null)}>Cancelar</Button>
              <Button onClick={submitBloqueo} disabled={bloqueoSaving || !bloqueoMotivo.trim()}>
                {bloqueoSaving ? 'Bloqueando...' : 'Bloquear'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Inasistencias Modal */}
      {showInasistencias && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">Inasistencias - {showInasistencias.nombres} {showInasistencias.apellidos}</h2>
              <button onClick={() => { setShowInasistencias(null); setInasistenciasData([]); }} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-6">
              {inasistenciasData.length === 0 ? (
                <p className="text-sm text-gray-500">Sin inasistencias registradas</p>
              ) : (
                <div className="space-y-3">
                  {inasistenciasData.map((i: any) => (
                    <div key={i.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                      <div>
                        <p className="font-medium text-sm">{i.especialidad}</p>
                        <p className="text-xs text-gray-500">Última: {i.ultimaInasistencia ? formatDate(i.ultimaInasistencia) : 'N/A'}</p>
                      </div>
                      <span className={cn('px-3 py-1 rounded-full text-xs font-medium', getSeverityColor(i.contador))}>
                        {i.contador} {i.contador === 1 ? 'vez' : 'veces'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-6 border-t flex justify-end">
              <button onClick={() => { setShowInasistencias(null); setInasistenciasData([]); }} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FieldInput({ type = 'text', label, required, name, value, onChange, onBlur, error, touched }: {
  type?: string; label: string; required?: boolean; name: string; value: any;
  onChange: (e: any) => void; onBlur?: () => void; error?: string; touched?: boolean;
}) {
  return (
    <div>
      <label className={cn('block text-sm font-medium text-gray-700 mb-1', touched && error ? 'text-red-700' : '')}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          type={type} name={name} value={value ?? ''} onChange={onChange} onBlur={onBlur}
          className={cn('w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500', touched && error ? 'border-red-400 bg-red-50 pr-10' : '')}
        />
        {touched && error && <FieldErrorIcon />}
      </div>
      {touched && error && <p role="alert" className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function FieldSelect({ label, required, name, value, onChange, options }: {
  label: string; required?: boolean; name: string; value: any; onChange: (e: any) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        name={name} value={value} onChange={onChange}
        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
