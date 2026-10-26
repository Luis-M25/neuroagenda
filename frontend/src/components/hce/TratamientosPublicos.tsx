'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';
import { ChevronDown, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { TablaEscala } from './PlanTratamientoForm';

const niv = (obj: string, obs: string) => ({ objetivo: obj || '', observacion: obs || '' });

function objetivoToDraft(o: any) {
  return {
    numero: o.numero,
    descripcion: o.descripcion || '',
    niveles: {
      2: niv(o.escalaMas2, o.obsMas2),
      1: niv(o.escalaMas1, o.obsMas1),
      0: niv(o.escalaCero, o.obsCero),
      [-1]: niv(o.escalaMenos1, o.obsMenos1),
      [-2]: niv(o.escalaMenos2, o.obsMenos2),
    },
  };
}

// HCE público: muestra los tratamientos del paciente de TODAS las especialidades
// y su estado (sin finalizar / finalizado). Si está finalizado, solo la escala.
export default function TratamientosPublicos({
  pacienteId,
  miEspecialistaId,
}: {
  pacienteId: string;
  miEspecialistaId?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [filtro, setFiltro] = useState<'TODOS' | 'MIOS' | 'OTROS'>('TODOS');
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const load = async () => {
    if (loaded) {
      setOpen(!open);
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient<any[]>(`/hce/paciente/${pacienteId}/tratamientos`);
      setItems(res || []);
      setLoaded(true);
      setOpen(true);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleHidden = (id: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const esMio = (t: any) => !!miEspecialistaId && (t.especialistaId || null) === miEspecialistaId;

  const itemsFiltrados = items.filter((t) => {
    if (filtro === 'MIOS') return esMio(t);
    if (filtro === 'OTROS') return !esMio(t);
    return true;
  });
  const countMios = items.filter(esMio).length;

  return (
    <div className="border rounded-xl">
      <button
        onClick={load}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl"
      >
        <span className="text-sm font-semibold text-gray-700">
          Ver tratamientos de todas las especialidades
        </span>
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2 border-t pt-3">
          {loading && <p className="text-xs text-gray-400">Cargando tratamientos...</p>}
          {miEspecialistaId && !loading && items.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {(
                [
                  ['TODOS', `Todos (${items.length})`],
                  ['MIOS', `Míos (${countMios})`],
                  ['OTROS', `Otros (${items.length - countMios})`],
                ] as const
              ).map(([v, label]) => (
                <button
                  key={v}
                  onClick={() => setFiltro(v)}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors ${
                    filtro === v
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          {!loading && itemsFiltrados.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-2">
              {items.length === 0 ? 'Sin tratamientos registrados' : 'Sin tratamientos para este filtro'}
            </p>
          )}
          {itemsFiltrados.map((t: any) => {
            const isHidden = hidden.has(t.consultaId);
            const plan = t.planTratamiento;
            const finalizado = plan?.estado === 'FINALIZADO';
            return (
              <div key={t.consultaId} className="border rounded-lg p-2.5 bg-gray-50/50">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-gray-700">{t.especialidad || '—'}</span>
                  <span className="text-[11px] text-gray-400">
                    {t.fecha ? new Date(t.fecha).toLocaleDateString('es-EC') : ''}
                    {t.especialista ? ` · ${t.especialista}` : ''}
                  </span>
                  {plan ? (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        finalizado ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {finalizado ? 'Finalizado' : 'Sin finalizar'}
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                      Sin plan neuropsicológico
                    </span>
                  )}
                  <button
                    onClick={() => toggleHidden(t.consultaId)}
                    className="ml-auto inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-800"
                  >
                    {isHidden ? <Eye size={12} /> : <EyeOff size={12} />}
                    {isHidden ? 'Mostrar' : 'Ocultar'}
                  </button>
                  {miEspecialistaId && esMio(t) && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 font-semibold">
                      Mío
                    </span>
                  )}
                </div>

                {!isHidden && (
                  <div className="mt-2 space-y-1.5">
                    {t.prescripciones?.length > 0 && (
                      <div className="text-xs text-gray-600">
                        <p className="font-medium text-gray-500">Prescripciones:</p>
                        {t.prescripciones.map((p: any) => (
                          <p key={p.id}>
                            <strong>{p.medicamento}</strong> {p.dosis} — {p.frecuencia}
                          </p>
                        ))}
                      </div>
                    )}
                    {plan && (plan.objetivos || []).length > 0 && (
                      <div className="space-y-1.5">
                        {(plan.objetivos || []).map((o: any) => (
                          <div key={o.numero} className="text-xs bg-white border rounded p-1.5">
                            <p className="font-medium">
                              Objetivo {o.numero}: {o.descripcion}
                            </p>
                            <div className="mt-1">
                              <TablaEscala draft={objetivoToDraft(o) as any} readOnly resultado={o.resultadoFinal} />
                            </div>
                            {finalizado && o.resultadoFinal !== null && o.resultadoFinal !== undefined && (
                              <p className="mt-1">
                                Resultado:{' '}
                                <strong className="text-green-700">
                                  {o.resultadoFinal > 0 ? `+${o.resultadoFinal}` : o.resultadoFinal}
                                </strong>
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
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
