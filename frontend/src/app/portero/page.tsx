'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { citasApi, pacientesApi } from '@/lib/api-client';
import { getUser, logout } from '@/lib/auth';
import { cn, getEstadoCitaColor } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';
import { Search, User, Clock, LogOut, ShieldCheck, CalendarDays } from 'lucide-react';
import { todayStr } from '@/lib/utils';

export default function PorteroPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [citas, setCitas] = useState<any[]>([]);
  const [selectedPaciente, setSelectedPaciente] = useState<any>(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingCitas, setLoadingCitas] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const u = getUser();
    setUser(u);
    if (u?.rol !== 'PORTERO') {
      router.replace('/login');
    }
  }, [router]);

  const handleSearch = async () => {
    if (!search.trim()) return;
    setLoadingSearch(true);
    try {
      if (/^\d+$/.test(search.trim())) {
        const res = await pacientesApi.findByIdentificacion(search.trim());
        setSearchResults(res ? [res] : []);
      } else {
        const res = await pacientesApi.getAll({ nombre: search.trim() });
        setSearchResults(Array.isArray(res) ? res : []);
      }
      setSelectedPaciente(null);
      setCitas([]);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoadingSearch(false);
    }
  };

  const loadCitas = async (pacienteId: string) => {
    setLoadingCitas(true);
    try {
      const res = await citasApi.getAll({ pacienteId });
      setCitas(Array.isArray(res) ? res : []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoadingCitas(false);
    }
  };

  const handleSelectPaciente = (paciente: any) => {
    setSelectedPaciente(paciente);
    loadCitas(paciente.id);
  };

  const handleEspera = async (cita: any) => {
    const fechaStr = cita.fecha?.slice(0, 10) || '';
    if (fechaStr !== todayStr()) {
      toast.error('Solo puede marcar en espera citas del día de hoy');
      return;
    }
    if (cita.estado !== 'PENDIENTE' && cita.estado !== 'CONFIRMADA') {
      toast.error('Solo puede marcar en espera citas pendientes o confirmadas');
      return;
    }
    setUpdatingId(cita.id);
    try {
      await citasApi.updateEstado(cita.id, { estado: 'EN_ESPERA' });
      toast.success('Cita marcada como EN ESPERA');
      loadCitas(selectedPaciente.id);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (!mounted || !user || user.rol !== 'PORTERO') return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center">
              <ShieldCheck size={20} className="text-primary-600" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">Portero</h1>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
            <LogOut size={16} />
            Salir
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Search size={18} className="text-primary-600" />
            Buscar paciente
          </h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Nombre o número de cédula..."
              className="flex-1 px-4 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
            />
            <Button onClick={handleSearch} disabled={loadingSearch}>{loadingSearch ? '...' : 'Buscar'}</Button>
          </div>

          {searchResults.length > 0 && !selectedPaciente && (
            <div className="mt-4 space-y-2">
              {searchResults.map((p: any) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPaciente(p)}
                  className="w-full text-left bg-gray-50 hover:bg-primary-50 rounded-lg p-3 flex items-center gap-3 transition-colors border border-gray-100"
                >
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold shrink-0">
                    {p.nombres?.[0]}{p.apellidos?.[0]}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{p.nombres} {p.apellidos}</p>
                    <p className="text-xs text-gray-500">{p.numeroIdentificacion}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {searchResults.length === 0 && !loadingSearch && search && (
            <p className="mt-4 text-center text-sm text-gray-500">No se encontraron pacientes</p>
          )}
        </div>

        {selectedPaciente && (
          <div className="bg-white rounded-xl border shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                  {selectedPaciente.nombres?.[0]}{selectedPaciente.apellidos?.[0]}
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">{selectedPaciente.nombres} {selectedPaciente.apellidos}</h2>
                  <p className="text-xs text-gray-500">{selectedPaciente.numeroIdentificacion}</p>
                </div>
              </div>
              <button onClick={() => { setSelectedPaciente(null); setCitas([]); }} className="text-sm text-primary-600 hover:text-primary-700">
                Cambiar paciente
              </button>
            </div>

            <h3 className="font-medium text-gray-700 text-sm mb-2 flex items-center gap-2">
              <CalendarDays size={14} className="text-primary-600" />
              Citas del paciente
            </h3>

            {loadingCitas ? (
              <div className="flex justify-center py-8"><div className="animate-spin h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full" /></div>
            ) : citas.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                <User size={32} className="mx-auto mb-2 text-gray-300" />
                No tiene citas registradas
              </div>
            ) : (
              <div className="space-y-2">
                {citas.map((c: any) => (
                  <div
                    key={c.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border',
                      c.estado === 'EN_ESPERA' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200',
                    )}
                  >
                    <Clock size={16} className="text-gray-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{c.horaInicio}</span>
                        <span className="text-xs text-gray-400">{new Date(c.fecha).toLocaleDateString('es-EC')}</span>
                        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', getEstadoCitaColor(c.estado))}>
                          {c.estado}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {c.especialidad} — {c.especialista?.nombres} {c.especialista?.apellidos}
                      </p>
                    </div>
                    {c.estado === 'EN_ESPERA' ? (
                      <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded">En espera ✓</span>
                    ) : c.fecha?.slice(0, 10) !== todayStr() ? (
                      <span className="text-xs text-gray-400">Otra fecha</span>
                    ) : c.estado !== 'PENDIENTE' && c.estado !== 'CONFIRMADA' ? (
                      <span className="text-xs text-gray-400">{c.estado}</span>
                    ) : (
                      <Button onClick={() => handleEspera(c)} disabled={updatingId === c.id} size="sm">{updatingId === c.id ? '...' : 'Marcar EN ESPERA'}</Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
