'use client';

import { useEffect, useState } from 'react';
import { hceApi } from '@/lib/api-client';
import type { CertificadoMedico, DerivacionHCE, HistorialClinico, HistorialDiagnostico, RecetaMedica } from '@/lib/api/hce.api';
import { toast } from 'sonner';
import {
  Activity, Calendar, Download, FileText, HeartPulse, Pill,
  ShieldCheck, UserMinus, Share2, AlertTriangle,
} from 'lucide-react';

function fmtFecha(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' });
}

function PrioridadBadge({ prioridad }: { prioridad: string }) {
  const estilos: Record<string, string> = {
    ALTA: 'bg-red-100 text-red-700',
    MEDIA: 'bg-amber-100 text-amber-700',
    BAJA: 'bg-gray-100 text-gray-600',
  };
  return <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${estilos[prioridad] || estilos.BAJA}`}>{prioridad}</span>;
}

export function HistorialClinicoResumen({ pacienteId }: { pacienteId: string }) {
  const [data, setData] = useState<HistorialClinico | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'antecedentes' | 'diagnosticos' | 'recetas' | 'certificados' | 'altas'>('antecedentes');

  useEffect(() => {
    if (!pacienteId) return;
    setLoading(true);
    hceApi.getHistorialClinico(pacienteId)
      .then((res) => setData(res))
      .catch((e: any) => toast.error(e.message || 'No se pudo cargar el historial clínico'))
      .finally(() => setLoading(false));
  }, [pacienteId]);

  if (loading) {
    return <div className="bg-white border rounded-xl p-6 text-sm text-gray-400">Cargando historial clínico...</div>;
  }
  if (!data) {
    return <div className="bg-white border rounded-xl p-6 text-sm text-gray-400">No se pudo cargar el historial clínico.</div>;
  }

  const tabs = [
    { key: 'antecedentes' as const, label: 'Antecedentes', count: data.antecedentes.personales.length + data.antecedentes.familiares.length, icon: HeartPulse },
    { key: 'diagnosticos' as const, label: 'Diagnósticos', count: data.diagnosticos.length, icon: Activity },
    { key: 'recetas' as const, label: 'Recetas', count: data.recetas.length, icon: Pill },
    { key: 'certificados' as const, label: 'Certificados', count: data.certificados.length, icon: ShieldCheck },
    { key: 'altas' as const, label: 'Altas y derivaciones', count: data.altas.length + data.derivaciones.length, icon: Share2 },
  ];

  return (
    <div className="bg-white border rounded-2xl overflow-hidden">
      <div className="px-5 pt-4 pb-0 border-b">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-bold text-lg text-gray-900">Historial clínico organizado</h2>
            <p className="text-xs text-gray-500">Antecedentes, diagnósticos, recetas y documentos del paciente.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 -mb-px">
          {tabs.map(({ key, label, count, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg border-b-2 transition-colors ${
                tab === key
                  ? 'border-primary-600 text-primary-700 bg-primary-50/60'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon size={14} /> {label}
              <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-5">
        {tab === 'antecedentes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Personales</h3>
              {data.antecedentes.personales.length === 0 ? (
                <p className="text-xs text-gray-400">Sin antecedentes personales</p>
              ) : (
                <div className="space-y-2">
                  {data.antecedentes.personales.map((a) => (
                    <div key={a.id} className="border rounded-lg p-2.5 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded-full font-medium">{a.categoria}</span>
                        <span className="flex-1 text-gray-800">{a.descripcion}</span>
                        <span className="text-[10px] text-gray-400">{fmtFecha(a.fecha)}</span>
                      </div>
                      {a.observacion && <p className="text-xs text-gray-500 mt-1">{a.observacion}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Familiares</h3>
              {data.antecedentes.familiares.length === 0 ? (
                <p className="text-xs text-gray-400">Sin antecedentes familiares</p>
              ) : (
                <div className="space-y-2">
                  {data.antecedentes.familiares.map((a) => (
                    <div key={a.id} className="border rounded-lg p-2.5 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded-full font-medium">{a.parentesco || a.categoria}</span>
                        <span className="flex-1 text-gray-800">{a.descripcion}</span>
                        <span className="text-[10px] text-gray-400">{fmtFecha(a.fecha)}</span>
                      </div>
                      {a.observacion && <p className="text-xs text-gray-500 mt-1">{a.observacion}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'diagnosticos' && <TablaDiagnosticos diagnosticos={data.diagnosticos} />}

        {tab === 'recetas' && (
          <div className="space-y-3">
            {data.recetas.length === 0 ? (
              <p className="text-xs text-gray-400">Sin recetas registradas</p>
            ) : data.recetas.map((r: RecetaMedica) => (
              <div key={r.id} className="border rounded-xl p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
                    Receta N.° {String(r.numeroReceta).padStart(4, '0')}
                  </span>
                  <span className="text-xs text-gray-500">{fmtFecha(r.fecha)}</span>
                  {r.especialista && (
                    <span className="text-xs text-gray-500">
                      {r.especialista.nombres} {r.especialista.apellidos} · {r.especialista.especialidad}
                    </span>
                  )}
                  {r.estadoEnfermedad && (
                    <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                      {r.estadoEnfermedad}
                    </span>
                  )}
                  {r.validezDias && (
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                      Validez {r.validezDias} días
                    </span>
                  )}
                  <button
                    onClick={() => hceApi.descargarRecetaPdf(r.id).catch((e: any) => toast.error(e.message))}
                    className="ml-auto inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
                  >
                    <Download size={12} /> PDF
                  </button>
                </div>
                {r.diagnostico && <p className="text-sm text-gray-800 mt-2">{r.diagnostico}</p>}
                {(r.items || []).length > 0 && (
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-left uppercase tracking-wide text-[10px] text-gray-400 border-b">
                          <th className="py-1.5 pr-3">Medicamento</th>
                          <th className="py-1.5 pr-3">Concentración</th>
                          <th className="py-1.5 pr-3">Vía</th>
                          <th className="py-1.5 pr-3">Cantidad</th>
                          <th className="py-1.5">Dosis / indicaciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {r.items.map((it: any) => (
                          <tr key={it.id} className="border-b last:border-0">
                            <td className="py-1.5 pr-3 font-medium text-gray-800">
                              {it.medicamento}
                              {it.formaFarmaceutica ? ` · ${it.formaFarmaceutica}` : ''}
                            </td>
                            <td className="py-1.5 pr-3 text-gray-600">{it.concentracion || '—'}</td>
                            <td className="py-1.5 pr-3 text-gray-600">{it.via || '—'}</td>
                            <td className="py-1.5 pr-3 text-gray-600">
                              {[it.cantidad, it.cantidadLetras].filter(Boolean).join(' / ') || '—'}
                            </td>
                            <td className="py-1.5 text-gray-600">
                              {[it.dosis, it.frecuencia, it.duracion, it.indicaciones].filter(Boolean).join(' · ') || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {(r.alergias || r.peso || r.talla) && (
                  <p className="text-[11px] text-gray-500 mt-2">
                    {r.alergias ? `Alergias: ${r.alergias}` : 'Sin alergias registradas'}
                    {r.peso ? ` · Peso: ${r.peso} kg` : ''}
                    {r.talla ? ` · Talla: ${r.talla} cm` : ''}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'certificados' && (
          <div className="space-y-3">
            {data.certificados.length === 0 ? (
              <p className="text-xs text-gray-400">Sin certificados registrados</p>
            ) : data.certificados.map((c: CertificadoMedico) => (
              <div key={c.id} className="border rounded-xl p-3 flex flex-wrap items-center gap-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${c.tipo === 'REPOSO' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                  {c.tipo === 'REPOSO' ? 'Reposo médico' : 'Asistencia'}
                </span>
                <span className="text-xs text-gray-600">{fmtFecha(c.createdAt)}</span>
                {c.tipo === 'REPOSO' && (
                  <span className="text-xs text-gray-500">{c.diasReposo || '—'} día(s) · {fmtFecha(c.fechaInicio)} al {fmtFecha(c.fechaFin)}</span>
                )}
                {c.especialista && <span className="text-xs text-gray-500">{c.especialista.nombres} {c.especialista.apellidos}</span>}
                {c.archivoPdfUrl && (
                  <button onClick={() => hceApi.descargarCertificadoMedicoPdf(c.id).catch((e: any) => toast.error(e.message))} className="ml-auto inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700">
                    <Download size={12} /> PDF
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'altas' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5"><UserMinus size={14} className="text-red-500" /> Altas por especialidad</h3>
              {data.altas.length === 0 ? (
                <p className="text-xs text-gray-400">Sin altas registradas</p>
              ) : (
                <div className="space-y-2">
                  {data.altas.map((a: any) => (
                    <div key={a.id} className="border rounded-lg p-2.5 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium bg-red-50 text-red-700 px-2 py-0.5 rounded">{a.especialidad}</span>
                        <span className="flex-1 text-gray-800">{a.motivo}</span>
                        <span className="text-[10px] text-gray-400">{fmtFecha(a.createdAt)}</span>
                      </div>
                      {a.observacion && <p className="text-xs text-gray-500 mt-1">{a.observacion}</p>}
                      <p className="text-[11px] text-gray-400 mt-1">Citas canceladas: {a.citasCanceladas ?? 0}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5"><Share2 size={14} className="text-primary-600" /> Derivaciones</h3>
              {data.derivaciones.length === 0 ? (
                <p className="text-xs text-gray-400">Sin derivaciones registradas</p>
              ) : (
                <div className="space-y-2">
                  {data.derivaciones.map((d: DerivacionHCE) => (
                    <div key={d.id} className="border rounded-lg p-2.5 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <PrioridadBadge prioridad={d.prioridad} />
                        <span className="flex-1 text-gray-800">{d.motivo}</span>
                        <span className="text-[10px] text-gray-400">{fmtFecha(d.createdAt)}</span>
                      </div>
                      <div className="mt-1.5 space-y-1">
                        {d.destinos.map((dest) => (
                          <div key={dest.id} className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                            <span>{dest.especialista ? `${dest.especialista.nombres} ${dest.especialista.apellidos}` : dest.especialidad}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${dest.estado === 'PROGRAMADA' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {dest.estado}
                            </span>
                            {dest.cita && <span className="text-gray-500">Cita: {fmtFecha(dest.cita.fecha)} {dest.cita.horaInicio}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TablaDiagnosticos({ diagnosticos }: { diagnosticos: HistorialDiagnostico[] }) {
  if (diagnosticos.length === 0) {
    return <p className="text-xs text-gray-400">Sin diagnósticos registrados</p>;
  }

  return (
    <div>
      <div className="mb-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-[11px] text-blue-700 flex items-start gap-1.5">
        <AlertTriangle size={13} className="shrink-0 mt-0.5" />
        <span>Por privacidad, los diagnósticos de otros especialistas muestran únicamente el código. La descripción se reserva al especialista que lo registró y a Auditoría/Administración.</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-gray-400 border-b">
              <th className="py-2 pr-3">Sistema</th>
              <th className="py-2 pr-3">Código</th>
              <th className="py-2 pr-3">Descripción</th>
              <th className="py-2 pr-3">Estado</th>
              <th className="py-2 pr-3">Especialidad</th>
              <th className="py-2">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {diagnosticos.map((d) => (
              <tr key={d.id} className="border-b last:border-0">
                <td className="py-2 pr-3"><span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{d.sistema}</span></td>
                <td className="py-2 pr-3 font-mono text-xs text-blue-700">{d.codigo}</td>
                <td className="py-2 pr-3 text-gray-700">{d.descripcion || <span className="text-gray-400 italic">Reservado</span>}</td>
                <td className="py-2 pr-3">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${d.estado === 'PRESUNTIVO' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                    {d.estado === 'PRESUNTIVO' ? 'Presuntivo' : 'Definitivo'}
                  </span>
                </td>
                <td className="py-2 pr-3 text-xs text-gray-500">{d.especialidad || '—'}</td>
                <td className="py-2 text-xs text-gray-500">{fmtFecha(d.fecha)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
