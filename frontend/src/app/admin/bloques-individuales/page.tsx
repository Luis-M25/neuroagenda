'use client';

import { useEffect, useState, useMemo } from 'react';
import { especialistasApi, citasApi, ApiError } from '@/lib/api-client';
import { getUser } from '@/lib/auth';
import { cn, getEstadoEspecialistaColor, formatDate } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';
import { Search, ToggleLeft, ToggleRight, X, Clock, Ban, CheckCircle, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const TODAY = format(new Date(), 'yyyy-MM-dd');

export default function BloquesIndividualesPage() {
  const [especialistas, setEspecialistas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showActivos, setShowActivos] = useState(true);
  const user = getUser();

  const [suspendModal, setSuspendModal] = useState(false);
  const [suspendTarget, setSuspendTarget] = useState<any>(null);
  const [suspendMotivo, setSuspendMotivo] = useState('');
  const [suspendFechaInicio, setSuspendFechaInicio] = useState(TODAY);
  const [suspendFechaFin, setSuspendFechaFin] = useState('');
  const [suspendIndefinido, setSuspendIndefinido] = useState(false);
  const [suspending, setSuspending] = useState(false);
  const [suspendCitasPendientes, setSuspendCitasPendientes] = useState<any[] | null>(null);

  const [reactivateTarget, setReactivateTarget] = useState<any>(null);
  const [reactivating, setReactivating] = useState(false);

  useEffect(() => {
    especialistasApi.getAll({ activo: true })
      .then(setEspecialistas)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  const loadAll = (todos: boolean) => {
    setLoading(true);
    const params = todos ? undefined : { activo: true };
    especialistasApi.getAll(params)
      .then(setEspecialistas)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  };

  const toggleActivos = () => {
    const next = !showActivos;
    setShowActivos(next);
    loadAll(!next);
  };

  const filtered = useMemo(
    () => especialistas.filter((e) => {
      const esp = e.especialista || e;
      const nombre = `${esp.nombres || ''} ${esp.apellidos || ''}`.toLowerCase();
      const id = (esp.numeroIdentificacion || '').toLowerCase();
      const q = search.toLowerCase();
      return nombre.includes(q) || id.includes(q);
    }),
    [especialistas, search],
  );

  const openSuspend = (e: any) => {
    setSuspendTarget(e);
    setSuspendMotivo('');
    setSuspendFechaInicio(TODAY);
    setSuspendFechaFin('');
    setSuspendIndefinido(false);
    setSuspendModal(true);
  };

  const handleSuspend = async (forzar = false) => {
    if (!suspendFechaInicio) {
      toast.error('La fecha de inicio es obligatoria');
      return;
    }
    if (!suspendTarget) return;

    if (!forzar) {
      setSuspending(true);
      try {
        const params: Record<string, string> = {
          especialistaId: suspendTarget.id,
          fechaInicio: suspendFechaInicio,
          fechaFin: suspendIndefinido ? '' : (suspendFechaFin || suspendFechaInicio),
          estado: 'PENDIENTE,CONFIRMADA',
        };
        const citas = await citasApi.getAll(params);
        if (citas.length > 0) {
          setSuspendCitasPendientes(citas);
          setSuspending(false);
          return;
        }
      } catch { /* continue without check */ }
    }

    setSuspending(true);
    try {
      await especialistasApi.updateEstado(suspendTarget.id, {
        estado: 'SUSPENDIDO_TEMPORAL',
        fechaInicioSuspension: suspendFechaInicio,
        fechaFinSuspension: suspendIndefinido ? undefined : (suspendFechaFin || undefined),
        motivo: suspendMotivo.trim() || undefined,
      });
      toast.success('Especialista suspendido temporalmente');
      setSuspendModal(false);
      setSuspendTarget(null);
      setSuspendCitasPendientes(null);
      loadAll(!showActivos);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSuspending(false);
    }
  };

  const openReactivate = (e: any) => {
    setReactivateTarget(e);
  };

  const confirmReactivate = async () => {
    if (!reactivateTarget) return;
    setReactivating(true);
    try {
      await especialistasApi.updateEstado(reactivateTarget.id, { estado: 'HABILITADO' });
      toast.success('Especialista reactivado');
      setReactivateTarget(null);
      loadAll(!showActivos);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setReactivating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  const estadoLabel: Record<string, string> = {
    HABILITADO: 'Habilitado',
    DESHABILITADO: 'Deshabilitado',
    SUSPENDIDO_TEMPORAL: 'Suspendido',
  };

  const getNombre = (e: any) => {
    const esp = e.especialista || e;
    return `${esp.nombres || ''} ${esp.apellidos || ''}`.trim();
  };

  const getEspecialidad = (e: any) => (e.especialista || e).especialidad || '-';
  const getSede = (e: any) => (e.especialista || e).sede || '-';
  const getConsultorio = (e: any) => (e.especialista || e).consultorio || '-';
  const getEstado = (e: any) => (e.especialista || e).estado || 'HABILITADO';
  const getIdentificacion = (e: any) => (e.especialista || e).numeroIdentificacion || '-';

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <PageHeader title="Bloques individuales" description="Suspender o reactivar especialistas de forma individual" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre o identificación..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>
        <button
          onClick={toggleActivos}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
            showActivos
              ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
              : 'bg-gray-50 text-gray-600 border-gray-300 hover:bg-gray-100',
          )}
        >
          {showActivos ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
          {showActivos ? 'Solo activos' : 'Todos'}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-neutral-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b bg-gray-50">
                <th className="p-4 font-medium">Nombre</th>
                <th className="p-4 font-medium">Identificación</th>
                <th className="p-4 font-medium">Especialidad</th>
                <th className="p-4 font-medium">Consultorio</th>
                <th className="p-4 font-medium">Sede</th>
                <th className="p-4 font-medium">Estado</th>
                <th className="p-4 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => {
                const estado = getEstado(e);
                const isHabilitado = estado === 'HABILITADO';
                return (
                  <tr key={e.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900">{getNombre(e)}</td>
                    <td className="p-4 text-gray-600">{getIdentificacion(e)}</td>
                    <td className="p-4 text-gray-600">{getEspecialidad(e)}</td>
                    <td className="p-4 text-gray-600">{getConsultorio(e)}</td>
                    <td className="p-4 text-gray-600">{getSede(e)}</td>
                    <td className="p-4">
                      <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', getEstadoEspecialistaColor(estado))}>
                        {estadoLabel[estado] || estado}
                      </span>
                    </td>
                    <td className="p-4">
                      {isHabilitado ? (
                        <button
                          onClick={() => openSuspend(e)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                        >
                          <Ban size={14} /> Suspender
                        </button>
                      ) : (
                        <button
                          onClick={() => openReactivate(e)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                        >
                          <CheckCircle size={14} /> Reactivar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-500">
                    <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p>No se encontraron especialistas</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Suspend modal */}
      {suspendModal && suspendTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Suspender especialista</h3>
              <button onClick={() => setSuspendModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              <span className="font-medium text-gray-900">{getNombre(suspendTarget)}</span> será suspendido temporalmente.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                <textarea
                  value={suspendMotivo}
                  onChange={(e) => setSuspendMotivo(e.target.value)}
                  rows={3}
                  placeholder="Motivo de la suspensión (opcional)"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha inicio <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={suspendFechaInicio}
                  onChange={(e) => setSuspendFechaInicio(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
                <input
                  type="date"
                  value={suspendIndefinido ? '' : suspendFechaFin}
                  onChange={(e) => setSuspendFechaFin(e.target.value)}
                  disabled={suspendIndefinido}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:text-gray-400"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" checked={suspendIndefinido} onChange={(e) => { setSuspendIndefinido(e.target.checked); if (e.target.checked) setSuspendFechaFin(''); }} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                Indefinido (sin fecha de fin)
              </label>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setSuspendModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleSuspend(false)}
                disabled={suspending}
                className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 disabled:opacity-50 transition-colors"
              >
                {suspending ? 'Suspendiendo...' : <><Ban size={16} /> Suspender</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reactivate confirm */}
      {reactivateTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Reactivar especialista</h3>
                <p className="text-sm text-gray-500">
                  ¿Está seguro de reactivar a <span className="font-medium text-gray-700">{getNombre(reactivateTarget)}</span>?
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setReactivateTarget(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmReactivate}
                disabled={reactivating}
                className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {reactivating ? 'Reactivando...' : <><CheckCircle size={16} /> Reactivar</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Citas pendientes warning individual */}
      {suspendCitasPendientes && suspendCitasPendientes.length > 0 && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[70vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center gap-3 bg-amber-50">
              <AlertTriangle size={24} className="text-amber-500 shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-gray-900">Citas pendientes</h3>
                <p className="text-sm text-amber-700">El especialista tiene {suspendCitasPendientes.length} cita(s) pendientes en el rango de fechas.</p>
              </div>
            </div>
            <div className="p-6 space-y-3">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-2 font-medium">Paciente</th>
                    <th className="pb-2 font-medium">Fecha</th>
                    <th className="pb-2 font-medium">Hora</th>
                  </tr>
                </thead>
                <tbody>
                  {suspendCitasPendientes.map((c: any, i: number) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2">{c.paciente?.nombres} {c.paciente?.apellidos}</td>
                      <td className="py-2">{formatDate(c.fecha)}</td>
                      <td className="py-2">{c.horaInicio}–{c.horaFin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-end gap-2 p-6 border-t">
              <button onClick={() => setSuspendCitasPendientes(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
              <button onClick={() => { setSuspendCitasPendientes(null); handleSuspend(true); }} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
                Suspender de todas formas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
