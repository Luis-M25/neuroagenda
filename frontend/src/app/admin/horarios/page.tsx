'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { horariosApi, especialistasApi, feriadosApi, especialidadesApi, sedesApi } from '@/lib/api-client';
import { cn, DIAS_SEMANA } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, X, CalendarX, ChevronDown, ToggleLeft } from 'lucide-react';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { validateRequired, validateTimeOrder, validateMinMax } from '@/lib/validators';

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

interface BloqueForm {
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  duracionMinutos: number;
  observaciones: string;
}

const emptyBloque: BloqueForm = {
  diaSemana: 1,
  horaInicio: '08:00',
  horaFin: '17:00',
  duracionMinutos: 30,
  observaciones: '',
};

export default function HorariosPage() {
  const [especialistas, setEspecialistas] = useState<any[]>([]);
  const [especialidades, setEspecialidades] = useState<any[]>([]);
  const [sedes, setSedes] = useState<any[]>([]);
  const [especialistaId, setEspecialistaId] = useState('');
  const [bloques, setBloques] = useState<any[]>([]);
  const [feriados, setFeriados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingBloqueId, setEditingBloqueId] = useState<string | null>(null);
  const [form, setForm] = useState<BloqueForm>(emptyBloque);
  const [showFeriadoForm, setShowFeriadoForm] = useState(false);
  const [editingFeriadoId, setEditingFeriadoId] = useState<string | null>(null);
  const [feriadoForm, setFeriadoForm] = useState({ fecha: '', nombre: '' });
  const [bloqueErrors, setBloqueErrors] = useState<Record<string, string>>({});
  const [bloqueTouched, setBloqueTouched] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');
  const [filterEspecialidad, setFilterEspecialidad] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterSede, setFilterSede] = useState('');
  const [showFeriados, setShowFeriados] = useState(true);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ dia: number; hora: number } | null>(null);
  const dragEndRef = useRef<{ dia: number; hora: number } | null>(null);
  const [selectedRange, setSelectedRange] = useState<{ dia: number; horaInicio: number; horaFin: number } | null>(null);

  useEffect(() => {
    Promise.all([
      especialistasApi.getAll({ activo: true }),
      feriadosApi.getAll(),
      especialidadesApi.getAll(true),
      sedesApi.getAll(true),
    ])
      .then(([esps, fers, espcs, sds]) => {
        setEspecialistas(esps);
        setFeriados(fers);
        setEspecialidades(espcs);
        setSedes(sds);
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  const loadBloques = useCallback(() => {
    if (!especialistaId) {
      setBloques([]);
      return;
    }
    horariosApi.getByEspecialista(especialistaId, true)
      .then(setBloques)
      .catch((e) => toast.error(e.message));
  }, [especialistaId]);

  const loadFeriados = () => {
    feriadosApi.getAll()
      .then(setFeriados)
      .catch((e) => toast.error(e.message));
  };

  const especialistasFiltered = useMemo(() => especialistas.filter((e) => {
    const esp = e.especialista || e;
    const fullText = `${esp.nombres} ${esp.apellidos} ${esp.numeroIdentificacion || ''} ${esp.tipoIdentificacion || ''} ${e.email || ''} ${e.emailInstitucional || ''} ${e.emailPersonal || ''} ${esp.emailInstitucional || ''} ${esp.emailPersonal || ''}`.toLowerCase();
    const matchesEspecialidad = !filterEspecialidad || esp.especialidad === filterEspecialidad;
    const matchesEstado = !filterEstado || esp.estado === filterEstado;
    const matchesSede = !filterSede || esp.sede === filterSede;
    return (!search || fullText.includes(search.toLowerCase())) && matchesEspecialidad && matchesEstado && matchesSede;
  }), [especialistas, search, filterEspecialidad, filterEstado, filterSede]);

  useEffect(() => {
    loadBloques();
  }, [loadBloques]);

  useEffect(() => {
    const handleMouseUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      const start = dragStartRef.current;
      const end = dragEndRef.current;
      dragStartRef.current = null;
      dragEndRef.current = null;
      setSelectedRange(null);
      if (!start || !end || start.dia !== end.dia) return;
      const horaInicio = Math.min(start.hora, end.hora);
      const horaFin = Math.max(start.hora, end.hora) + 1;
      if (horaFin - horaInicio >= 1) {
        const startStr = `${String(horaInicio).padStart(2, '0')}:00`;
        const endStr = horaFin <= 23 ? `${String(horaFin).padStart(2, '0')}:00` : '23:59';
        openCreate(start.dia, startStr, endStr);
      }
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const searchableOptions = useMemo(() => especialistasFiltered.map((e) => {
    const esp = e.especialista || e;
    const idInfo = esp.numeroIdentificacion ? ` · ${esp.tipoIdentificacion === 'PASAPORTE' ? 'Pas: ' : 'Céd: '}${esp.numeroIdentificacion}` : '';
    return {
      value: esp.id || '',
      label: `${esp.nombres} ${esp.apellidos}${idInfo} · ${esp.especialidad || ''}`,
      filterKey: `${esp.numeroIdentificacion || ''} ${e.email || ''} ${e.emailInstitucional || ''} ${e.emailPersonal || ''} ${esp.emailInstitucional || ''} ${esp.emailPersonal || ''}`,
    };
  }), [especialistasFiltered]);

  const openCreate = (dia: number, horaInicio?: string, horaFinParam?: string) => {
    setEditingBloqueId(null);
    const startHora = horaInicio ?? emptyBloque.horaInicio;
    const [h] = startHora.split(':').map(Number);
    const endHora = horaFinParam ?? `${String(Math.min(h + 1, 23)).padStart(2, '0')}:00`;
    setForm({
      ...emptyBloque,
      diaSemana: dia,
      horaInicio: startHora,
      horaFin: endHora,
    });
    setShowForm(true);
  };

  const openEdit = (bloque: any) => {
    setEditingBloqueId(bloque.id);
    setForm({
      diaSemana: bloque.diaSemana,
      horaInicio: bloque.horaInicio,
      horaFin: bloque.horaFin,
      duracionMinutos: bloque.duracionMinutos,
      observaciones: bloque.observaciones || '',
    });
    setShowForm(true);
  };

  const validateBloque = useCallback((name: string, value: any, formData: BloqueForm) => {
    let err = '';
    switch (name) {
      case 'horaInicio':
      case 'horaFin':
        err = validateRequired(String(value), name === 'horaInicio' ? 'Hora inicio' : 'Hora fin').message;
        if (!err && formData.horaInicio && formData.horaFin) {
          err = validateTimeOrder(formData.horaInicio, formData.horaFin, 'Horario').message;
        }
        break;
      case 'duracionMinutos':
        err = validateMinMax(Number(value), 15, 120, 'Duración').message;
        break;
      case 'diaSemana':
        err = validateRequired(String(value), 'Día de la semana').message;
        break;
    }
    setBloqueErrors((prev) => ({ ...prev, [name]: err }));
    return err;
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target;
    let value: any = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value;
    if (target.type === 'number') value = Number(value);
    const newForm = { ...form, [target.name]: value };
    setForm(newForm);
    if (bloqueTouched[target.name]) {
      validateBloque(target.name, value, newForm);
    }
  };

  const handleBlur = (name: string, value: any) => {
    setBloqueTouched((prev) => ({ ...prev, [name]: true }));
    validateBloque(name, value, form);
  };

  const handleSave = async () => {
    const errs: Record<string, string> = {};
    const allTouched: Record<string, boolean> = { diaSemana: true, horaInicio: true, horaFin: true, duracionMinutos: true };
    let hasError = false;
    Object.keys(allTouched).forEach((key) => {
      const err = validateBloque(key, (form as any)[key], form);
      if (err) { errs[key] = err; hasError = true; }
    });
    setBloqueTouched((prev) => ({ ...prev, ...allTouched }));
    setBloqueErrors((prev) => ({ ...prev, ...errs }));
    if (hasError) { toast.error('Corrija los errores antes de guardar (ISO 9001)'); return; }

    setSaving(true);
    try {
      if (editingBloqueId) {
        await horariosApi.update(editingBloqueId, { ...form, especialistaId });
        toast.success('Bloque actualizado');
      } else {
        await horariosApi.create({ ...form, especialistaId });
        toast.success('Bloque creado');
      }
      setShowForm(false);
      loadBloques();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar este bloque?')) return;
    try {
      await horariosApi.remove(id);
      toast.success('Bloque eliminado');
      loadBloques();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleFeriadoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFeriadoForm({ ...feriadoForm, [e.target.name]: e.target.value });
  };

  const openCreateFeriado = () => {
    setEditingFeriadoId(null);
    setFeriadoForm({ fecha: '', nombre: '' });
    setShowFeriadoForm(true);
  };

  const openEditFeriado = (f: any) => {
    setEditingFeriadoId(f.id);
    const d = new Date(f.fecha);
    const fechaStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setFeriadoForm({ fecha: fechaStr, nombre: f.nombre });
    setShowFeriadoForm(true);
  };

  const handleSaveFeriado = async () => {
    setSaving(true);
    try {
      if (editingFeriadoId) {
        await feriadosApi.update(editingFeriadoId, feriadoForm);
        toast.success('Feriado actualizado');
      } else {
        await feriadosApi.create(feriadoForm);
        toast.success('Feriado creado');
      }
      setShowFeriadoForm(false);
      loadFeriados();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFeriado = async (id: string) => {
    if (!window.confirm('¿Eliminar este feriado?')) return;
    try {
      await feriadosApi.remove(id);
      toast.success('Feriado eliminado');
      loadFeriados();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const toggleFeriado = async (f: any) => {
    try {
      await feriadosApi.update(f.id, { activo: !f.activo });
      toast.success(f.activo ? 'Feriado deshabilitado' : 'Feriado habilitado');
      loadFeriados();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const bloquesByDia = (dia: number) => bloques.filter((b) => b.diaSemana === dia);

  const blockedCells = useMemo(() => {
    const set = new Set<string>();
    bloques.forEach((b) => {
      const [hIni] = b.horaInicio.split(':').map(Number);
      const [hFin] = b.horaFin.split(':').map(Number);
      for (let h = hIni; h < hFin; h++) {
        set.add(`${b.diaSemana}-${h}`);
      }
    });
    return set;
  }, [bloques]);

  const isCellBlocked = (dia: number, hora: number) => blockedCells.has(`${dia}-${hora}`);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <PageHeader title="Horarios" description="Editor de horarios semanal" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
          <div className="w-full sm:w-44">
            <label className="block text-xs font-medium text-neutral-500 mb-1">Especialidad</label>
            <select
              value={filterEspecialidad}
              onChange={(e) => setFilterEspecialidad(e.target.value)}
              className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Todas</option>
              {especialidades.map((esp) => <option key={esp.id} value={esp.nombre}>{esp.nombre}</option>)}
            </select>
          </div>
          <div className="w-full sm:w-36">
            <label className="block text-xs font-medium text-neutral-500 mb-1">Estado</label>
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              <option value="HABILITADO">Habilitado</option>
              <option value="DESHABILITADO">Deshabilitado</option>
              <option value="SUSPENDIDO_TEMPORAL">Suspendido</option>
            </select>
          </div>
          <div className="w-full sm:w-44">
            <label className="block text-xs font-medium text-neutral-500 mb-1">Sede</label>
            <select
              value={filterSede}
              onChange={(e) => setFilterSede(e.target.value)}
              className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Todas</option>
              {sedes.map((s) => <option key={s.id} value={s.nombre}>{s.nombre}</option>)}
            </select>
          </div>
          <div className="flex-1 w-full">
            <label className="block text-xs font-medium text-neutral-500 mb-1">Especialista</label>
            <SearchableSelect
              value={especialistaId}
              onChange={setEspecialistaId}
              options={searchableOptions}
              placeholder="Buscar y seleccionar especialista..."
              emptyMessage="Sin resultados"
            />
          </div>
        </div>
      </div>

      {!especialistaId ? (
        <div className="bg-white rounded-xl border border-neutral-100 p-12 text-center text-gray-500">
          Seleccione un especialista para ver y editar sus horarios
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-3 border text-left font-medium text-gray-600 w-24">Hora</th>
                  {DIAS_SEMANA.filter((_, i) => i > 0).map((dia, idx) => (
                    <th key={idx} className="p-3 border text-left font-medium text-gray-600">
                      <div className="flex items-center justify-between">
                        <span>{dia}</span>
                        <button
                          onClick={() => openCreate(idx + 1)}
                          className="p-1 text-primary-600 hover:bg-primary-50 rounded"
                          title="Agregar bloque"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 12 }, (_, i) => {
                  const hora = `${String(i + 7).padStart(2, '0')}:00`;
                  const hHora = i + 7;
                  return (
                    <tr key={hora}>
                      <td className="p-3 border text-gray-500 font-medium">{hora}</td>
                      {[1, 2, 3, 4, 5, 6, 0].map((dia) => {
                        if (isCellBlocked(dia, hHora)) {
                          const block = bloques.find((b) => {
                            if (b.diaSemana !== dia) return false;
                            const [hIni] = b.horaInicio.split(':').map(Number);
                            const [hFin] = b.horaFin.split(':').map(Number);
                            return hIni <= hHora && hFin > hHora;
                          });
                          if (!block) {
                            return <td key={dia} className="p-1 border bg-primary-50/40" />;
                          }
                          const [hIni, mIni] = block.horaInicio.split(':').map(Number);
                          const [hFin, mFin] = block.horaFin.split(':').map(Number);
                          const duracionHoras = ((hFin * 60 + mFin) - (hIni * 60 + mIni)) / 60;
                          const isStart = hIni === hHora;
                          return (
                            <td key={dia} className={cn(
                              'p-1 border relative align-top',
                              isStart ? 'bg-primary-50/40' : 'bg-primary-30/20'
                            )}>
                              <div className={cn(
                                'rounded-lg p-2 text-xs',
                                isStart ? 'bg-primary-50 border border-primary-200' : 'bg-primary-30/10 border border-primary-100'
                              )}>
                                {isStart ? (
                                  <>
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium text-primary-800">
                                        {block.horaInicio} - {block.horaFin}
                                      </span>
                                      <div className="flex gap-0.5">
                                        <button onClick={() => openEdit(block)} className="p-0.5 text-primary-600 hover:bg-primary-100 rounded">
                                          <Pencil size={12} />
                                        </button>
                                        <button onClick={() => handleDelete(block.id)} className="p-0.5 text-danger-600 hover:bg-danger-50 rounded">
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    </div>
                                    <div className="text-neutral-500 mt-0.5">{block.duracionMinutos} min por cita {duracionHoras > 1 ? `· ${Math.round((duracionHoras * 60) / block.duracionMinutos)} cupos` : ''}</div>
                                    {block.observaciones && <div className="text-neutral-400 truncate">{block.observaciones}</div>}
                                  </>
                                ) : (
                                  <div className="text-neutral-300 text-center text-[10px]">...</div>
                                )}
                              </div>
                            </td>
                          );
                        }
                        const isSelected = selectedRange?.dia === dia && hHora >= selectedRange.horaInicio && hHora < selectedRange.horaFin;
                        return (
                          <td
                            key={dia}
                            className={cn(
                              'p-0 border border-dashed cursor-pointer select-none transition-colors',
                              isSelected ? 'bg-primary-100/70 border-primary-300' : 'bg-gray-50/50 hover:bg-gray-100/50'
                            )}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              isDraggingRef.current = true;
                              dragStartRef.current = { dia, hora: hHora };
                              dragEndRef.current = { dia, hora: hHora };
                              setSelectedRange({ dia, horaInicio: hHora, horaFin: hHora + 1 });
                            }}
                            onMouseEnter={() => {
                              if (!isDraggingRef.current || !dragStartRef.current) return;
                              if (dia !== dragStartRef.current.dia) return;
                              dragEndRef.current = { dia, hora: hHora };
                              const startHora = dragStartRef.current.hora;
                              const horaInicio = Math.min(startHora, hHora);
                              const horaFin = Math.max(startHora, hHora) + 1;
                              setSelectedRange({ dia, horaInicio, horaFin });
                            }}
                          >
                            <div className="w-full h-full min-h-[2rem] flex items-center justify-center">
                              <Plus size={14} className="text-gray-300" />
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t bg-gray-50 flex items-center gap-2 text-xs text-gray-500">
            <div className="w-3 h-3 rounded bg-primary-50 border border-primary-200" />
            <span>Bloque activo</span>
            <span className="ml-2">Total: {bloques.length} bloques</span>
            {selectedRange && (
              <span className="ml-auto text-primary-600 font-medium">
                {String(selectedRange.horaInicio).padStart(2, '0')}:00 - {String(selectedRange.horaFin).padStart(2, '0')}:00
              </span>
            )}
          </div>
        </div>
      )}

      {/* Bloque Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{editingBloqueId ? 'Editar Bloque' : 'Nuevo Bloque'}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={cn('block text-sm font-medium mb-1', bloqueTouched.diaSemana && bloqueErrors.diaSemana ? 'text-red-700' : 'text-gray-700')}>
                  Día de la Semana <span className="text-red-500">*</span>
                </label>
                <select name="diaSemana" value={form.diaSemana} onChange={handleChange} onBlur={() => handleBlur('diaSemana', form.diaSemana)}
                  className={cn('w-full border rounded-lg px-3 py-2', bloqueTouched.diaSemana && bloqueErrors.diaSemana ? 'border-red-400 bg-red-50' : '')}>
                  {DIAS_SEMANA.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
                {bloqueTouched.diaSemana && bloqueErrors.diaSemana && <p role="alert" className="text-xs text-red-500 mt-1">{bloqueErrors.diaSemana}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={cn('block text-sm font-medium mb-1', bloqueTouched.horaInicio && bloqueErrors.horaInicio ? 'text-red-700' : 'text-gray-700')}>
                    Hora Inicio <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input type="time" name="horaInicio" value={form.horaInicio} onChange={handleChange} onBlur={() => handleBlur('horaInicio', form.horaInicio)}
                      className={cn('w-full border rounded-lg px-3 py-2', bloqueTouched.horaInicio && bloqueErrors.horaInicio ? 'border-red-400 bg-red-50 pr-10' : '')} />
                    {bloqueTouched.horaInicio && bloqueErrors.horaInicio && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      </div>
                    )}
                  </div>
                  {bloqueTouched.horaInicio && bloqueErrors.horaInicio && <p role="alert" className="text-xs text-red-500 mt-1">{bloqueErrors.horaInicio}</p>}
                </div>
                <div>
                  <label className={cn('block text-sm font-medium mb-1', bloqueTouched.horaFin && bloqueErrors.horaFin ? 'text-red-700' : 'text-gray-700')}>
                    Hora Fin <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input type="time" name="horaFin" value={form.horaFin} onChange={handleChange} onBlur={() => handleBlur('horaFin', form.horaFin)}
                      className={cn('w-full border rounded-lg px-3 py-2', bloqueTouched.horaFin && bloqueErrors.horaFin ? 'border-red-400 bg-red-50 pr-10' : '')} />
                    {bloqueTouched.horaFin && bloqueErrors.horaFin && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      </div>
                    )}
                  </div>
                  {bloqueTouched.horaFin && bloqueErrors.horaFin && <p role="alert" className="text-xs text-red-500 mt-1">{bloqueErrors.horaFin}</p>}
                </div>
              </div>
              <div>
                <label className={cn('block text-sm font-medium mb-1', bloqueTouched.duracionMinutos && bloqueErrors.duracionMinutos ? 'text-red-700' : 'text-gray-700')}>
                  Duración por cita (minutos) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                   <input type="number" name="duracionMinutos" value={form.duracionMinutos} onChange={handleChange} onBlur={() => handleBlur('duracionMinutos', form.duracionMinutos)} className={cn('w-full border rounded-lg px-3 py-2', bloqueTouched.duracionMinutos && bloqueErrors.duracionMinutos ? 'border-red-400 bg-red-50 pr-10' : '')} min={15} step={15} />
                  {bloqueTouched.duracionMinutos && bloqueErrors.duracionMinutos && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    </div>
                  )}
                </div>
                {bloqueTouched.duracionMinutos && bloqueErrors.duracionMinutos && <p role="alert" className="text-xs text-red-500 mt-1">{bloqueErrors.duracionMinutos}</p>}
                <p className="text-xs text-gray-400 mt-1">Tiempo asignado a cada cita dentro del bloque (15-120 min)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                <textarea name="observaciones" value={form.observaciones} onChange={handleChange} className="w-full border rounded-lg px-3 py-2" rows={2} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button>
              <Button onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : editingBloqueId ? 'Actualizar' : 'Crear'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Feriados Section */}
      <div className="bg-white rounded-xl border border-neutral-100 border border-neutral-100 overflow-hidden">
        <div
          onClick={() => setShowFeriados(!showFeriados)}
          className="w-full p-4 flex items-center justify-between cursor-pointer select-none hover:bg-neutral-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <CalendarX size={18} className="text-neutral-400" />
            <h2 className="text-base font-semibold text-neutral-800">Feriados</h2>
            <span className="text-xs text-neutral-400">{feriados.filter(f => f.activo).length} activos</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => { e.stopPropagation(); setShowFeriadoForm(true); setEditingFeriadoId(null); setFeriadoForm({ fecha: '', nombre: '' }); }}
              className="flex items-center gap-1 px-3 py-1.5 bg-primary-500 text-white rounded-lg text-xs font-medium hover:bg-primary-600 transition-colors"
            >
              <Plus size={14} /> Agregar
            </button>
            <ChevronDown size={16} className={cn('text-neutral-400 transition-transform', showFeriados && 'rotate-180')} />
          </div>
        </div>
        {showFeriados && (
          <>
        {feriados.length === 0 ? (
          <div className="p-8 text-center text-sm text-neutral-400 border-t border-neutral-100">
            No hay feriados registrados.
          </div>
        ) : (
          <div className="overflow-x-auto border-t border-neutral-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-500">
                  <th className="p-3 font-medium border-b border-neutral-100">Fecha</th>
                  <th className="p-3 font-medium border-b border-neutral-100">Nombre</th>
                  <th className="p-3 font-medium border-b border-neutral-100">Estado</th>
                  <th className="p-3 font-medium border-b border-neutral-100 w-24">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {feriados.map((f) => {
                  const d = new Date(f.fecha);
                  const fechaStr = d.toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' });
                  return (
                    <tr key={f.id} className="border-b border-neutral-50 last:border-b-0 hover:bg-neutral-50 transition-colors">
                      <td className="p-3 text-neutral-800 font-medium">{fechaStr}</td>
                      <td className="p-3 text-neutral-600">{f.nombre}</td>
                      <td className="p-3">
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          f.activo ? 'bg-primary-50 text-primary-600' : 'bg-neutral-100 text-neutral-500'
                        )}>
                          {f.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <button onClick={() => toggleFeriado(f)} className={cn(
                            'p-1.5 rounded-lg transition-colors',
                            f.activo ? 'text-neutral-400 hover:text-danger-600 hover:bg-danger-50' : 'text-neutral-400 hover:text-primary-600 hover:bg-primary-50'
                          )} title={f.activo ? 'Deshabilitar' : 'Habilitar'}>
                            <ToggleLeft size={14} />
                          </button>
                          <button onClick={() => openEditFeriado(f)} className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Editar">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDeleteFeriado(f.id)} className="p-1.5 text-neutral-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors" title="Eliminar">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        </>
          )}
        </div>

      {/* Feriado Form Modal */}
      {showFeriadoForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{editingFeriadoId ? 'Editar Feriado' : 'Nuevo Feriado'}</h3>
              <button onClick={() => setShowFeriadoForm(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha <span className="text-red-500">*</span></label>
                <input type="date" name="fecha" value={feriadoForm.fecha} onChange={handleFeriadoChange}
                  className={cn('w-full border rounded-lg px-3 py-2', !feriadoForm.fecha ? 'border-red-300' : '')} />
                {!feriadoForm.fecha && <p className="text-xs text-red-500 mt-1">La fecha es obligatoria</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del feriado <span className="text-red-500">*</span></label>
                <input type="text" name="nombre" value={feriadoForm.nombre} onChange={handleFeriadoChange} placeholder="Ej: Año Nuevo"
                  className={cn('w-full border rounded-lg px-3 py-2', !feriadoForm.nombre ? 'border-red-300' : '')} />
                {!feriadoForm.nombre && <p className="text-xs text-red-500 mt-1">El nombre es obligatorio</p>}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowFeriadoForm(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button>
              <button onClick={handleSaveFeriado} disabled={saving || !feriadoForm.fecha || !feriadoForm.nombre} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                {saving ? 'Guardando...' : editingFeriadoId ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
