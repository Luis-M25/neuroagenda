'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';
import { Plus, Trash2, Upload } from 'lucide-react';

const TIPOS_DOCUMENTO = ['PDF', 'RX', 'MRI', 'LAB', 'CONSENTIMIENTO', 'FOTO', 'OTRO'];

export default function TabDocumentos({ consultaId, editable }: { consultaId: string | null; editable: boolean }) {
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [form, setForm] = useState({ tipo: 'LAB', nombre: '', resultado: '', archivoUrl: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!consultaId) return;
    apiClient<any>(`/hce/consulta/${consultaId}`).then(c => setDocumentos(c.examenes || [])).catch((e) => console.error('Error:', e));
  }, [consultaId]);

  const add = async () => {
    if (!form.nombre) { toast.error('Nombre requerido'); return; }
    if (!consultaId) return;
    setSaving(true);
    try {
      const d = await apiClient(`/hce/consulta/${consultaId}/examen`, { method: 'POST', body: JSON.stringify(form) });
      setDocumentos([...documentos, d]);
      setForm({ tipo: 'LAB', nombre: '', resultado: '', archivoUrl: '' });
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      {documentos.length > 0 && (
        <div className="space-y-2">
          {documentos.map((doc: any) => (
            <div key={doc.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium bg-purple-100 text-purple-700 px-2 py-0.5 rounded">{doc.tipoDocumento || doc.tipo}</span>
                <span className="text-sm font-medium">{doc.nombre}</span>
                {doc.resultado && <span className="text-xs text-gray-500">{doc.resultado}</span>}
                {doc.archivoUrl && <Upload size={14} className="text-blue-500" />}
              </div>
              {editable && <button onClick={async () => { try { await apiClient(`/hce/examenComplementario/${doc.id}`, { method: 'DELETE' }); setDocumentos(d => d.filter(x => x.id !== doc.id)); } catch (e: any) { toast.error(e.message); } }} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>}
            </div>
          ))}
        </div>
      )}
      {editable && (
        <div className="bg-white rounded-lg border p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tipo Documento</label>
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
                {TIPOS_DOCUMENTO.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
              <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Nombre del documento..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Resultado</label>
              <input type="text" value={form.resultado} onChange={(e) => setForm({ ...form, resultado: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Resultado (opcional)" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">URL Archivo</label>
              <input type="text" value={form.archivoUrl} onChange={(e) => setForm({ ...form, archivoUrl: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="URL (opcional)" />
            </div>
          </div>
          <button onClick={add} disabled={saving} className="inline-flex items-center gap-1 px-3 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50"><Plus size={14} /> Agregar Documento</button>
        </div>
      )}
    </div>
  );
}
