'use client';

import { useEffect, useState, useCallback } from 'react';
import { reportesApi, especialistasApi } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { AlertTriangle, BarChart3, Download, Filter } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';

export default function ReportesPage() {
  const [tab, setTab] = useState<'inasistencias' | 'citas'>('inasistencias');
  const [loading, setLoading] = useState(false);

  // Inasistencias
  const [inasistencias, setInasistencias] = useState<any[]>([]);
  const [especialidades, setEspecialidades] = useState<string[]>([]);
  const [filtroEsp, setFiltroEsp] = useState('');
  const [filtroDesde, setFiltroDesde] = useState('');
  const [filtroHasta, setFiltroHasta] = useState('');

  // Citas por especialista
  const [citasPorEsp, setCitasPorEsp] = useState<any[]>([]);
  const [filtroCitasDesde, setFiltroCitasDesde] = useState('');
  const [filtroCitasHasta, setFiltroCitasHasta] = useState('');

  useEffect(() => {
    especialistasApi.getEspecialidades()
      .then(setEspecialidades)
      .catch((e) => console.error('Error cargando especialidades:', e));

    loadInasistencias();
    loadCitasPorEspecialista();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loaders con useCallback declarados mas abajo
  }, [filtroEsp, filtroDesde, filtroHasta, filtroCitasDesde, filtroCitasHasta]);

  const loadInasistencias = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filtroEsp) params.especialidad = filtroEsp;
      if (filtroDesde) params.desde = filtroDesde;
      if (filtroHasta) params.hasta = filtroHasta;
      const data = await reportesApi.getNoAsistidos(params);
      setInasistencias(data);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [filtroEsp, filtroDesde, filtroHasta]);

  const loadCitasPorEspecialista = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filtroCitasDesde) params.desde = filtroCitasDesde;
      if (filtroCitasHasta) params.hasta = filtroCitasHasta;
      const data = await reportesApi.getCitasPorEspecialista(params);
      setCitasPorEsp(data);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [filtroCitasDesde, filtroCitasHasta]);

  const maxCitas = Math.max(...citasPorEsp.map((c: any) => c.total || 0), 1);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Reportes" description="Estadisticas y reportes del sistema" />

      <div className="flex gap-1 bg-neutral-100 rounded-xl p-1 w-fit">
        <button onClick={() => setTab('inasistencias')}
          className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all', tab === 'inasistencias' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-700')}>
          <AlertTriangle size={16} /> Inasistencias</button>
        <button onClick={() => setTab('citas')}
          className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all', tab === 'citas' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-700')}>
          <BarChart3 size={16} /> Citas por Especialista</button>
      </div>

      {/* Tab: Inasistencias */}
      {tab === 'inasistencias' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-neutral-100 p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Especialidad</label>
                <select value={filtroEsp} onChange={(e) => setFiltroEsp(e.target.value)} className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-400">
                  <option value="">Todas</option>
                  {especialidades.map((e) => <option key={e} value={e}>{e}</option>)}</select> </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Desde</label>
                <input type="date" value={filtroDesde} onChange={(e) => setFiltroDesde(e.target.value)} className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-400" /></div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Hasta</label>
                <input type="date" value={filtroHasta} onChange={(e) => setFiltroHasta(e.target.value)} className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-400" /></div>
              <div className="flex items-end gap-2">
                <Button onClick={loadInasistencias} icon={<Filter size={14} />} size="sm">Filtrar</Button>
                <Button onClick={() => reportesApi.exportarCsv('no-asistidos', { especialidad: filtroEsp, fechaInicio: filtroDesde, fechaFin: filtroHasta })} icon={<Download size={14} />} variant="outline" size="sm">CSV</Button></div></div></div>

          <Card padding="none">
            <div className="overflow-x-auto"><table className="w-full text-sm"><thead>
              <tr className="text-left border-b border-neutral-100 bg-neutral-50/50">
                <th className="px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Paciente</th>
                <th className="px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Identificacion</th>
                <th className="px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Especialidad</th>
                <th className="px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Contador</th>
                <th className="px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Severidad</th>
                <th className="px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Ultima</th>
                <th className="px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Estado</th></tr></thead><tbody>
              {loading ? <tr><td colSpan={7} className="p-8 text-center"><div className="animate-spin h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full mx-auto" /></td></tr>
              : inasistencias.length === 0 ? <tr><td colSpan={7} className="p-12"><EmptyState title="Sin inasistencias" /></td></tr>
              : inasistencias.map((i: any) => {
                const p = i.paciente || {}; const c = i.contador || 0;
                const sev = c === 0 ? 'Baja' : c <= 2 ? 'Media' : c <= 4 ? 'Alta' : 'Critica';
                const sevVariant: any = c <= 1 ? 'info' : c <= 3 ? 'warning' : 'danger';
                return (
                  <tr key={i.id} className="border-t border-neutral-50 hover:bg-neutral-50/50 transition-colors">
                    <td className="px-5 py-4 font-medium text-neutral-900">{p.nombres} {p.apellidos}</td>
                    <td className="px-5 py-4 text-neutral-600">{p.numeroIdentificacion}</td>
                    <td className="px-5 py-4 text-neutral-600">{i.especialidad}</td>
                    <td className="px-5 py-4"><Badge variant={sevVariant}>{c}</Badge></td>
                    <td className="px-5 py-4"><Badge variant={sevVariant}>{sev}</Badge></td>
                    <td className="px-5 py-4 text-neutral-500 text-xs">{i.ultimaInasistencia ? new Date(i.ultimaInasistencia).toLocaleDateString('es-EC') : '-'}</td>
                    <td className="px-5 py-4"><Badge variant={p.bloqueado ? 'danger' : 'success'}>{p.bloqueado ? 'Bloqueado' : 'Activo'}</Badge></td></tr>);})}</tbody></table></div></Card>
        </div>
      )}

      {/* Tab: Citas por Especialista */}
      {tab === 'citas' && (
        <div className="space-y-4">
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Desde</label>
                <input type="date" value={filtroCitasDesde} onChange={(e) => setFiltroCitasDesde(e.target.value)} className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Hasta</label>
                <input type="date" value={filtroCitasHasta} onChange={(e) => setFiltroCitasHasta(e.target.value)} className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-400" />
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={loadCitasPorEspecialista} icon={<Filter size={14} />}>Filtrar</Button>
                <Button onClick={() => reportesApi.exportarCsv('citas-por-especialista', { fechaInicio: filtroCitasDesde, fechaFin: filtroCitasHasta })} icon={<Download size={14} />} variant="outline">CSV</Button>
              </div>
            </div>
          </Card>

          <Card>
            {loading ? <div className="flex justify-center py-8"><div className="animate-spin h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full" /></div>
            : citasPorEsp.length === 0 ? <EmptyState title="Sin datos disponibles" />
            : (<>
              <h3 className="font-semibold text-neutral-900 mb-4">Citas por Especialista</h3>
              <div className="space-y-3">
                {citasPorEsp.map((item: any, idx: number) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-neutral-700">{item.especialista}</span>
                      <span className="text-neutral-500">{item.total} citas</span>
                    </div>
                    <div className="w-full bg-neutral-100 rounded-full h-3">
                      <div className="bg-primary-500 h-3 rounded-full transition-all duration-500" style={{ width: `${(item.total / maxCitas) * 100}%` }} />
                    </div>
                  </div>))}
              </div>
              <div className="overflow-x-auto mt-6">
                <table className="w-full text-sm">
                  <thead><tr className="text-left border-b border-neutral-100 bg-neutral-50/50">
                    <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Especialista</th>
                    <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Especialidad</th>
                    <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Total</th>
                    <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Pendientes</th>
                    <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Atendidas</th>
                    <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Canceladas</th>
                  </tr></thead>
                  <tbody>
                    {citasPorEsp.map((item: any, idx: number) => (
                      <tr key={idx} className="border-t border-neutral-50 hover:bg-neutral-50/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-neutral-900">{item.especialista}</td>
                        <td className="px-4 py-3 text-neutral-600">{item.especialidad}</td>
                        <td className="px-4 py-3 font-bold text-primary-600">{item.total}</td>
                        <td className="px-4 py-3"><Badge variant="warning">{item.pendientes || 0}</Badge></td>
                        <td className="px-4 py-3"><Badge variant="success">{item.atendidas || 0}</Badge></td>
                        <td className="px-4 py-3"><Badge variant="danger">{item.canceladas || 0}</Badge></td>
                      </tr>))}
                  </tbody></table></div></>)}
          </Card></div>)}
    </div>
  );
}
