'use client';

import { useEffect, useState, useMemo } from 'react';
import { especialistasApi, ApiError } from '@/lib/api-client';
import { getUser } from '@/lib/auth';
import { cn, formatDate } from '@/lib/utils';
import type { BloqueoGrupal } from '@/types/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';
import { Plus, Search, Calendar, X, Users, Clock, CheckCircle2, AlertTriangle, Edit3, Trash2, Stethoscope } from 'lucide-react';

interface FormData {
  nombre: string;
  descripcion: string;
  fechaInicio: string;
  fechaFin: string;
  especialistaIds: string[];
}

const emptyForm: FormData = {
  nombre: '',
  descripcion: '',
  fechaInicio: '',
  fechaFin: '',
  especialistaIds: [],
};

export default function BloquesGrupalesPage() {
  const [bloqueos, setBloqueos] = useState<BloqueoGrupal[]>([]);
  const [especialistas, setEspecialistas] = useState<any[]>([]);
  const [especialidades, setEspecialidades] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingBloqueo, setEditingBloqueo] = useState<BloqueoGrupal | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<BloqueoGrupal | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [especialistaSearch, setEspecialistaSearch] = useState('');
  const [especialidadFilter, setEspecialidadFilter] = useState('');
  const [especialistaDropdownOpen, setEspecialistaDropdownOpen] = useState(false);
  const [citasPendientes, setCitasPendientes] = useState<any[] | null>(null);
  const [indefinido, setIndefinido] = useState(false);

  useEffect(() => {
    Promise.all([
      especialistasApi.getAll({ activo: true }),
      especialistasApi.getAllBloqueos(),
      especialistasApi.getEspecialidades(),
    ])
      .then(([esp, bloqueos, espcs]) => {
        setEspecialistas(esp);
        setBloqueos(bloqueos);
        setEspecialidades(espcs);
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleEspecialista = (id: string) => {
    setForm((prev) => ({
      ...prev,
      especialistaIds: prev.especialistaIds.includes(id)
        ? prev.especialistaIds.filter((eid) => eid !== id)
        : [...prev.especialistaIds, id],
    }));
  };

  const selectByEspecialidad = (especialidad: string) => {
    if (!especialidad) return;
    const ids = especialistas
      .filter((e) => {
        const esp = getEsp(e);
        return esp.especialidad === especialidad;
      })
      .map((e) => e.id);
    setForm((prev) => ({
      ...prev,
      especialistaIds: Array.from(new Set([...prev.especialistaIds, ...ids])),
    }));
    toast.success(`${ids.length} especialista(s) de ${especialidad} seleccionado(s)`);
  };

  const clearEspecialistas = () => {
    setForm((prev) => ({ ...prev, especialistaIds: [] }));
  };

  const getEsp = (e: any) => e.especialista || e;
  const getEspId = (e: any) => e.especialista?.id || e.id;

  const filteredEspecialistas = useMemo(
    () => especialistas.filter((e) => {
      const esp = getEsp(e);
      const nombre = `${esp.nombres || ''} ${esp.apellidos || ''}`.toLowerCase();
      const matchNombre = nombre.includes(especialistaSearch.toLowerCase());
      const matchEspecialidad = !especialidadFilter || esp.especialidad === especialidadFilter;
      return matchNombre && matchEspecialidad;
    }),
    [especialistas, especialistaSearch, especialidadFilter],
  );

  const selectedEspecialistas = useMemo(
    () => especialistas.filter((e) => form.especialistaIds.includes(e.id)),
    [especialistas, form.especialistaIds],
  );

  const handleSubmit = async (forzar = false) => {
    if (!form.nombre.trim()) { toast.error('El nombre es obligatorio'); return; }
    if (!form.fechaInicio) { toast.error('La fecha de inicio es obligatoria'); return; }
    if (form.especialistaIds.length === 0) { toast.error('Debe seleccionar al menos un especialista'); return; }

    setSaving(true);
    try {
      const body = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || undefined,
        fechaInicio: form.fechaInicio,
        fechaFin: indefinido ? undefined : form.fechaFin || undefined,
        especialistaIds: form.especialistaIds.map((uid) => {
          const found = especialistas.find((e) => e.id === uid);
          return getEspId(found);
        }),
        forzar,
      };

      if (editingBloqueo) {
        await especialistasApi.updateBloqueoGrupal(editingBloqueo.id, body);
        const updated = await especialistasApi.getAllBloqueos();
        setBloqueos(updated);
        setEditingBloqueo(null);
        toast.success('Bloqueo grupal actualizado exitosamente');
      } else {
        const nuevo = await especialistasApi.createBloqueoGrupal(body);
        const enriched: BloqueoGrupal = {
          ...nuevo,
          especialistas: selectedEspecialistas.map((e) => {
            const esp = getEsp(e);
            return { id: e.id, nombres: esp.nombres || '', apellidos: esp.apellidos || '' };
          }),
        };
        setBloqueos((prev) => [enriched, ...prev]);
        toast.success('Bloqueo grupal creado exitosamente');
      }

      setForm(emptyForm);
      setShowForm(false);
      setEspecialistaSearch('');
      setCitasPendientes(null);
      setIndefinido(false);
    } catch (e: any) {
      if (e instanceof ApiError && e.data?.codigo === 'CITAS_PENDIENTES' && Array.isArray(e.data?.citas)) {
        setCitasPendientes(e.data.citas);
        return;
      }
      toast.error(e instanceof ApiError ? e.data?.message || e.message : e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!showDeleteConfirm) return;
    try {
      await especialistasApi.deleteBloqueoGrupal(showDeleteConfirm.id);
      setBloqueos((prev) => prev.filter((b) => b.id !== showDeleteConfirm.id));
      setShowDeleteConfirm(null);
      toast.success('Bloqueo eliminado correctamente');
    } catch (e: any) {
      toast.error(e instanceof ApiError ? e.data?.message || e.message : e.message);
    }
  };

  const openNewForm = () => {
    setEditingBloqueo(null);
    setForm(emptyForm);
    setEspecialistaSearch('');
    setIndefinido(false);
    setShowForm(true);
  };

  const openEditForm = (b: BloqueoGrupal) => {
    setEditingBloqueo(b);
    setForm({
      nombre: b.nombre,
      descripcion: b.descripcion || '',
      fechaInicio: b.fechaInicio ? b.fechaInicio.split('T')[0] : '',
      fechaFin: b.fechaFin ? b.fechaFin.split('T')[0] : '',
      especialistaIds: especialistas.filter((e) => b.especialistas?.some((be: any) => getEspId(be) === getEspId(e))).map((e) => e.id),
    });
    setIndefinido(!b.fechaFin);
    setEspecialistaSearch('');
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <PageHeader title="Bloques grupales" description="Gestión de bloqueos grupales de especialistas" actions={
          <Button onClick={openNewForm} icon={<Plus size={18} />}>Nuevo bloqueo</Button>
        } />
      </div>

      {/* Lista de bloqueos */}
      <div className="space-y-4">
        {bloqueos.length === 0 && (
          <div className="bg-white rounded-xl border border-neutral-100 p-12 text-center">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No hay bloqueos grupales</h3>
            <p className="text-gray-500">Cree un bloqueo grupal para restringir la disponibilidad de varios especialistas</p>
          </div>
        )}
        {bloqueos.map((b) => (
          <div key={b.id} className="bg-white rounded-xl border border-neutral-100 p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900 text-lg">{b.nombre}</h3>
                {b.descripcion && <p className="text-gray-600 text-sm">{b.descripcion}</p>}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><Calendar size={14} /> Inicio: {formatDate(b.fechaInicio)}</span>
                  {b.fechaFin ? <span className="flex items-center gap-1"><Calendar size={14} /> Fin: {formatDate(b.fechaFin)}</span> : <span className="flex items-center gap-1 text-purple-600 font-medium">Indefinido</span>}
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  <Users size={14} className="text-gray-400" />
                  {b.especialistas?.map((e) => {
                    const esp = getEsp(e);
                    const espId = getEspId(e);
                    return (
                      <span key={espId} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                        {esp.nombres} {esp.apellidos}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-medium">
                  <CheckCircle2 size={12} /> Activo
                </span>
                <button onClick={() => openEditForm(b)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors" title="Editar">
                  <Edit3 size={16} />
                </button>
                <button onClick={() => setShowDeleteConfirm(b)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors" title="Eliminar">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Formulario modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold text-gray-900">{editingBloqueo ? 'Editar bloqueo grupal' : 'Nuevo bloqueo grupal'}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre <span className="text-red-500">*</span></label>
                <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Ej: Capacitación mensual" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea name="descripcion" value={form.descripcion} onChange={handleChange} rows={3} placeholder="Motivo del bloqueo (opcional)" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio <span className="text-red-500">*</span></label>
                  <input type="date" name="fechaInicio" value={form.fechaInicio} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
                  <input type="date" name="fechaFin" value={indefinido ? '' : form.fechaFin} onChange={handleChange} disabled={indefinido} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:text-gray-400" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" checked={indefinido} onChange={(e) => { setIndefinido(e.target.checked); if (e.target.checked) setForm((prev) => ({ ...prev, fechaFin: '' })); }} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                Indefinido (sin fecha de fin)
              </label>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Selección por especialidad</label>
                <div className="flex gap-2 mb-2">
                  <select
                    value={especialidadFilter}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEspecialidadFilter(val);
                      if (val) selectByEspecialidad(val);
                    }}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  >
                    <option value="">Todas las especialidades</option>
                    {especialidades.map((esp) => <option key={esp} value={esp}>{esp}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={clearEspecialistas}
                    className="px-3 py-2 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    Limpiar
                  </button>
                </div>
                <p className="text-xs text-gray-500 mb-2">Seleccione una especialidad para agregar todos sus especialistas, o elija individualmente.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Especialistas <span className="text-red-500">*</span></label>
                {selectedEspecialistas.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {selectedEspecialistas.map((e) => {
                      const esp = getEsp(e);
                      return (
                        <span key={e.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-50 text-primary-700 rounded-full text-xs font-medium">
                          {esp.nombres} {esp.apellidos}
                          <button type="button" onClick={() => toggleEspecialista(e.id)} className="hover:text-primary-900"><X size={12} /></button>
                        </span>
                      );
                    })}
                  </div>
                )}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                  <input type="text" placeholder="Buscar especialista..." value={especialistaSearch}
                    onChange={(e) => { setEspecialistaSearch(e.target.value); setEspecialistaDropdownOpen(true); }}
                    onFocus={() => setEspecialistaDropdownOpen(true)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
                  {especialistaDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setEspecialistaDropdownOpen(false)} />
                      <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {filteredEspecialistas.length === 0 ? (
                          <div className="p-3 text-sm text-gray-400 text-center">Sin resultados</div>
                        ) : (
                          filteredEspecialistas.map((e) => {
                            const checked = form.especialistaIds.includes(e.id);
                            const esp = getEsp(e);
                            return (
                              <label key={e.id} className={cn('flex items-center gap-2 px-3 py-2 text-sm cursor-pointer transition-colors', checked ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-50')}>
                                <input type="checkbox" checked={checked} onChange={() => toggleEspecialista(e.id)} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                                {esp.nombres} {esp.apellidos}
                                <span className="ml-auto text-xs text-gray-400">{esp.especialidad}</span>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-6 border-t">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors">Cancelar</button>
              <Button onClick={() => handleSubmit(false)} disabled={saving}>{saving ? 'Guardando...' : editingBloqueo ? 'Actualizar bloqueo' : 'Crear bloqueo'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de citas pendientes */}
      {citasPendientes && (
        <div className="fixed inset-0 bg-black/50 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center gap-3 bg-amber-50">
              <AlertTriangle size={24} className="text-amber-500 shrink-0" />
              <div>
                <h2 className="text-lg font-bold text-gray-900">Citas pendientes encontradas</h2>
                <p className="text-sm text-amber-700">Hay {citasPendientes.length} cita(s) pendiente(s) en el rango de fechas. Debe reagendarlas antes de bloquear.</p>
              </div>
            </div>
            <div className="p-6 space-y-3">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-2 font-medium">Paciente</th>
                    <th className="pb-2 font-medium">Especialista</th>
                    <th className="pb-2 font-medium">Fecha</th>
                    <th className="pb-2 font-medium">Hora</th>
                  </tr>
                </thead>
                <tbody>
                  {citasPendientes.map((c: any, i: number) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2">{c.paciente?.nombres} {c.paciente?.apellidos}</td>
                      <td className="py-2">{c.especialista?.nombres} {c.especialista?.apellidos}</td>
                      <td className="py-2">{formatDate(c.fecha)}</td>
                      <td className="py-2">{c.horaInicio}–{c.horaFin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-end gap-2 p-6 border-t">
              <button onClick={() => setCitasPendientes(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors">Cancelar</button>
              <button onClick={() => { setCitasPendientes(null); handleSubmit(true); }} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors">
                Bloquear de todas formas
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="p-6 border-b flex items-center gap-3 bg-red-50">
              <AlertTriangle size={24} className="text-red-500 shrink-0" />
              <div>
                <h2 className="text-lg font-bold text-gray-900">Eliminar bloqueo</h2>
                <p className="text-sm text-red-700">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-700 text-sm">
                ¿Está seguro de eliminar el bloqueo <strong>{showDeleteConfirm.nombre}</strong>?
                {showDeleteConfirm.especialistas?.length > 0 && (
                  <span className="block mt-2 text-gray-500">
                    Afecta a {showDeleteConfirm.especialistas.length} especialista(s).
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 p-6 border-t">
              <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors">Cancelar</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
