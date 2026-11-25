'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { reportesApi } from '@/lib/api-client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import type { CitasPorEspecialistaReporte } from '@/types/reportes';
import { fieldClass } from './reportes.utils';

export function CitasEspecialistaTab() {
  const [items, setItems] = useState<CitasPorEspecialistaReporte[]>([]);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const maxCitas = useMemo(() => Math.max(...items.map((item) => item.total), 1), [items]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await reportesApi.getCitasPorEspecialista({
        ...(fechaInicio ? { fechaInicio } : {}),
        ...(fechaFin ? { fechaFin } : {}),
      });
      setItems(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // La primera carga usa los filtros vacíos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exportar = async () => {
    setExporting(true);
    try {
      await reportesApi.exportarCsv('citas-por-especialista', { fechaInicio, fechaFin });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Desde</label>
            <input type="date" value={fechaInicio} onChange={(event) => setFechaInicio(event.target.value)} className={fieldClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Hasta</label>
            <input type="date" value={fechaFin} onChange={(event) => setFechaFin(event.target.value)} className={fieldClass} />
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={loadData} loading={loading} icon={<Filter size={14} />}>Filtrar</Button>
            <Button onClick={exportar} loading={exporting} icon={<Download size={14} />} variant="outline">CSV</Button>
          </div>
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" /></div>
        ) : items.length === 0 ? (
          <EmptyState title="Sin datos disponibles" />
        ) : (
          <>
            <h3 className="mb-4 font-semibold text-neutral-900">Citas por especialista</h3>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.especialistaId}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-neutral-700">{item.especialista}</span>
                    <span className="text-neutral-500">{item.total} citas</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-neutral-100">
                    <div className="h-3 rounded-full bg-primary-500 transition-all duration-500" style={{ width: `${(item.total / maxCitas) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50/50 text-left">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Especialista</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Especialidad</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Total</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Pendientes</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Atendidas</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Canceladas</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">No asistió</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.especialistaId} className="border-t border-neutral-50 transition-colors hover:bg-neutral-50/50">
                      <td className="px-4 py-3 font-medium text-neutral-900">{item.especialista}</td>
                      <td className="px-4 py-3 text-neutral-600">{item.especialidad}</td>
                      <td className="px-4 py-3 font-bold text-primary-600">{item.total}</td>
                      <td className="px-4 py-3"><Badge variant="warning">{item.pendientes}</Badge></td>
                      <td className="px-4 py-3"><Badge variant="success">{item.atendidas}</Badge></td>
                      <td className="px-4 py-3"><Badge variant="danger">{item.canceladas}</Badge></td>
                      <td className="px-4 py-3"><Badge variant="danger">{item.noAsistieron}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
