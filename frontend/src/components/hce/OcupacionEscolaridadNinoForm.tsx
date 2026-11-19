'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Briefcase, Plus, Trash2 } from 'lucide-react';
import { hceApi } from '@/lib/api-client';
import type { OcupacionEscolaridadNino } from '@/types/historia-clinica';
import {
  ETIQUETAS_DEFAULT,
  cargarEtiquetasNino,
  type EtiquetasModulos,
} from './modulos-funcionales.helpers';

type ResponsableLocal = { nombre: string; contacto: string; parentesco: string };

function Chips({
  opciones,
  seleccionadas,
  onToggle,
}: {
  opciones: string[];
  seleccionadas: string[];
  onToggle: (valor: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {opciones.map((op) => {
        const activa = seleccionadas.includes(op);
        return (
          <button
            key={op}
            type="button"
            onClick={() => onToggle(op)}
            aria-pressed={activa}
            className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
              activa
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-primary-400'
            }`}
          >
            {op}
          </button>
        );
      })}
    </div>
  );
}

export function OcupacionEscolaridadNinoForm({
  pacienteId,
  especialidad,
}: {
  pacienteId: string;
  especialidad?: string;
}) {
  const [registro, setRegistro] = useState<OcupacionEscolaridadNino | null>(null);
  const [ocupacionTexto, setOcupacionTexto] = useState('');
  const [ocupacionEtiquetas, setOcupacionEtiquetas] = useState<string[]>([]);
  const [nivelAcademico, setNivelAcademico] = useState('');
  const [escolaridadTexto, setEscolaridadTexto] = useState('');
  const [escolaridadEtiquetas, setEscolaridadEtiquetas] = useState<string[]>([]);
  const [responsables, setResponsables] = useState<ResponsableLocal[]>([]);
  const [motivo, setMotivo] = useState('');
  const [etiquetas, setEtiquetas] = useState<EtiquetasModulos>(ETIQUETAS_DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let activo = true;
    Promise.all([
      hceApi.getOcupacionEscolaridadNino(pacienteId),
      cargarEtiquetasNino(especialidad),
    ])
      .then(([data, ets]) => {
        if (!activo) return;
        setRegistro(data);
        setOcupacionTexto(data?.ocupacionTexto ?? '');
        setOcupacionEtiquetas(data?.ocupacionEtiquetas ?? []);
        setNivelAcademico(data?.nivelAcademico ?? '');
        setEscolaridadTexto(data?.escolaridadTexto ?? '');
        setEscolaridadEtiquetas(data?.escolaridadEtiquetas ?? []);
        setResponsables(
          (data?.responsables ?? []).map((r) => ({
            nombre: r.nombre,
            contacto: r.contacto ?? '',
            parentesco: r.parentesco ?? '',
          })),
        );
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
    setSaving(true);
    try {
      const resp = await hceApi.saveOcupacionEscolaridadNino(pacienteId, {
        ocupacionTexto: ocupacionTexto.trim() || undefined,
        ocupacionEtiquetas,
        nivelAcademico: nivelAcademico || undefined,
        escolaridadTexto: escolaridadTexto.trim() || undefined,
        escolaridadEtiquetas,
        responsables: responsables
          .filter((r) => r.nombre.trim())
          .map((r) => ({
            nombre: r.nombre.trim(),
            contacto: r.contacto.trim() || undefined,
            parentesco: r.parentesco.trim() || undefined,
          })),
        motivo: motivo.trim() || undefined,
      });
      setRegistro(resp);
      toast.success('Módulo guardado');
    } catch (e: any) {
      toast.error(e.message || 'No se pudo guardar el módulo');
    } finally {
      setSaving(false);
    }
  };

  const agregarAntecedente = async (categoria: 'OCUPACION' | 'ESCOLARIDAD', descripcion: string) => {
    if (!descripcion.trim()) {
      toast.error('Escriba primero el texto que desea registrar como antecedente');
      return;
    }
    try {
      await hceApi.addAntecedente(pacienteId, {
        ambito: 'PERSONAL',
        categoria,
        descripcion: descripcion.trim(),
      });
      toast.success('Registrado en el módulo Antecedentes');
    } catch (e: any) {
      toast.error(e.message || 'No se pudo registrar el antecedente');
    }
  };

  if (loading) {
    return <Card className="p-5 text-sm text-gray-400">Cargando módulo...</Card>;
  }

  return (
    <Card className="p-5 space-y-5">

      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-600">Ocupación — descripción</label>
        <textarea
          value={ocupacionTexto}
          onChange={(e) => setOcupacionTexto(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-gray-200 p-2 text-sm focus:border-primary-500 focus:ring-primary-500"
          placeholder="Describa la ocupación actual o anterior"
        />
        <p className="text-xs font-medium text-gray-600">Etiquetas de ocupación</p>
        <Chips
          opciones={etiquetas.ocupacionEtiquetas}
          seleccionadas={ocupacionEtiquetas}
          onToggle={(v) => toggle(v, ocupacionEtiquetas, setOcupacionEtiquetas)}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => agregarAntecedente('OCUPACION', ocupacionTexto || ocupacionEtiquetas.join(', '))}
        >
          Agregar como antecedente (ocupación)
        </Button>
      </div>

      <div className="border-t pt-4 space-y-2">
        <label className="text-xs font-medium text-gray-600">Nivel académico</label>
        <select
          value={nivelAcademico}
          onChange={(e) => setNivelAcademico(e.target.value)}
          className="w-full rounded-lg border border-gray-200 p-2 text-sm focus:border-primary-500 focus:ring-primary-500"
        >
          <option value="">Seleccione...</option>
          {etiquetas.nivelAcademico.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <label className="text-xs font-medium text-gray-600 block pt-1">Escolaridad — descripción</label>
        <textarea
          value={escolaridadTexto}
          onChange={(e) => setEscolaridadTexto(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-gray-200 p-2 text-sm focus:border-primary-500 focus:ring-primary-500"
        />
        <p className="text-xs font-medium text-gray-600">Etiquetas de escolaridad</p>
        <Chips
          opciones={etiquetas.escolaridadEtiquetas}
          seleccionadas={escolaridadEtiquetas}
          onToggle={(v) => toggle(v, escolaridadEtiquetas, setEscolaridadEtiquetas)}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => agregarAntecedente('ESCOLARIDAD', escolaridadTexto || escolaridadEtiquetas.join(', '))}
        >
          Agregar como antecedente (escolaridad)
        </Button>
      </div>

      <div className="border-t pt-4 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-gray-600">Personas responsables del cuidado</p>
          <Button
            variant="outline"
            size="sm"
            icon={<Plus size={13} />}
            onClick={() => setResponsables((prev) => [...prev, { nombre: '', contacto: '', parentesco: '' }])}
          >
            Agregar
          </Button>
        </div>
        {responsables.length === 0 && (
          <p className="text-xs text-gray-400">Sin responsables registrados.</p>
        )}
        {responsables.map((r, i) => (
          <div key={i} className="grid sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-start rounded-lg border border-gray-100 p-2">
            <input
              value={r.nombre}
              onChange={(e) => setResponsables((prev) => prev.map((x, j) => j === i ? { ...x, nombre: e.target.value } : x))}
              placeholder="Nombre"
              className="rounded-lg border border-gray-200 p-2 text-sm"
            />
            <input
              value={r.contacto}
              onChange={(e) => setResponsables((prev) => prev.map((x, j) => j === i ? { ...x, contacto: e.target.value } : x))}
              placeholder="Contacto"
              className="rounded-lg border border-gray-200 p-2 text-sm"
            />
            <input
              value={r.parentesco}
              onChange={(e) => setResponsables((prev) => prev.map((x, j) => j === i ? { ...x, parentesco: e.target.value } : x))}
              placeholder="Parentesco"
              className="rounded-lg border border-gray-200 p-2 text-sm"
            />
            <Button
              variant="ghost"
              size="sm"
              icon={<Trash2 size={13} />}
              onClick={() => setResponsables((prev) => prev.filter((_, j) => j !== i))}
            />
          </div>
        ))}
      </div>

      <div className="border-t pt-4 space-y-2">
        <label className="text-xs font-medium text-gray-600">Motivo del cambio (auditoría)</label>
        <input
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Opcional"
          className="w-full rounded-lg border border-gray-200 p-2 text-sm"
        />
        <div className="flex items-center gap-3">
          <Button onClick={handleGuardar} loading={saving}>Guardar módulo</Button>
          {registro && (
            <span className="text-xs text-gray-400">
              Última actualización: {new Date(registro.updatedAt).toLocaleString('es-EC')}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
