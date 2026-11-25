'use client';

import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  FileArchive,
  Search,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { toast } from 'sonner';
import { reportesApi } from '@/lib/api-client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { PacienteConHc, ResumenHcPaciente } from '@/types/reportes';
import { fieldClass, formatFechaEc } from './reportes.utils';

export function DescargaHcPacienteTab() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PacienteConHc[]>([]);
  const [searching, setSearching] = useState(false);
  const [summary, setSummary] = useState<ResumenHcPaciente | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const value = query.trim();
    if (summary) {
      setResults([]);
      setSearching(false);
      return;
    }
    if (value.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await reportesApi.buscarPacientesConHc(value);
        if (active) setResults(data);
      } catch (error: any) {
        if (active) {
          setResults([]);
          toast.error(error.message);
        }
      } finally {
        if (active) setSearching(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, summary]);

  const seleccionar = async (paciente: PacienteConHc) => {
    setQuery(`${paciente.nombres} ${paciente.apellidos} — ${paciente.numeroIdentificacion}`);
    setResults([]);
    setSummary(null);
    setLoadingSummary(true);
    try {
      setSummary(await reportesApi.getResumenHcPaciente(paciente.id));
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoadingSummary(false);
    }
  };

  const descargar = async () => {
    if (!summary) return;
    setDownloading(true);
    try {
      const result = await reportesApi.descargarHcPacienteZip(
        summary.paciente.id,
        summary.paciente.numeroIdentificacion,
      );
      if (result.excluidas > 0 || result.noDisponibles > 0) {
        const detalles = [
          result.excluidas > 0 ? `${result.excluidas} sin firmar` : '',
          result.noDisponibles > 0 ? `${result.noDisponibles} PDF no disponibles` : '',
        ].filter(Boolean).join(' y ');
        toast.warning(`ZIP descargado con ${result.incluidas} HC; se excluyeron ${detalles}.`);
      } else {
        toast.success(`ZIP descargado con ${result.incluidas} HC en orden cronológico.`);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="max-w-2xl">
          <label className="mb-1 block text-sm font-medium text-neutral-700">Buscar paciente</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setSummary(null);
              }}
              placeholder="Escriba nombre, apellido o identificación"
              className={`${fieldClass} pl-10`}
            />
            {searching && (
              <div className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
            )}
          </div>

          {results.length > 0 && (
            <div className="mt-2 max-h-80 overflow-y-auto rounded-xl border border-neutral-200 bg-white shadow-lg">
              {results.map((paciente) => (
                <button
                  key={paciente.id}
                  type="button"
                  onClick={() => seleccionar(paciente)}
                  className="flex w-full items-center gap-3 border-b border-neutral-100 px-4 py-3 text-left last:border-b-0 hover:bg-neutral-50"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                    <UserRound size={17} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-neutral-900">{paciente.nombres} {paciente.apellidos}</p>
                    <p className="text-xs text-neutral-500">{paciente.numeroIdentificacion}</p>
                  </div>
                  <div className="shrink-0 text-right text-xs text-neutral-500">
                    <p>{paciente.totalHc} HC</p>
                    <p>{paciente.firmadas} firmadas</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!searching && query.trim().length >= 2 && results.length === 0 && !summary && (
            <p className="mt-2 text-xs text-neutral-500">No se encontraron pacientes con HC para esta búsqueda.</p>
          )}
        </div>
      </Card>

      {loadingSummary && (
        <Card><div className="flex justify-center py-10"><div className="h-7 w-7 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" /></div></Card>
      )}

      {summary && (
        <Card>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                  <UserRound size={22} />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900">{summary.paciente.nombres} {summary.paciente.apellidos}</h3>
                  <p className="text-sm text-neutral-500">{summary.paciente.numeroIdentificacion}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="info">{summary.totalHc} HC registradas</Badge>
                <Badge variant="success">{summary.firmadas} firmadas</Badge>
                <Badge variant={summary.pendientes > 0 ? 'warning' : 'neutral'}>{summary.pendientes} pendientes</Badge>
              </div>

              {(summary.primeraFecha || summary.ultimaFecha) && (
                <p className="text-sm text-neutral-500">
                  Período: {formatFechaEc(summary.primeraFecha)} → {formatFechaEc(summary.ultimaFecha)}
                </p>
              )}

              <div className="space-y-2 text-sm">
                <p className="flex items-start gap-2 text-neutral-600">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-success-600" />
                  El ZIP incluirá únicamente documentos firmados, numerados de la HC más antigua a la más reciente.
                </p>
                {summary.pendientes > 0 && (
                  <p className="flex items-start gap-2 text-warning-700">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    {summary.pendientes} HC sin firmar no se incluirán.
                  </p>
                )}
                {summary.pdfNoDisponible > 0 && (
                  <p className="flex items-start gap-2 text-neutral-600">
                    <ShieldCheck size={16} className="mt-0.5 shrink-0 text-primary-600" />
                    Se regenerarán {summary.pdfNoDisponible} PDF firmados que no están en disco.
                  </p>
                )}
              </div>
            </div>

            <Button
              onClick={descargar}
              loading={downloading}
              disabled={summary.firmadas === 0}
              icon={<FileArchive size={18} />}
              size="lg"
              className="shrink-0"
            >
              Descargar ZIP cronológico
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
