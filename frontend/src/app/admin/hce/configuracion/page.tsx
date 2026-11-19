'use client';

import { useEffect, useState } from 'react';
import { hceApi } from '@/lib/api-client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { EtiquetasModal } from '@/components/hce/EtiquetasModal';
import { toast } from 'sonner';
import { Save, ArrowLeft, ShieldCheck, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';

type ModuloCfg = { modulo: string; habilitado: boolean; label: string; orden: number };
type Grupo = 'hab' | 'des';

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

const MODULOS_CON_ETIQUETAS = new Set([
  'ocupacion_escolaridad', 'actividad_funcional',
  'ocupacion_escolaridad_nino', 'actividad_funcional_nino',
]);

const reasignar = (lista: ModuloCfg[], offset: number): ModuloCfg[] =>
  lista.map((m, i) => ({ ...m, orden: offset + i }));

export default function HceConfiguracionPage() {
  const [especialidades, setEspecialidades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEsp, setSelectedEsp] = useState<any>(null);
  const [modulos, setModulos] = useState<ModuloCfg[]>([]);
  const [dragging, setDragging] = useState<string | null>(null);
  const [modalFormName, setModalFormName] = useState<string | null>(null);
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

  useEffect(() => {
    if (!selectedEsp) { setModulos([]); return; }
    const lista: ModuloCfg[] = (selectedEsp.modulos || []).map((m: any, i: number) => ({
      ...m,
      orden: typeof m.orden === 'number' ? m.orden : i,
    }));
    setModulos(lista.sort((a, b) => a.orden - b.orden));
  }, [selectedEsp]);

  const habilitados = modulos.filter((m) => m.habilitado);
  const deshabilitados = modulos.filter((m) => !m.habilitado);

  const moverEnGrupo = (modulo: string, grupo: Grupo, destino: number) => {
    setModulos((prev) => {
      const hab = prev.filter((m) => m.habilitado);
      const des = prev.filter((m) => !m.habilitado);
      const arr = grupo === 'hab' ? hab : des;
      const from = arr.findIndex((m) => m.modulo === modulo);
      if (from < 0 || destino < 0 || destino >= arr.length || from === destino) return prev;
      const copia = [...arr];
      const [item] = copia.splice(from, 1);
      copia.splice(destino, 0, item);
      const nuevaHab = grupo === 'hab' ? reasignar(copia, 0) : reasignar(hab, 0);
      const nuevaDes = grupo === 'des' ? reasignar(copia, hab.length) : reasignar(des, hab.length);
      return [...nuevaHab, ...nuevaDes];
    });
  };

  const moverFlecha = (modulo: string, grupo: Grupo, delta: number) => {
    const arr = grupo === 'hab' ? habilitados : deshabilitados;
    const i = arr.findIndex((m) => m.modulo === modulo);
    moverEnGrupo(modulo, grupo, i + delta);
  };

  const toggleModulo = (modulo: string) => {
    setModulos((prev) => {
      const actual = prev.find((m) => m.modulo === modulo);
      if (!actual) return prev;
      const hab = prev.filter((m) => m.habilitado && m.modulo !== modulo);
      const des = prev.filter((m) => !m.habilitado && m.modulo !== modulo);
      const nuevo = { ...actual, habilitado: !actual.habilitado };
      if (nuevo.habilitado) hab.push(nuevo);
      else des.push(nuevo);
      return [...reasignar(hab, 0), ...reasignar(des, hab.length)];
    });
  };

  const togglePrivacidad = async (especialidad: string, actual: boolean) => {
    setSavingPrivacidad(especialidad);
    try {
      await hceApi.updatePrivacidadDiagnosticos(especialidad, !actual);
      setPrivacidad((prev) => prev.map((p) => p.especialidad === especialidad ? { ...p, compartirDiagnosticos: !actual } : p));
      toast.success(`Diagnósticos de ${especialidad}: ${!actual ? 'visibles' : 'reservados'}`);
    } catch (e: any) {
      toast.error(e.message || 'No se pudo actualizar la privacidad');
    } finally { setSavingPrivacidad(null); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await hceApi.updateModulosEspecialidad(
        selectedEsp.especialidad,
        modulos.map((m) => ({ modulo: m.modulo, habilitado: m.habilitado, orden: m.orden })),
      );
      toast.success('Módulos y orden actualizados');
      loadEspecialidades();
      setSelectedEsp(null);
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const renderGrupo = (grupo: Grupo, lista: ModuloCfg[], titulo: string) => (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{titulo} ({lista.length})</p>
      {lista.length === 0 && <p className="text-xs text-gray-400 italic">Ninguno</p>}
      {lista.map((m, idx) => (
        <div key={m.modulo}>
          <div
            draggable
            onDragStart={() => setDragging(m.modulo)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => { if (dragging) moverEnGrupo(dragging, grupo, idx); setDragging(null); }}
            className={`flex items-center gap-2 p-2.5 rounded-lg border border-gray-100 bg-white hover:bg-gray-50 cursor-grab ${dragging === m.modulo ? 'opacity-50 border-primary-400' : ''}`}
          >
            <GripVertical size={14} className="text-gray-300 shrink-0" />
            <span className="w-6 text-xs font-bold text-primary-600 shrink-0">{idx + 1}.</span>
            <input
              type="checkbox"
              checked={m.habilitado}
              onChange={() => toggleModulo(m.modulo)}
              className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 shrink-0"
            />
            <span className="text-sm text-gray-700 flex-1">{m.label}</span>
            {MODULOS_CON_ETIQUETAS.has(m.modulo) && (
              <button
                type="button"
                onClick={() => setModalFormName(m.modulo)}
                className="text-xs px-2 py-1 rounded border border-primary-200 text-primary-700 hover:bg-primary-50 shrink-0"
              >
                Editar etiquetas
              </button>
            )}
            <button type="button" onClick={() => moverFlecha(m.modulo, grupo, -1)} title="Subir" className="p-1 text-gray-400 hover:text-primary-600 disabled:opacity-30" disabled={idx === 0}>
              <ArrowUp size={14} />
            </button>
            <button type="button" onClick={() => moverFlecha(m.modulo, grupo, 1)} title="Bajar" className="p-1 text-gray-400 hover:text-primary-600 disabled:opacity-30" disabled={idx === lista.length - 1}>
              <ArrowDown size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Configuración HC" description="Habilita, deshabilita y ordena los módulos por especialidad" />

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
            {especialidades.map((e) => {
              const modulosEsp = Array.isArray(e.modulos) ? e.modulos : [];
              const totalModulos = modulosEsp.length;
              const habilitadosCount = modulosEsp.filter((m: any) => m.habilitado).length;
              const pct = totalModulos > 0 ? (habilitadosCount / totalModulos) * 100 : 0;
              return (
                <button key={e.especialidad} onClick={() => setSelectedEsp(e)}
                  className="bg-white rounded-xl border p-4 hover:shadow-md transition-shadow text-left">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLOR_MAP[e.especialidad] || '#6b7280' }} />
                    <p className="font-semibold text-gray-900">{e.especialidad}</p>
                  </div>
                  <p className="text-sm text-gray-500">{habilitadosCount} de {totalModulos} módulos habilitados</p>
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
          <div className="bg-white rounded-xl border p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLOR_MAP[selectedEsp.especialidad] || '#6b7280' }} />
              <h2 className="font-semibold text-gray-900 text-lg">{selectedEsp.especialidad}</h2>
            </div>
            <p className="text-xs text-gray-500">
              Arrastra un módulo (o usa las flechas) para cambiar el orden. El orden se aplica también a la vista del especialista.
            </p>
            {renderGrupo('hab', habilitados, 'Habilitados')}
            {renderGrupo('des', deshabilitados, 'Deshabilitados')}
            <Button onClick={handleSave} disabled={saving} icon={<Save size={14} />}>{saving ? 'Guardando...' : 'Guardar cambios'}</Button>
          </div>
        </>
      )}

      <EtiquetasModal
        isOpen={modalFormName !== null}
        especialidad={selectedEsp?.especialidad ?? ''}
        formName={modalFormName ?? ''}
        onClose={() => setModalFormName(null)}
      />
    </div>
  );
}
