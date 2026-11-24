'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { especialistasApi, citasApi } from '@/lib/api-client';
import { getUser } from '@/lib/auth';
import { cn, getEstadoEspecialistaColor, formatDate } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';
import { Stethoscope, X, Check, ChevronDown, ChevronUp, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ESTADO_OPTS = ['HABILITADO', 'DESHABILITADO', 'SUSPENDIDO_TEMPORAL'];

const estadoLabel: Record<string, string> = {
  HABILITADO: 'Habilitado',
  DESHABILITADO: 'Deshabilitado',
  SUSPENDIDO_TEMPORAL: 'Suspendido Temporal',
};

export default function BloquesEspecialidadPage() {
  const [especialidades, setEspecialidades] = useState<string[]>([]);
  const [selectedEspecialidad, setSelectedEspecialidad] = useState<string | null>(null);
  const [especialistas, setEspecialistas] = useState<any[]>([]);
  const [loadingEspecialidades, setLoadingEspecialidades] = useState(true);
  const [loadingEspecialistas, setLoadingEspecialistas] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkFechaInicio, setBulkFechaInicio] = useState('');
  const [bulkFechaFin, setBulkFechaFin] = useState('');
  const [bulkIndefinido, setBulkIndefinido] = useState(false);

  const [showIndividualModal, setShowIndividualModal] = useState(false);
  const [individualTarget, setIndividualTarget] = useState<any>(null);
  const [individualEstado, setIndividualEstado] = useState('HABILITADO');
  const [individualFechaInicio, setIndividualFechaInicio] = useState('');
  const [individualFechaFin, setIndividualFechaFin] = useState('');
  const [individualIndefinido, setIndividualIndefinido] = useState(false);

  const user = getUser();
  const isPrincipal = user?.rol === 'ADMISION_PRINCIPAL';

  useEffect(() => {
    especialistasApi.getEspecialidades()
      .then(setEspecialidades)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoadingEspecialidades(false));
  }, []);

  useEffect(() => {
    if (!selectedEspecialidad) {
      setEspecialistas([]);
      return;
    }
    setLoadingEspecialistas(true);
    setSelectedIds(new Set());
    setSelectAll(false);
    especialistasApi.getAll({ especialidad: selectedEspecialidad })
      .then(setEspecialistas)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoadingEspecialistas(false));
  }, [selectedEspecialidad]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds(new Set());
      setSelectAll(false);
    } else {
      setSelectedIds(new Set(especialistas.map((e) => e.id)));
      setSelectAll(true);
    }
  };

  const openBulkModal = () => {
    if (selectedIds.size === 0) {
      toast.error('Seleccione al menos un especialista');
      return;
    }
    setBulkFechaInicio('');
    setBulkFechaFin('');
    setBulkIndefinido(false);
    setShowBulkModal(true);
  };

  const handleBulkSuspend = async () => {
    if (!bulkFechaInicio) {
      toast.error('Debe ingresar fecha inicio');
      return;
    }
    if (!bulkIndefinido && !bulkFechaFin) {
      toast.error('Debe ingresar fecha fin o marcar Indefinido');
      return;
    }
    if (!bulkIndefinido && bulkFechaFin <= bulkFechaInicio) {
      toast.error('Fecha fin debe ser posterior a fecha inicio');
      return;
    }
    const fin = bulkIndefinido ? bulkFechaInicio : bulkFechaFin;
    try {
      const citas = await citasApi.getAll({
        estado: 'PENDIENTE,CONFIRMADA',
        fechaInicio: bulkFechaInicio,
        fechaFin: fin,
      });
      const especialistasSeleccionados = new Set(selectedIds);
      const citasAfectadas = citas.filter(c => especialistasSeleccionados.has(c.especialistaId));
      if (citasAfectadas.length > 0 && !window.confirm(`Hay ${citasAfectadas.length} cita(s) pendiente(s) en el rango seleccionado. ¿Forzar suspensión de todas formas?`)) {
        return;
      }
    } catch { /* continuar si falla la verificación */ }
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          especialistasApi.updateEstado(id, {
            estado: 'SUSPENDIDO_TEMPORAL',
            fechaInicioSuspension: bulkFechaInicio,
            fechaFinSuspension: bulkIndefinido ? undefined : bulkFechaFin,
          })
        )
      );
      toast.success(`${selectedIds.size} especialista(s) suspendido(s) temporalmente`);
      setShowBulkModal(false);
      setSelectedIds(new Set());
      setSelectAll(false);
      const data = await especialistasApi.getAll({ especialidad: selectedEspecialidad! });
      setEspecialistas(data);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const openIndividual = (esp: any) => {
    setIndividualTarget(esp);
    const data = esp.especialista || esp;
    setIndividualEstado(data.estado || 'HABILITADO');
    setIndividualFechaInicio(data.fechaInicioSuspension ? data.fechaInicioSuspension.split('T')[0] : '');
    setIndividualFechaFin(data.fechaFinSuspension ? data.fechaFinSuspension.split('T')[0] : '');
    setIndividualIndefinido(!data.fechaFinSuspension);
    setShowIndividualModal(true);
  };

  const handleIndividualSave = async () => {
    if (!individualTarget) return;
    const data: any = { estado: individualEstado };
    if (individualEstado === 'SUSPENDIDO_TEMPORAL') {
      if (!individualFechaInicio) {
        toast.error('Debe ingresar fecha inicio para suspensión temporal');
        return;
      }
      if (!individualIndefinido && !individualFechaFin) {
        toast.error('Debe ingresar fecha fin o marcar Indefinido');
        return;
      }
      if (!individualIndefinido && individualFechaFin <= individualFechaInicio) {
        toast.error('Fecha fin debe ser posterior a fecha inicio');
        return;
      }
      data.fechaInicioSuspension = individualFechaInicio;
      data.fechaFinSuspension = individualIndefinido ? undefined : individualFechaFin;
    }
    try {
      await especialistasApi.updateEstado(individualTarget.id, data);
      toast.success('Estado actualizado');
      setShowIndividualModal(false);
      const result = await especialistasApi.getAll({ especialidad: selectedEspecialidad! });
      setEspecialistas(result);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (loadingEspecialidades) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <PageHeader title="Bloques por especialidad" description="Gestión de suspensiones por especialidad" />

      {/* Especialidades grid */}
      <div>
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Especialidades</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {especialidades.map((esp) => (
            <button
              key={esp}
              onClick={() => setSelectedEspecialidad(esp === selectedEspecialidad ? null : esp)}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left',
                selectedEspecialidad === esp
                  ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:shadow-sm'
              )}
            >
              <Stethoscope size={20} className={cn(selectedEspecialidad === esp ? 'text-primary-600' : 'text-gray-400')} />
              <span className="truncate">{esp}</span>
              {selectedEspecialidad === esp && <Check size={16} className="ml-auto text-primary-600 shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      {/* Especialistas */}
      {selectedEspecialidad && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Especialistas en <span className="text-primary-600">{selectedEspecialidad}</span>
              <span className="ml-2 text-sm font-normal text-gray-500">({especialistas.length})</span>
            </h2>
            <div className="flex items-center gap-2">
              {selectedIds.size > 0 && (
                <button
                  onClick={openBulkModal}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                >
                  Suspender seleccionados ({selectedIds.size})
                </button>
              )}
            </div>
          </div>

          {loadingEspecialistas ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : especialistas.length === 0 ? (
            <p className="text-gray-500 text-center py-12">No se encontraron especialistas en esta especialidad</p>
          ) : (
            <div className="bg-white rounded-xl border border-neutral-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b bg-gray-50">
                      <th className="p-4 w-10">
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={toggleSelectAll}
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th className="p-4 font-medium">Nombre</th>
                      <th className="p-4 font-medium">Identificación</th>
                      <th className="p-4 font-medium">Estado</th>
                      <th className="p-4 font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {especialistas.map((e) => (
                      <tr key={e.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(e.id)}
                            onChange={() => toggleSelect(e.id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="p-4 font-medium text-gray-900">
                          <div className="flex items-center gap-3">
                            {e.fotoUrl ? (
                              <Image src={e.fotoUrl} alt="" width={32} height={32} className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                                <User className="w-4 h-4 text-primary-600" />
                              </div>
                            )}
                            <span>{e.especialista?.nombres || e.nombres} {e.especialista?.apellidos || e.apellidos}</span>
                          </div>
                        </td>
                        <td className="p-4 text-gray-600">{e.especialista?.numeroIdentificacion || e.numeroIdentificacion || '-'}</td>
                        <td className="p-4">
                          <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getEstadoEspecialistaColor(e.especialista?.estado || e.estado))}>
                            {estadoLabel[e.especialista?.estado || e.estado] || e.especialista?.estado || e.estado}
                          </span>
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => openIndividual(e)}
                            className="px-3 py-1.5 text-xs font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                          >
                            Cambiar estado
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bulk Suspend Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Suspensión grupal</h3>
              <button onClick={() => setShowBulkModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {selectedIds.size} especialista(s) seleccionado(s) serán suspendidos temporalmente.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
                <input
                  type="date"
                  value={bulkFechaInicio}
                  onChange={(e) => setBulkFechaInicio(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
                <input
                  type="date"
                  value={bulkIndefinido ? '' : bulkFechaFin}
                  onChange={(e) => setBulkFechaFin(e.target.value)}
                  disabled={bulkIndefinido}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-400"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" checked={bulkIndefinido} onChange={(e) => { setBulkIndefinido(e.target.checked); if (e.target.checked) setBulkFechaFin(''); }} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                Indefinido (sin fecha de fin)
              </label>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowBulkModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                Cancelar
              </button>
              <button onClick={handleBulkSuspend} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm">
                Suspender temporalmente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Individual Estado Modal */}
      {showIndividualModal && individualTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Cambiar estado</h3>
              <button onClick={() => setShowIndividualModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {individualTarget.especialista?.nombres || individualTarget.nombres} {individualTarget.especialista?.apellidos || individualTarget.apellidos}
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  value={individualEstado}
                  onChange={(e) => setIndividualEstado(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  {ESTADO_OPTS.map((o) => (
                    <option key={o} value={o}>{estadoLabel[o]}</option>
                  ))}
                </select>
              </div>
              {individualEstado === 'SUSPENDIDO_TEMPORAL' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
                    <input
                      type="date"
                      value={individualFechaInicio}
                      onChange={(e) => setIndividualFechaInicio(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
                    <input
                      type="date"
                      value={individualIndefinido ? '' : individualFechaFin}
                      onChange={(e) => setIndividualFechaFin(e.target.value)}
                      disabled={individualIndefinido}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-400"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={individualIndefinido} onChange={(e) => { setIndividualIndefinido(e.target.checked); if (e.target.checked) setIndividualFechaFin(''); }} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                    Indefinido (sin fecha de fin)
                  </label>
                </>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowIndividualModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                Cancelar
              </button>
              <Button onClick={handleIndividualSave}>Guardar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
