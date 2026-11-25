'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { hceApi } from '@/lib/api-client';

type Campo = { name: string; label: string };

const CATALOGOS: Record<string, Campo[]> = {
  ocupacion_escolaridad: [
    { name: 'ocupacion_etiquetas', label: 'Ocupacion' },
    { name: 'escolaridad_etiquetas', label: 'Escolaridad' },
  ],
  actividad_funcional: [
    { name: 'actividades_vida_diaria', label: 'Actividades de la vida diaria' },
    { name: 'actividades_instrumentales', label: 'Actividades instrumentales' },
  ],
  ocupacion_escolaridad_nino: [
    { name: 'ocupacion_etiquetas', label: 'Ocupacion' },
    { name: 'escolaridad_etiquetas', label: 'Escolaridad' },
  ],
  actividad_funcional_nino: [
    { name: 'actividades_vida_diaria', label: 'Actividades de la vida diaria' },
    { name: 'actividades_instrumentales', label: 'Actividades instrumentales' },
  ],
};

const DEFAULTS: Record<string, string[]> = {
  'ocupacion_escolaridad.ocupacion_etiquetas': ['Ama de casa', 'Docente', 'Estudiante', 'Comerciante', 'Empleado', 'Independiente', 'Jubilado', 'Otro'],
  'ocupacion_escolaridad.escolaridad_etiquetas': ['Alfabetizado', 'Primaria incompleta', 'Primaria completa', 'Secundaria incompleta', 'Secundaria completa', 'Tecnico', 'Superior', 'Posgrado'],
  'actividad_funcional.actividades_vida_diaria': ['Bano', 'Vestirse', 'Alimentacion', 'Movilidad', 'Higiene personal', 'Continencia'],
  'actividad_funcional.actividades_instrumentales': ['Compras', 'Cocina', 'Manejo de dinero', 'Transporte', 'Medicamentos', 'Limpieza', 'Telefono'],
  'ocupacion_escolaridad_nino.ocupacion_etiquetas': ['Ama de casa', 'Docente', 'Estudiante', 'Comerciante', 'Empleado', 'Independiente', 'Jubilado', 'Otro'],
  'ocupacion_escolaridad_nino.escolaridad_etiquetas': ['Alfabetizado', 'Primaria incompleta', 'Primaria completa', 'Secundaria incompleta', 'Secundaria completa', 'Tecnico', 'Superior', 'Posgrado'],
  'actividad_funcional_nino.actividades_vida_diaria': ['Bano', 'Vestirse', 'Alimentacion', 'Movilidad', 'Higiene personal', 'Continencia'],
  'actividad_funcional_nino.actividades_instrumentales': ['Compras', 'Cocina', 'Manejo de dinero', 'Transporte', 'Medicamentos', 'Limpieza', 'Telefono'],
};

interface Props {
  isOpen: boolean;
  especialidad: string;
  formName: string;
  onClose: () => void;
}

export function EtiquetasModal({ isOpen, especialidad, formName, onClose }: Props) {
  const campos = CATALOGOS[formName] ?? [];
  const [config, setConfig] = useState<any>(null);
  const [opciones, setOpciones] = useState<Record<string, string[]>>({});
  const [categoria, setCategoria] = useState<string | null>(null);
  const [nueva, setNueva] = useState('');
  const [nuevaError, setNuevaError] = useState('');
  const [editando, setEditando] = useState<number | null>(null);
  const [editValor, setEditValor] = useState('');
  const [editError, setEditError] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let activo = true;
    setCategoria(null);
    setLoading(true);
    const defaults = () => {
      const opts: Record<string, string[]> = {};
      const fields = campos.map((c) => {
        const options = DEFAULTS[`${formName}.${c.name}`] ?? [];
        opts[c.name] = options;
        return { name: c.name, label: c.label, type: 'chips', required: false, options };
      });
      if (activo) { setConfig({ fields }); setOpciones(opts); }
    };
    hceApi.getFormsConfig(especialidad)
      .then((cfg: any) => {
        if (!activo) return;
        const form = cfg?.[formName];
        if (!form?.fields) { defaults(); return; }
        const opts: Record<string, string[]> = {};
        for (const c of campos) {
          const field = form.fields.find((f: any) => f.name === c.name);
          opts[c.name] = Array.isArray(field?.options) ? field.options.map(String) : (DEFAULTS[`${formName}.${c.name}`] ?? []);
        }
        setConfig(form);
        setOpciones(opts);
      })
      .catch(() => { if (activo) defaults(); })
      .finally(() => { if (activo) setLoading(false); });
    return () => { activo = false; };
  }, [isOpen, especialidad, formName]);

  if (!isOpen) return null;

  const campoActual = campos.find((c) => c.name === categoria);
  const lista = categoria ? (opciones[categoria] ?? []) : [];

  const abrirCategoria = (name: string) => {
    setCategoria(name);
    setNueva('');
    setNuevaError('');
    setEditando(null);
    setEditError('');
  };

  const volver = () => {
    setCategoria(null);
    setNueva('');
    setNuevaError('');
    setEditando(null);
    setEditError('');
  };

  const agregar = () => {
    const valor = nueva.trim();
    if (!valor) {
      setNuevaError('Escriba una opcion antes de agregar');
      return;
    }
    if (lista.includes(valor)) {
      setNuevaError('Esa opcion ya existe');
      return;
    }
    setNuevaError('');
    if (categoria) setOpciones((prev) => ({ ...prev, [categoria]: [valor, ...lista] }));
    setNueva('');
  };

  const eliminar = (idx: number) => {
    if (!categoria) return;
    setOpciones((prev) => ({ ...prev, [categoria]: (prev[categoria] ?? []).filter((_, i) => i !== idx) }));
    if (editando === idx) { setEditando(null); setEditError(''); }
  };

  const iniciarEdicion = (idx: number) => {
    setEditando(idx);
    setEditValor(lista[idx] ?? '');
    setEditError('');
  };

  const guardarEdicion = (idx: number) => {
    if (!categoria) return;
    const valor = editValor.trim();
    if (!valor) {
      setEditError('La opcion no puede quedar vacia');
      return;
    }
    if (lista.some((v, i) => i !== idx && v === valor)) {
      setEditError('Esa opcion ya existe');
      return;
    }
    setEditError('');
    setOpciones((prev) => ({ ...prev, [categoria]: (prev[categoria] ?? []).map((v, i) => i === idx ? valor : v) }));
    setEditando(null);
  };

  const guardar = async () => {
    if (!categoria || !config) return;
    setSaving(true);
    try {
      const form = JSON.parse(JSON.stringify(config));
      let field = (form.fields ?? []).find((f: any) => f.name === categoria);
      if (!field) {
        field = { name: categoria, label: campoActual?.label ?? categoria, type: 'chips', required: false };
        form.fields = [...(form.fields ?? []), field];
      }
      field.options = lista;
      await hceApi.saveFormConfig({
        especialidad,
        formName,
        config: form,
        habilitado: true,
        orden: 0,
      } as any);
      setConfig(form);
      toast.success(`Opciones guardadas: ${campoActual?.label}`);
      volver();
    } catch (e: any) {
      toast.error(e.message || 'No se pudieron guardar las opciones');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Etiquetas de los modulos funcionales</h2>
            <p className="text-xs text-gray-500">{especialidad} - {formName.replace(/_/g, ' ')}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700" title="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <p className="text-sm text-gray-400">Cargando opciones...</p>
          ) : !categoria ? (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">Seleccione la categoria de etiquetas que desea editar:</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {campos.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => abrirCategoria(c.name)}
                    className="flex items-center justify-between rounded-xl border border-gray-200 p-4 text-left hover:border-primary-400 hover:bg-primary-50/40 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{c.label}</p>
                      <p className="text-xs text-gray-500">{(opciones[c.name] ?? []).length} opciones</p>
                    </div>
                    <ArrowRight size={16} className="text-primary-600" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <button type="button" onClick={volver} className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700">
                  <ArrowLeft size={14} /> Volver
                </button>
                <span className="text-gray-300">/</span>
                <h3 className="text-sm font-semibold text-gray-800">{campoActual?.label}</h3>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-2">
                {lista.length === 0 && <p className="text-xs text-gray-400">Sin opciones. Agregue la primera.</p>}
                {lista.map((op, idx) => (
                  <div key={`${op}-${idx}`} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white px-3 py-2">
                      {editando === idx ? (
                        <input
                          autoFocus
                          value={editValor}
                          onChange={(e) => { setEditValor(e.target.value); if (editError) setEditError(''); }}
                          onKeyDown={(e) => { if (e.key === 'Enter') guardarEdicion(idx); if (e.key === 'Escape') { setEditando(null); setEditError(''); } }}
                          className={`flex-1 rounded border px-2 py-1 text-sm ${editError ? 'border-red-400 focus:ring-red-300' : 'border-primary-300'}`}
                        />
                      ) : (
                        <span className="flex-1 text-sm text-gray-700">{op}</span>
                      )}
                      {editando === idx ? (
                        <>
                          <button type="button" onClick={() => guardarEdicion(idx)} className="p-1 text-green-600 hover:bg-green-50" title="Guardar opcion"><Save size={14} /></button>
                          <button type="button" onClick={() => { setEditando(null); setEditError(''); }} className="p-1 text-gray-400 hover:bg-gray-100" title="Cancelar"><X size={14} /></button>
                        </>
                      ) : (
                        <>
                          <button type="button" onClick={() => iniciarEdicion(idx)} className="p-1 text-gray-500 hover:bg-primary-50 hover:text-primary-600" title="Editar"><Pencil size={14} /></button>
                          <button type="button" onClick={() => eliminar(idx)} className="p-1 text-red-500 hover:bg-red-50" title="Eliminar"><Trash2 size={14} /></button>
                        </>
                      )}
                    </div>
                    {editando === idx && editError && (
                      <p className="text-xs text-red-500 pl-1">{editError}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                <div className="flex gap-2">
                  <input
                    value={nueva}
                    onChange={(e) => { setNueva(e.target.value); if (nuevaError) setNuevaError(''); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') agregar(); }}
                    placeholder="Nueva opcion"
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm ${nuevaError ? 'border-red-400 focus:ring-red-300' : 'border-gray-200'}`}
                  />
                  <Button type="button" variant="outline" onClick={agregar} icon={<Plus size={14} />}>Agregar</Button>
                </div>
                {nuevaError && <p className="text-xs text-red-500 pl-1">{nuevaError}</p>}
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <Button type="button" variant="ghost" onClick={volver}>Volver a categorias</Button>
                <Button type="button" onClick={guardar} disabled={saving} icon={<Save size={14} />}>
                  {saving ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}