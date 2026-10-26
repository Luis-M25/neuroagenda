'use client';

import { useEffect, useState } from 'react';
import { especialidadesApi } from '@/lib/api-client';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';

interface FormData { nombre: string; descripcion: string; }
const emptyForm: FormData = { nombre: '', descripcion: '' };

export default function EspecialidadesPage() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadList(); }, []);

  const loadList = () => {
    setLoading(true);
    especialidadesApi.getAll().then(setList).catch((e) => toast.error(e.message)).finally(() => setLoading(false));
  };

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (c: any) => { setEditingId(c.id); setForm({ nombre: c.nombre, descripcion: c.descripcion || '' }); setShowForm(true); };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { setForm({ ...form, [e.target.name]: e.target.value }); };

  const handleSave = async () => {
    if (!form.nombre.trim()) { toast.error('El nombre de la especialidad es obligatorio'); return; }
    setSaving(true);
    try {
      if (editingId) { await especialidadesApi.update(editingId, form); toast.success('Especialidad actualizada'); }
      else { await especialidadesApi.create(form); toast.success('Especialidad creada'); }
      setShowForm(false); loadList();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  const handleDelete = async (c: any) => {
    if (!window.confirm(`Eliminar especialidad "${c.nombre}"?`)) return;
    try { await especialidadesApi.remove(c.id); toast.success('Especialidad eliminada'); loadList(); }
    catch (e: any) { toast.error(e.message); }
  };

  const toggleActivo = async (c: any) => {
    try { await especialidadesApi.update(c.id, { activo: !c.activo }); toast.success(c.activo ? 'Desactivada' : 'Activada'); loadList(); }
    catch (e: any) { toast.error(e.message); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Especialidades" description="Gestion de especialidades medicas"
        actions={<Button icon={<Plus size={16} />} onClick={openCreate}>Nueva Especialidad</Button>} />

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-neutral-100 bg-neutral-50/50">
                <th className="px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Nombre</th>
                <th className="px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Descripcion</th>
                <th className="px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Estado</th>
                <th className="px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider w-20" />
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id} className="border-t border-neutral-50 hover:bg-neutral-50/50 transition-colors">
                  <td className="px-5 py-4 font-medium text-neutral-900">{c.nombre}</td>
                  <td className="px-5 py-4 text-neutral-500">{c.descripcion || '-'}</td>
                  <td className="px-5 py-4">
                    <button onClick={() => toggleActivo(c)}>
                      <Badge variant={c.activo ? 'success' : 'danger'}>{c.activo ? 'Activo' : 'Inactivo'}</Badge>
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(c)} className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(c)} className="p-1.5 text-neutral-400 hover:text-danger-500 hover:bg-danger-50 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={4} className="p-12"><EmptyState title="Sin especialidades" description="Crea la primera especialidad medica" /></td></tr>}
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
                <h3 className="text-lg font-bold text-neutral-900">{editingId ? 'Editar Especialidad' : 'Nueva Especialidad'}</h3>
                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-neutral-100 rounded-lg"><X size={18} className="text-neutral-500" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Nombre <span className="text-danger-500">*</span></label>
                  <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Ej: Cardiologia"
                    className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Descripcion</label>
                  <textarea name="descripcion" value={form.descripcion} onChange={handleChange} rows={3}
                    className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-400 resize-none" placeholder="Descripcion opcional" />
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
