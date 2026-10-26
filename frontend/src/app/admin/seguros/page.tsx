'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Pencil, Trash2 } from 'lucide-react';

export default function SegurosPage() {
  const [seguros, setSeguros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nombre: '', tipo: '', telefono: '', direccion: '' });
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchSeguros = async () => {
    try { const data = await apiClient<any[]>('/seguros'); setSeguros(data); } catch { setSeguros([]); } finally { setLoading(false); }
  };

  useEffect(() => { fetchSeguros(); }, []);

  const handleSave = async () => {
    if (!form.nombre.trim() || !form.tipo.trim()) { toast.error('Nombre y tipo requeridos'); return; }
    setSaving(true);
    try {
      if (editId) { await apiClient(`/seguros/${editId}`, { method: 'PATCH', body: JSON.stringify(form) }); }
      else { await apiClient('/seguros', { method: 'POST', body: JSON.stringify(form) }); }
      toast.success(editId ? 'Seguro actualizado' : 'Seguro creado');
      setForm({ nombre: '', tipo: '', telefono: '', direccion: '' }); setEditId(null); fetchSeguros();
    } catch (e: any) { toast.error(e.message || 'Error al guardar'); } finally { setSaving(false); }
  };

  const handleEdit = (s: any) => { setForm({ nombre: s.nombre, tipo: s.tipo, telefono: s.telefono || '', direccion: s.direccion || '' }); setEditId(s.id); };
  const handleDelete = async (id: string) => {
    if (!confirm('Desactivar seguro?')) return;
    try { await apiClient(`/seguros/${id}`, { method: 'DELETE' }); fetchSeguros(); }
    catch (e: any) { toast.error(e.message); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Seguros / Convenios" description="Gestion de seguros medicos" />

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre del seguro"
            className="border border-neutral-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-400" />
          <input type="text" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} placeholder="Tipo (Publico/Privado)"
            className="border border-neutral-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-400" />
          <input type="text" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} placeholder="Telefono"
            className="border border-neutral-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-400" />
          <input type="text" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} placeholder="Direccion"
            className="border border-neutral-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-400" />
        </div>
        <div className="flex gap-2 mt-3">
          <Button onClick={handleSave} loading={saving}>{editId ? 'Actualizar' : 'Agregar Seguro'}</Button>
          {editId && <Button variant="outline" onClick={() => { setEditId(null); setForm({ nombre: '', tipo: '', telefono: '', direccion: '' }); }}>Cancelar</Button>}
        </div>
      </Card>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-neutral-100 bg-neutral-50/50">
                <th className="px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Nombre</th>
                <th className="px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Tipo</th>
                <th className="px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Telefono</th>
                <th className="px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Direccion</th>
                <th className="px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider w-20" />
              </tr>
            </thead>
            <tbody>
              {seguros.map((s) => (
                <tr key={s.id} className="border-t border-neutral-50 hover:bg-neutral-50/50 transition-colors">
                  <td className="px-5 py-4 font-medium text-neutral-900">{s.nombre}</td>
                  <td className="px-5 py-4 text-neutral-600">{s.tipo}</td>
                  <td className="px-5 py-4 text-neutral-600">{s.telefono || '-'}</td>
                  <td className="px-5 py-4 text-neutral-600">{s.direccion || '-'}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEdit(s)} className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(s.id)} className="p-1.5 text-neutral-400 hover:text-danger-500 hover:bg-danger-50 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {seguros.length === 0 && <tr><td colSpan={5} className="p-12"><EmptyState title="Sin seguros" description="Agrega el primer seguro o convenio" /></td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
