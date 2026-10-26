'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { ROUTES } from '@/lib/routes';
import { toast } from 'sonner';
import { Search, User, ArrowLeft, CalendarDays } from 'lucide-react';

function calcEdad(fecha: string) {
  const hoy = new Date();
  const nac = new Date(fecha);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return `${edad} años`;
}

export default function HcePacientesPorEspecialistaPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any[]>([]);
  const [espNombre, setEspNombre] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient<any[]>(`/hce/admin/especialista/${id}/pacientes`)
      .then((res) => {
        setData(res);
        if (res[0]?.ultimaConsulta?.especialista) {
          const e = res[0].ultimaConsulta.especialista;
          setEspNombre(`${e.nombres} ${e.apellidos}`);
        }
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const filtered = data.filter((d: any) => {
    const p = d.paciente;
    const full = `${p.nombres} ${p.apellidos} ${p.numeroIdentificacion}`.toLowerCase();
    return full.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href={ROUTES.admin.hceEspecialistas} className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center gap-1 mb-2">
          <ArrowLeft size={14} /> Volver a especialistas
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Pacientes{espNombre ? ` — ${espNombre}` : ''}</h1>
        <p className="text-gray-500 mt-1">Consulta las historias clínicas</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar paciente..." className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full" /></div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((d: any) => (
            <Link key={d.paciente.id} href={`${ROUTES.admin.hceEspecialistas}/${id}/pacientes/${d.paciente.id}`}
              className="bg-white rounded-xl border p-4 hover:shadow-md transition-shadow flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                <User size={18} className="text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{d.paciente.nombres} {d.paciente.apellidos}</p>
                <p className="text-sm text-gray-500">
                  {d.paciente.numeroIdentificacion} · {d.paciente.fechaNacimiento ? calcEdad(d.paciente.fechaNacimiento) : ''}
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <CalendarDays size={14} />
                  {d.ultimaConsulta.createdAt ? new Date(d.ultimaConsulta.createdAt).toLocaleDateString('es-EC') : '-'}
                </div>
                <p className="text-xs text-gray-400">{d.totalConsultas} consulta{d.totalConsultas !== 1 ? 's' : ''}</p>
              </div>
            </Link>
          ))}
          {filtered.length === 0 && <p className="text-center py-12 text-gray-500">No se encontraron pacientes</p>}
        </div>
      )}
    </div>
  );
}
