'use client';

import { useEffect, useState } from 'react';
import { hceApi } from '@/lib/api-client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';
import { Save, ArrowLeft, ShieldCheck } from 'lucide-react';

const MODULOS = [
  { key: 'consulta', label: 'Consulta' },
  { key: 'antecedentes', label: 'Antecedentes Personales y Familiares' },
  { key: 'alergias', label: 'Alergias' },
  { key: 'signos_vitales', label: 'Signos Vitales' },
  { key: 'examen_fisico', label: 'Examen Físico' },
  { key: 'diagnosticos', label: 'Diagnósticos (CIE-10 / DSM-5)' },
  { key: 'examenes', label: 'Exámenes Lab/Imágenes' },
  { key: 'pedidos', label: 'Pedidos e Interconsultas' },
  { key: 'prescripcion', label: 'Receta Médica' },
  { key: 'tratamiento', label: 'Tratamiento y Plan Terapéutico' },
  { key: 'evolucion', label: 'Evolución Clínica' },
  { key: 'vacunas', label: 'Vacunas' },
  { key: 'consentimientos', label: 'Consentimientos' },
  { key: 'proxima_cita', label: 'Próxima Cita' },
  { key: 'observaciones', label: 'Observaciones' },
  { key: 'optometria', label: 'Historia Clínica Optometría' },
];

const COLOR_MAP: Record<string, string> = {
  'Medicina General': '#10b981',
  'Pediatría': '#06b6d4',
  'Cardiología': '#ef4444',
  'Traumatología': '#3b82f6',
  'Psicología': '#8b5cf6',
  'Nutrición': '#f97316',
  'Dermatología': '#ec4899',
  'Neurología': '#6366f1',
  'Oftalmología': '#14b8a6',
  'Optometría': '#0ea5e9',
};

export default function HceConfiguracionPage() {
  const [especialidades, setEspecialidades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEsp, setSelectedEsp] = useState<any>(null);
  const [modulos, setModulos] = useState<{ modulo: string; habilitado: boolean; label: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [privacidad, setPrivacidad] = useState<Array<{ especialidad: string; compartirDiagnosticos: boolean }>>([]);
  const [savingPrivacidad, setSavingPrivacidad] = useState<string | null>(null);

  const loadEspecialidades = () => {
    setLoading(true);
    hceApi.getEspecialidadesModulos()
      .then((data: any[]) => setEspecialidades(data))
      .catch((e: any) => toast.error(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadEspecialidades(); }, []);

  useEffect(() => {
    hceApi.getPrivacidadDiagnosticos()
      .then((data) => setPrivacidad(data))
      .catch(() => { /* la privacidad se puede configurar luego */ });
  }, []);

  const togglePrivacidad = async (especialidad: string, actual: boolean) => {
    setSavingPrivacidad(especialidad);
    try {
      await hceApi.updatePrivacidadDiagnosticos(especialidad, !actual);
      setPrivacidad((prev) => prev.map((p) => p.especialidad === especialidad ? { ...p, compartirDiagnosticos: !actual } : p));
      toast.success(`Diagnósticos de ${especialidad}: ${!actual ? 'visibles' : 'reservados'}`);
    } catch (e: any) {
      toast.error(e.message || 'No se pudo actualizar la privacidad');
    } finally {
      setSavingPrivacidad(null);
    }
  };

  useEffect(() => {
    if (!selectedEsp) { setModulos([]); return; }
    setModulos(selectedEsp.modulos);
  }, [selectedEsp]);

  const toggleModulo = (modulo: string) => {
    setModulos(prev => prev.map(m => m.modulo === modulo ? { ...m, habilitado: !m.habilitado } : m));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await hceApi.updateModulosEspecialidad(selectedEsp.especialidad, modulos);
      toast.success('Módulos actualizados');
      loadEspecialidades();
      setSelectedEsp(null);
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Configuración HC" description="Habilitar/deshabilitar módulos por especialidad" />

      <Card className="p-5">
        <div className="flex items-start gap-2 mb-3">
          <ShieldCheck size={18} className="text-primary-600 mt-0.5" />
          <div>
            <h2 className="font-semibold text-gray-900">Privacidad de diagnósticos entre especialidades</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              En el historial unificado los especialistas ven únicamente el código del diagnóstico. Si desactiva una especialidad,
              sus diagnósticos no se mostrarán a otros especialistas. El especialista autor, Auditoría y Administración principal siempre tienen acceso.
            </p>
          </div>
        </div>
        {privacidad.length === 0 ? (
          <p className="text-xs text-gray-400">No hay especialidades configuradas.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-2">
            {privacidad.map((p) => (
              <label key={p.especialidad} className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={p.compartirDiagnosticos}
                  disabled={savingPrivacidad === p.especialidad}
                  onChange={() => togglePrivacidad(p.especialidad, p.compartirDiagnosticos)}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 flex-1">{p.especialidad}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${p.compartirDiagnosticos ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                  {p.compartirDiagnosticos ? 'Comparte código' : 'Reservado'}
                </span>
              </label>
            ))}
          </div>
        )}
      </Card>

      {!selectedEsp ? (
        loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full" /></div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {especialidades.map(e => {
              const modulosEsp = Array.isArray(e.modulos) ? e.modulos : [];
              const totalModulos = modulosEsp.length || MODULOS.length;
              const habilitados = modulosEsp.filter((m: any) => m.habilitado).length;
              const pct = totalModulos > 0 ? (habilitados / totalModulos) * 100 : 0;
              return (
              <button key={e.especialidad} onClick={() => setSelectedEsp(e)}
                className="bg-white rounded-xl border p-4 hover:shadow-md transition-shadow text-left">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLOR_MAP[e.especialidad] || '#6b7280' }} />
                  <p className="font-semibold text-gray-900">{e.especialidad}</p>
                </div>
                <p className="text-sm text-gray-500">
                  {habilitados} de {totalModulos} módulos habilitados
                </p>
                <div className="mt-2 w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-primary-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </button>
              );
            })}
          </div>
        )
      ) : (
        <>
          <button onClick={() => setSelectedEsp(null)} className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center gap-1">
            <ArrowLeft size={14} /> Volver a especialidades
          </button>
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLOR_MAP[selectedEsp.especialidad] || '#6b7280' }} />
              <h2 className="font-semibold text-gray-900 text-lg">{selectedEsp.especialidad}</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {modulos.map(m => (
                <label key={m.modulo} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 cursor-pointer border border-gray-100">
                  <input type="checkbox" checked={m.habilitado} onChange={() => toggleModulo(m.modulo)}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                  <span className="text-sm text-gray-700">{m.label}</span>
                </label>
              ))}
            </div>
            <Button onClick={handleSave} disabled={saving} icon={<Save size={14} />}>{saving ? 'Guardando...' : 'Guardar cambios'}</Button>
          </div>
        </>
      )}
    </div>
  );
}
