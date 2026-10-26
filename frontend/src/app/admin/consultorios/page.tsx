'use client';

import { useEffect, useState } from 'react';
import { consultoriosApi, sedesApi } from '@/lib/api-client';
import type { Consultorio } from '@/types/api';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';

interface ConsultorioForm { nombre: string; sede: string; }
const emptyForm: ConsultorioForm = { nombre: '', sede: '' };

export default function ConsultoriosPage() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ConsultorioForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [sedes, setSedes] = useState<any[]>([]);

  useEffect(() => { loadList(); sedesApi.getAll(true).then(setSedes).catch((e) => console.error('Error cargando sedes:', e)); }, []);

  const loadList = () => { setLoading(true); consultoriosApi.getAll().then(setList).catch((e) => toast.error(e.message)).finally(() => setLoading(false)); };
  const openCreate = () => { setEditingId(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (c: any) => { setEditingId(c.id); setForm({ nombre: c.nombre, sede: c.sede }); setShowForm(true); };

  const handleSave = async () => {
    if (!form.nombre.trim() || !form.sede) { toast.error('Nombre y sede son obligatorios'); return; }
    setSaving(true);
    try {
      if (editingId) { await consultoriosApi.update(editingId, form as unknown as Partial<Consultorio>); toast.success('Consultorio actualizado'); }
      else { await consultoriosApi.create(form as unknown as Partial<Consultorio>); toast.success('Consultorio creado'); }
      setShowForm(false); loadList();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  const handleDelete = async (c: any) => {
    if (!window.confirm(`Eliminar consultorio "${c.nombre}"?`)) return;
    try { await consultoriosApi.remove(c.id); toast.success('Consultorio eliminado'); loadList(); }
    catch (e: any) { toast.error(e.message); }
  };

  const toggleActivo = async (c: any) => {
    try { await consultoriosApi.update(c.id, { activo: !c.activo }); toast.success(c.activo ? 'Desactivado' : 'Activado'); loadList(); }
    catch (e: any) { toast.error(e.message); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Consultorios" description="Gestion de consultorios por sede"
        actions={<Button icon={<Plus size={16} />} onClick={openCreate}>Nuevo Consultorio</Button>} />

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-neutral-100 bg-neutral-50/50">
                <th className="px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Nombre</th>
                <th className="px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Sede</th>
                <th className="px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Estado</th>
                <th className="px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider w-20" />
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id} className="border-t border-neutral-50 hover:bg-neutral-50/50 transition-colors">
                  <td className="px-5 py-4 font-medium text-neutral-900">{c.nombre}</td>
                  <td className="px-5 py-4 text-neutral-600">{c.sede || '-'}</td>
                  <td className="px-5 py-4"><button onClick={() => toggleActivo(c)}><Badge variant={c.activo ? 'success' : 'danger'}>{c.activo ? 'Activo' : 'Inactivo'}</Badge></button></td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(c)} className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(c)} className="p-1.5 text-neutral-400 hover:text-danger-500 hover:bg-danger-50 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={4} className="p-12"><EmptyState title="Sin consultorios" description="Crea el primer consultorio" /></td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" />
          <div className="relative w-full max-w-md animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-neutral-900">{editingId ? 'Editar Consultorio' : 'Nuevo Consultorio'}</h3>
                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-neutral-100 rounded-lg"><X size={18} className="text-neutral-500" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Nombre <span className="text-danger-500">*</span></label>
                  <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Consultorio 301"
                    className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Sede <span className="text-danger-500">*</span></label>
                  <select value={form.sede} onChange={(e) => setForm({ ...form, sede: e.target.value })}
                    className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-400">
                    <option value="">Seleccionar sede...</option>
                    {sedes.map((s: any) => <option key={s.id} value={s.nombre}>{s.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button onClick={handleSave} loading={saving}>{editingId ? 'Actualizar' : 'Crear'}</Button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
