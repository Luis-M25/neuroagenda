'use client';

import { useEffect, useState } from 'react';
import { auditoriaApi } from '@/lib/api-client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AuditoriaPage() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [limite] = useState(50);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    entidad: '',
    accion: '',
    desde: '',
    hasta: '',
  });

  const totalPaginas = Math.ceil(total / limite);

  const loadData = () => {
    setLoading(true);
    auditoriaApi.listar({
      ...filtros,
      entidad: filtros.entidad || undefined,
      accion: filtros.accion || undefined,
      desde: filtros.desde || undefined,
      hasta: filtros.hasta || undefined,
      pagina,
      limite,
    })
      .then((data) => {
        setItems(data.items);
        setTotal(data.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [pagina]);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setPagina(1);
    loadData();
  };

  const formatFecha = (f: string) => {
    return new Date(f).toLocaleString('es-EC', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const getAccionColor = (accion: string) => {
    if (accion.includes('CREAR')) return 'bg-green-100 text-green-800';
    if (accion.includes('ACTUALIZAR') || accion.includes('EDITAR')) return 'bg-blue-100 text-blue-800';
    if (accion.includes('ELIMINAR') || accion.includes('DESACTIVAR')) return 'bg-red-100 text-red-800';
    if (accion.includes('BLOQUEAR') || accion.includes('SUSPENDER')) return 'bg-orange-100 text-orange-800';
    if (accion.includes('DESBLOQUEAR') || accion.includes('ACTIVAR')) return 'bg-teal-100 text-teal-800';
    if (accion.includes('CANCELAR') || accion.includes('NO_ASISTIO')) return 'bg-red-100 text-red-800';
    if (accion.includes('INICIO_SESION')) return 'bg-purple-100 text-purple-800';
    if (accion.includes('REAGENDAR')) return 'bg-indigo-100 text-indigo-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Auditoría" description="Registro de actividades del sistema" />

      <form onSubmit={handleFilter} className="bg-white rounded-xl border border-neutral-100 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Entidad</label>
            <select
              value={filtros.entidad}
              onChange={(e) => setFiltros({ ...filtros, entidad: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Todas</option>
              <option value="Cita">Cita</option>
              <option value="Paciente">Paciente</option>
              <option value="Especialista">Especialista</option>
              <option value="Administracion">Administración</option>
              <option value="HorarioEspecialista">Horario</option>
              <option value="Usuario">Usuario</option>
              <option value="BloqueoGrupal">Bloqueo Grupal</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Acción</label>
            <input
              type="text"
              value={filtros.accion}
              onChange={(e) => setFiltros({ ...filtros, accion: e.target.value })}
              placeholder="Buscar acción..."
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
            <input
              type="date"
              value={filtros.desde}
              onChange={(e) => setFiltros({ ...filtros, desde: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
            <input
              type="date"
              value={filtros.hasta}
              onChange={(e) => setFiltros({ ...filtros, hasta: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" icon={<Search size={16} />}>Filtrar</Button>
          </div>
        </div>
      </form>

      <div className="bg-white rounded-xl border border-neutral-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No se encontraron registros de auditoría</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-neutral-50/50 text-neutral-500 border-b border-neutral-100">
                    <th className="p-3 font-medium">Fecha</th>
                    <th className="p-3 font-medium">Usuario</th>
                    <th className="p-3 font-medium">Rol</th>
                    <th className="p-3 font-medium">Acción</th>
                    <th className="p-3 font-medium">Entidad</th>
                    <th className="p-3 font-medium">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-t hover:bg-gray-50">
                      <td className="p-3 text-gray-500 whitespace-nowrap">{formatFecha(item.createdAt)}</td>
                      <td className="p-3 font-medium">{item.usuario?.email || 'Sistema'}</td>
                      <td className="p-3">
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100">
                          {item.usuario?.rol || '-'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAccionColor(item.accion)}`}>
                          {item.accion}
                        </span>
                      </td>
                      <td className="p-3 text-gray-600">{item.entidad}</td>
                      <td className="p-3 text-gray-500 max-w-xs truncate">
                        {item.detalle ? (
                          typeof item.detalle === 'string'
                            ? item.detalle
                            : JSON.stringify(item.detalle)
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between p-4 border-t">
              <span className="text-sm text-gray-500">
                Mostrando {(pagina - 1) * limite + 1}-{Math.min(pagina * limite, total)} de {total}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagina(pagina - 1)}
                  disabled={pagina <= 1}
                  className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm">
                  Pág. {pagina} de {totalPaginas || 1}
                </span>
                <button
                  onClick={() => setPagina(pagina + 1)}
                  disabled={pagina >= totalPaginas}
                  className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}