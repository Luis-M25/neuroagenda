'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, hceApi } from '@/lib/api-client';
import { ROUTES } from '@/lib/routes';
import { toast } from 'sonner';
import { ArrowLeft, Search, User, Calendar, FileText, LayoutGrid, List, Pill } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { getModuloIcon, getModuloColor } from '@/lib/medical-icons';

export default function EspecialistaHcePage() {
  const router = useRouter();
  const [espId, setEspId] = useState<string | null>(null);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [modulos, setModulos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewModulos, setViewModulos] = useState(false);

  const [consultasPorPaciente, setConsultasPorPaciente] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      const profile = await authApi.profile();
      const id = profile?.especialista?.id;
      if (!id) { setLoading(false); return; }
      setEspId(id);
      try {
        const [list, mods] = await Promise.all([
          hceApi.getPacientes(id),
          hceApi.getModulos(id),
        ]);
        const arr = Array.isArray(list) ? list : [];
        setPacientes(arr);
        const counts: Record<string, number> = {};
        for (const p of arr) {
          if (p.totalConsultas) counts[p.paciente?.id || p.id] = p.totalConsultas;
        }
        setConsultasPorPaciente(counts);
        setModulos(mods.filter((m: any) => m.habilitado));
      } catch (e: any) { toast.error(e.message); }
      finally { setLoading(false); }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return pacientes;
    const q = search.toLowerCase();
    return pacientes.filter((p: any) => {
      const name = `${p.paciente?.nombres || ''} ${p.paciente?.apellidos || ''} ${p.paciente?.numeroIdentificacion || ''}`.toLowerCase();
      return name.includes(q);
    });
  }, [pacientes, search]);

  const pacientesOrdenados = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const ca = consultasPorPaciente[a.paciente?.id || a.id] || 0;
      const cb = consultasPorPaciente[b.paciente?.id || b.id] || 0;
      return cb - ca;
    });
  }, [filtered, consultasPorPaciente]);

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PageHeader title="Historia Clínica" description={`${pacientes.length} pacientes atendidos`} />
        <div className="flex gap-2">
          <button onClick={() => setViewModulos(false)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${!viewModulos ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
            <List size={16} /> Pacientes
          </button>
          <button onClick={() => setViewModulos(true)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${viewModulos ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
            <LayoutGrid size={16} /> Módulos
          </button>
        </div>
      </div>

      {viewModulos ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <button onClick={() => router.push(ROUTES.especialista.hceRecetas)}
            className="bg-white rounded-xl border border-neutral-100 p-4 hover:border-neutral-200 hover:shadow-sm transition-all text-left group">
            <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center mb-3"><Pill size={20} /></div>
            <p className="font-semibold text-sm text-neutral-800">Recetas médicas</p>
            <p className="text-xs text-neutral-400 mt-1">Historial y descarga de recetas</p>
          </button>
          {modulos.map((m: any) => {
            const Icon = getModuloIcon(m.modulo);
            const color = getModuloColor(m.modulo);
            return (
              <button key={m.modulo} onClick={() => router.push(`${ROUTES.especialista.hce}?modulo=${m.modulo}`)}
                className="bg-white rounded-xl border border-neutral-100 p-4 hover:border-neutral-200 hover:shadow-sm transition-all text-left group">
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}><Icon size={20} /></div>
                <p className="font-semibold text-sm text-neutral-800">{m.label}</p>
                <p className="text-xs text-neutral-400 mt-1">Ver registros por módulo</p>
              </button>
            );
          })}
          {modulos.length === 0 && (
            <EmptyState icon={<FileText size={24} />} title="No tienes módulos habilitados" description="Contacta al administrador" />
          )}
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar paciente por nombre o cédula..." className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500" />
          </div>

          {pacientes.length === 0 ? (
            <EmptyState icon={<User size={32} />} title="No has atendido pacientes aún" description="Cuando atiendas consultas, tus pacientes aparecerán aquí" />
          ) : pacientesOrdenados.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No se encontraron pacientes con &quot;{search}&quot;</div>
          ) : (
            <div className="grid gap-3">
              {pacientesOrdenados.map((p: any) => {
                const pid = p.paciente?.id || p.id;
                const total = consultasPorPaciente[pid] || 0;
                return (
                  <button key={pid} onClick={() => router.push(`${ROUTES.especialista.hce}/${pid}`)}
                    className="bg-white rounded-xl border p-4 hover:shadow-md transition-shadow flex items-center gap-4 text-left w-full">
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-lg font-bold text-primary-600 shrink-0">
                      {p.paciente?.nombres?.[0]}{p.paciente?.apellidos?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{p.paciente?.nombres} {p.paciente?.apellidos}</p>
                      <p className="text-sm text-gray-500">{p.paciente?.numeroIdentificacion}</p>
                    </div>
                    <div className="shrink-0 text-center">
                      <span className="block text-lg font-bold text-primary-600">{total}</span>
                      <span className="text-xs text-gray-400">consulta{total !== 1 ? 's' : ''}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
