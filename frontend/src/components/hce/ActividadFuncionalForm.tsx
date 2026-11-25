'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { hceApi } from '@/lib/api-client';
import type { ActividadFuncional } from '@/types/historia-clinica';
import {
  ETIQUETAS_DEFAULT,
  cargarEtiquetas,
  type EtiquetasModulos,
} from './modulos-funcionales.helpers';
import { Chips } from './fields/Chips';

export function ActividadFuncionalForm({
  pacienteId,
  especialidad,
}: {
  pacienteId: string;
  especialidad?: string;
}) {
  const [registro, setRegistro] = useState<ActividadFuncional | null>(null);
  const [actividadSignificativa, setActividadSignificativa] = useState('');
  const [medidaIndependencia, setMedidaIndependencia] = useState('');
  const [cambiosDesempeno, setCambiosDesempeno] = useState('');
  const [actividadesVidaDiaria, setActividadesVidaDiaria] = useState<string[]>([]);
  const [actividadesInstrumentales, setActividadesInstrumentales] = useState<string[]>([]);
  const [motricidadFina, setMotricidadFina] = useState('');
  const [motivo, setMotivo] = useState('');
  const [etiquetas, setEtiquetas] = useState<EtiquetasModulos>(ETIQUETAS_DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let activo = true;
    Promise.all([
      hceApi.getActividadFuncional(pacienteId),
      cargarEtiquetas(especialidad),
    ])
      .then(([data, ets]) => {
        if (!activo) return;
        setRegistro(data);
        setActividadSignificativa(data?.actividadSignificativa ?? '');
        setMedidaIndependencia(data?.medidaIndependencia != null ? String(data.medidaIndependencia) : '');
        setCambiosDesempeno(data?.cambiosDesempeno ?? '');
        setActividadesVidaDiaria(data?.actividadesVidaDiaria ?? []);
        setActividadesInstrumentales(data?.actividadesInstrumentales ?? []);
        setMotricidadFina(data?.motricidadFina ?? '');
        setEtiquetas(ets);
      })
      .catch((e: any) => toast.error(e.message))
      .finally(() => { if (activo) setLoading(false); });
    return () => { activo = false; };
  }, [pacienteId, especialidad]);

  const toggle = (valor: string, lista: string[], setter: (v: string[]) => void) => {
    setter(lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor]);
  };

  const handleGuardar = async () => {
    const porcentaje = medidaIndependencia.trim() === '' ? undefined : Number(medidaIndependencia);
    if (porcentaje !== undefined && (!Number.isInteger(porcentaje) || porcentaje < 0 || porcentaje > 100)) {
      toast.error('La medida de independencia debe ser un entero entre 0 y 100');
      return;
    }
    setSaving(true);
    try {
      const resp = await hceApi.saveActividadFuncional(pacienteId, {
        actividadSignificativa: actividadSignificativa.trim() || undefined,
        medidaIndependencia: porcentaje,
        cambiosDesempeno: cambiosDesempeno.trim() || undefined,
        actividadesVidaDiaria,
        actividadesInstrumentales,
        motricidadFina: motricidadFina.trim() || undefined,
        motivo: motivo.trim() || undefined,
      });
      setRegistro(resp);
      toast.success('Modulo guardado');
    } catch (e: any) {
      toast.error(e.message || 'No se pudo guardar el modulo');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Card className="p-5 text-sm text-gray-400">Cargando modulo...</Card>;
  }

  return (
    <Card className="p-5 space-y-5">

      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-600">Actividad significativa</label>
        <textarea
          value={actividadSignificativa}
          onChange={(e) => setActividadSignificativa(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-gray-200 p-2 text-sm focus:border-primary-500 focus:ring-primary-500"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-600">Medida de independencia funcional (%)</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={100}
            value={medidaIndependencia}
            onChange={(e) => setMedidaIndependencia(e.target.value)}
            placeholder="0 - 100"
            className="w-28 rounded-lg border border-gray-200 p-2 text-sm focus:border-primary-500 focus:ring-primary-500"
          />
          <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-2 rounded-full bg-primary-500 transition-all"
              style={{ width: `${Math.max(0, Math.min(100, Number(medidaIndependencia) || 0))}%` }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2 border-t pt-4">
        <label className="text-xs font-medium text-gray-600">Cambios en el desempeno cotidiano</label>
        <textarea
          value={cambiosDesempeno}
          onChange={(e) => setCambiosDesempeno(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-gray-200 p-2 text-sm focus:border-primary-500 focus:ring-primary-500"
        />
      </div>

      <div className="space-y-2 border-t pt-4">
        <p className="text-xs font-medium text-gray-600">Actividades de la vida diaria</p>
        <Chips
          opciones={etiquetas.actividadesVidaDiaria}
          seleccionadas={actividadesVidaDiaria}
          onToggle={(v) => toggle(v, actividadesVidaDiaria, setActividadesVidaDiaria)}
        />
      </div>

      <div className="space-y-2 border-t pt-4">
        <p className="text-xs font-medium text-gray-600">Actividades instrumentales</p>
        <Chips
          opciones={etiquetas.actividadesInstrumentales}
          seleccionadas={actividadesInstrumentales}
          onToggle={(v) => toggle(v, actividadesInstrumentales, setActividadesInstrumentales)}
        />
      </div>

      <div className="space-y-2 border-t pt-4">
        <label className="text-xs font-medium text-gray-600">Motricidad fina</label>
        <textarea
          value={motricidadFina}
          onChange={(e) => setMotricidadFina(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-gray-200 p-2 text-sm focus:border-primary-500 focus:ring-primary-500"
        />
      </div>

      <div className="border-t pt-4 space-y-2">
        <label className="text-xs font-medium text-gray-600">Motivo del cambio (auditoria)</label>
        <input
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Opcional"
          className="w-full rounded-lg border border-gray-200 p-2 text-sm"
        />
        <div className="flex items-center gap-3">
          <Button onClick={handleGuardar} loading={saving}>Guardar modulo</Button>
          {registro && (
            <span className="text-xs text-gray-400">
              Ultima actualizacion: {new Date(registro.updatedAt).toLocaleString('es-EC')}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}