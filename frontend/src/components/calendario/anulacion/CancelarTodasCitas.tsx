'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { citasApi } from '@/lib/api-client';
import { toast } from 'sonner';
import { Ban, AlertTriangle, Clock, User, Stethoscope, CheckCircle2, ArrowLeft } from 'lucide-react';
import { getSpecialistVisuals } from './specialistColors';

interface CitaDia {
  id: string;
  paciente: string;
  horaInicio: string;
  horaFin: string;
  especialidad: string;
  estado: string;
  especialistaId: string;
  especialista: string;
}

interface Props {
  fecha: string;
  allCitas: CitaDia[];
  onBack: () => void;
  onComplete: () => void;
}

function horaLabel(hora: string): string {
  return hora?.substring(0, 5) || hora;
}

function fechaLabel(fecha: string): string {
  return new Date(`${fecha}T12:00:00`).toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export default function CancelarTodasCitas({ fecha, allCitas, onBack, onComplete }: Props) {
  const [step, setStep] = useState<'confirmar' | 'procesando'>('confirmar');
  const [progreso, setProgreso] = useState({ actual: 0, total: 0 });

  const visualMap = useMemo(() => {
    const list: Array<{ id: string; nombre: string }> = [];
    const seen = new Set<string>();
    for (const c of allCitas) {
      if (!seen.has(c.especialistaId)) {
        seen.add(c.especialistaId);
        list.push({ id: c.especialistaId, nombre: c.especialista });
      }
    }
    return getSpecialistVisuals(list);
  }, [allCitas]);

  const citasAgrupadas = useMemo(() => {
    const map = new Map<string, CitaDia[]>();
    for (const c of allCitas) {
      const key = c.especialistaId;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[1][0].especialista.localeCompare(b[1][0].especialista))
      .map(([espId, citas]) => ({
        espId,
        especialista: citas[0].especialista,
        especialidad: citas[0].especialidad,
        citas: citas.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio)),
      }));
  }, [allCitas]);

  const handleCancelar = async () => {
    setStep('procesando');
    setProgreso({ actual: 0, total: allCitas.length });

    let ok = 0;
    for (let i = 0; i < allCitas.length; i++) {
      try {
        await citasApi.updateEstado(allCitas[i].id, {
          estado: 'CANCELADA',
          motivoCancelacion: 'Día no laborable',
          canceladaPor: 'ADMIN',
        });
        ok++;
      } catch {}
      setProgreso({ actual: i + 1, total: allCitas.length });
    }

    if (ok === allCitas.length) {
      toast.success(`${ok} citas canceladas correctamente`);
    } else {
      toast.warning(`${ok} de ${allCitas.length} citas canceladas`);
    }
    onComplete();
  };

  return (
    <div className="space-y-4">
      <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle size={20} className="text-red-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-red-800">Cancelar todas las citas del día</p>
          <p className="text-xs text-red-600 mt-0.5">
            Se cancelarán todas las {allCitas.length} citas activas del {fechaLabel(fecha)}. Esta acción no se puede deshacer.
          </p>
        </div>
      </div>

      {step === 'procesando' && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-neutral-500">
            <span>Cancelando {progreso.actual} de {progreso.total} citas...</span>
            <span className="font-semibold text-neutral-700">
              {progreso.total > 0 ? Math.round((progreso.actual / progreso.total) * 100) : 0}%
            </span>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-red-600 h-2 rounded-full transition-all duration-200"
              style={{ width: `${progreso.total > 0 ? (progreso.actual / progreso.total) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      <div className="border rounded-xl overflow-hidden">
        {citasAgrupadas.map((grupo) => {
          const visual = visualMap.get(grupo.espId) || { color: '#6b7280', badge: '?' };
          return (
            <div key={grupo.espId} className="border-b last:border-b-0">
              <div className="px-3 py-2 bg-neutral-50 flex items-center gap-2">
                <span
                  className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                   style={{ backgroundColor: visual.color }}
                >
                  {visual.badge}
                </span>
                <span className="text-xs font-semibold text-neutral-700">{grupo.especialista}</span>
                <span className="text-[10px] text-neutral-400">{grupo.especialidad}</span>
                <span className="ml-auto text-[10px] font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                  {grupo.citas.length} cita(s)
                </span>
              </div>
              <div className="divide-y">
                {grupo.citas.map((c) => (
                  <div key={c.id} className="px-3 py-2 flex items-center gap-2 text-xs">
                    <Clock size={12} className="text-neutral-400 shrink-0" />
                    <span className="font-medium min-w-[50px]">{horaLabel(c.horaInicio)}</span>
                    <span className="text-neutral-700">{c.paciente}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {citasAgrupadas.length === 0 && (
          <div className="px-4 py-6 text-center text-sm text-neutral-400">
            No hay citas activas para este día
          </div>
        )}
      </div>

      <div className="flex justify-between pt-2">
        <button
          onClick={onBack}
          disabled={step === 'procesando'}
          className="px-4 py-2 text-sm font-medium text-neutral-600 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-50 inline-flex items-center gap-1.5"
        >
          <ArrowLeft size={14} /> Volver
        </button>
        <button
          onClick={handleCancelar}
          disabled={allCitas.length === 0 || step === 'procesando'}
          className="px-5 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 inline-flex items-center gap-1.5"
        >
          <Ban size={16} />
          {step === 'procesando' ? 'Cancelando...' : `Cancelar ${allCitas.length} citas`}
        </button>
      </div>
    </div>
  );
}
