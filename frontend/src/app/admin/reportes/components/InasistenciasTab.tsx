'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Download, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { reportesApi, especialistasApi } from '@/lib/api-client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import type { ReporteNoAsistidos } from '@/types/reportes';
import { fieldClass, formatFechaEc } from './reportes.utils';

export function InasistenciasTab() {
  const [items, setItems] = useState<ReporteNoAsistidos[]>([]);
  const [especialidades, setEspecialidades] = useState<string[]>([]);
  const [especialidad, setEspecialidad] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await reportesApi.getNoAsistidos({
        ...(especialidad ? { especialidad } : {}),
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
    especialistasApi.getEspecialidades()
      .then(setEspecialidades)
      .catch((error) => console.error('Error cargando especialidades:', error));
    void loadData();
    // La primera carga usa los filtros vacíos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exportar = async () => {
    setExporting(true);
    try {
      await reportesApi.exportarCsv('no-asistidos', {
        especialidad,
        fechaInicio,
        fechaFin,
      });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Especialidad</label>
            <select value={especialidad} onChange={(event) => setEspecialidad(event.target.value)} className={fieldClass}>
              <option value="">Todas</option>
              {especialidades.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Desde</label>
            <input type="date" value={fechaInicio} onChange={(event) => setFechaInicio(event.target.value)} className={fieldClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Hasta</label>
            <input type="date" value={fechaFin} onChange={(event) => setFechaFin(event.target.value)} className={fieldClass} />
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={loadData} loading={loading} icon={<Filter size={14} />} size="sm">Filtrar</Button>
            <Button onClick={exportar} loading={exporting} icon={<Download size={14} />} variant="outline" size="sm">CSV</Button>
          </div>
        </div>
      </Card>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50/50 text-left">
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Paciente</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Identificación</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Especialidad</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Total</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Severidad</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Última</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center"><div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" /></td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="p-12"><EmptyState icon={<AlertTriangle size={20} />} title="Sin inasistencias" /></td></tr>
              ) : items.map((item) => {
                const count = item.total;
                const severity = count <= 1 ? 'Baja' : count <= 3 ? 'Media' : count <= 5 ? 'Alta' : 'Crítica';
                const variant = count <= 1 ? 'info' : count <= 3 ? 'warning' : 'danger';
                return (
                  <tr key={`${item.paciente.id}-${item.especialidad}`} className="border-t border-neutral-50 transition-colors hover:bg-neutral-50/50">
                    <td className="px-5 py-4 font-medium text-neutral-900">{item.paciente.nombres} {item.paciente.apellidos}</td>
                    <td className="px-5 py-4 text-neutral-600">{item.paciente.numeroIdentificacion}</td>
                    <td className="px-5 py-4 text-neutral-600">{item.especialidad}</td>
                    <td className="px-5 py-4"><Badge variant={variant}>{count}</Badge></td>
                    <td className="px-5 py-4"><Badge variant={variant}>{severity}</Badge></td>
                    <td className="px-5 py-4 text-xs text-neutral-500">{formatFechaEc(item.ultimaInasistencia)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
