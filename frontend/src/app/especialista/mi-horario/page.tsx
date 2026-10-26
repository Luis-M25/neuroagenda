'use client';

import { useEffect, useState } from 'react';
import { horariosApi } from '@/lib/api-client';
import { authApi } from '@/lib/api-client';
import { DIAS_SEMANA } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Clock } from 'lucide-react';

export default function MiHorarioPage() {
  const [horarios, setHorarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const profile = await authApi.profile();
        const espId = profile?.especialista?.id;
        if (espId) {
          const data = await horariosApi.getByEspecialista(espId, true);
          setHorarios(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
    </div>
  );

  const grouped: Record<number, any[]> = {};
  for (let i = 0; i < 7; i++) grouped[i] = [];
  horarios.forEach(h => {
    if (grouped[h.diaSemana]) grouped[h.diaSemana].push(h);
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Mi Horario" description="Horarios registrados por administración" />

      {horarios.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-neutral-100">
          <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No tienes horarios asignados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 0].map(dia => {
            const slots = grouped[dia];
            if (!slots || slots.length === 0) return null;

            return (
              <div key={dia} className="bg-white rounded-xl border border-neutral-100 p-5">
                <h3 className="font-semibold text-gray-900 mb-3">{DIAS_SEMANA[dia]}</h3>
                <div className="space-y-2">
                  {slots
                    .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
                    .map(h => (
                      <div key={h.id}
                        className={`p-3 rounded-lg text-sm ${h.esFeriado ? 'bg-red-50 text-red-600' : h.activo ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{h.horaInicio} - {h.horaFin}</span>
                          <span className="text-xs">{h.duracionMinutos} min</span>
                        </div>
                        {h.observaciones && <p className="text-xs mt-1 opacity-75">{h.observaciones}</p>}
                        {h.esFeriado && <p className="text-xs mt-1 font-medium">🚫 Feriado</p>}
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
