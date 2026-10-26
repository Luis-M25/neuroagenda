'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { feriadosApi } from '@/lib/api-client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Pencil, Trash2, Plus } from 'lucide-react';

export default function FeriadosPage() {
  const [feriados, setFeriados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ fecha: '', nombre: '' });
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchFeriados = async () => {
    try { const data = await feriadosApi.getAll(); setFeriados(data); } catch { setFeriados([]); } finally { setLoading(false); }
  };

  useEffect(() => { fetchFeriados(); }, []);

  const handleSave = async () => {
    if (!form.fecha || !form.nombre.trim()) { toast.error('Fecha y nombre requeridos'); return; }
    setSaving(true);
    try {
      if (editId) { await feriadosApi.update(editId, form); }
      else { await feriadosApi.create(form); }
      toast.success(editId ? 'Feriado actualizado' : 'Feriado creado');
      setForm({ fecha: '', nombre: '' }); setEditId(null); fetchFeriados();
    } catch (e: any) { toast.error(e.message || 'Error al guardar'); } finally { setSaving(false); }
  };

  const handleEdit = (f: any) => {
    const fechaStr = f.fecha ? new Date(f.fecha).toISOString().split('T')[0] : '';
    setForm({ fecha: fechaStr, nombre: f.nombre }); setEditId(f.id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar feriado?')) return;
    try { await feriadosApi.remove(id); toast.success('Feriado eliminado'); fetchFeriados(); }
    catch (e: any) { toast.error(e.message); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Feriados" description="Gestion de dias feriados del sistema" />

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Fecha</label>
            <input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })}
              className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Nombre del feriado</label>
            <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Ano Nuevo"
              className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-400" />
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={handleSave} loading={saving} icon={<Plus size={14} />}>{editId ? 'Actualizar' : 'Agregar Feriado'}</Button>
            {editId && <Button variant="outline" onClick={() => { setEditId(null); setForm({ fecha: '', nombre: '' }); }}>Cancelar</Button>}
          </div>
        </div>
      </Card>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-neutral-100 bg-neutral-50/50">
                <th className="px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Fecha</th>
                <th className="px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Nombre</th>
                <th className="px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider w-20" />
              </tr>
            </thead>
            <tbody>
              {feriados.toSorted((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()).map((f) => (
                <tr key={f.id} className="border-t border-neutral-50 hover:bg-neutral-50/50 transition-colors">
                  <td className="px-5 py-4 text-neutral-900 font-medium">{new Date(f.fecha).toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                  <td className="px-5 py-4 text-neutral-600">{f.nombre}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEdit(f)} className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(f.id)} className="p-1.5 text-neutral-400 hover:text-danger-500 hover:bg-danger-50 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {feriados.length === 0 && <tr><td colSpan={3} className="p-12"><EmptyState title="Sin feriados" description="Agrega el primer feriado" /></td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
