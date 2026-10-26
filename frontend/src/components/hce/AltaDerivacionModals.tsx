'use client';

import { useEffect, useMemo, useState } from 'react';
import { hceApi } from '@/lib/api-client';
import { toast } from 'sonner';
import { AlertTriangle, Loader2, Search, X } from 'lucide-react';

interface AltaPacienteModalProps {
  isOpen: boolean;
  pacienteId: string | null;
  especialidad?: string;
  onClose: () => void;
}

export function AltaPacienteModal({ isOpen, pacienteId, especialidad, onClose }: AltaPacienteModalProps) {
  const [motivo, setMotivo] = useState('');
  const [observacion, setObservacion] = useState('');
  const [especialidadManual, setEspecialidadManual] = useState(especialidad || '');
  const [saving, setSaving] = useState(false);
  const [resultado, setResultado] = useState<any>(null);

  useEffect(() => {
    if (!isOpen) return;
    setMotivo('');
    setObservacion('');
    setEspecialidadManual(especialidad || '');
    setResultado(null);
  }, [isOpen, especialidad]);

  if (!isOpen) return null;

  const confirmar = async () => {
    if (!pacienteId) return;
    if (!motivo.trim()) {
      toast.error('Indique el motivo del alta');
      return;
    }
    if (!especialidadManual.trim()) {
      toast.error('Indique la especialidad del alta');
      return;
    }
    setSaving(true);
    try {
      const res = await hceApi.darAlta(pacienteId, {
        motivo: motivo.trim(),
        observacion: observacion.trim() || undefined,
        especialidad: especialidadManual.trim(),
      });
      setResultado(res);
      toast.success(`Alta registrada. Citas canceladas: ${res.citasCanceladas ?? 0}`);
    } catch (e: any) {
      toast.error(e.message || 'No se pudo registrar el alta');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Alta por especialidad</h2>
            <p className="text-xs text-gray-500">Se cancelarán y liberarán las citas futuras de esta especialidad.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
        </div>

        {resultado ? (
          <div className="p-6 space-y-4">
            <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-sm text-green-800">
              <p className="font-semibold">Alta registrada correctamente.</p>
              <p className="mt-1">Especialidad: {resultado.especialidad}</p>
              <p>Citas futuras canceladas y liberadas: {resultado.citasCanceladas ?? 0}</p>
              <p className="mt-2 text-xs text-green-700">Las demás especialidades no fueron afectadas. El paciente puede volver a agendar en esta especialidad si es necesario.</p>
            </div>
            <div className="flex justify-end">
              <button onClick={onClose} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm">Cerrar</button>
            </div>
          </div>
        ) : (
          <>
            <div className="p-6 space-y-4">
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 flex gap-2">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>El alta solo afecta a la especialidad seleccionada. No bloquea al paciente ni modifica otras especialidades.</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Especialidad *</label>
                <input
                  value={especialidadManual}
                  onChange={(e) => setEspecialidadManual(e.target.value)}
                  disabled={!!especialidad}
                  className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Motivo del alta *</label>
                <input value={motivo} onChange={(e) => setMotivo(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Ej. alta terapéutica, traslado, resolución del cuadro" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Observación</label>
                <textarea value={observacion} onChange={(e) => setObservacion(e.target.value)} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
              <button onClick={confirmar} disabled={saving} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm flex items-center gap-1 hover:bg-red-700 disabled:opacity-50">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? 'Procesando...' : 'Confirmar alta'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface DerivacionModalProps {
  isOpen: boolean;
  pacienteId: string | null;
  consultaId: string | null;
  especialistaOrigenId?: string;
  onClose: () => void;
  onCreated?: () => void;
}

export function DerivacionModal({ isOpen, pacienteId, consultaId, especialistaOrigenId, onClose, onCreated }: DerivacionModalProps) {
  const [especialistas, setEspecialistas] = useState<any[]>([]);
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [motivo, setMotivo] = useState('');
  const [prioridad, setPrioridad] = useState<'BAJA' | 'MEDIA' | 'ALTA'>('MEDIA');
  const [observacion, setObservacion] = useState('');
  const [saving, setSaving] = useState(false);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSeleccionados([]);
    setBusqueda('');
    setMotivo('');
    setPrioridad('MEDIA');
    setObservacion('');
    setCargando(true);
    hceApi.getEspecialistasDerivacion()
      .then((list) => setEspecialistas(Array.isArray(list) ? list : []))
      .catch(() => setEspecialistas([]))
      .finally(() => setCargando(false));
  }, [isOpen]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return especialistas
      .filter((e) => e?.id && e.id !== especialistaOrigenId)
      .filter((e) => {
        if (!q) return true;
        return `${e.nombres} ${e.apellidos} ${e.especialidad}`.toLowerCase().includes(q);
      });
  }, [especialistas, busqueda, especialistaOrigenId]);

  const agrupados = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const e of filtrados) {
      const esp = e.especialidad || 'Otra';
      if (!map.has(esp)) map.set(esp, []);
      map.get(esp)!.push(e);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtrados]);

  if (!isOpen) return null;

  const toggle = (id: string) => {
    setSeleccionados((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const enviar = async () => {
    if (!pacienteId) return;
    if (seleccionados.length === 0) {
      toast.error('Seleccione al menos un especialista');
      return;
    }
    if (!motivo.trim()) {
      toast.error('Indique el motivo de la derivación');
      return;
    }
    setSaving(true);
    try {
      await hceApi.crearDerivacion({
        pacienteId,
        consultaId: consultaId || undefined,
        motivo: motivo.trim(),
        prioridad,
        observacion: observacion.trim() || undefined,
        especialistaIds: seleccionados,
      });
      toast.success('Derivación enviada a los especialistas seleccionados');
      onCreated?.();
      onClose();
    } catch (e: any) {
      toast.error(e.message || 'No se pudo crear la derivación');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-8 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Derivar paciente</h2>
            <p className="text-xs text-gray-500">Seleccione uno o varios especialistas. Solo ellos recibirán la notificación.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Prioridad</label>
              <select value={prioridad} onChange={(e) => setPrioridad(e.target.value as any)} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="BAJA">Baja</option>
                <option value="MEDIA">Media</option>
                <option value="ALTA">Alta</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Motivo *</label>
              <input value={motivo} onChange={(e) => setMotivo(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Motivo de la derivación" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Observación</label>
            <textarea value={observacion} onChange={(e) => setObservacion(e.target.value)} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-gray-500">Especialistas destino *</label>
              <span className="text-xs text-primary-600 font-medium">{seleccionados.length} seleccionado(s)</span>
            </div>
            <div className="relative mb-2">
              <Search size={14} className="absolute left-2 top-2.5 text-gray-400" />
              <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar especialista o especialidad..." className="w-full pl-8 border rounded-lg px-3 py-2 text-sm" />
            </div>
            {cargando ? (
              <p className="text-sm text-gray-400">Cargando especialistas...</p>
            ) : agrupados.length === 0 ? (
              <p className="text-sm text-gray-400">No hay especialistas disponibles.</p>
            ) : (
              <div className="border rounded-xl max-h-64 overflow-y-auto p-2 space-y-3">
                {agrupados.map(([especialidad, lista]) => (
                  <div key={especialidad}>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1">{especialidad}</p>
                    <div className="space-y-1">
                      {lista.map((e) => {
                        const checked = seleccionados.includes(e.id);
                        return (
                          <label key={e.id} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-sm ${checked ? 'bg-primary-50' : 'hover:bg-gray-50'}`}>
                            <input type="checkbox" checked={checked} onChange={() => toggle(e.id)} />
                            <span className="flex-1">{e.nombres} {e.apellidos}</span>
                            <span className="text-[11px] text-gray-400">{e.sede || ''}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
          <button onClick={enviar} disabled={saving} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm flex items-center gap-1 hover:bg-primary-700 disabled:opacity-50">
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? 'Enviando...' : 'Enviar derivación'}
          </button>
        </div>
      </div>
    </div>
  );
}
