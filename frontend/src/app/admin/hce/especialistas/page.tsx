'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { ROUTES } from '@/lib/routes';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';
import { Search, Stethoscope } from 'lucide-react';

export default function HceEspecialistasPage() {
  const [especialistas, setEspecialistas] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient<any[]>('/hce/admin/especialistas')
      .then(setEspecialistas)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = especialistas.filter(e =>
    e.nombre.toLowerCase().includes(search.toLowerCase()) ||
    e.especialidad?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader title="HCE — Especialistas" description="Historia Clínica Electrónica por especialista" />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar especialista..." className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full" /></div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(e => (
            <Link key={e.id} href={`${ROUTES.admin.hceEspecialistas}/${e.id}/pacientes`}
              className="bg-white rounded-xl border p-4 hover:shadow-md transition-shadow flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                <Stethoscope size={22} className="text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{e.nombre}</p>
                <p className="text-sm text-gray-500">{e.especialidad} · {e.sede}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-gray-400">{e.totalConsultas} consultas</p>
              </div>
            </Link>
          ))}
          {filtered.length === 0 && <p className="text-center py-12 text-gray-500">No se encontraron especialistas</p>}
        </div>
      )}
    </div>
  );
}
