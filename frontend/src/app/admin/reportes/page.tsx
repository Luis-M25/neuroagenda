'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CalendarCheck,
  ClipboardList,
  FileArchive,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { cn } from '@/lib/utils';
import { AsistenciasPacienteTab } from './components/AsistenciasPacienteTab';
import { CitasEspecialistaTab } from './components/CitasEspecialistaTab';
import { DescargaHcPacienteTab } from './components/DescargaHcPacienteTab';
import { InasistenciasTab } from './components/InasistenciasTab';
import { RegistroHcTab } from './components/RegistroHcTab';

type TabId = 'inasistencias' | 'citas' | 'asistencias' | 'registro-hc' | 'hc-paciente';

const tabs: Array<{
  id: TabId;
  label: string;
  icon: typeof AlertTriangle;
}> = [
  { id: 'inasistencias', label: 'Inasistencias', icon: AlertTriangle },
  { id: 'citas', label: 'Citas por especialista', icon: BarChart3 },
  { id: 'asistencias', label: 'Asistencias por paciente', icon: CalendarCheck },
  { id: 'registro-hc', label: 'Registro de HC', icon: ClipboardList },
  { id: 'hc-paciente', label: 'HC por paciente', icon: FileArchive },
];

export default function ReportesPage() {
  const [tab, setTab] = useState<TabId>('inasistencias');

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Reportes"
        description="Estadísticas, registros cronológicos y documentos clínicos"
      />

      <div className="overflow-x-auto pb-1">
        <div className="flex w-max gap-1 rounded-xl bg-neutral-100 p-1">
          {tabs.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  'flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all',
                  tab === item.id
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700',
                )}
              >
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {tab === 'inasistencias' && <InasistenciasTab />}
      {tab === 'citas' && <CitasEspecialistaTab />}
      {tab === 'asistencias' && <AsistenciasPacienteTab />}
      {tab === 'registro-hc' && <RegistroHcTab />}
      {tab === 'hc-paciente' && <DescargaHcPacienteTab />}
    </div>
  );
}
