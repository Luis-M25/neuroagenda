'use client';

import { useEffect, useState } from 'react';
import { auditorApi } from '@/lib/api-client';
import { cn, formatDate } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';
import {
  FileText, Search, Filter, CheckCircle, AlertTriangle,
  X, Eye, ThumbsUp, MessageSquare, User, Stethoscope, Calendar,
  ChevronLeft, ChevronRight, BarChart3, History,
} from 'lucide-react';

export default function AuditorDashboard() {

  const [tab, setTab] = useState<'lista' | 'detalle'>('lista');
  const [loading, setLoading] = useState(true);
  const [consultaActual, setConsultaActual] = useState<any>(null);
  const [estadisticas, setEstadisticas] = useState<any>(null);

  // Filtros
  const [especialistas, setEspecialistas] = useState<any[]>([]);
  const [filterEsp, setFilterEsp] = useState('');
  const [filterPaciente, setFilterPaciente] = useState('');
  const [filterEspecialidad, setFilterEspecialidad] = useState('');
  const [filterEstadoRev, setFilterEstadoRev] = useState('');
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<any[]>([]);
  const limite = 20;

  // Modal de revisión
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionEstado, setRevisionEstado] = useState<'REVISADO' | 'REVISADO_CON_OBSERVACIONES'>('REVISADO');
  const [revisionObs, setRevisionObs] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
    loadEstadisticas();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        pagina: String(pagina),
        limite: String(limite),
      };
      if (filterEsp) params.especialistaId = filterEsp;
      if (filterEspecialidad) params.especialidad = filterEspecialidad;
      if (filterEstadoRev) params.estadoRevision = filterEstadoRev;

      const [hcData, espData] = await Promise.all([
        auditorApi.listarHc(params),
        auditorApi.listarEspecialistas(),
      ]);
      setItems(hcData.items || []);
      setTotal(hcData.total || 0);
      setEspecialistas(espData || []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'lista') loadData();
  }, [pagina, tab]);

  const loadEstadisticas = async () => {
    try {
      const data = await auditorApi.getEstadisticas();
      setEstadisticas(data);
    } catch {}
  };

  const totalPaginas = Math.ceil(total / limite);

  const handleVerDetalle = async (consultaId: string) => {
    setLoading(true);
    try {
      const data = await auditorApi.getHcCompleta(consultaId);
      setConsultaActual(data);
      setTab('detalle');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRevisar = async () => {
    if (!consultaActual) return;
    setSaving(true);
    try {
      await auditorApi.revisarHc(consultaActual.id, {
        estado: revisionEstado,
        observacion: revisionObs || undefined,
      });
      toast.success('HC revisada exitosamente');
      setShowRevisionModal(false);
      setRevisionObs('');
      loadEstadisticas();
      if (tab === 'detalle') {
        const data = await auditorApi.getHcCompleta(consultaActual.id);
        setConsultaActual(data);
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAplicarFiltros = () => {
    setPagina(1);
    loadData();
  };

  if (tab === 'detalle' && consultaActual) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => { setTab('lista'); setConsultaActual(null); }}>
              <ChevronLeft size={18} />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-neutral-900">Detalle de Historia Clínica</h1>
              <p className="text-sm text-neutral-500">
                {consultaActual.paciente?.nombres} {consultaActual.paciente?.apellidos}
                {' — '}
                {consultaActual.especialista?.nombres} {consultaActual.especialista?.apellidos}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {consultaActual.revision && (
              <Badge variant={consultaActual.revision.estado === 'REVISADO' ? 'success' : 'warning'}>
                {consultaActual.revision.estado === 'REVISADO' ? 'Revisado' : 'Con observaciones'}
              </Badge>
            )}
            {consultaActual.revision?.estado !== 'REVISADO' && (
              <>
                <Button onClick={() => { setRevisionEstado('REVISADO'); setShowRevisionModal(true); }}>
                  <ThumbsUp size={16} className="mr-1" />
                  Marcar Revisado
                </Button>
                <Button variant="outline" onClick={() => { setRevisionEstado('REVISADO_CON_OBSERVACIONES'); setShowRevisionModal(true); }}>
                  <MessageSquare size={16} className="mr-1" />
                  Con Observaciones
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Información de la Consulta</h2>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-neutral-500">Motivo de Consulta</dt>
                  <dd className="font-medium text-neutral-900">{consultaActual.motivoConsulta || '-'}</dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Enfermedad Actual</dt>
                  <dd className="font-medium text-neutral-900">{consultaActual.enfermedadActual || '-'}</dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Tipo de Consulta</dt>
                  <dd className="font-medium text-neutral-900">{consultaActual.tipoConsulta || '-'}</dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Tipo de Atención</dt>
                  <dd className="font-medium text-neutral-900">{consultaActual.tipoAtencion || '-'}</dd>
                </div>
                {consultaActual.cita && (
                  <>
                    <div>
                      <dt className="text-neutral-500">Fecha de Cita</dt>
                      <dd className="font-medium text-neutral-900">{formatDate(consultaActual.cita.fecha)}</dd>
                    </div>
                    <div>
                      <dt className="text-neutral-500">Horario</dt>
                      <dd className="font-medium text-neutral-900">{consultaActual.cita.horaInicio} - {consultaActual.cita.horaFin}</dd>
                    </div>
                  </>
                )}
              </dl>
            </Card>

            {consultaActual.diagnosticos?.length > 0 && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">Diagnósticos (CIE-10)</h2>
                <div className="space-y-2">
                  {consultaActual.diagnosticos.map((d: any) => (
                    <div key={d.id} className="flex items-center gap-2 p-2 bg-neutral-50 rounded-lg">
                      <Badge variant="info">{d.codigoCIE10}</Badge>
                      <span className="text-sm text-neutral-800">{d.descripcion}</span>
                      {d.esPrincipal && <Badge variant="success">Principal</Badge>}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {consultaActual.prescripciones?.length > 0 && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">Prescripciones</h2>
                <div className="space-y-2">
                  {consultaActual.prescripciones.map((p: any) => (
                    <div key={p.id} className="p-3 bg-neutral-50 rounded-lg">
                      <p className="font-medium text-neutral-900">{p.medicamento}</p>
                      <p className="text-sm text-neutral-600">{p.dosis} — {p.frecuencia}{p.duracion ? ` por ${p.duracion}` : ''}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {consultaActual.signosVitales?.length > 0 && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">Signos Vitales</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left bg-neutral-50">
                        <th className="px-3 py-2 font-medium text-neutral-700">Fecha</th>
                        <th className="px-3 py-2 font-medium text-neutral-700">PA</th>
                        <th className="px-3 py-2 font-medium text-neutral-700">FC</th>
                        <th className="px-3 py-2 font-medium text-neutral-700">T°</th>
                        <th className="px-3 py-2 font-medium text-neutral-700">Peso</th>
                        <th className="px-3 py-2 font-medium text-neutral-700">Talla</th>
                        <th className="px-3 py-2 font-medium text-neutral-700">IMC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {consultaActual.signosVitales.map((sv: any) => (
                        <tr key={sv.id} className="border-t border-neutral-100">
                          <td className="px-3 py-2">{formatDate(sv.fecha)}</td>
                          <td className="px-3 py-2">{sv.presionArterial || '-'}</td>
                          <td className="px-3 py-2">{sv.frecuenciaCardiaca || '-'}</td>
                          <td className="px-3 py-2">{sv.temperatura ? `${sv.temperatura}°C` : '-'}</td>
                          <td className="px-3 py-2">{sv.peso ? `${sv.peso}kg` : '-'}</td>
                          <td className="px-3 py-2">{sv.talla ? `${sv.talla}cm` : '-'}</td>
                          <td className="px-3 py-2">{sv.imc || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {consultaActual.evoluciones?.length > 0 && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">Evoluciones</h2>
                {consultaActual.evoluciones.map((e: any) => (
                  <div key={e.id} className="mb-3 p-3 bg-neutral-50 rounded-lg">
                    {e.subjetivo && <p className="text-sm"><strong>Subjetivo:</strong> {e.subjetivo}</p>}
                    {e.objetivo && <p className="text-sm"><strong>Objetivo:</strong> {e.objetivo}</p>}
                    {e.analisis && <p className="text-sm"><strong>Análisis:</strong> {e.analisis}</p>}
                    {e.plan && <p className="text-sm"><strong>Plan:</strong> {e.plan}</p>}
                  </div>
                ))}
              </Card>
            )}

            {consultaActual.examenes?.length > 0 && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">Exámenes</h2>
                <div className="space-y-2">
                  {consultaActual.examenes.map((ex: any) => (
                    <div key={ex.id} className="p-3 bg-neutral-50 rounded-lg">
                      <p className="font-medium text-neutral-900">{ex.nombre}</p>
                      <p className="text-sm text-neutral-600">Tipo: {ex.tipo} | Fase: {ex.fase || '-'}</p>
                      {ex.resultado && <p className="text-sm text-neutral-700 mt-1">{ex.resultado}</p>}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {consultaActual.firmas?.length > 0 && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">Firmas</h2>
                {consultaActual.firmas.map((f: any) => (
                  <div key={f.id} className="flex items-center gap-2 text-sm text-neutral-600">
                    <CheckCircle size={16} className="text-success-500" />
                    <span>Firmado digitalmente — {formatDate(f.fechaFirma)}</span>
                  </div>
                ))}
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-neutral-700 mb-3">Paciente</h3>
              <div className="space-y-2 text-sm">
                <p className="font-medium text-neutral-900">
                  {consultaActual.paciente?.nombres} {consultaActual.paciente?.apellidos}
                </p>
                <p className="text-neutral-500">ID: {consultaActual.paciente?.numeroIdentificacion}</p>
                <p className="text-neutral-500">Género: {consultaActual.paciente?.genero}</p>
                <p className="text-neutral-500">Grupo: {consultaActual.paciente?.grupoSanguineo}</p>
                <p className="text-neutral-500">Seguro: {consultaActual.paciente?.tipoSeguro}</p>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="text-sm font-semibold text-neutral-700 mb-3">Especialista</h3>
              <div className="space-y-2 text-sm">
                <p className="font-medium text-neutral-900">
                  {consultaActual.especialista?.nombres} {consultaActual.especialista?.apellidos}
                </p>
                <p className="text-neutral-500">{consultaActual.especialista?.especialidad}</p>
                {consultaActual.especialista?.codigoMsp && (
                  <p className="text-neutral-500">MSP: {consultaActual.especialista.codigoMsp}</p>
                )}
              </div>
            </Card>

            {consultaActual.revisiones?.length > 0 && (
              <Card className="p-4">
                <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
                  <History size={14} />
                  Historial de Revisiones
                </h3>
                <div className="space-y-3">
                  {consultaActual.revisiones.map((r: any) => (
                    <div key={r.id} className="text-sm border-b border-neutral-100 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <Badge variant={r.estado === 'REVISADO' ? 'success' : 'warning'}>
                          {r.estado === 'REVISADO' ? 'Aprobado' : 'Con observaciones'}
                        </Badge>
                        <span className="text-xs text-neutral-400">{formatDate(r.createdAt)}</span>
                      </div>
                      {r.observacion && (
                        <p className="text-neutral-600 mt-1">{r.observacion}</p>
                      )}
                      <p className="text-xs text-neutral-400 mt-1">
                        por {r.auditor?.nombres} {r.auditor?.apellidos} ({r.auditor?.email})
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {consultaActual.versiones?.length > 0 && (
              <Card className="p-4">
                <h3 className="text-sm font-semibold text-neutral-700 mb-3">Versiones</h3>
                <div className="space-y-1 text-sm text-neutral-500">
                  {consultaActual.versiones.map((v: any) => (
                    <p key={v.id}>v{v.version} — {formatDate(v.createdAt)}</p>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>

        {showRevisionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <Card className="w-full max-w-md p-6 mx-4">
              <h2 className="text-lg font-semibold text-neutral-900 mb-2">
                {revisionEstado === 'REVISADO' ? 'Marcar como Revisado' : 'Marcar con Observaciones'}
              </h2>
              <p className="text-sm text-neutral-500 mb-4">
                {revisionEstado === 'REVISADO'
                  ? 'Confirma que la historia clínica está completa y correcta.'
                  : 'Indica que la historia clínica requiere correcciones.'}
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Observaciones {revisionEstado === 'REVISADO_CON_OBSERVACIONES' ? '(requerido)' : '(opcional)'}
                </label>
                <textarea
                  value={revisionObs}
                  onChange={(e) => setRevisionObs(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder={revisionEstado === 'REVISADO_CON_OBSERVACIONES' ? 'Describa las correcciones necesarias...' : 'Observaciones adicionales...'}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setShowRevisionModal(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleRevisar}
                  disabled={saving || (revisionEstado === 'REVISADO_CON_OBSERVACIONES' && !revisionObs.trim())}
                >
                  {saving ? 'Guardando...' : 'Confirmar'}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Auditoría de Historias Clínicas"
        description="Revise y valide las historias clínicas del sistema"
      />

      {estadisticas && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                <FileText size={20} className="text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">{estadisticas.totalConsultas}</p>
                <p className="text-xs text-neutral-500">Total HC</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-success-100 flex items-center justify-center">
                <CheckCircle size={20} className="text-success-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">{estadisticas.revisiones.revisadas}</p>
                <p className="text-xs text-neutral-500">Revisadas</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning-100 flex items-center justify-center">
                <AlertTriangle size={20} className="text-warning-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">{estadisticas.revisiones.conObservaciones}</p>
                <p className="text-xs text-neutral-500">Con Obs.</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center">
                <BarChart3 size={20} className="text-neutral-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">{estadisticas.revisiones.pendientes}</p>
                <p className="text-xs text-neutral-500">Pendientes</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-neutral-700 mb-1">Especialista</label>
            <select
              value={filterEsp}
              onChange={(e) => setFilterEsp(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm"
            >
              <option value="">Todos</option>
              {especialistas.map((e: any) => (
                <option key={e.id} value={e.id}>{e.nombres} {e.apellidos} - {e.especialidad}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-neutral-700 mb-1">Especialidad</label>
            <select
              value={filterEspecialidad}
              onChange={(e) => setFilterEspecialidad(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm"
            >
              <option value="">Todas</option>
              {especialistas.reduce<string[]>((acc, e) => acc.includes(e.especialidad) ? acc : acc.concat(e.especialidad), []).map((esp) => (
                <option key={esp} value={esp}>{esp}</option>
              ))}
            </select>
          </div>
          <div className="w-40">
            <label className="block text-sm font-medium text-neutral-700 mb-1">Estado</label>
            <select
              value={filterEstadoRev}
              onChange={(e) => setFilterEstadoRev(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm"
            >
              <option value="">Todos</option>
              <option value="PENDIENTE">Pendientes</option>
              <option value="REVISADO">Revisados</option>
              <option value="REVISADO_CON_OBSERVACIONES">Con observaciones</option>
            </select>
          </div>
          <Button onClick={handleAplicarFiltros} size="sm">
            <Filter size={16} className="mr-1" />
            Filtrar
          </Button>
        </div>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<FileText size={24} />}
          title="No hay historias clínicas"
          description="No se encontraron registros con los filtros seleccionados"
        />
      ) : (
        <>
          <div className="space-y-3">
            {items.map((item: any) => {
              const tieneRevision = item.ultimaRevision;
              const estadoRev = tieneRevision?.estado || 'PENDIENTE';
              return (
                <div
                  key={item.id}
                  className={cn(
                    'bg-white rounded-xl border border-neutral-100 p-4 hover:shadow-md transition-shadow cursor-pointer border-l-4',
                    estadoRev === 'REVISADO' ? 'border-l-success-500' :
                    estadoRev === 'REVISADO_CON_OBSERVACIONES' ? 'border-l-warning-500' :
                    'border-l-neutral-300',
                  )}
                  onClick={() => handleVerDetalle(item.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <User size={16} className="text-neutral-400 shrink-0" />
                        <p className="font-semibold text-neutral-900 truncate">
                          {item.paciente?.nombres} {item.paciente?.apellidos}
                        </p>
                        <Badge variant={
                          estadoRev === 'REVISADO' ? 'success' :
                          estadoRev === 'REVISADO_CON_OBSERVACIONES' ? 'warning' : 'info'
                        }>
                          {estadoRev === 'REVISADO' ? 'Revisado' :
                           estadoRev === 'REVISADO_CON_OBSERVACIONES' ? 'Con Obs.' : 'Pendiente'}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-500">
                        <Stethoscope size={14} className="text-neutral-400 inline mr-1" />
                        {item.especialista?.nombres} {item.especialista?.apellidos}
                        <span className="text-neutral-300">|</span>
                        <span>{item.especialista?.especialidad}</span>
                        <span className="text-neutral-300">|</span>
                        <span>{item.paciente?.numeroIdentificacion}</span>
                        <span className="text-neutral-300">|</span>
                        <Calendar size={14} className="text-neutral-400 inline mr-1" />
                        {formatDate(item.createdAt)}
                      </div>
                      {item.diagnosticos?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.diagnosticos.slice(0, 3).map((d: any) => (
                            <Badge key={d.id} variant="neutral" className="text-xs">
                              {d.codigoCIE10}
                            </Badge>
                          ))}
                          {item.diagnosticos.length > 3 && (
                            <span className="text-xs text-neutral-400">+{item.diagnosticos.length - 3} más</span>
                          )}
                        </div>
                      )}
                    </div>
                    <Button size="sm" variant="ghost">
                      <Eye size={16} />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPaginas > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-neutral-500">
                Mostrando {(pagina - 1) * limite + 1}-{Math.min(pagina * limite, total)} de {total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pagina <= 1}
                  onClick={() => setPagina(pagina - 1)}
                >
                  <ChevronLeft size={16} />
                </Button>
                <span className="text-sm text-neutral-600">{pagina} / {totalPaginas}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pagina >= totalPaginas}
                  onClick={() => setPagina(pagina + 1)}
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
