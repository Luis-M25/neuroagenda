'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { CalendarCheck, Download, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { reportesApi } from '@/lib/api-client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import type { AsistenciaPacienteReporte, AsistenciasFiltros } from '@/types/reportes';
import { ReportPagination } from './ReportPagination';
import { estadoLabel, estadoVariant, fieldClass, formatFechaEc } from './reportes.utils';

type FilterState = Omit<AsistenciasFiltros, 'page' | 'limit' | 'pacienteId'>;

const EMPTY_FILTERS: FilterState = {
  q: '',
  estado: '',
  fechaInicio: '',
  fechaFin: '',
};

const ESTADOS = [
  'PENDIENTE',
  'CONFIRMADA',
  'EN_ESPERA',
  'EN_ATENCION',
  'ATENDIDA',
  'NO_ASISTIO',
  'CANCELADA',
];

export function AsistenciasPacienteTab() {
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [items, setItems] = useState<AsistenciaPacienteReporte[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await reportesApi.getAsistenciasPorPaciente({
        ...appliedFilters,
        page,
        limit,
      });
      setItems(data.items);
      setTotal(data.total);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page, limit]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filtrar = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    setAppliedFilters({ ...filters });
  };

  const exportar = async () => {
    setExporting(true);
    try {
      await reportesApi.exportarCsv('asistencias-por-paciente', filters);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={filtrar}>
        <Card>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
            <div className="xl:col-span-2">
              <label className="mb-1 block text-xs font-medium text-neutral-600">Paciente o identificación</label>
              <input
                value={filters.q || ''}
                onChange={(event) => setFilters({ ...filters, q: event.target.value })}
                placeholder="Nombre, apellido o cédula"
                className={fieldClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600">Estado</label>
              <select value={filters.estado || ''} onChange={(event) => setFilters({ ...filters, estado: event.target.value })} className={fieldClass}>
                <option value="">Todos</option>
                {ESTADOS.map((estado) => <option key={estado} value={estado}>{estadoLabel(estado)}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600">Desde</label>
              <input type="date" value={filters.fechaInicio || ''} onChange={(event) => setFilters({ ...filters, fechaInicio: event.target.value })} className={fieldClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600">Hasta</label>
              <input type="date" value={filters.fechaFin || ''} onChange={(event) => setFilters({ ...filters, fechaFin: event.target.value })} className={fieldClass} />
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit" loading={loading} icon={<Filter size={14} />} size="sm">Filtrar</Button>
              <Button type="button" onClick={exportar} loading={exporting} icon={<Download size={14} />} variant="outline" size="sm">CSV</Button>
            </div>
          </div>
        </Card>
      </form>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50/50 text-left">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Paciente</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Identificación</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Fecha</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Hora</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Especialidad</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Especialista</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-10 text-center"><div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" /></td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={7} className="p-12"><EmptyState icon={<CalendarCheck size={22} />} title="Sin registros de asistencia" description="No hay citas que coincidan con los filtros." /></td></tr>
              ) : items.map((item) => (
                <tr key={item.id} className="border-t border-neutral-50 transition-colors hover:bg-neutral-50/50">
                  <td className="px-4 py-3 font-medium text-neutral-900">{item.paciente.nombres} {item.paciente.apellidos}</td>
                  <td className="px-4 py-3 text-neutral-600">{item.paciente.numeroIdentificacion}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-neutral-600">{formatFechaEc(item.fecha)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-neutral-600">{item.horaInicio}–{item.horaFin}</td>
                  <td className="px-4 py-3 text-neutral-600">{item.especialidad}</td>
                  <td className="px-4 py-3 text-neutral-600">{item.especialista.nombres} {item.especialista.apellidos}</td>
                  <td className="px-4 py-3"><Badge variant={estadoVariant(item.estado)}>{estadoLabel(item.estado)}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ReportPagination page={page} limit={limit} total={total} onPageChange={setPage} disabled={loading} />
      </Card>
    </div>
  );
}
