'use client';

import { useEffect, useState } from 'react';
import { hceApi } from '@/lib/api-client';
import { toast } from 'sonner';
import { FileDown, Loader2, X } from 'lucide-react';
import { todayStr } from '@/lib/utils';

interface CertificadoMedicoModalProps {
  isOpen: boolean;
  consultaId: string | null;
  onClose: () => void;
}

export function CertificadoMedicoModal({ isOpen, consultaId, onClose }: CertificadoMedicoModalProps) {
  const [tipo, setTipo] = useState<'ASISTENCIA' | 'REPOSO'>('ASISTENCIA');
  const [motivo, setMotivo] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [diasReposo, setDiasReposo] = useState('3');
  const [fechaInicio, setFechaInicio] = useState(todayStr());
  const [fechaFin, setFechaFin] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setTipo('ASISTENCIA');
    setMotivo('');
    setObservaciones('');
    setDiasReposo('3');
    setFechaInicio(todayStr());
    setFechaFin('');
    setPassword('');
  }, [isOpen]);

  if (!isOpen) return null;

  const generar = async () => {
    if (!consultaId) {
      toast.error('No hay consulta HCE');
      return;
    }
    if (!password.trim()) {
      toast.error('Ingrese su contraseña para firmar el certificado');
      return;
    }
    if (tipo === 'REPOSO' && (!diasReposo || Number(diasReposo) < 1)) {
      toast.error('Indique los días de reposo');
      return;
    }
    setSaving(true);
    try {
      const cert = await hceApi.generarCertificadoMedico(consultaId, {
        tipo,
        password,
        motivo: motivo.trim() || undefined,
        observaciones: observaciones.trim() || undefined,
        ...(tipo === 'REPOSO'
          ? {
              diasReposo: Number(diasReposo),
              fechaInicio: fechaInicio || undefined,
              fechaFin: fechaFin || undefined,
            }
          : {}),
      });
      toast.success('Certificado generado');
      await hceApi.descargarCertificadoMedicoPdf(cert.id).catch(() => {
        toast.error('El certificado se generó, pero no se pudo descargar el PDF');
      });
      onClose();
    } catch (e: any) {
      toast.error(e.message || 'No se pudo generar el certificado');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Certificado médico</h2>
            <p className="text-xs text-gray-500">Seleccione el tipo de certificado a emitir.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setTipo('ASISTENCIA')}
              className={`px-4 py-2 rounded-lg text-sm border ${tipo === 'ASISTENCIA' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700'}`}
            >
              Asistencia
            </button>
            <button
              onClick={() => setTipo('REPOSO')}
              className={`px-4 py-2 rounded-lg text-sm border ${tipo === 'REPOSO' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700'}`}
            >
              Reposo médico
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Motivo / diagnóstico</label>
            <input value={motivo} onChange={(e) => setMotivo(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Motivo del certificado" />
          </div>

          {tipo === 'REPOSO' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Días de reposo *</label>
                  <input type="number" min={1} value={diasReposo} onChange={(e) => setDiasReposo(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Inicio</label>
                  <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Fin (opcional; se calcula automáticamente)</label>
                <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Observaciones</label>
            <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Contraseña de firma *</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Confirme su contraseña" />
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
          <button onClick={generar} disabled={saving} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm flex items-center gap-1 hover:bg-primary-700 disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
            {saving ? 'Generando...' : 'Firmar y descargar'}
          </button>
        </div>
      </div>
    </div>
  );
}
