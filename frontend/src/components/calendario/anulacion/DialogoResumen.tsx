'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  AlertTriangle, CheckCircle2, HelpCircle, XCircle, ArrowLeft, Ban,
  Clock, User, Stethoscope,
} from 'lucide-react';
import type { CitaConReagendamiento } from './ListaCitasReagendar';
import { getSpecialistVisuals } from './specialistColors';

interface Props {
  reagendadas: CitaConReagendamiento[];
  canceladas: CitaConReagendamiento[];
  pendientes: CitaConReagendamiento[];
  onRegresar: () => void;
  onCancelarPendientes: () => void;
  onConfirmar: () => void;
  onClose: () => void;
  procesando: boolean;
}

function horaLabel(hora: string): string {
  return hora?.substring(0, 5) || hora;
}

function fechaLabel(fecha: string): string {
  return new Date(`${fecha}T12:00:00`).toLocaleDateString('es-EC', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function DialogoResumen({
  reagendadas,
  canceladas,
  pendientes,
  onRegresar,
  onCancelarPendientes,
  onConfirmar,
  onClose,
  procesando,
}: Props) {
  const [mostrandoCancelacion, setMostrandoCancelacion] = useState(false);
  const hayPendientes = pendientes.length > 0;

  const visualMap = useMemo(() => {
    const all: Array<{ id: string; nombre: string }> = [];
    const seen = new Set<string>();
    for (const c of [...reagendadas, ...canceladas, ...pendientes]) {
      if (!seen.has(c.cita.especialistaId)) {
        seen.add(c.cita.especialistaId);
        all.push({ id: c.cita.especialistaId, nombre: c.cita.especialista });
      }
    }
    return getSpecialistVisuals(all);
  }, [reagendadas, canceladas, pendientes]);

  const todasACancelar = [...canceladas, ...pendientes];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b bg-neutral-50">
          <div>
            <h3 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-primary-600" />
              {mostrandoCancelacion ? 'Confirmar anulación de citas' : hayPendientes ? 'Resumen de reagendamiento' : 'Confirmar cambios'}
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">Revise los detalles antes de continuar</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-200 text-neutral-500">
            <XCircle size={20} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {mostrandoCancelacion ? (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-start gap-2">
                <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    Se anularán {todasACancelar.length} cita(s)
                  </p>
                  <p className="text-xs text-red-600 mt-0.5">
                    Esta acción no se puede deshacer. Las citas serán marcadas como CANCELADA.
                  </p>
                </div>
              </div>

              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-neutral-50 text-left">
                      <th className="px-3 py-2 text-xs font-semibold text-neutral-600">Paciente</th>
                      <th className="px-3 py-2 text-xs font-semibold text-neutral-600">Especialista</th>
                      <th className="px-3 py-2 text-xs font-semibold text-neutral-600">Hora</th>
                      <th className="px-3 py-2 text-xs font-semibold text-neutral-600">Estado previo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todasACancelar.map((c) => {
                      const visual = visualMap.get(c.cita.especialistaId) || { color: '#6b7280', badge: '?' };
                      return (
                        <tr key={c.cita.id} className="border-t">
                          <td className="px-3 py-2 font-medium text-neutral-900 text-xs">{c.cita.paciente}</td>
                          <td className="px-3 py-2 text-xs">
                            <div className="flex items-center gap-1">
                              <span className="w-4 h-4 rounded flex items-center justify-center text-[8px] font-bold text-white shrink-0"                               style={{ backgroundColor: visual.color }}
                            >
                              {visual.badge}
                              </span>
                              <span className="text-neutral-600 truncate">{c.cita.especialista}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-xs text-neutral-600">{horaLabel(c.cita.horaInicio)}</td>
                          <td className="px-3 py-2">
                            <span className={cn(
                              'px-1.5 py-0.5 rounded text-[10px] font-medium',
                              c.estadoReagendamiento === 'cancelada'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-neutral-200 text-neutral-600'
                            )}>
                              {c.estadoReagendamiento === 'cancelada' ? 'Ya cancelada' : 'Pendiente'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setMostrandoCancelacion(false)}
                  className="px-4 py-2 text-sm font-medium text-neutral-600 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 inline-flex items-center gap-1.5"
                >
                  <ArrowLeft size={14} /> Volver
                </button>
                <button
                  onClick={() => { onCancelarPendientes(); }}
                  disabled={procesando}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <Ban size={14} />
                  {procesando ? 'Anulando...' : `Anular ${todasACancelar.length} citas`}
                </button>
              </div>
            </div>
          ) : (
            <>
              {hayPendientes && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                  <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-900">
                      {pendientes.length} cita(s) sin reagendar
                    </p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Estas citas aún no tienen un nuevo horario asignado. Puede regresar a reagendarlas o anularlas.
                    </p>
                  </div>
                </div>
              )}

              {reagendadas.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <HelpCircle size={14} className="text-purple-600" />
                    <p className="text-sm font-semibold text-purple-800">Citas reagendadas ({reagendadas.length})</p>
                  </div>
                  <div className="border rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-purple-50 text-left">
                          <th className="px-3 py-2 text-xs font-semibold text-purple-800">Paciente</th>
                          <th className="px-3 py-2 text-xs font-semibold text-purple-800">Especialista</th>
                          <th className="px-3 py-2 text-xs font-semibold text-purple-800">Hora original</th>
                          <th className="px-3 py-2 text-xs font-semibold text-purple-800">Nueva fecha</th>
                          <th className="px-3 py-2 text-xs font-semibold text-purple-800">Nueva hora</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reagendadas.map((c) => {
                          const visual = visualMap.get(c.cita.especialistaId) || { color: '#6b7280', badge: '?' };
                          return (
                            <tr key={c.cita.id} className="border-t bg-purple-50/30">
                              <td className="px-3 py-2 font-medium text-neutral-900 text-xs">{c.cita.paciente}</td>
                              <td className="px-3 py-2 text-xs">
                                <div className="flex items-center gap-1">
                                  <span className="w-4 h-4 rounded flex items-center justify-center text-[8px] font-bold text-white shrink-0"                                   style={{ backgroundColor: visual.color }}
                                  >
                                    {visual.badge}
                                  </span>
                                  <span className="text-neutral-600 truncate">{c.cita.especialista}</span>
                                </div>
                              </td>
                              <td className="px-3 py-2 text-xs text-neutral-600">{horaLabel(c.cita.horaInicio)}</td>
                              <td className="px-3 py-2 text-xs font-medium text-purple-700">{c.nuevaFecha ? fechaLabel(c.nuevaFecha) : '-'}</td>
                              <td className="px-3 py-2 text-xs font-medium text-purple-700">{c.nuevaHoraInicio ? horaLabel(c.nuevaHoraInicio) : '-'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {canceladas.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle size={14} className="text-red-600" />
                    <p className="text-sm font-semibold text-red-800">Citas a anular ({canceladas.length})</p>
                  </div>
                  <div className="border rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-red-50 text-left">
                          <th className="px-3 py-2 text-xs font-semibold text-red-800">Paciente</th>
                          <th className="px-3 py-2 text-xs font-semibold text-red-800">Especialista</th>
                          <th className="px-3 py-2 text-xs font-semibold text-red-800">Hora</th>
                        </tr>
                      </thead>
                      <tbody>
                        {canceladas.map((c) => (
                          <tr key={c.cita.id} className="border-t bg-red-50/30">
                            <td className="px-3 py-2 font-medium text-neutral-900 text-xs">{c.cita.paciente}</td>
                            <td className="px-3 py-2 text-xs text-neutral-600">{c.cita.especialista}</td>
                            <td className="px-3 py-2 text-xs text-neutral-600">{horaLabel(c.cita.horaInicio)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {pendientes.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={14} className="text-neutral-500" />
                    <p className="text-sm font-semibold text-neutral-700">Citas sin reagendar ({pendientes.length})</p>
                  </div>
                  <div className="border rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-neutral-100 text-left">
                          <th className="px-3 py-2 text-xs font-semibold text-neutral-600">Paciente</th>
                          <th className="px-3 py-2 text-xs font-semibold text-neutral-600">Especialista</th>
                          <th className="px-3 py-2 text-xs font-semibold text-neutral-600">Hora</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendientes.map((c) => (
                          <tr key={c.cita.id} className="border-t bg-neutral-100/30">
                            <td className="px-3 py-2 font-medium text-neutral-900 text-xs">{c.cita.paciente}</td>
                            <td className="px-3 py-2 text-xs text-neutral-600">{c.cita.especialista}</td>
                            <td className="px-3 py-2 text-xs text-neutral-600">{horaLabel(c.cita.horaInicio)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                {hayPendientes && (
                  <>
                    <button
                      onClick={onRegresar}
                      className="px-4 py-2 text-sm font-medium text-neutral-600 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 inline-flex items-center gap-1.5"
                    >
                      <ArrowLeft size={14} /> Regresar a reagendar
                    </button>
                    <button
                      onClick={() => setMostrandoCancelacion(true)}
                      className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 inline-flex items-center gap-1.5"
                    >
                      <Ban size={14} /> Anular citas no reagendadas
                    </button>
                  </>
                )}
                {!hayPendientes && (
                  <>
                    <button
                      onClick={onRegresar}
                      className="px-4 py-2 text-sm font-medium text-neutral-600 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 inline-flex items-center gap-1.5"
                    >
                      <ArrowLeft size={14} /> Regresar
                    </button>
                    <button
                      onClick={onConfirmar}
                      disabled={procesando}
                      className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 inline-flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={14} />
                      {procesando ? 'Aplicando...' : 'Confirmar y aplicar cambios'}
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
