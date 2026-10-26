'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { hceApi } from '@/lib/api-client';
import type { RecetasPagina } from '@/lib/api/hce.api';
import { ROUTES } from '@/lib/routes';
import { toast } from 'sonner';
import { ArrowLeft, Calendar, Download, FileText, Loader2, Pill, Search, User } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';

function fmtFecha(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function RecetasHcePage() {
  const router = useRouter();
  const [data, setData] = useState<RecetasPagina | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [page, setPage] = useState(1);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQ(q.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    hceApi
      .getRecetas({
        q: debouncedQ || undefined,
        desde: desde || undefined,
        hasta: hasta || undefined,
        page,
        limit: 20,
      })
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((error: any) => {
        if (!cancelled) toast.error(error.message || 'No se pudieron cargar las recetas');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQ, desde, hasta, page]);

  const descargar = async (id: string) => {
    setDownloading(id);
    try {
      await hceApi.descargarRecetaPdf(id);
    } catch (error: any) {
      toast.error(error.message || 'No se pudo descargar la receta');
    } finally {
      setDownloading(null);
    }
  };

  const recetas = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-5">
      <button
        onClick={() => router.push(ROUTES.especialista.hce)}
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 transition-colors"
      >
        <ArrowLeft size={15} /> Volver a Historia Clínica
      </button>

      <PageHeader
        title="Recetas médicas"
        description={`${total} receta${total === 1 ? '' : 's'} emitida${total === 1 ? '' : 's'}`}
      />

      <div className="bg-white border rounded-2xl p-4 flex flex-col lg:flex-row lg:items-end gap-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-neutral-500 mb-1">Buscar</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Paciente, cédula, diagnóstico o especialista..."
              className="w-full pl-9 pr-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-500 mb-1">Desde</label>
          <input
            type="date"
            value={desde}
            onChange={(e) => {
              setDesde(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-500 mb-1">Hasta</label>
          <input
            type="date"
            value={hasta}
            onChange={(e) => {
              setHasta(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        {(q || desde || hasta) && (
          <button
            onClick={() => {
              setQ('');
              setDesde('');
              setHasta('');
              setPage(1);
            }}
            className="px-3 py-2 border rounded-xl text-sm text-neutral-600 hover:bg-neutral-50"
          >
            Limpiar
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-primary-600" size={28} />
        </div>
      ) : recetas.length === 0 ? (
        <div className="bg-white border rounded-2xl">
          <EmptyState
            icon={<FileText size={26} />}
            title="No hay recetas para mostrar"
            description="Las recetas firmadas desde una consulta aparecerán aquí."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {recetas.map((r) => (
            <div key={r.id} className="bg-white border rounded-2xl p-4 hover:shadow-sm transition-shadow">
              <div className="flex flex-wrap items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
                  <Pill size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
                      Receta N.° {String(r.numeroReceta).padStart(4, '0')}
                    </span>
                    <span className="text-xs text-neutral-500 inline-flex items-center gap-1">
                      <Calendar size={12} /> {fmtFecha(r.fecha)}
                    </span>
                    {r.validezDias ? (
                      <span className="text-[10px] font-medium bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded">
                        Validez {r.validezDias} días
                      </span>
                    ) : null}
                    {r.estadoEnfermedad && (
                      <span className="text-[10px] font-medium bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">
                        {r.estadoEnfermedad}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 font-semibold text-neutral-900 inline-flex items-center gap-1.5">
                    <User size={14} className="text-neutral-400" />
                    {r.paciente ? `${r.paciente.apellidos} ${r.paciente.nombres}` : 'Paciente'}
                    {r.paciente?.numeroIdentificacion && (
                      <span className="text-xs font-normal text-neutral-400">· {r.paciente.numeroIdentificacion}</span>
                    )}
                  </p>
                  {r.diagnostico && <p className="text-sm text-neutral-600 mt-1">{r.diagnostico}</p>}
                  <p className="text-xs text-neutral-400 mt-1">
                    {r.especialista ? `${r.especialista.nombres} ${r.especialista.apellidos} · ${r.especialista.especialidad}` : 'Especialista'}
                    {' · '}
                    {r.items?.length || 0} medicamento{(r.items?.length || 0) === 1 ? '' : 's'}
                  </p>
                </div>
                <button
                  onClick={() => descargar(r.id)}
                  disabled={downloading === r.id}
                  className="inline-flex items-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-medium text-primary-700 hover:bg-primary-50 disabled:opacity-50"
                >
                  {downloading === r.id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  PDF
                </button>
              </div>

              {(r.items?.length || 0) > 0 && (
                <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
                  {r.items.slice(0, 6).map((it, index) => (
                    <div key={it.id || `${r.id}-${index}`} className="rounded-lg bg-neutral-50 px-3 py-2 text-xs">
                      <span className="font-semibold text-neutral-800">{it.medicamento}</span>
                      {it.concentracion && <span className="text-neutral-500"> · {it.concentracion}</span>}
                      {(it.dosis || it.frecuencia) && (
                        <p className="text-neutral-500 mt-0.5">
                          {[it.dosis, it.frecuencia, it.duracion].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white border rounded-2xl px-4 py-3">
              <span className="text-xs text-neutral-500">
                Página {data?.page || page} de {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 border rounded-lg text-xs disabled:opacity-40"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 border rounded-lg text-xs disabled:opacity-40"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
