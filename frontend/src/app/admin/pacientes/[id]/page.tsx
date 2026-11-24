'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { pacientesApi, auditoriaApi, hceApi } from '@/lib/api-client';
import type { Paciente } from '@/types/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { cn, formatDate, getEstadoCitaColor } from '@/lib/utils';
import { toast } from 'sonner';
import {
  ArrowLeft, User, Phone, Stethoscope, Calendar, FileText,
  AlertTriangle, Ban, CheckCircle, Edit, XCircle,
} from 'lucide-react';
import { EditPacienteModal } from './components/EditPacienteModal';

interface PacienteDetalle extends Paciente {
  citas?: any[];
  [key: string]: any;
}

type Tab = 'datos' | 'antecedentes' | 'historial' | 'progreso' | 'auditoria' | 'hce';

function formatLabel(val?: string) {
  if (!val) return '-';
  return val.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function calcEdad(fechaNac?: string) {
  if (!fechaNac) return '-';
  const nac = new Date(fechaNac);
  const hoy = new Date();
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return `${edad} años`;
}

export default function PacienteDetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id as string;

  const [tab, setTab] = useState<Tab>('datos');
  const [data, setData] = useState<PacienteDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [historial, setHistorial] = useState<any[]>([]);
  const [citas, setCitas] = useState<any[]>([]);
  const [auditoria, setAuditoria] = useState<any[]>([]);
  const [showEdit, setShowEdit] = useState(false);
  const [inasistencias, setInasistencias] = useState<any[]>([]);
  const [cancelModal, setCancelModal] = useState<{ open: boolean; especialidad: string; contador: number } | null>(null);
  const [cancelMotivo, setCancelMotivo] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [consultasHCE, setConsultasHCE] = useState<any[]>([]);
  const [hceExpanded, setHceExpanded] = useState<Set<string>>(new Set());

  const loadData = useCallback(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      pacientesApi.getById(id),
      pacientesApi.getHistorial(id).catch(() => []),
      pacientesApi.getInasistencias(id).catch(() => []),
      hceApi.getHistorialPaciente(id).catch(() => []),
      auditoriaApi.listar({ entidad: 'Paciente', accion: '', pagina: 1, limite: 50 }).catch(() => ({ items: [] })),
    ])
      .then(([paciente, hist, inasist, hce, aud]) => {
        const p = paciente as PacienteDetalle;
        setData(p);
        setHistorial(Array.isArray(hist) ? hist : []);
        setInasistencias(Array.isArray(inasist) ? inasist : []);
        setConsultasHCE((hce as any)?.consultasHCE || (Array.isArray(hce) ? hce : []));
        const items = (aud?.items ?? []).filter((it: any) => it.entidadId === id);
        setAuditoria(items);
        if (p.citas) setCitas(p.citas);
      })
      .catch((e: any) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCancelarProtocolo = async () => {
    if (!cancelModal || !cancelMotivo.trim()) return;
    setCancelling(true);
    try {
      await pacientesApi.cancelarProtocolo(id, cancelModal.especialidad, cancelMotivo);
      toast.success(`Protocolo de ${cancelModal.especialidad} cancelado`);
      setCancelModal(null);
      setCancelMotivo('');
      loadData();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <Link href="/admin/pacientes" className="inline-flex items-center gap-1 text-sm text-primary-600">
          <ArrowLeft size={14} /> Volver a pacientes
        </Link>
        <Card className="p-8 text-center text-neutral-500">No se encontró el paciente solicitado.</Card>
      </div>
    );
  }

  const p = data;
  const nombreCompleto = `${p.primerNombre || p.nombres || ''} ${p.segundoNombre || ''} ${p.primerApellido || p.apellidos || ''} ${p.segundoApellido || ''}`.trim();

  return (
    <div className="space-y-6">
      <PageHeader
        title={nombreCompleto}
        description={`${p.numeroIdentificacion || ''}${p.tipoSeguro ? ` · ${formatLabel(p.tipoSeguro)}` : ''}`}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" icon={<Edit size={16} />} onClick={() => setShowEdit(true)}>
              Editar
            </Button>
            <Link href="/admin/pacientes">
              <Button variant="secondary" icon={<ArrowLeft size={16} />}>Volver</Button>
            </Link>
          </div>
        }
      />

      <div className="flex gap-1 bg-white/60 rounded-lg p-0.5 w-fit">
        {(['datos', 'antecedentes', 'historial', 'progreso', 'auditoria', 'hce'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-1.5 rounded-md text-sm font-medium transition-all ${
              tab === t ? 'bg-primary-600 text-white shadow-sm' : 'text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            {t === 'datos' ? 'Datos' : t === 'antecedentes' ? 'Antecedentes' : t === 'historial' ? `Historial (${citas.length})` : t === 'progreso' ? 'Progreso' : t === 'hce' ? `HCE (${consultasHCE.length})` : `Auditoría (${auditoria.length})`}
          </button>
        ))}
      </div>

      {tab === 'datos' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-4 space-y-2">
            <h3 className="font-semibold flex items-center gap-2"><User size={16} /> Datos personales</h3>
            <Row k="Nombres" v={nombreCompleto || `${p.nombres || ''} ${p.apellidos || ''}`} />
            <Row k="Identificación" v={`${formatLabel(p.tipoIdentificacion)} ${p.numeroIdentificacion}`} />
            <Row k="Género" v={formatLabel(p.genero)} />
            <Row k="Fecha de nacimiento" v={p.fechaNacimiento ? formatDate(p.fechaNacimiento) : '-'} />
            <Row k="Edad" v={calcEdad(p.fechaNacimiento)} />
            <Row k="Estado civil" v={formatLabel(p.estadoCivil)} />
          </Card>

          <Card className="p-4 space-y-2">
            <h3 className="font-semibold flex items-center gap-2"><Phone size={16} /> Contacto</h3>
            <Row k="Teléfono" v={p.telefono} />
            <Row k="Teléfono secundario" v={p.telefonoSecundario} />
            <Row k="Dirección" v={p.direccion} />
          </Card>

          <Card className="p-4 space-y-2">
            <h3 className="font-semibold flex items-center gap-2"><Stethoscope size={16} /> Información médica</h3>
            <Row k="Grupo sanguíneo" v={formatLabel(p.grupoSanguineo)} />
            <Row k="Tipo seguro" v={p.tipoSeguro} />
            <Row k="Convenio" v={p.nombreConvenio || '-'} />
          </Card>

          <Card className="p-4 space-y-2">
            <h3 className="font-semibold flex items-center gap-2"><AlertTriangle size={16} /> Emergencia</h3>
            <Row k="Contacto" v={p.emergenciaNombre} />
            <Row k="Teléfono" v={p.emergenciaTelefono} />
            <Row k="Parentesco" v={p.emergenciaParentesco} />
          </Card>

          <Card className="p-4 space-y-2">
            <h3 className="font-semibold flex items-center gap-2"><FileText size={16} /> Laboral</h3>
            <Row k="Empresa" v={p.laboralEmpresa} />
            <Row k="Cargo" v={p.laboralCargo} />
            <Row k="Dirección" v={p.laboralDireccion} />
            <Row k="Teléfono" v={p.laboralTelefono} />
          </Card>

          <Card className="p-4 space-y-2">
            <h3 className="font-semibold flex items-center gap-2"><CheckCircle size={16} /> Estado</h3>
            <div className="flex items-baseline gap-3 text-sm">
              <span className="text-xs text-neutral-500 min-w-[140px]">Estado</span>
              <span className={cn('inline-block px-2 py-0.5 rounded-full text-xs font-medium', p.bloqueado ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800')}>
                {p.bloqueado ? 'Bloqueado' : 'Activo'}
              </span>
            </div>
            {p.bloqueado && <Row k="Motivo" v={p.motivoBloqueo} />}
          </Card>
        </div>
      )}

      {tab === 'antecedentes' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-4">
            <h3 className="font-semibold text-neutral-900 mb-3">Alergias</h3>
            {p.alergias && (typeof p.alergias === 'string' ? p.alergias : Array.isArray(p.alergias) ? p.alergias : []).length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {(typeof p.alergias === 'string' ? p.alergias.split(',').map((s: string) => s.trim()).filter(Boolean) : Array.isArray(p.alergias) ? p.alergias : []).map((a: string, i: number) => (
                  <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700 ring-1 ring-orange-200">
                    {a}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-500">Sin alergias registradas</p>
            )}
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold text-neutral-900 mb-3">Enfermedades Preexistentes</h3>
            {p.enfermedadesPreexistentes && (typeof p.enfermedadesPreexistentes === 'string' ? p.enfermedadesPreexistentes : Array.isArray(p.enfermedadesPreexistentes) ? p.enfermedadesPreexistentes : []).length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {(typeof p.enfermedadesPreexistentes === 'string' ? p.enfermedadesPreexistentes.split(',').map((s: string) => s.trim()).filter(Boolean) : Array.isArray(p.enfermedadesPreexistentes) ? p.enfermedadesPreexistentes : []).map((e: string, i: number) => (
                  <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 ring-1 ring-red-200">
                    {e}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-500">Sin enfermedades preexistentes registradas</p>
            )}
          </Card>
        </div>
      )}

      {tab === 'historial' && (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-500 border-b bg-neutral-50">
                  <th className="p-3 font-medium">Fecha</th>
                  <th className="p-3 font-medium">Hora</th>
                  <th className="p-3 font-medium">Especialidad</th>
                  <th className="p-3 font-medium">Estado</th>
                  <th className="p-3 font-medium">Especialista</th>
                </tr>
              </thead>
              <tbody>
                {citas.map((c: any) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-neutral-50">
                    <td className="p-3">{c.fecha ? formatDate(c.fecha) : '-'}</td>
                    <td className="p-3">{c.horaInicio ? `${c.horaInicio.slice(0, 5)} - ${c.horaFin ? c.horaFin.slice(0, 5) : ''}` : '-'}</td>
                    <td className="p-3">{c.especialidad || '-'}</td>
                    <td className="p-3">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', getEstadoCitaColor(c.estado))}>
                        {formatLabel(c.estado)}
                      </span>
                    </td>
                    <td className="p-3">{c.especialista ? `${c.especialista.nombres || ''} ${c.especialista.apellidos || ''}` : '-'}</td>
                  </tr>
                ))}
                {citas.length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-neutral-500">Sin citas registradas</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'progreso' && (
        <Card className="p-4 space-y-4">
          <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
            <AlertTriangle size={16} /> Inasistencias por especialidad
          </h3>
          {inasistencias.length === 0 ? (
            <p className="text-sm text-neutral-500">Sin inasistencias registradas</p>
          ) : (
            <div className="space-y-3">
              {inasistencias.map((inasis: any) => {
                const contador = inasis.contador || 0;
                const max = 3;
                const percentage = Math.min((contador / max) * 100, 100);
                const isLimit = contador >= max;
                return (
                  <div key={inasis.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-neutral-800">{inasis.especialidad}</span>
                      <span className={`text-xs font-bold ${isLimit ? 'text-red-600' : contador >= 2 ? 'text-amber-600' : 'text-neutral-500'}`}>
                        {contador} / {max}
                      </span>
                    </div>
                    <div className="w-full bg-neutral-100 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all ${isLimit ? 'bg-red-500' : contador >= 2 ? 'bg-amber-500' : 'bg-blue-500'}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    {inasis.ultimaInasistencia && (
                      <p className="text-xs text-neutral-400 mt-1">
                        Última: {new Date(inasis.ultimaInasistencia).toLocaleDateString('es-EC')}
                      </p>
                    )}
                    {isLimit && (
                      <div className="mt-3 pt-3 border-t">
                        <button
                          onClick={() => setCancelModal({ open: true, especialidad: inasis.especialidad, contador })}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                        >
                          <XCircle size={14} /> Cancelar protocolo
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {tab === 'auditoria' && (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-500 border-b bg-neutral-50">
                  <th className="p-3 font-medium">Fecha</th>
                  <th className="p-3 font-medium">Acción</th>
                  <th className="p-3 font-medium">Usuario</th>
                  <th className="p-3 font-medium">Motivo</th>
                  <th className="p-3 font-medium">Entidad</th>
                </tr>
              </thead>
              <tbody>
                {auditoria.map((it, idx) => (
                  <tr key={it.id || idx} className="border-b last:border-0 hover:bg-neutral-50">
                    <td className="p-3 text-neutral-600">{new Date(it.createdAt).toLocaleString('es-EC')}</td>
                    <td className="p-3 font-medium">{it.accion}</td>
                    <td className="p-3">{it.usuario?.email || it.usuarioId || '-'}</td>
                    <td className="p-3 text-neutral-500">{it.motivo || '-'}</td>
                    <td className="p-3"><Badge variant="info">{it.entidad}</Badge></td>
                  </tr>
                ))}
                {auditoria.length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-neutral-500">Sin eventos de auditoría</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'hce' && (
        <Card className="p-0 overflow-hidden">
          {consultasHCE.length === 0 ? (
            <div className="p-8 text-center text-neutral-500">Sin consultas en historia clínica</div>
          ) : (
            <div className="space-y-2 p-4">
              {consultasHCE.map((c: any) => {
                const isOpen = hceExpanded.has(c.id);
                return (
                  <div key={c.id} className="border rounded-lg">
                    <button
                      onClick={() => {
                        const next = new Set(hceExpanded);
                        isOpen ? next.delete(c.id) : next.add(c.id);
                        setHceExpanded(next);
                      }}
                      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 text-left"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {c.especialista?.especialidad || '-'} · {c.motivoConsulta || 'Sin motivo'}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString('es-EC') : '-'}
                          {c.especialista && <> · Dr/a. {c.especialista.nombres} {c.especialista.apellidos}</>}
                        </p>
                      </div>
                      <svg className={cn('w-4 h-4 text-gray-400 transition-transform', isOpen && 'rotate-180')} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    {isOpen && (
                      <div className="px-3 pb-3 border-t space-y-3 pt-3">
                        {c.motivoConsulta && (
                          <div>
                            <p className="text-xs font-semibold text-gray-600 mb-0.5">Motivo de consulta</p>
                            <p className="text-sm text-gray-800">{c.motivoConsulta}</p>
                          </div>
                        )}
                        {c.enfermedadActual && (
                          <div>
                            <p className="text-xs font-semibold text-gray-600 mb-0.5">Enfermedad actual</p>
                            <p className="text-sm text-gray-800">{c.enfermedadActual}</p>
                          </div>
                        )}
                        {c.diagnosticos?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-600 mb-1">Diagnósticos</p>
                            <div className="space-y-1">
                              {c.diagnosticos.map((d: any) => (
                                <div key={d.id} className="flex items-center gap-2 text-sm bg-blue-50 border border-blue-200 rounded px-2 py-1">
                                  <span className="text-xs font-mono font-bold text-blue-700">{d.codigoCIE10}</span>
                                  <span className="text-gray-700">{d.descripcion}</span>
                                  <span className="ml-auto text-xs text-blue-500">{d.tipo}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {c.prescripciones?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-600 mb-1">Prescripciones</p>
                            <div className="space-y-1">
                              {c.prescripciones.map((p: any) => (
                                <div key={p.id} className="text-sm bg-green-50 border border-green-200 rounded px-2 py-1">
                                  <span className="font-medium">{p.medicamento}</span>
                                  <span className="text-gray-500 ml-1">{p.dosis} · {p.frecuencia}{p.duracion ? ` · ${p.duracion}` : ''}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {c.evoluciones?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-600 mb-1">Evolución (SOAP)</p>
                            {c.evoluciones.map((ev: any) => (
                              <div key={ev.id} className="text-sm bg-gray-50 rounded p-2 space-y-1">
                                {ev.subjetivo && <p><span className="font-medium text-gray-600">S:</span> {ev.subjetivo}</p>}
                                {ev.objetivo && <p><span className="font-medium text-gray-600">O:</span> {ev.objetivo}</p>}
                                {ev.analisis && <p><span className="font-medium text-gray-600">A:</span> {ev.analisis}</p>}
                                {ev.plan && <p><span className="font-medium text-gray-600">P:</span> {ev.plan}</p>}
                              </div>
                            ))}
                          </div>
                        )}
                        {c.firmada && (
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle size={12} /> Firmada digitalmente
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {showEdit && <EditPacienteModal paciente={data} onClose={() => setShowEdit(false)} onSaved={loadData} />}

      {cancelModal?.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Cancelar Protocolo</h2>
              <p className="text-sm text-gray-500 mt-1">
                Cancelar protocolo de <strong>{cancelModal.especialidad}</strong> ({cancelModal.contador} de 3 inasistencias). Se cancelarán todas las citas futuras de esta especialidad.
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                <textarea
                  value={cancelMotivo}
                  onChange={(e) => setCancelMotivo(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  rows={3}
                  placeholder="Describa el motivo de la cancelación del protocolo"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setCancelModal(null); setCancelMotivo(''); }}
                  disabled={cancelling}
                  className="flex-1 px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCancelarProtocolo}
                  disabled={cancelling || !cancelMotivo.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
                >
                  {cancelling ? 'Procesando...' : 'Confirmar Cancelación'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: any }) {
  return (
    <div className="flex items-baseline gap-3 text-sm">
      <span className="text-xs text-neutral-500 min-w-[140px]">{k}</span>
      <span className="font-medium text-neutral-900 break-words">{v || '-'}</span>
    </div>
  );
}
