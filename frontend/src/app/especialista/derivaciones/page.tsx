'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { hceApi, pacientesApi } from '@/lib/api-client';
import type { DerivacionHCE } from '@/lib/api/hce.api';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { DerivacionModal } from '@/components/hce/AltaDerivacionModals';
import { toast } from 'sonner';
import { getUser } from '@/lib/auth';
import {
  ArrowDownLeft, ArrowUpRight, CheckCircle2, Clock, Loader2, Plus, Search,
  Share2, Stethoscope, User, X,
} from 'lucide-react';

function fmtFecha(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
}

function prioridadBadge(prioridad: string) {
  if (prioridad === 'ALTA') return 'bg-red-100 text-red-700 border-red-200';
  if (prioridad === 'MEDIA') return 'bg-amber-100 text-amber-700 border-amber-200';
  return 'bg-neutral-100 text-neutral-600 border-neutral-200';
}

export default function EspecialistaDerivacionesPage() {
  const user = getUser();
  const miEspecialistaId = user?.especialista?.id as string | undefined;

  const [derivaciones, setDerivaciones] = useState<DerivacionHCE[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTipo, setFilterTipo] = useState<'TODAS' | 'ENVIADAS' | 'RECIBIDAS'>('TODAS');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterPrioridad, setFilterPrioridad] = useState('');
  const [search, setSearch] = useState('');

  const [showNueva, setShowNueva] = useState(false);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<any | null>(null);
  const [pacienteQuery, setPacienteQuery] = useState('');
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [buscandoPacientes, setBuscandoPacientes] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    hceApi.getDerivaciones({
      estado: filterEstado || undefined,
      prioridad: filterPrioridad || undefined,
    })
      .then((res) => setDerivaciones(Array.isArray(res) ? res : []))
      .catch((e: any) => toast.error(e.message || 'No se pudieron cargar las derivaciones'))
      .finally(() => setLoading(false));
  }, [filterEstado, filterPrioridad]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!showNueva) return;
    const q = pacienteQuery.trim();
    if (q.length < 2) {
      setPacientes([]);
      setBuscandoPacientes(false);
      return;
    }

    let active = true;
    setBuscandoPacientes(true);
    const timer = setTimeout(async () => {
      try {
        const [porNombre, porIdentificacion] = await Promise.all([
          pacientesApi.getAll({ nombre: q }).catch(() => []),
          /^\d+$/.test(q) ? pacientesApi.getAll({ identificacion: q }).catch(() => []) : Promise.resolve([]),
        ]);
        if (!active) return;
        const unicos = new Map<string, any>();
        [...porNombre, ...porIdentificacion].forEach((p: any) => unicos.set(p.id, p));
        setPacientes(Array.from(unicos.values()).slice(0, 20));
      } finally {
        if (active) setBuscandoPacientes(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [pacienteQuery, showNueva]);

  const filtradas = useMemo(() => {
    let list = derivaciones;

    if (filterTipo === 'ENVIADAS') {
      list = list.filter((d) => d.especialistaOrigenId === miEspecialistaId);
    } else if (filterTipo === 'RECIBIDAS') {
      list = list.filter((d) => d.destinos.some((dest) => dest.especialistaId === miEspecialistaId));
    }

    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((d) => {
      const paciente = `${d.paciente?.nombres || ''} ${d.paciente?.apellidos || ''} ${d.paciente?.numeroIdentificacion || ''}`.toLowerCase();
      const destino = d.destinos.map((x) => `${x.especialista?.nombres || ''} ${x.especialista?.apellidos || ''} ${x.especialidad}`).join(' ').toLowerCase();
      const origen = `${d.especialistaOrigen?.nombres || ''} ${d.especialistaOrigen?.apellidos || ''} ${d.especialistaOrigen?.especialidad || ''}`.toLowerCase();
      return paciente.includes(q) || destino.includes(q) || origen.includes(q) || d.motivo.toLowerCase().includes(q);
    });
  }, [derivaciones, filterTipo, search, miEspecialistaId]);

  const stats = useMemo(() => ({
    total: derivaciones.length,
    pendientes: derivaciones.filter((d) => d.estado === 'PENDIENTE').length,
    enProceso: derivaciones.filter((d) => d.estado === 'EN_PROCESO').length,
    programadas: derivaciones.filter((d) => d.estado === 'PROGRAMADA').length,
  }), [derivaciones]);

  const abrirNueva = () => {
    if (!miEspecialistaId) {
      toast.error('No se encontró el perfil de especialista');
      return;
    }
    setPacienteQuery('');
    setPacientes([]);
    setPacienteSeleccionado(null);
    setShowNueva(true);
  };

  const cerrarNueva = () => {
    setShowNueva(false);
    setPacienteQuery('');
    setPacientes([]);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Módulo de Derivaciones"
        description="Gestión y seguimiento de interconsultas y derivaciones de pacientes entre especialidades."
        actions={
          <Button icon={<Plus size={16} />} onClick={abrirNueva}>
            Nueva derivación
          </Button>
        }
      />

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-neutral-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Total Derivaciones</p>
              <p className="text-2xl font-bold text-neutral-900 mt-1">{stats.total}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
              <Share2 size={18} />
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-white border-neutral-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">Pendientes</p>
              <p className="text-2xl font-bold text-amber-700 mt-1">{stats.pendientes}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={18} />
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-white border-neutral-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">En Proceso</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">{stats.enProceso}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Stethoscope size={18} />
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-white border-neutral-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Programadas</p>
              <p className="text-2xl font-bold text-emerald-700 mt-1">{stats.programadas}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card padding="md" className="space-y-4">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex rounded-lg border overflow-hidden bg-neutral-100 p-0.5">
            <button
              onClick={() => setFilterTipo('TODAS')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filterTipo === 'TODAS' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600 hover:text-neutral-900'}`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilterTipo('ENVIADAS')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${filterTipo === 'ENVIADAS' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600 hover:text-neutral-900'}`}
            >
              <ArrowUpRight size={13} className="text-blue-500" /> Enviadas
            </button>
            <button
              onClick={() => setFilterTipo('RECIBIDAS')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${filterTipo === 'RECIBIDAS' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600 hover:text-neutral-900'}`}
            >
              <ArrowDownLeft size={13} className="text-emerald-500" /> Recibidas
            </button>
          </div>

          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-3 text-neutral-400" />
            <input
              type="text"
              placeholder="Buscar por paciente, cédula o motivo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            />
          </div>

          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="text-sm border rounded-lg px-3 py-2 bg-white"
          >
            <option value="">Todos los estados</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="EN_PROCESO">En Proceso</option>
            <option value="PROGRAMADA">Programada</option>
            <option value="ATENDIDA">Atendida</option>
            <option value="CANCELADA">Cancelada</option>
          </select>

          <select
            value={filterPrioridad}
            onChange={(e) => setFilterPrioridad(e.target.value)}
            className="text-sm border rounded-lg px-3 py-2 bg-white"
          >
            <option value="">Todas las prioridades</option>
            <option value="ALTA">Alta</option>
            <option value="MEDIA">Media</option>
            <option value="BAJA">Baja</option>
          </select>
        </div>
      </Card>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full" />
        </div>
      ) : filtradas.length === 0 ? (
        <EmptyState
          icon={<Share2 size={24} />}
          title="No hay derivaciones registradas"
          description="Las derivaciones emitidas o dirigidas a su especialidad aparecerán listadas aquí."
        />
      ) : (
        <div className="space-y-4">
          {filtradas.map((d) => (
            <Card key={d.id} padding="md" className="space-y-3 hover:border-neutral-300 transition-colors">
              <div className="flex flex-wrap items-start justify-between gap-2 border-b pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-neutral-900">
                      {d.paciente?.nombres} {d.paciente?.apellidos}
                    </span>
                    <span className="text-xs text-neutral-500 font-mono">
                      C.I: {d.paciente?.numeroIdentificacion || '—'}
                    </span>
                    <Badge variant="neutral" className={`text-xs border ${prioridadBadge(d.prioridad)}`}>
                      {d.prioridad}
                    </Badge>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Derivado por: <span className="font-medium text-neutral-700">{d.especialistaOrigen?.nombres} {d.especialistaOrigen?.apellidos}</span> ({d.especialistaOrigen?.especialidad}) — {fmtFecha(d.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    d.estado === 'PENDIENTE' ? 'bg-amber-100 text-amber-800' :
                    d.estado === 'EN_PROCESO' ? 'bg-blue-100 text-blue-800' :
                    d.estado === 'PROGRAMADA' ? 'bg-emerald-100 text-emerald-800' :
                    d.estado === 'ATENDIDA' ? 'bg-neutral-100 text-neutral-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {d.estado}
                  </span>
                </div>
              </div>

              <div className="text-sm bg-neutral-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Motivo / Resumen Clínico</p>
                <p className="text-neutral-800 whitespace-pre-wrap">{d.motivo}</p>
                {d.observacion && (
                  <p className="text-xs text-neutral-600 mt-2 border-t pt-2">{d.observacion}</p>
                )}
              </div>

              {/* Destinos */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Especialidades destino</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {d.destinos.map((dest) => (
                    <div
                      key={dest.id}
                      className="border rounded-lg p-3 bg-white flex flex-col justify-between gap-2 text-xs"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-neutral-900">{dest.especialidad}</span>
                          <span className="text-[11px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600">{dest.estado}</span>
                        </div>
                        <p className="text-neutral-600 mt-1">
                          {dest.especialista ? `${dest.especialista.nombres} ${dest.especialista.apellidos}` : 'Cualquier especialista'}
                        </p>
                        {dest.cita ? (
                          <p className="text-emerald-700 font-medium mt-1">
                            Cita: {fmtFecha(dest.cita.fecha)} a las {dest.cita.horaInicio} ({dest.cita.estado})
                          </p>
                        ) : dest.estado === 'PENDIENTE' && !dest.citaId ? (
                          <p className="text-amber-600 mt-1">Pendiente de programación por Admisión</p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Selector de paciente para nueva derivación */}
      {showNueva && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h2 className="text-lg font-bold text-neutral-900">Nueva derivación</h2>
                <p className="text-xs text-neutral-500">Seleccione el paciente que desea derivar.</p>
              </div>
              <button onClick={cerrarNueva} className="p-2 hover:bg-neutral-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-3 text-neutral-400" />
                <input
                  autoFocus
                  value={pacienteQuery}
                  onChange={(e) => setPacienteQuery(e.target.value)}
                  placeholder="Buscar por nombre, apellidos o cédula..."
                  className="w-full pl-9 pr-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {buscandoPacientes ? (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-neutral-400">
                  <Loader2 size={16} className="animate-spin" /> Buscando pacientes...
                </div>
              ) : pacienteQuery.trim().length < 2 ? (
                <p className="py-6 text-center text-sm text-neutral-400">Escriba al menos 2 caracteres para buscar.</p>
              ) : pacientes.length === 0 ? (
                <div className="py-6">
                  <EmptyState
                    icon={<User size={22} />}
                    title="Sin resultados"
                    description="No se encontraron pacientes con ese criterio."
                  />
                </div>
              ) : (
                <div className="divide-y border rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                  {pacientes.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setPacienteSeleccionado(p);
                        setShowNueva(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-neutral-50 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center text-xs font-bold shrink-0">
                        {p.nombres?.[0]}{p.apellidos?.[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-neutral-900 truncate">
                          {p.nombres} {p.apellidos}
                        </p>
                        <p className="text-xs text-neutral-500">{p.numeroIdentificacion || 'Sin identificación'}</p>
                      </div>
                      <Plus size={16} className="text-primary-600 shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {pacienteSeleccionado && (
        <DerivacionModal
          isOpen
          pacienteId={pacienteSeleccionado.id}
          consultaId={null}
          especialistaOrigenId={miEspecialistaId}
          onClose={() => setPacienteSeleccionado(null)}
          onCreated={load}
        />
      )}
    </div>
  );
}
