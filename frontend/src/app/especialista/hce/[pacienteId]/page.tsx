'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { hceApi } from '@/lib/api-client';
import { ROUTES } from '@/lib/routes';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  ArrowLeft, User, Calendar, Clock, Activity, FileText,
  Stethoscope, ChevronRight, Download, Eye,
} from 'lucide-react';
import OptometriaInformeForm from '@/components/hce/OptometriaInformeForm';
import { HistorialClinicoResumen } from '@/components/hce/HistorialClinicoResumen';

function calcEdad(fecha: string) {
  const hoy = new Date();
  const nac = new Date(fecha);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return `${edad} años`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-EC', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

export default function EspecialistaHcePacientePage() {
  const { pacienteId } = useParams<{ pacienteId: string }>();
  const [paciente, setPaciente] = useState<any>(null);
  const [consultas, setConsultas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    hceApi.getHistorialPaciente(pacienteId as string)
      .then((data: any) => {
        setPaciente({
          nombres: data.nombres,
          apellidos: data.apellidos,
          numeroIdentificacion: data.numeroIdentificacion,
          fechaNacimiento: data.fechaNacimiento,
          grupoSanguineo: data.grupoSanguineo,
          telefono: data.telefono,
          alergias: data.alergias,
          antecedentes: data.antecedentes,
        });
        setConsultas(data.consultasHCE || []);
      })
      .catch((e: any) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [pacienteId]);

  const toggleExpand = (consultaId: string) => {
    const next = new Set(expanded);
    expanded.has(consultaId) ? next.delete(consultaId) : next.add(consultaId);
    setExpanded(next);
  };

  if (loading) return (
    <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full" /></div>
  );

  if (!paciente) return (
    <div className="text-center py-12 text-gray-500">Paciente no encontrado</div>
  );

  return (
    <div className="space-y-6">
      <Link href={ROUTES.especialista.hce} className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center gap-1">
        <ArrowLeft size={14} /> Volver a pacientes
      </Link>

      <div className="bg-white rounded-xl border p-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center text-xl font-bold text-primary-600 shrink-0">
            {paciente.nombres?.[0]}{paciente.apellidos?.[0]}
          </div>
          <div>
            <h1 className="text-xl font-bold">{paciente.nombres} {paciente.apellidos}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {paciente.numeroIdentificacion} · {paciente.fechaNacimiento ? calcEdad(paciente.fechaNacimiento) : ''}
              {paciente.grupoSanguineo ? ` · ${paciente.grupoSanguineo.replace(/_/g, ' ')}` : ''}
              {paciente.telefono ? ` · ${paciente.telefono}` : ''}
            </p>
          </div>
        </div>
        {paciente.alergias && (
          <div className="mt-3 bg-red-50 text-red-700 text-sm rounded-lg p-2.5">
            <strong>Alergias:</strong> {paciente.alergias}
          </div>
        )}
      </div>

      <HistorialClinicoResumen pacienteId={pacienteId as string} />

      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg text-gray-900 flex items-center gap-2">
          <Calendar size={18} className="text-primary-600" />
          Historial de consultas ({consultas.length})
        </h2>
      </div>

      {consultas.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Sin consultas registradas</div>
      ) : (
        <div className="space-y-3">
          {consultas.map((c: any) => {
            const isExpanded = expanded.has(c.id);
            return (
              <div key={c.id} className="bg-white rounded-xl border overflow-hidden">
                <button
                  onClick={() => toggleExpand(c.id)}
                  className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-gray-400 shrink-0" />
                    {c.numeroConsulta && (
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-primary-100 text-primary-700">
                        Consulta #{String(c.numeroConsulta).padStart(3, '0')}
                      </span>
                    )}
                    <span className="text-sm font-semibold text-gray-700">{formatDate(c.createdAt)}</span>
                    {c.cita?.horaInicio && (
                      <span className="text-xs text-gray-500">{c.cita.horaInicio}</span>
                    )}
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                      {c.especialista?.especialidad || '-'}
                    </span>
                    <span className="text-xs text-gray-500">{c.especialista?.nombres} {c.especialista?.apellidos}</span>
                    <ChevronRight size={14} className={cn('ml-auto text-gray-400 transition-transform shrink-0', isExpanded && 'rotate-90')} />
                  </div>
                  {c.motivoConsulta && (
                    <p className="text-sm font-medium text-gray-800 mt-2">{c.motivoConsulta}</p>
                  )}
                  {!isExpanded && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {c.diagnosticos?.length > 0 && <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">{c.diagnosticos.length} diag.</span>}
                      {c.prescripciones?.length > 0 && <span className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-medium">{c.prescripciones.length} presc.</span>}
                      {c.evoluciones?.length > 0 && <span className="text-xs bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-medium">{c.evoluciones.length} evol.</span>}
                      {c.pedidos?.length > 0 && <span className="text-xs bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-medium">{c.pedidos.length} ped.</span>}
                    </div>
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t p-4 space-y-4 bg-gray-50/50">
                    {c.firmada && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => hceApi.descargarConsultaPdf(c.id).catch((e: any) => toast.error(e.message))}
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                        >
                          <Download size={12} /> HC PDF
                        </button>
                        {c.optometriaInforme && (
                          <button
                            onClick={() => hceApi.descargarDevolucionPdf(c.id).catch((e: any) => toast.error(e.message))}
                            className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 bg-sky-100 text-sky-700 rounded-lg hover:bg-sky-200"
                          >
                            <Download size={12} /> Devolución
                          </button>
                        )}
                      </div>
                    )}
                    {/* Consulta */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 mb-2"><Stethoscope size={14} className="text-primary-600" />Consulta</h3>
                      {(c.motivoConsulta || c.enfermedadActual) ? (
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {c.motivoConsulta && <div><span className="block text-gray-500">Motivo</span><span className="text-gray-900">{c.motivoConsulta}</span></div>}
                          {c.enfermedadActual && <div><span className="block text-gray-500">Enfermedad actual</span><span className="text-gray-900">{c.enfermedadActual}</span></div>}

                        </div>
                      ) : <p className="text-xs text-gray-400">Sin datos de consulta</p>}
                    </div>

                    {/* Historia Clínica Optometría */}
                    {c.especialista?.especialidad === 'Optometría' && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 mb-2">
                          <Eye size={14} className="text-primary-600" />Historia Clínica Optometría
                          {c.optometriaInforme && (
                            <span className="text-xs font-medium bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded">
                              {c.optometriaInforme.tipo === 'TAMIZAJE' ? 'Tamizaje' : 'Integral'}
                            </span>
                          )}
                        </h3>
                        {c.optometriaInforme ? (
                          <div className="bg-white border rounded-lg p-3">
                            <OptometriaInformeForm consultaId={c.id} editable={false} />
                          </div>
                        ) : <p className="text-xs text-gray-400">Sin informe de optometría registrado</p>}
                      </div>
                    )}

                    {/* Diagnósticos */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 mb-2"><Activity size={14} className="text-primary-600" />Diagnósticos</h3>
                      {c.diagnosticos?.length > 0 ? (
                        <div className="space-y-2">
                          {c.diagnosticos.map((d: any) => (
                            <div key={d.id} className="bg-white border rounded-lg p-3 text-sm">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] uppercase font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{d.sistema || 'CIE10'}</span>
                                <span className="font-mono text-xs font-semibold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{d.codigo || d.codigoCIE10}</span>
                                <span className="text-gray-900">{d.descripcion}</span>
                                <span className={`ml-auto text-xs px-1.5 py-0.5 rounded ${d.estado === 'PRESUNTIVO' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
                                  {d.estado === 'PRESUNTIVO' ? 'Presuntivo' : 'Definitivo'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : <p className="text-xs text-gray-400">Sin diagnósticos registrados</p>}
                    </div>

                    {/* Prescripciones */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 mb-2"><FileText size={14} className="text-primary-600" />Prescripciones</h3>
                      {c.prescripciones?.length > 0 ? (
                        <div className="space-y-2">
                          {c.prescripciones.map((p: any) => (
                            <div key={p.id} className="bg-white border rounded-lg p-3 text-sm">
                              <p className="font-semibold text-gray-900">{p.medicamento}</p>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-500">
                                <span>Dosis: {p.dosis}</span>
                                {p.via && <span>Vía: {p.via}</span>}
                                <span>Frecuencia: {p.frecuencia}</span>
                                {p.duracion && <span>Duración: {p.duracion}</span>}
                              </div>
                              {p.indicaciones && <p className="text-xs text-gray-500 mt-1 italic">{p.indicaciones}</p>}
                            </div>
                          ))}
                        </div>
                      ) : <p className="text-xs text-gray-400">Sin prescripciones registradas</p>}
                    </div>

                    {/* Evoluciones */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 mb-2"><Activity size={14} className="text-primary-600" />Evolución</h3>
                      {c.evolucionesOcultas ? (
                        <p className="text-xs text-gray-500 bg-gray-100 rounded-lg px-3 py-2">
                          La evolución clínica solo es visible para el especialista titular que la registró, Auditoría y Administración principal.
                        </p>
                      ) : c.evoluciones?.length > 0 ? (
                        <div className="space-y-2">
                          {c.evoluciones.map((ev: any) => {
                            const texto = ev.nota || [ev.subjetivo, ev.objetivo, ev.analisis, ev.plan].filter(Boolean).join('\n');
                            return (
                              <div key={ev.id} className="bg-white border rounded-lg p-3 text-sm space-y-1">
                                <p className="text-gray-900 whitespace-pre-wrap">{texto || '—'}</p>
                                <p className="text-[10px] text-gray-400">Registrada: {new Date(ev.createdAt).toLocaleString('es-EC')}</p>
                              </div>
                            );
                          })}
                        </div>
                      ) : <p className="text-xs text-gray-400">Sin evoluciones registradas</p>}
                    </div>

                    {/* Pedidos */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 mb-2"><FileText size={14} className="text-primary-600" />Pedidos / Órdenes</h3>
                      {c.pedidos?.length > 0 ? (
                        <div className="space-y-2">
                          {c.pedidos.map((p: any) => (
                            <div key={p.id} className="bg-white border rounded-lg p-3 text-sm flex items-center gap-2">
                              <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{p.tipo}</span>
                              <span className="text-gray-900">{p.descripcion}</span>
                              {p.urgente && <span className="text-xs font-bold text-red-500">URGENTE</span>}
                            </div>
                          ))}
                        </div>
                      ) : <p className="text-xs text-gray-400">Sin pedidos registrados</p>}
                    </div>

                    {/* Signos Vitales */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 mb-2"><Activity size={14} className="text-primary-600" />Signos Vitales</h3>
                      {c.signosVitales?.length > 0 ? (
                        <div className="space-y-2">
                          {c.signosVitales.map((s: any) => (
                            <div key={s.id} className="bg-white border rounded-lg p-3 text-sm flex flex-wrap gap-x-4 gap-y-1">
                              {s.presionArterial && <span className="text-gray-700">PA: <strong>{s.presionArterial}</strong></span>}
                              {s.frecuenciaCardiaca && <span className="text-gray-700">FC: <strong>{s.frecuenciaCardiaca}</strong></span>}
                              {s.temperatura && <span className="text-gray-700">T°: <strong>{s.temperatura}°C</strong></span>}
                              {s.peso && <span className="text-gray-700">Peso: <strong>{s.peso}kg</strong></span>}
                              {s.talla && <span className="text-gray-700">Talla: <strong>{s.talla}cm</strong></span>}
                              {s.imc && <span className="text-gray-700">IMC: <strong>{s.imc}</strong></span>}
                              {s.dolorEVA != null && <span className="text-gray-700">Dolor: <strong>{s.dolorEVA}/10</strong></span>}
                              {s.observaciones && <span className="text-gray-500 text-xs w-full">{s.observaciones}</span>}
                            </div>
                          ))}
                        </div>
                      ) : <p className="text-xs text-gray-400">Sin signos vitales registrados</p>}
                    </div>

                    {/* Examen Físico */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 mb-2"><Stethoscope size={14} className="text-primary-600" />Examen Físico</h3>
                      {[['General', c.efEstadoGeneral, c.efObsGeneral], ['Cardiovascular', c.efCardiovascular, c.efObsCardio], ['Respiratorio', c.efRespiratorio, c.efObsResp], ['Abdomen', c.efAbdomen, c.efObsAbdomen], ['Neurológico', c.efNeurologico, c.efObsNeuro], ['Extremidades', c.efExtremidades, c.efObsExtrem], ['Piel', c.efPiel, c.efObsPiel], ['Cabeza/Cuello', c.efCabezaCuello, c.efObsCabeza]].filter(([, estado]) => estado && estado !== 'NO_EVALUADO').length > 0 ? (
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {[['General', c.efEstadoGeneral, c.efObsGeneral], ['Cardiovascular', c.efCardiovascular, c.efObsCardio], ['Respiratorio', c.efRespiratorio, c.efObsResp], ['Abdomen', c.efAbdomen, c.efObsAbdomen], ['Neurológico', c.efNeurologico, c.efObsNeuro], ['Extremidades', c.efExtremidades, c.efObsExtrem], ['Piel', c.efPiel, c.efObsPiel], ['Cabeza/Cuello', c.efCabezaCuello, c.efObsCabeza]].map(([label, estado, obs]) => (
                            <div key={label as string} className="bg-white border rounded-lg p-2">
                              <span className="text-xs font-medium text-gray-600">{label}: </span>
                              <span className={`text-xs font-semibold ${estado === 'NORMAL' ? 'text-green-600' : estado === 'ALTERADO' ? 'text-red-600' : 'text-gray-400'}`}>{estado || 'NO_EVALUADO'}</span>
                              {obs && <p className="text-xs text-gray-500 mt-0.5">{obs}</p>}
                            </div>
                          ))}
                        </div>
                      ) : <p className="text-xs text-gray-400">Sin examen físico registrado</p>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
