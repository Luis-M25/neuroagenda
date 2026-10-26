'use client';

import { useEffect, useMemo, useState } from 'react';
import { permisosApi } from '@/lib/api-client';
import { usePermisos } from '@/lib/use-permisos';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { cn } from '@/lib/utils';

interface PermisoSummary {
  id: string;
  clave: string;
  nombre: string;
  descripcion: string | null;
  categoria: string | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  Especialistas: 'bg-blue-50 text-blue-700 ring-blue-200',
  Pacientes: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Inasistencias: 'bg-rose-50 text-rose-700 ring-rose-200',
  Citas: 'bg-amber-50 text-amber-700 ring-amber-200',
  Calendario: 'bg-violet-50 text-violet-700 ring-violet-200',
  Reportes: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
  Administracion: 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200',
  HCE: 'bg-sky-50 text-sky-700 ring-sky-200',
  Catalogos: 'bg-lime-50 text-lime-700 ring-lime-200',
  Auxiliares: 'bg-slate-100 text-slate-700 ring-slate-200',
};

const DEFAULT_COLOR = 'bg-neutral-100 text-neutral-700 ring-neutral-200';

export default function PermisosPage() {
  const [items, setItems] = useState<PermisoSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { permisos: granted, loading: loadingPermisos } = usePermisos();

  useEffect(() => {
    permisosApi.listar()
      .then((permisos) => setItems(Array.isArray(permisos) ? permisos : []))
      .catch((e: any) => setError(e?.message ?? 'Error cargando datos'))
      .finally(() => setLoading(false));
  }, []);

  const grouped = useMemo(() => {
    const acc: Record<string, PermisoSummary[]> = {};
    for (const p of items) {
      const cat = p.categoria ?? 'Otros';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(p);
    }
    return acc;
  }, [items]);

  const totalGranted = granted.length;
  const total = items.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Permisos del sistema"
        description="Permisos efectivos de tu sesión."
      />
      <Card className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-neutral-700">Tus permisos efectivos:</span>
              <span className="ml-auto text-sm text-neutral-500">
                <strong>{totalGranted}</strong> de {total}
                {loadingPermisos && ' (cargando...)'}
              </span>
            </div>
          </Card>

          {error && (
            <Card className="p-3 border-red-300 bg-red-50">
              <p className="text-sm text-red-700">{error}</p>
            </Card>
          )}

          {loading ? (
            <Card className="p-8 text-center text-neutral-500">Cargando permisos...</Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(grouped).map(([categoria, list]) => (
                <Card key={categoria} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-neutral-900">{categoria}</h4>
                    <Badge variant="neutral">{list.length}</Badge>
                  </div>
                  <ul className="space-y-2">
                    {list.map((p) => (
                      <li key={p.id} className="flex items-start gap-2">
                        <span
                          className={cn(
                            'mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] ring-1',
                            granted.includes(p.clave)
                              ? 'bg-emerald-500 text-white ring-emerald-300'
                              : 'bg-neutral-100 text-neutral-400 ring-neutral-200',
                          )}
                        >
                          {granted.includes(p.clave) ? '✓' : '–'}
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-baseline gap-1">
                            <span className="text-sm font-medium text-neutral-800">{p.nombre}</span>
                            <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full ring-1', CATEGORY_COLORS[categoria] ?? DEFAULT_COLOR)}>
                              {p.clave}
                            </span>
                          </div>
                          {p.descripcion && (
                            <p className="text-xs text-neutral-500 mt-0.5">{p.descripcion}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          )}
    </div>
  );
}
