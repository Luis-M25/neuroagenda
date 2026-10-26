'use client';

import { useState, useEffect, useRef } from 'react';
import { especialistasApi, especialidadesApi, consultoriosApi, sedesApi } from '@/lib/api-client';
import { cn, generatePassword } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { requirePermission } from '@/lib/use-permission';
import { toast } from 'sonner';
import {
  Plus, Search, Pencil, ToggleLeft, User, X,
  ChevronLeft, ChevronRight, Eye, EyeOff, RotateCw,
} from 'lucide-react';
import { PageSkeleton } from '@/components/ui/skeleton';
import { useEspecialistaForm, ESTADO_CIVIL_OPTS } from '../hooks/useEspecialistaForm';
import { useEspecialistaEstado } from '../hooks/useEspecialistaEstado';
import { PasswordStrengthBar } from '@/components/shared/FormField';
import { usePermisos } from '@/lib/use-permisos';
import Link from 'next/link';

const ESTADO_COLOR: Record<string, string> = {
  HABILITADO: 'bg-green-100 text-green-700 ring-green-200',
  DESHABILITADO: 'bg-red-100 text-red-700 ring-red-200',
  SUSPENDIDO_TEMPORAL: 'bg-amber-100 text-amber-700 ring-amber-200',
};

export default function EspecialistasPage() {
  const [items, setItems] = useState<any[]>([]);
  const [especialidades, setEspecialidades] = useState<any[]>([]);
  const [consultorios, setConsultorios] = useState<any[]>([]);
  const [sedes, setSedes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [filterEspecialidad, setFilterEspecialidad] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterSede, setFilterSede] = useState('');
  const [emailSource, setEmailSource] = useState<'institucional' | 'secundario' | 'personal'>('institucional');

  const [wizardStep, setWizardStep] = useState(1);
  const [idChecking, setIdChecking] = useState(false);
  const [idError, setIdError] = useState('');
  const idCheckRef = useRef(0);
  const idCheckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { can } = usePermisos();

  const {
    showForm, setShowForm, editingId, form, setForm, saving,
    touched, setTouched, fieldErrors, handleChange, openCreate, openEdit, handleSave,
    generatePassword: regeneratePassword, showPassword, toggleShowPassword,
  } = useEspecialistaForm();

  const {
    showEstadoModal, setShowEstadoModal, estadoTarget, estadoData, setEstadoData,
    estadoTouched, setEstadoTouched, estadoFieldErrors, setEstadoFieldErrors,
    openEstado, handleEstadoChange, handleEstadoBlur, handleEstadoSave, validateEstadoField,
  } = useEspecialistaEstado();

  const loadList = () => {
    especialistasApi.getAll()
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((e) => toast.error(e.message));
  };

  useEffect(() => {
    Promise.all([
      especialistasApi.getAll(),
      especialidadesApi.getAll(true),
      consultoriosApi.getAll(),
      sedesApi.getAll(true),
    ]).then(([esp, espcs, cons, sds]) => {
      setItems(Array.isArray(esp) ? esp : []);
      setEspecialidades(Array.isArray(espcs) ? espcs : []);
      setConsultorios(Array.isArray(cons) ? cons : []);
      setSedes(Array.isArray(sds) ? sds : []);
    }).catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setForm((prev) => {
      const src = emailSource === 'institucional'
        ? prev.emailInstitucional
        : emailSource === 'secundario'
        ? prev.emailSecundario
        : prev.emailPersonal;
      if (src && prev.email !== src) return { ...prev, email: src };
      return prev;
    });
  }, [emailSource, form.emailInstitucional, form.emailSecundario, form.emailPersonal, setForm]);

  const checkIdentificacionExists = async (numero: string) => {
    if (!numero || editingId) return;
    const seq = ++idCheckRef.current;
    setIdError('');
    setIdChecking(true);
    try {
      const result: any = await especialistasApi.findByIdentificacion(numero);
      if (seq !== idCheckRef.current) return;
      if (result?.exists || result?.especialista) {
        setIdError('Ya existe un especialista registrado con esta identificación');
      }
    } catch (e: any) {
      if (seq === idCheckRef.current) {
        setIdError(e?.data?.message || e?.message || 'Error al verificar identificación');
      }
    } finally {
      if (seq === idCheckRef.current) setIdChecking(false);
    }
  };

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange(e);
    if (idCheckTimerRef.current) clearTimeout(idCheckTimerRef.current);
    const v = e.target.value;
    if (v.length < 8) { setIdError(''); setIdChecking(false); return; }
    idCheckTimerRef.current = setTimeout(() => checkIdentificacionExists(v), 400);
  };

  const handleOpenCreate = () => {
    if (!can('crear_especialista')) {
      toast.error('No tienes permiso para crear especialistas');
      return;
    }
    setWizardStep(1);
    setIdError('');
    setIdChecking(false);
    openCreate();
  };

  const handleBlurId = (name: string, value: string) => {
    if (name === 'numeroIdentificacion') {
      if (idCheckTimerRef.current) clearTimeout(idCheckTimerRef.current);
      checkIdentificacionExists(value);
    }
  };

  const validateStep = (step: number): boolean => {
    const required: Record<number, string[]> = {
      1: ['primerNombre', 'primerApellido', 'numeroIdentificacion', 'tipoIdentificacion'],
      2: ['emailInstitucional', 'telefono'],
      3: ['email', 'password'],
      4: ['codigoMsp', 'especialidad', 'tituloProfesional', 'sede'],
    };

    const fields = required[step] || [];
    const newTouched = { ...touched };
    const missing: string[] = [];

    fields.forEach((f) => {
      newTouched[f] = true;
      const v = (form as any)[f];
      if (v === undefined || v === null || v === '') missing.push(f);
    });

    setTouched(newTouched);

    if (step === 1 && idError) {
      toast.error('Corrija la identificación antes de continuar');
      return false;
    }
    if (missing.length > 0) {
      const labels: Record<string, string> = {
        primerNombre: 'Primer nombre',
        primerApellido: 'Primer apellido',
        numeroIdentificacion: 'Número ID',
        tipoIdentificacion: 'Tipo ID',
        emailInstitucional: 'Email institucional',
        telefono: 'Teléfono',
        email: 'Email login',
        password: 'Contraseña',
        codigoMsp: 'Código MSP',
        especialidad: 'Especialidad',
        tituloProfesional: 'Título profesional',
        sede: 'Sede',
      };
      toast.error(`Campos obligatorios: ${missing.map((f) => labels[f] || f).join(', ')}`);
      return false;
    }
    return true;
  };

  const goToStep = (step: number) => {
    if (step <= wizardStep) {
      setWizardStep(step);
      return;
    }
    if (!validateStep(wizardStep)) return;
    setWizardStep(step);
  };

  const consultoriosFiltrados = consultorios.filter((c) => c.sede === form.sede);

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Especialistas"
        description="Gestión de especialistas con credenciales y permisos"
        actions={
          <Button onClick={handleOpenCreate} icon={<Plus size={18} />}>
            Nuevo Especialista
          </Button>
        }
      />

      {/* Filtros */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
            <input
              type="text"
              placeholder="Buscar (nombre, identificación, correo)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterEspecialidad}
            onChange={(e) => setFilterEspecialidad(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
          >
            <option value="">Todas las especialidades</option>
            {especialidades.map((e) => (
              <option key={e.id} value={e.nombre}>{e.nombre}</option>
            ))}
          </select>
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
          >
            <option value="">Todos los estados</option>
            <option value="HABILITADO">Habilitado</option>
            <option value="DESHABILITADO">Deshabilitado</option>
            <option value="SUSPENDIDO_TEMPORAL">Suspendido</option>
          </select>
          <select
            value={filterSede}
            onChange={(e) => setFilterSede(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
          >
            <option value="">Todas las sedes</option>
            {sedes.map((s) => (
              <option key={s.id} value={s.nombre}>{s.nombre}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Vista de Especialistas Adaptativa (Cards en móvil, Tabla fija en escritorio) */}
      <div className="space-y-3">
        {/* Filtro de resultados activos */}
        {(() => {
          const filteredItems = items.filter((e) => {
            const esp = e.especialista || {};
            const s = search.toLowerCase();
            const matchSearch = !s
              || `${esp.nombres || ''} ${esp.apellidos || ''}`.toLowerCase().includes(s)
              || (esp.numeroIdentificacion || '').toLowerCase().includes(s)
              || (e.email || '').toLowerCase().includes(s)
              || (esp.emailInstitucional || '').toLowerCase().includes(s);
            const matchEsp = !filterEspecialidad || esp.especialidad === filterEspecialidad;
            const matchEst = !filterEstado || esp.estado === filterEstado;
            const matchSede = !filterSede || esp.sede === filterSede;
            return matchSearch && matchEsp && matchEst && matchSede;
          });

          if (filteredItems.length === 0) {
            return (
              <Card className="p-8 text-center text-neutral-500">
                No se encontraron especialistas con los criterios seleccionados
              </Card>
            );
          }

          return (
            <>
              {/* Tarjetas Móviles (visible solo en pantallas pequeñas) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
                {filteredItems.map((e) => {
                  const esp = e.especialista || {};
                  const estado = esp.estado || 'HABILITADO';
                  const labelEstado = estado === 'SUSPENDIDO_TEMPORAL' ? 'Suspendido'
                    : estado === 'DESHABILITADO' ? 'Deshabilitado'
                    : 'Habilitado';
                  const nombreCompleto = [esp.primerNombre, esp.segundoNombre, esp.primerApellido, esp.segundoApellido].filter(Boolean).join(' ').trim() || `${esp.nombres || ''} ${esp.apellidos || ''}`.trim();

                  return (
                    <div key={e.id} className="bg-white rounded-2xl border border-neutral-100 p-4 shadow-xs space-y-3">
                      <div className="flex items-start gap-3">
                        {esp.fotoUrl ? (
                          <img src={esp.fotoUrl} alt="" className="w-12 h-12 rounded-full object-cover shrink-0 ring-1 ring-neutral-100" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                            <User className="w-6 h-6 text-primary-600" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <Link href={`/admin/especialistas/${e.id}`} className="font-semibold text-sm text-neutral-900 hover:text-primary-600 truncate block">
                            {nombreCompleto || 'Sin nombre'}
                          </Link>
                          <p className="text-xs text-primary-700 font-medium truncate mt-0.5">{esp.especialidad || 'Especialidad no asignada'}</p>
                          <p className="text-[11px] text-neutral-400 font-mono mt-0.5">{esp.numeroIdentificacion || 'Sin ID'}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0 ring-1 ${ESTADO_COLOR[estado] || ESTADO_COLOR.HABILITADO}`}>
                          {labelEstado}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
                        <div className="truncate pr-2">
                          <span className="font-medium text-neutral-700">Sede:</span> {esp.sede || '-'}
                          {esp.consultorioPredeterminado && <span className="ml-1 text-neutral-400">({esp.consultorioPredeterminado})</span>}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Link href={`/admin/especialistas/${e.id}`} className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg" title="Ver detalle">
                            <Eye size={16} />
                          </Link>
                          <button
                            onClick={() => {
                              if (!can('editar_especialista')) { toast.error('No tienes permiso para editar'); return; }
                              openEdit(e);
                            }}
                            className="p-1.5 text-neutral-600 hover:bg-neutral-100 rounded-lg"
                            title="Editar"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => {
                              if (!can('deshabilitar_especialista')) { toast.error('No tienes permiso para deshabilitar'); return; }
                              openEstado(e);
                            }}
                            className="p-1.5 text-warning-600 hover:bg-warning-50 rounded-lg"
                            title="Cambiar estado"
                          >
                            <ToggleLeft size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tabla de Escritorio (visible a partir de md: 768px) */}
              <Card className="p-0 overflow-hidden hidden md:block">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm table-fixed min-w-[760px]">
                    <colgroup>
                      <col className="w-[8%]" />
                      <col className="w-[30%]" />
                      <col className="w-[22%]" />
                      <col className="w-[14%]" />
                      <col className="w-[12%]" />
                      <col className="w-[14%]" />
                    </colgroup>
                    <thead>
                      <tr className="text-left text-neutral-400 border-b bg-neutral-50/50">
                        <th className="p-3.5 font-medium text-xs uppercase tracking-wider">Foto</th>
                        <th className="p-3.5 font-medium text-xs uppercase tracking-wider">Especialista</th>
                        <th className="p-3.5 font-medium text-xs uppercase tracking-wider">Especialidad</th>
                        <th className="p-3.5 font-medium text-xs uppercase tracking-wider">Estado</th>
                        <th className="p-3.5 font-medium text-xs uppercase tracking-wider">Sede</th>
                        <th className="p-3.5 font-medium text-xs uppercase tracking-wider text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {filteredItems.map((e) => {
                        const esp = e.especialista || {};
                        const estado = esp.estado || 'HABILITADO';
                        const labelEstado = estado === 'SUSPENDIDO_TEMPORAL' ? 'Suspendido'
                          : estado === 'DESHABILITADO' ? 'Deshabilitado'
                          : 'Habilitado';
                        const nombreCompleto = [esp.primerNombre, esp.segundoNombre, esp.primerApellido, esp.segundoApellido].filter(Boolean).join(' ').trim() || `${esp.nombres || ''} ${esp.apellidos || ''}`.trim();

                        return (
                          <tr key={e.id} className="hover:bg-neutral-50/60 transition-colors">
                            <td className="p-3.5">
                              {esp.fotoUrl ? (
                                <img src={esp.fotoUrl} alt="" className="w-9 h-9 rounded-full object-cover ring-1 ring-neutral-100" />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-primary-50 flex items-center justify-center">
                                  <User className="w-4 h-4 text-primary-600" />
                                </div>
                              )}
                            </td>
                            <td className="p-3.5 truncate">
                              <Link href={`/admin/especialistas/${e.id}`} className="font-semibold text-neutral-900 hover:text-primary-600 truncate block" title={nombreCompleto}>
                                {nombreCompleto}
                              </Link>
                              <div className="text-xs text-neutral-400 font-mono mt-0.5 truncate">{esp.numeroIdentificacion}</div>
                            </td>
                            <td className="p-3.5 truncate" title={esp.especialidad}>
                              <span className="font-medium text-neutral-700">{esp.especialidad}</span>
                              {esp.subEspecialidad && <span className="text-xs text-neutral-400 block truncate">{esp.subEspecialidad}</span>}
                            </td>
                            <td className="p-3.5 whitespace-nowrap">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ${ESTADO_COLOR[estado] || ESTADO_COLOR.HABILITADO}`}>
                                {labelEstado}
                              </span>
                            </td>
                            <td className="p-3.5 truncate text-neutral-600">
                              <span>{esp.sede || '-'}</span>
                              {esp.consultorioPredeterminado && (
                                <span className="text-xs text-neutral-400 block truncate">Cons: {esp.consultorioPredeterminado}</span>
                              )}
                            </td>
                            <td className="p-3.5 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1">
                                <Link href={`/admin/especialistas/${e.id}`} className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg" title="Ver detalle">
                                  <Eye size={16} />
                                </Link>
                                <button
                                  onClick={() => {
                                    if (!can('editar_especialista')) { toast.error('No tienes permiso para editar'); return; }
                                    openEdit(e);
                                  }}
                                  className="p-1.5 text-neutral-600 hover:bg-neutral-100 rounded-lg"
                                  title="Editar"
                                >
                                  <Pencil size={16} />
                                </button>
                                <button
                                  onClick={() => {
                                    if (!can('deshabilitar_especialista')) { toast.error('No tienes permiso para deshabilitar'); return; }
                                    openEstado(e);
                                  }}
                                  className="p-1.5 text-warning-600 hover:bg-warning-50 rounded-lg"
                                  title="Cambiar estado"
                                >
                                  <ToggleLeft size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          );
        })()}
      </div>

      {/* Modal del Formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[calc(100vh-2rem)] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b shrink-0">
              <h2 className="text-lg font-bold">
                {editingId ? 'Editar Especialista' : 'Nuevo Especialista'}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-neutral-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            {/* Stepper solo en creación */}
            {!editingId && (
              <div className="flex px-6 pt-4 gap-2 shrink-0">
                {[1, 2, 3, 4].map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors',
                      wizardStep >= s ? 'bg-primary-600 text-white' : 'bg-neutral-200 text-neutral-500',
                    )}>
                      {s}
                    </div>
                    <span className={cn('text-xs hidden sm:inline', wizardStep >= s ? 'text-primary-700 font-medium' : 'text-neutral-400')}>
                      {s === 1 && 'Datos Personales'}
                      {s === 2 && 'Contacto'}
                      {s === 3 && 'Credenciales'}
                      {s === 4 && 'Profesional'}
                    </span>
                    {s < 4 && <div className="w-8 h-0.5 bg-neutral-200 mx-1" />}
                  </div>
                ))}
              </div>
            )}

            <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
              {/* Modo edición: mostramos todo en una sola vista */}
              {editingId ? (
                <EditModeForm
                  form={form}
                  setForm={setForm}
                  touched={touched}
                  fieldErrors={fieldErrors}
                  handleChange={handleChange}
                  handleBlur={(name: string, value: string) => {
                    if (name === 'numeroIdentificacion') handleBlurId(name, value);
                  }}
                  handleIdChange={handleChange}
                  idError={idError}
                  idChecking={idChecking}
                  especialidades={especialidades}
                  sedes={sedes}
                  consultoriosFiltrados={consultoriosFiltrados}
                />
              ) : (
                <>
                  {wizardStep === 1 && (
                    <Step1DatosPersonales
                      form={form}
                      setForm={setForm}
                      touched={touched}
                      fieldErrors={fieldErrors}
                      handleChange={handleChange}
                      handleIdChange={handleIdChange}
                      idError={idError}
                      idChecking={idChecking}
                    />
                  )}
                  {wizardStep === 2 && (
                    <Step2Contacto
                      form={form}
                      setForm={setForm}
                      touched={touched}
                      fieldErrors={fieldErrors}
                      handleChange={handleChange}
                    />
                  )}
                  {wizardStep === 3 && (
                    <Step3Credenciales
                      form={form}
                      setForm={setForm}
                      touched={touched}
                      fieldErrors={fieldErrors}
                      handleChange={handleChange}
                      emailSource={emailSource}
                      setEmailSource={setEmailSource}
                      showPassword={showPassword}
                      toggleShowPassword={toggleShowPassword}
                      regeneratePassword={regeneratePassword}
                    />
                  )}
                  {wizardStep === 4 && (
                    <Step4Profesional
                      form={form}
                      setForm={setForm}
                      touched={touched}
                      fieldErrors={fieldErrors}
                      handleChange={handleChange}
                      sedes={sedes}
                      consultoriosFiltrados={consultoriosFiltrados}
                      especialidades={especialidades}
                    />
                  )}
                </>
              )}
            </div>

            <div className="flex items-center justify-between p-6 border-t shrink-0">
              <div>
                {!editingId && wizardStep > 1 && (
                  <button
                    onClick={() => setWizardStep(wizardStep - 1)}
                    className="flex items-center gap-1 px-4 py-2 border rounded-lg hover:bg-neutral-50"
                  >
                    <ChevronLeft size={16} /> Anterior
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg hover:bg-neutral-50">
                  Cancelar
                </button>
                {editingId ? (
                  <button
                    onClick={async () => { await handleSave(); loadList(); }}
                    disabled={saving}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {saving ? 'Guardando...' : 'Actualizar'}
                  </button>
                ) : wizardStep < 4 ? (
                  <button
                    onClick={() => goToStep(wizardStep + 1)}
                    className="flex items-center gap-1 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Siguiente <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    onClick={async () => { await handleSave(); loadList(); }}
                    disabled={saving || idChecking}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {saving ? 'Guardando...' : 'Crear Especialista'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de estado */}
      {showEstadoModal && estadoTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">
                Cambiar Estado — {(estadoTarget.especialista?.nombres || '')} {(estadoTarget.especialista?.apellidos || '')}
              </h2>
              <button onClick={() => setShowEstadoModal(false)} className="p-2 hover:bg-neutral-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Estado</label>
                <select
                  name="estado"
                  value={estadoData.estado}
                  onChange={(e) => handleEstadoChange(e, setEstadoData)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="HABILITADO">Habilitado</option>
                  <option value="DESHABILITADO">Deshabilitado</option>
                  <option value="SUSPENDIDO_TEMPORAL">Suspendido Temporal</option>
                </select>
              </div>
              {estadoData.estado === 'SUSPENDIDO_TEMPORAL' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={cn('block text-sm font-medium mb-1', estadoTouched.fechaInicio && estadoFieldErrors.fechaInicio ? 'text-red-700' : 'text-neutral-700')}>
                      Fecha Inicio <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="fechaInicio"
                      value={estadoData.fechaInicio}
                      onChange={(e) => handleEstadoChange(e, setEstadoData)}
                      onBlur={() => handleEstadoBlur('fechaInicio', estadoData.fechaInicio, setEstadoTouched, validateEstadoField)}
                      className={cn('w-full border rounded-lg px-3 py-2', estadoTouched.fechaInicio && estadoFieldErrors.fechaInicio ? 'border-red-400' : '')}
                    />
                    {estadoTouched.fechaInicio && estadoFieldErrors.fechaInicio && <p className="text-xs text-red-500 mt-1">{estadoFieldErrors.fechaInicio}</p>}
                  </div>
                  <div>
                    <label className={cn('block text-sm font-medium mb-1', estadoTouched.fechaFin && estadoFieldErrors.fechaFin ? 'text-red-700' : 'text-neutral-700')}>
                      Fecha Fin <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="fechaFin"
                      value={estadoData.fechaFin}
                      onChange={(e) => handleEstadoChange(e, setEstadoData)}
                      onBlur={() => handleEstadoBlur('fechaFin', estadoData.fechaFin, setEstadoTouched, validateEstadoField)}
                      className={cn('w-full border rounded-lg px-3 py-2', estadoTouched.fechaFin && estadoFieldErrors.fechaFin ? 'border-red-400' : '')}
                    />
                    {estadoTouched.fechaFin && estadoFieldErrors.fechaFin && <p className="text-xs text-red-500 mt-1">{estadoFieldErrors.fechaFin}</p>}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 p-6 border-t">
              <button onClick={() => setShowEstadoModal(false)} className="px-4 py-2 border rounded-lg hover:bg-neutral-50">
                Cancelar
              </button>
              <button
                onClick={() => handleEstadoSave(estadoTarget, estadoData, setShowEstadoModal, loadList, estadoFieldErrors, estadoTouched)}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface FieldInputProps {
  type?: string;
  name: string;
  value: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onBlur?: () => void;
  error?: string;
  touched?: boolean;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
}

function FieldInput({ type = 'text', name, value, onChange, onBlur, error, touched, placeholder, disabled, maxLength }: FieldInputProps) {
  return (
    <div className="relative">
      <input
        type={type}
        name={name}
        value={value ?? ''}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        className={cn('w-full border rounded-lg px-3 py-2', touched && error ? 'border-red-400 bg-red-50 pr-10' : '')}
      />
      {touched && error && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  );
}

function FieldSelect({ name, value, onChange, onBlur, error, touched, options, placeholder, disabled }: any) {
  return (
    <div className="relative">
      <select
        name={name}
        value={value ?? ''}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        className={cn('w-full border rounded-lg px-3 py-2', touched && error ? 'border-red-400 bg-red-50 pr-10' : '')}
      >
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {touched && error && (
        <div className="absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  );
}

function Step1DatosPersonales({ form, touched, fieldErrors, handleChange, handleIdChange, idError, idChecking }: any) {
  return (
    <>
      <h3 className="font-semibold text-neutral-900">Datos personales</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block">
            Primer nombre <span className="text-red-500">*</span>
          </label>
          <FieldInput name="primerNombre" value={form.primerNombre} onChange={handleChange}
            error={fieldErrors.primerNombre} touched={touched.primerNombre} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Segundo nombre</label>
          <FieldInput name="segundoNombre" value={form.segundoNombre} onChange={handleChange} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">
            Primer apellido <span className="text-red-500">*</span>
          </label>
          <FieldInput name="primerApellido" value={form.primerApellido} onChange={handleChange}
            error={fieldErrors.primerApellido} touched={touched.primerApellido} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Segundo apellido</label>
          <FieldInput name="segundoApellido" value={form.segundoApellido} onChange={handleChange} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Tipo ID</label>
          <FieldSelect
            name="tipoIdentificacion" value={form.tipoIdentificacion} onChange={handleChange}
            options={[{ value: 'CEDULA', label: 'CEDULA' }, { value: 'PASAPORTE', label: 'PASAPORTE' }]}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">
            Número ID <span className="text-red-500">*</span>
          </label>
          <FieldInput name="numeroIdentificacion" value={form.numeroIdentificacion}
            onChange={handleIdChange} error={fieldErrors.numeroIdentificacion} touched={touched.numeroIdentificacion} />
          {idChecking && (
            <p className="text-[10px] text-neutral-400 mt-1">Verificando disponibilidad...</p>
          )}
          {idError && <p className="text-xs text-red-500 mt-1">{idError}</p>}
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Género</label>
          <FieldSelect name="genero" value={form.genero} onChange={handleChange}
            options={[{ value: 'MASCULINO', label: 'MASCULINO' }, { value: 'FEMENINO', label: 'FEMENINO' }, { value: 'OTRO', label: 'OTRO' }]} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Estado civil</label>
          <FieldSelect name="estadoCivil" value={form.estadoCivil} onChange={handleChange}
            options={ESTADO_CIVIL_OPTS.map((e) => ({ value: e, label: e }))} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Fecha nacimiento</label>
          <FieldInput type="date" name="fechaNacimiento" value={form.fechaNacimiento} onChange={handleChange} />
        </div>
      </div>
    </>
  );
}

function Step2Contacto({ form, touched, fieldErrors, handleChange }: any) {
  return (
    <>
      <h3 className="font-semibold text-neutral-900">Contacto</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="text-sm font-medium mb-1 block">
            Email institucional (login principal) <span className="text-red-500">*</span>
          </label>
          <FieldInput type="email" name="emailInstitucional" value={form.emailInstitucional} onChange={handleChange}
            error={fieldErrors.emailInstitucional} touched={touched.emailInstitucional} placeholder="usuario@clinica.com" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Email secundario (opcional, login alternativo)</label>
          <FieldInput type="email" name="emailSecundario" value={form.emailSecundario} onChange={handleChange}
            error={fieldErrors.emailSecundario} touched={touched.emailSecundario} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Email personal</label>
          <FieldInput type="email" name="emailPersonal" value={form.emailPersonal} onChange={handleChange}
            error={fieldErrors.emailPersonal} touched={touched.emailPersonal} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">
            Teléfono <span className="text-red-500">*</span>
          </label>
          <FieldInput name="telefono" value={form.telefono} onChange={handleChange}
            error={fieldErrors.telefono} touched={touched.telefono} placeholder="09XXXXXXXX" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Teléfono secundario</label>
          <FieldInput name="telefonoSecundario" value={form.telefonoSecundario} onChange={handleChange} />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-medium mb-1 block">Dirección</label>
          <FieldInput name="direccion" value={form.direccion} onChange={handleChange} />
        </div>
      </div>
    </>
  );
}

interface Step3Props {
  form: any;
  setForm: any;
  touched: any;
  fieldErrors: any;
  handleChange: any;
  emailSource: 'institucional' | 'secundario' | 'personal';
  setEmailSource: (v: 'institucional' | 'secundario' | 'personal') => void;
  showPassword: boolean;
  toggleShowPassword: () => void;
  regeneratePassword: () => void;
}

function Step3Credenciales(props: Step3Props) {
  const { form, touched, fieldErrors, handleChange, emailSource, setEmailSource,
    showPassword, toggleShowPassword, regeneratePassword } = props;

  const strength = (() => {
    if (!form.password) return null;
    const lower = /[a-z]/.test(form.password);
    const upper = /[A-Z]/.test(form.password);
    const digit = /\d/.test(form.password);
    const sym = /[!@#$%^&*(),.?":{}|<>?_=+-]/.test(form.password);
    const len = form.password.length >= 12;
    let score = 0;
    if (lower) score++;
    if (upper) score++;
    if (digit) score++;
    if (sym) score++;
    if (len) score++;
    return score;
  })();

  return (
    <>
      <h3 className="font-semibold text-neutral-900">Credenciales</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block">
            Fuente de email <span className="text-red-500">*</span>
          </label>
          <FieldSelect
            value={emailSource} name="emailSource"
            options={[
              { value: 'institucional', label: 'Email Institucional' },
              { value: 'secundario', label: 'Email Secundario' },
              { value: 'personal', label: 'Email Personal' },
            ]}
            onChange={(e: any) => setEmailSource(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">
            Email (usuario) <span className="text-red-500">*</span>
          </label>
          <FieldInput type="email" name="email" value={form.email} onChange={handleChange}
            error={fieldErrors.email} touched={touched.email} />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-medium mb-1 block">
            Contraseña <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2 items-stretch">
            <div className="flex-1 relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                className={cn(
                  'w-full border rounded-lg px-3 py-2 pr-10 font-mono text-sm',
                  touched.password && fieldErrors.password ? 'border-red-400 bg-red-50' : '',
                )}
              />
              <button
                type="button"
                onClick={toggleShowPassword}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-500 hover:text-neutral-700"
                title={showPassword ? 'Ocultar' : 'Mostrar'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button
              type="button"
              onClick={regeneratePassword}
              className="px-3 py-2 border rounded-lg hover:bg-neutral-50 flex items-center gap-1 text-sm"
              title="Generar nueva contraseña automática"
            >
              <RotateCw size={14} /> Regenerar
            </button>
          </div>
          {touched.password && fieldErrors.password && (
            <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>
          )}
          {form.password && strength !== null && (
            <div className="mt-2">
              <PasswordStrengthBar score={strength} label={strength >= 4 ? 'Fuerte' : strength >= 3 ? 'Aceptable' : strength >= 1 ? 'Débil' : 'Insuficiente'} />
            </div>
          )}
          <p className="mt-2 text-xs text-neutral-500">
            La contraseña se genera automáticamente al abrir este formulario. Puedes regenerarla o copiarla después.
          </p>
        </div>
      </div>
    </>
  );
}

function Step4Profesional({ form, touched, fieldErrors, handleChange, sedes, consultoriosFiltrados, especialidades }: any) {
  const [showExtra, setShowExtra] = useState(false);
  const colorOptions = [
    { value: '#3B82F6', label: 'Azul' },
    { value: '#10B981', label: 'Verde' },
    { value: '#F59E0B', label: 'Ámbar' },
    { value: '#EF4444', label: 'Rojo' },
    { value: '#8B5CF6', label: 'Violeta' },
    { value: '#EC4899', label: 'Rosa' },
    { value: '#64748B', label: 'Gris' },
  ];

  return (
    <>
      <h3 className="font-semibold text-neutral-900">Datos profesionales</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block">
            Código MSP <span className="text-red-500">*</span>
          </label>
          <FieldInput name="codigoMsp" value={form.codigoMsp} onChange={handleChange}
            error={fieldErrors.codigoMsp} touched={touched.codigoMsp} placeholder="ej. MSP-001" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">
            Especialidad <span className="text-red-500">*</span>
          </label>
          <FieldSelect
            name="especialidad" value={form.especialidad} onChange={handleChange}
            options={especialidades.map((e: any) => ({ value: e.nombre, label: e.nombre }))}
            placeholder="Seleccione..."
            error={fieldErrors.especialidad} touched={touched.especialidad}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Subespecialidad</label>
          <FieldInput name="subEspecialidad" value={form.subEspecialidad} onChange={handleChange} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">
            Título profesional <span className="text-red-500">*</span>
          </label>
          <FieldInput name="tituloProfesional" value={form.tituloProfesional} onChange={handleChange}
            error={fieldErrors.tituloProfesional} touched={touched.tituloProfesional} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">
            Sede <span className="text-red-500">*</span>
          </label>
          <FieldSelect
            name="sede" value={form.sede} onChange={handleChange}
            options={sedes.map((s: any) => ({ value: s.nombre, label: s.nombre }))}
            placeholder="Seleccione..."
            error={fieldErrors.sede} touched={touched.sede}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Consultorio predeterminado</label>
          <FieldSelect
            name="consultorioPredeterminado" value={form.consultorioPredeterminado} onChange={handleChange}
            options={[
              { value: '', label: form.sede ? 'Ninguno' : 'Seleccione sede primero' },
              ...consultoriosFiltrados.map((c: any) => ({ value: c.nombre, label: c.nombre })),
            ]}
            disabled={!form.sede}
          />
        </div>
        <div className="md:col-span-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={!!form.tienePasantes}
              onChange={(e) => {
                const target = { name: 'tienePasantes', value: e.target.checked } as any;
                handleChange({ target } as any);
              }}
              className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-neutral-700">Habilitar pasantes</span>
          </label>
          <p className="text-xs text-neutral-400 mt-1 ml-7">
            Permite asignar pasantes a este especialista al crear citas.
          </p>
        </div>
      </div>

      <details className="pt-2" open={showExtra} onClick={() => setShowExtra((v) => !v)}>
        <summary className="cursor-pointer text-sm font-semibold text-neutral-700 hover:text-primary-700 select-none">
          Personalización del calendario
        </summary>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
          <div>
            <label className="text-sm font-medium mb-1 block">Color</label>
            <input
              type="color"
              value={form.colorCalendario || '#3B82F6'}
              onChange={(e) => handleChange({ target: { name: 'colorCalendario', value: e.target.value, type: 'color' } } as any)}
              className="h-10 w-20 border rounded-lg cursor-pointer p-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Código alfabético (2 letras)</label>
            <FieldInput name="codigoAlfabetico" value={form.codigoAlfabetico} onChange={handleChange} placeholder="ej. ME" maxLength={3} />
          </div>
        </div>
      </details>
    </>
  );
}

function EditModeForm(props: any) {
  const { form, setForm, touched, fieldErrors, handleChange, handleIdChange, idError, idChecking,
    especialidades, sedes, consultoriosFiltrados } = props;

  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-neutral-900 pt-2 border-t">Datos personales</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Primer nombre <span className="text-red-500">*</span></label>
          <FieldInput name="primerNombre" value={form.primerNombre} onChange={handleChange}
            error={fieldErrors.primerNombre} touched={touched.primerNombre} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Segundo nombre</label>
          <FieldInput name="segundoNombre" value={form.segundoNombre} onChange={handleChange} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Primer apellido <span className="text-red-500">*</span></label>
          <FieldInput name="primerApellido" value={form.primerApellido} onChange={handleChange}
            error={fieldErrors.primerApellido} touched={touched.primerApellido} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Segundo apellido</label>
          <FieldInput name="segundoApellido" value={form.segundoApellido} onChange={handleChange} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Tipo ID</label>
          <FieldSelect
            name="tipoIdentificacion" value={form.tipoIdentificacion} onChange={handleChange}
            options={[{ value: 'CEDULA', label: 'CEDULA' }, { value: 'PASAPORTE', label: 'PASAPORTE' }]}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">
            Número ID <span className="text-red-500">*</span>
          </label>
          <FieldInput name="numeroIdentificacion" value={form.numeroIdentificacion}
            onChange={handleIdChange} error={fieldErrors.numeroIdentificacion} touched={touched.numeroIdentificacion} />
          {idError && <p className="text-xs text-red-500 mt-1">{idError}</p>}
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Género</label>
          <FieldSelect name="genero" value={form.genero} onChange={handleChange}
            options={[{ value: 'MASCULINO', label: 'MASCULINO' }, { value: 'FEMENINO', label: 'FEMENINO' }, { value: 'OTRO', label: 'OTRO' }]} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Estado civil</label>
          <FieldSelect name="estadoCivil" value={form.estadoCivil} onChange={handleChange}
            options={ESTADO_CIVIL_OPTS.map((e) => ({ value: e, label: e }))} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Fecha nacimiento</label>
          <FieldInput type="date" name="fechaNacimiento" value={form.fechaNacimiento} onChange={handleChange} />
        </div>
      </div>

      <h3 className="font-semibold text-neutral-900 pt-2 border-t">Contacto</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="text-sm font-medium mb-1 block">
            Email institucional (login principal) <span className="text-red-500">*</span>
          </label>
          <FieldInput type="email" name="emailInstitucional" value={form.emailInstitucional} onChange={handleChange}
            error={fieldErrors.emailInstitucional} touched={touched.emailInstitucional} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Email secundario</label>
          <FieldInput type="email" name="emailSecundario" value={form.emailSecundario} onChange={handleChange} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Email personal</label>
          <FieldInput type="email" name="emailPersonal" value={form.emailPersonal} onChange={handleChange} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">
            Teléfono <span className="text-red-500">*</span>
          </label>
          <FieldInput name="telefono" value={form.telefono} onChange={handleChange}
            error={fieldErrors.telefono} touched={touched.telefono} placeholder="09XXXXXXXX" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Teléfono secundario</label>
          <FieldInput name="telefonoSecundario" value={form.telefonoSecundario} onChange={handleChange} />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-medium mb-1 block">Dirección</label>
          <FieldInput name="direccion" value={form.direccion} onChange={handleChange} />
        </div>
      </div>

      <h3 className="font-semibold text-neutral-900 pt-2 border-t">Datos profesionales</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block">
            Código MSP <span className="text-red-500">*</span>
          </label>
          <FieldInput name="codigoMsp" value={form.codigoMsp} onChange={handleChange}
            error={fieldErrors.codigoMsp} touched={touched.codigoMsp} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">
            Especialidad <span className="text-red-500">*</span>
          </label>
          <FieldSelect
            name="especialidad" value={form.especialidad} onChange={handleChange}
            options={especialidades.map((e: any) => ({ value: e.nombre, label: e.nombre }))}
            error={fieldErrors.especialidad} touched={touched.especialidad}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Subespecialidad</label>
          <FieldInput name="subEspecialidad" value={form.subEspecialidad} onChange={handleChange} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">
            Título profesional <span className="text-red-500">*</span>
          </label>
          <FieldInput name="tituloProfesional" value={form.tituloProfesional} onChange={handleChange}
            error={fieldErrors.tituloProfesional} touched={touched.tituloProfesional} />
        </div>
      </div>

      <h3 className="font-semibold text-neutral-900 pt-2 border-t">Ubicación de atención</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block">
            Sede <span className="text-red-500">*</span>
          </label>
          <FieldSelect
            name="sede" value={form.sede} onChange={handleChange}
            options={sedes.map((s: any) => ({ value: s.nombre, label: s.nombre }))}
            error={fieldErrors.sede} touched={touched.sede}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Consultorio predeterminado</label>
          <FieldSelect
            name="consultorioPredeterminado" value={form.consultorioPredeterminado} onChange={handleChange}
            options={[
              { value: '', label: form.sede ? 'Ninguno' : 'Seleccione sede primero' },
              ...consultoriosFiltrados.map((c: any) => ({ value: c.nombre, label: c.nombre })),
            ]}
            disabled={!form.sede}
          />
        </div>
        <div className="md:col-span-2 pt-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={!!form.tienePasantes}
              onChange={(e) =>
                setForm((prev: any) => ({ ...prev, tienePasantes: e.target.checked }))
              }
              className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-neutral-700">Habilitar pasantes</span>
          </label>
        </div>
        <div className="md:col-span-2 pt-2">
          <label className="text-sm font-medium mb-1 block">Color de calendario</label>
          <input
            type="color"
            value={form.colorCalendario || '#3B82F6'}
            onChange={(e) => setForm((prev: any) => ({ ...prev, colorCalendario: e.target.value }))}
            className="h-10 w-20 border rounded-lg cursor-pointer p-1"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-medium mb-1 block">Código alfabético (2 letras)</label>
          <FieldInput name="codigoAlfabetico" value={form.codigoAlfabetico}
            onChange={(e: any) => {
              handleChange({ target: { name: 'codigoAlfabetico', value: e.target.value.slice(0, 3) } } as any);
            }}
            maxLength={3} />
        </div>
      </div>
    </div>
  );
}
