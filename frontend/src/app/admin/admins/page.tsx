'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminsApi } from '@/lib/api-client';
import { getUser } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, X, User, Shield, ShieldCheck } from 'lucide-react';
import { validateCedulaEcuador, validateEmail, validateNombres, validateIdentificacion, validatePhoneEcuador, validatePasswordStrength } from '@/lib/validators';
import { PasswordStrengthBar } from '@/components/shared/FormField';

const TIPO_ID_OPTS = ['CEDULA', 'PASAPORTE'];

const ALL_PERMISOS = [
  { key: 'verEspecialistas', label: 'Ver Especialistas' },
  { key: 'crearEspecialista', label: 'Crear Especialista' },
  { key: 'editarEspecialista', label: 'Editar Especialista' },
  { key: 'deshabilitarEspecialista', label: 'Deshabilitar Especialista' },
  { key: 'bloquearEspecialistaGrupal', label: 'Bloqueo Grupal Especialistas' },
  { key: 'verPacientes', label: 'Ver Pacientes' },
  { key: 'crearPaciente', label: 'Crear Paciente' },
  { key: 'editarPaciente', label: 'Editar Paciente' },
  { key: 'verInasistenciasPaciente', label: 'Ver Inasistencias' },
  { key: 'bloquearPaciente', label: 'Bloquear Paciente' },
  { key: 'verTodasCitas', label: 'Ver Todas las Citas' },
  { key: 'crearCita', label: 'Crear Cita' },
  { key: 'editarCita', label: 'Editar Cita' },
  { key: 'cancelarCita', label: 'Cancelar Cita' },
  { key: 'reagendarCita', label: 'Reagendar Cita' },
  { key: 'marcarNoAsistio', label: 'Marcar No Asistió' },
  { key: 'verCalendario', label: 'Ver Calendario' },
  { key: 'verReportes', label: 'Ver Reportes' },
  { key: 'gestionarAdmins', label: 'Gestionar Administradores' },
  { key: 'gestionarPermisos', label: 'Gestionar Permisos' },
  { key: 'verHistoriaClinica', label: 'Ver HCE' },
];

export default function AdminsPage() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    nombres: '', apellidos: '', tipoIdentificacion: 'CEDULA', numeroIdentificacion: '',
    telefono: '', direccion: '', email: '', password: '',
  });
  const [permisos, setPermisos] = useState<Record<string, boolean>>(
    Object.fromEntries(ALL_PERMISOS.map((p) => [p.key, true]))
  );
  const [saving, setSaving] = useState(false);
  const user = getUser();
  const isPrincipal = user?.rol === 'ADMISION_PRINCIPAL';
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [passwordStrength, setPasswordStrength] = useState(validatePasswordStrength(''));

  // Auditor tab
  const [auditores, setAuditores] = useState<any[]>([]);
  const [showAuditorForm, setShowAuditorForm] = useState(false);
  const [auditorForm, setAuditorForm] = useState({ nombres: '', apellidos: '', email: '', password: '', numeroIdentificacion: '' });
  const [auditorPwStrength, setAuditorPwStrength] = useState(validatePasswordStrength(''));
  const [savingAuditor, setSavingAuditor] = useState(false);

  // Enfermeros tab
  const [enfermeros, setEnfermeros] = useState<any[]>([]);
  const [showEnfermeroForm, setShowEnfermeroForm] = useState(false);
  const [enfermeroForm, setEnfermeroForm] = useState({ nombres: '', apellidos: '', email: '', password: '', numeroIdentificacion: '' });
  const [enfermeroPwStrength, setEnfermeroPwStrength] = useState(validatePasswordStrength(''));
  const [savingEnfermero, setSavingEnfermero] = useState(false);

  // Porteros tab
  const [activeTab, setActiveTab] = useState<'admins' | 'porteros' | 'auditores' | 'enfermeros'>('admins');
  const [porteros, setPorteros] = useState<any[]>([]);
  const [showPorteroForm, setShowPorteroForm] = useState(false);
  const [porteroForm, setPorteroForm] = useState({ nombres: '', apellidos: '', email: '', password: '', numeroIdentificacion: '' });
  const [porteroPwStrength, setPorteroPwStrength] = useState(validatePasswordStrength(''));
  const [savingPortero, setSavingPortero] = useState(false);

  const validateField = useCallback((name: string, value: string, isEdit: boolean) => {
    let err = '';
    switch (name) {
      case 'nombres': err = validateNombres(value, 'Nombres').message; break;
      case 'apellidos': err = validateNombres(value, 'Apellidos').message; break;
      case 'numeroIdentificacion': err = validateIdentificacion(form.tipoIdentificacion, value).message; break;
      case 'email': if (!isEdit) { const r = validateEmail(value); if (!r.valid) err = r.message; } break;
      case 'telefono': err = validatePhoneEcuador(value, 'Teléfono').message; break;
      case 'password':
        if (!value && !isEdit) err = 'La contraseña es obligatoria (ISO 27001)';
        else if (value) {
          const s = validatePasswordStrength(value);
          setPasswordStrength(s);
          if (s.score < 3) err = 'Contraseña muy débil: ' + s.issues.join('; ');
        }
        break;
    }
    setFieldErrors((prev) => ({ ...prev, [name]: err }));
  }, [form.tipoIdentificacion]);

  useEffect(() => {
    adminsApi.getAll()
      .then(setAdmins)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  const loadList = () => {
    adminsApi.getAll()
      .then(setAdmins)
      .catch((e) => toast.error(e.message));
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ nombres: '', apellidos: '', tipoIdentificacion: 'CEDULA', numeroIdentificacion: '', telefono: '', direccion: '', email: '', password: '' });
    setPermisos(Object.fromEntries(ALL_PERMISOS.map((p) => [p.key, true])));
    setShowForm(true);
  };

  const openEdit = (a: any) => {
    setEditingId(a.id);
    const adm = a.administracion || a;
    setForm({
      nombres: adm.nombres || a.nombres || '',
      apellidos: adm.apellidos || a.apellidos || '',
      tipoIdentificacion: adm.tipoIdentificacion || a.tipoIdentificacion || 'CEDULA',
      numeroIdentificacion: adm.numeroIdentificacion || a.numeroIdentificacion || '',
      telefono: adm.telefono || a.telefono || '',
      direccion: adm.direccion || a.direccion || '',
      email: '',
      password: '',
    });
    const p = adm.permisos || a.permisos || {};
    setPermisos(Object.fromEntries(ALL_PERMISOS.map((perm) => [perm.key, p[perm.key] !== false])));
    setShowForm(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (touched[name]) {
      validateField(name, value, !!editingId);
    }
  };

  const handleBlur = (name: string, value: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, value, !!editingId);
  };

  const togglePermiso = (key: string) => {
    setPermisos({ ...permisos, [key]: !permisos[key] });
  };

  const handleSave = async () => {
    // Validate all required fields
    const allErrors: Record<string, string> = {};
    const allTouched: Record<string, boolean> = {};

    const fieldsToValidate = ['nombres', 'apellidos', 'numeroIdentificacion', 'telefono'];
    if (!editingId) fieldsToValidate.push('email', 'password');

    fieldsToValidate.forEach((field) => {
      allTouched[field] = true;
      let err = '';
      switch (field) {
        case 'nombres': err = validateNombres(form.nombres, 'Nombres').message; break;
        case 'apellidos': err = validateNombres(form.apellidos, 'Apellidos').message; break;
        case 'numeroIdentificacion': err = validateIdentificacion(form.tipoIdentificacion, form.numeroIdentificacion).message; break;
        case 'telefono': err = validatePhoneEcuador(form.telefono, 'Teléfono').message; break;
        case 'email': if (!editingId) { const r = validateEmail(form.email); if (!r.valid) err = r.message; } break;
        case 'password':
          if (!editingId) {
            if (!form.password) err = 'La contraseña es obligatoria (ISO 27001)';
            else { const s = validatePasswordStrength(form.password); if (s.score < 3) err = 'Contraseña muy débil'; }
          }
          break;
      }
      if (err) allErrors[field] = err;
    });

    setTouched((prev) => ({ ...prev, ...allTouched }));
    setFieldErrors((prev) => ({ ...prev, ...allErrors }));

    if (Object.keys(allErrors).length > 0) {
      toast.error('Corrija los errores antes de guardar (ISO 9001)');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await adminsApi.update(editingId, {
          nombres: form.nombres, apellidos: form.apellidos,
          tipoIdentificacion: form.tipoIdentificacion, numeroIdentificacion: form.numeroIdentificacion,
          telefono: form.telefono, direccion: form.direccion,
        });
        if (isPrincipal) {
          const activePerms = Object.entries(permisos).filter(([, v]) => v).map(([k]) => k);
          await adminsApi.updatePermisos(editingId, activePerms);
        }
        toast.success('Administrador actualizado');
      } else {
        const activePerms = Object.entries(permisos).filter(([, v]) => v).map(([k]) => k);
        await adminsApi.create({ ...form, permisos: activePerms as any });
        toast.success('Administrador creado');
      }
      setShowForm(false);
      loadList();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (a: any) => {
    if (a.rol === 'ADMISION_PRINCIPAL') {
      toast.error('No se puede eliminar al administrador principal');
      return;
    }
    if (!window.confirm(`¿Eliminar a ${a.nombres} ${a.apellidos}?`)) return;
    try {
      await adminsApi.remove(a.id);
      toast.success('Administrador eliminado');
      loadList();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  // ── Porteros handlers ──
  const loadPorteros = () => {
    adminsApi.getAllPorteros()
      .then(setPorteros)
      .catch((e: any) => toast.error(e.message));
  };

  useEffect(() => {
    if (activeTab === 'porteros') loadPorteros();
  }, [activeTab]);

  const handleSavePortero = async () => {
    if (!porteroForm.nombres.trim() || !porteroForm.apellidos.trim()) {
      toast.error('Complete nombres y apellidos');
      return;
    }
    if (!porteroForm.email.trim() || !validateEmail(porteroForm.email).valid) {
      toast.error('Ingrese un email válido');
      return;
    }
    if (!porteroForm.numeroIdentificacion.trim()) {
      toast.error('Ingrese la cédula');
      return;
    }
    const cedulaResult = validateCedulaEcuador(porteroForm.numeroIdentificacion);
    if (!cedulaResult.valid) {
      toast.error(cedulaResult.message || 'Cédula inválida');
      return;
    }
    const pwStrength = validatePasswordStrength(porteroForm.password);
    if (pwStrength.score < 3) {
      toast.error('Contraseña muy débil: ' + pwStrength.issues.join('; '));
      return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(porteroForm.password)) {
      toast.error('La contraseña debe tener al menos un carácter especial (!@#$%^&*(),.?":{}|<>)');
      return;
    }
    setSavingPortero(true);
    try {
      await adminsApi.createPortero(porteroForm);
      toast.success('Portero creado');
      setShowPorteroForm(false);
      setPorteroForm({ nombres: '', apellidos: '', email: '', password: '', numeroIdentificacion: '' });
      setPorteroPwStrength(validatePasswordStrength(''));
      loadPorteros();
    } catch (e: any) { toast.error(e.message); }
    finally { setSavingPortero(false); }
  };

  const handleDeletePortero = async (p: any) => {
    if (!window.confirm(`¿Eliminar portero ${p.email}?`)) return;
    try {
      await adminsApi.removePortero(p.id);
      toast.success('Portero eliminado');
      loadPorteros();
    } catch (e: any) { toast.error(e.message); }
  };

  // ── Auditor handlers ──
  const loadAuditores = () => {
    adminsApi.getAllAuditores()
      .then(setAuditores)
      .catch((e: any) => toast.error(e.message));
  };

  useEffect(() => {
    if (activeTab === 'auditores') loadAuditores();
  }, [activeTab]);

  const handleSaveAuditor = async () => {
    if (!auditorForm.nombres.trim() || !auditorForm.apellidos.trim()) {
      toast.error('Complete nombres y apellidos');
      return;
    }
    if (!auditorForm.email.trim() || !validateEmail(auditorForm.email).valid) {
      toast.error('Ingrese un email válido');
      return;
    }
    if (!auditorForm.numeroIdentificacion.trim()) {
      toast.error('Ingrese la cédula');
      return;
    }
    const cedulaResult = validateCedulaEcuador(auditorForm.numeroIdentificacion);
    if (!cedulaResult.valid) {
      toast.error(cedulaResult.message || 'Cédula inválida');
      return;
    }
    const pwStrength = validatePasswordStrength(auditorForm.password);
    if (pwStrength.score < 3) {
      toast.error('Contraseña muy débil: ' + pwStrength.issues.join('; '));
      return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(auditorForm.password)) {
      toast.error('La contraseña debe tener al menos un carácter especial (!@#$%^&*(),.?":{}|<>)');
      return;
    }
    setSavingAuditor(true);
    try {
      await adminsApi.createAuditor(auditorForm);
      toast.success('Auditor creado');
      setShowAuditorForm(false);
      setAuditorForm({ nombres: '', apellidos: '', email: '', password: '', numeroIdentificacion: '' });
      setAuditorPwStrength(validatePasswordStrength(''));
      loadAuditores();
    } catch (e: any) { toast.error(e.message); }
    finally { setSavingAuditor(false); }
  };

  const handleDeleteAuditor = async (a: any) => {
    if (!window.confirm(`¿Eliminar auditor ${a.email}?`)) return;
    try {
      await adminsApi.removeAuditor(a.id);
      toast.success('Auditor eliminado');
      loadAuditores();
    } catch (e: any) { toast.error(e.message); }
  };

  // ── Enfermeros handlers ──
  const loadEnfermeros = () => {
    adminsApi.getAllEnfermeros()
      .then(setEnfermeros)
      .catch((e: any) => toast.error(e.message));
  };

  useEffect(() => {
    if (activeTab === 'enfermeros') loadEnfermeros();
  }, [activeTab]);

  const handleSaveEnfermero = async () => {
    if (!enfermeroForm.nombres.trim() || !enfermeroForm.apellidos.trim()) {
      toast.error('Complete nombres y apellidos');
      return;
    }
    if (!enfermeroForm.email.trim() || !validateEmail(enfermeroForm.email).valid) {
      toast.error('Ingrese un email válido');
      return;
    }
    if (!enfermeroForm.numeroIdentificacion.trim()) {
      toast.error('Ingrese la cédula');
      return;
    }
    const cedulaResult = validateCedulaEcuador(enfermeroForm.numeroIdentificacion);
    if (!cedulaResult.valid) {
      toast.error(cedulaResult.message || 'Cédula inválida');
      return;
    }
    const pwStrength = validatePasswordStrength(enfermeroForm.password);
    if (pwStrength.score < 3) {
      toast.error('Contraseña muy débil: ' + pwStrength.issues.join('; '));
      return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(enfermeroForm.password)) {
      toast.error('La contraseña debe tener al menos un carácter especial (!@#$%^&*(),.?":{}|<>)');
      return;
    }
    setSavingEnfermero(true);
    try {
      await adminsApi.createEnfermero(enfermeroForm);
      toast.success('Enfermero creado');
      setShowEnfermeroForm(false);
      setEnfermeroForm({ nombres: '', apellidos: '', email: '', password: '', numeroIdentificacion: '' });
      setEnfermeroPwStrength(validatePasswordStrength(''));
      loadEnfermeros();
    } catch (e: any) { toast.error(e.message); }
    finally { setSavingEnfermero(false); }
  };

  const handleDeleteEnfermero = async (e: any) => {
    if (!window.confirm(`¿Eliminar enfermero ${e.email}?`)) return;
    try {
      await adminsApi.removeEnfermero(e.id);
      toast.success('Enfermero eliminado');
      loadEnfermeros();
    } catch (e: any) { toast.error(e.message); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Administradores" description="Gestión de administradores, enfermeros, auditores y porteros del sistema" actions={
        activeTab === 'admins' ? (
          <Button onClick={openCreate} icon={<Plus size={18} />}>Nuevo Admin</Button>
        ) : activeTab === 'auditores' ? (
          <Button onClick={() => setShowAuditorForm(true)} icon={<Plus size={18} />}>Nuevo Auditor</Button>
        ) : activeTab === 'enfermeros' ? (
          <Button onClick={() => setShowEnfermeroForm(true)} icon={<Plus size={18} />}>Nuevo Enfermero</Button>
        ) : (
          <Button onClick={() => setShowPorteroForm(true)} icon={<Plus size={18} />}>Nuevo Portero</Button>
        )
      } />

      <div className="flex border-b">
        <button onClick={() => setActiveTab('admins')} className={cn('px-6 py-3 text-sm font-medium border-b-2 transition-colors', activeTab === 'admins' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700')}>
          <Shield size={14} className="inline mr-1.5" /> Administradores
        </button>
        <button onClick={() => setActiveTab('porteros')} className={cn('px-6 py-3 text-sm font-medium border-b-2 transition-colors', activeTab === 'porteros' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700')}>
          <ShieldCheck size={14} className="inline mr-1.5" /> Porteros
        </button>
        <button onClick={() => setActiveTab('auditores')} className={cn('px-6 py-3 text-sm font-medium border-b-2 transition-colors', activeTab === 'auditores' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700')}>
          <Shield size={14} className="inline mr-1.5" /> Auditores
        </button>
        <button onClick={() => setActiveTab('enfermeros')} className={cn('px-6 py-3 text-sm font-medium border-b-2 transition-colors', activeTab === 'enfermeros' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700')}>
          <User size={14} className="inline mr-1.5" /> Enfermeros
        </button>
      </div>

      {activeTab === 'admins' ? (
        <>

      <div className="bg-white rounded-xl border border-neutral-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b bg-gray-50">
                <th className="p-4 font-medium">Nombre</th>
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium">Rol</th>
                <th className="p-4 font-medium">Teléfono</th>
                <th className="p-4 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">{a.administracion?.nombres || a.nombres} {a.administracion?.apellidos || a.apellidos}</td>
                  <td className="p-4">{a.usuario?.email || a.email}</td>
                  <td className="p-4">
                    <span className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      a.rol === 'ADMISION_PRINCIPAL' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    )}>
                      {a.rol === 'ADMISION_PRINCIPAL' ? 'Admin Principal' : 'Admisión'}
                    </span>
                  </td>
                  <td className="p-4">{a.telefono}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(a)} className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg" title="Editar"><Pencil size={16} /></button>
                      <button
                        onClick={() => handleDelete(a)}
                        disabled={a.rol === 'ADMISION_PRINCIPAL'}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {admins.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">No hay administradores</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">{editingId ? 'Editar Administrador' : 'Nuevo Administrador'}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2"><User size={16} /> Datos Básicos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={cn('block text-sm font-medium mb-1', touched.nombres && fieldErrors.nombres ? 'text-red-700' : 'text-gray-700')}>
                    Nombres <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input name="nombres" value={form.nombres} onChange={handleChange} onBlur={() => handleBlur('nombres', form.nombres)}
                      className={cn('w-full border rounded-lg px-3 py-2', touched.nombres && fieldErrors.nombres ? 'border-red-400 bg-red-50 pr-10' : '')} />
                    {touched.nombres && fieldErrors.nombres && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      </div>
                    )}
                  </div>
                  {touched.nombres && fieldErrors.nombres && <p role="alert" className="text-xs text-red-500 mt-1">{fieldErrors.nombres}</p>}
                </div>
                <div>
                  <label className={cn('block text-sm font-medium mb-1', touched.apellidos && fieldErrors.apellidos ? 'text-red-700' : 'text-gray-700')}>
                    Apellidos <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input name="apellidos" value={form.apellidos} onChange={handleChange} onBlur={() => handleBlur('apellidos', form.apellidos)}
                      className={cn('w-full border rounded-lg px-3 py-2', touched.apellidos && fieldErrors.apellidos ? 'border-red-400 bg-red-50 pr-10' : '')} />
                    {touched.apellidos && fieldErrors.apellidos && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      </div>
                    )}
                  </div>
                  {touched.apellidos && fieldErrors.apellidos && <p role="alert" className="text-xs text-red-500 mt-1">{fieldErrors.apellidos}</p>}
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Tipo ID</label><select name="tipoIdentificacion" value={form.tipoIdentificacion} onChange={handleChange} className="w-full border rounded-lg px-3 py-2">{TIPO_ID_OPTS.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
                <div>
                  <label className={cn('block text-sm font-medium mb-1', touched.numeroIdentificacion && fieldErrors.numeroIdentificacion ? 'text-red-700' : 'text-gray-700')}>
                    Número ID <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input name="numeroIdentificacion" value={form.numeroIdentificacion} onChange={handleChange} onBlur={() => handleBlur('numeroIdentificacion', form.numeroIdentificacion)}
                      className={cn('w-full border rounded-lg px-3 py-2', touched.numeroIdentificacion && fieldErrors.numeroIdentificacion ? 'border-red-400 bg-red-50 pr-10' : '')} />
                    {touched.numeroIdentificacion && fieldErrors.numeroIdentificacion && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      </div>
                    )}
                  </div>
                  {touched.numeroIdentificacion && fieldErrors.numeroIdentificacion && <p role="alert" className="text-xs text-red-500 mt-1">{fieldErrors.numeroIdentificacion}</p>}
                </div>
                <div>
                  <label className={cn('block text-sm font-medium mb-1', touched.telefono && fieldErrors.telefono ? 'text-red-700' : 'text-gray-700')}>
                    Teléfono <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input name="telefono" value={form.telefono} onChange={handleChange} onBlur={() => handleBlur('telefono', form.telefono)}
                      className={cn('w-full border rounded-lg px-3 py-2', touched.telefono && fieldErrors.telefono ? 'border-red-400 bg-red-50 pr-10' : '')} />
                    {touched.telefono && fieldErrors.telefono && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      </div>
                    )}
                  </div>
                  {touched.telefono && fieldErrors.telefono && <p role="alert" className="text-xs text-red-500 mt-1">{fieldErrors.telefono}</p>}
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label><input name="direccion" value={form.direccion} onChange={handleChange} className="w-full border rounded-lg px-3 py-2" /></div>
                {!editingId && (
                  <>
                    <div>
                      <label className={cn('block text-sm font-medium mb-1', touched.email && fieldErrors.email ? 'text-red-700' : 'text-gray-700')}>
                        Email (Usuario) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input type="email" name="email" value={form.email} onChange={handleChange} onBlur={() => handleBlur('email', form.email)}
                          className={cn('w-full border rounded-lg px-3 py-2', touched.email && fieldErrors.email ? 'border-red-400 bg-red-50 pr-10' : '')} />
                        {touched.email && fieldErrors.email && (
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                          </div>
                        )}
                      </div>
                      {touched.email && fieldErrors.email && <p role="alert" className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
                    </div>
                    <div>
                      <label className={cn('block text-sm font-medium mb-1', touched.password && fieldErrors.password ? 'text-red-700' : 'text-gray-700')}>
                        Contraseña <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input type="password" name="password" value={form.password} onChange={handleChange} onBlur={() => handleBlur('password', form.password)}
                          className={cn('w-full border rounded-lg px-3 py-2', touched.password && fieldErrors.password ? 'border-red-400 bg-red-50 pr-10' : '')} />
                        {touched.password && fieldErrors.password && (
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                          </div>
                        )}
                      </div>
                      {touched.password && fieldErrors.password && <p role="alert" className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>}
                      {form.password && !editingId && <PasswordStrengthBar score={passwordStrength.score} label={passwordStrength.label} />}
                    </div>
                  </>
                )}
              </div>

              {isPrincipal && (
                <>
                  <h3 className="font-semibold text-gray-900 pt-4 border-t flex items-center gap-2"><Shield size={16} /> Permisos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {ALL_PERMISOS.map((perm) => (
                      <label key={perm.key} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={permisos[perm.key] || false}
                          onChange={() => togglePermiso(perm.key)}
                          className="rounded"
                        />
                        <span className="text-sm">{perm.label}</span>
                      </label>
                    ))}
                  </div>
                </>
              )}

              {!isPrincipal && (
                <p className="text-sm text-gray-500 pt-4 border-t">
                  Solo el administrador principal puede gestionar permisos.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 p-6 border-t">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button>
              <Button onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}</Button>
            </div>
          </div>
        </div>
      )}
      </>
      ) : activeTab === 'auditores' ? (
        <>
          <div className="bg-white rounded-xl border border-neutral-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b bg-gray-50">
                    <th className="p-4 font-medium">Nombre</th>
                    <th className="p-4 font-medium">Email</th>
                    <th className="p-4 font-medium">Identificación</th>
                    <th className="p-4 font-medium">Rol</th>
                    <th className="p-4 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {auditores.map((a) => (
                    <tr key={a.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="p-4 font-medium text-gray-900">{a.nombres || a.email?.split('@')[0] || '-'} {a.apellidos || ''}</td>
                      <td className="p-4">{a.email}</td>
                      <td className="p-4 text-gray-500">{a.numeroIdentificacion || '-'}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Auditor
                        </span>
                      </td>
                      <td className="p-4">
                        <button onClick={() => handleDeleteAuditor(a)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Eliminar">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {auditores.length === 0 && (
                    <tr><td colSpan={5} className="p-8 text-center text-gray-500">No hay auditores registrados</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {showAuditorForm && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
                <div className="flex items-center justify-between p-6 border-b">
                  <h2 className="text-lg font-bold">Nuevo Auditor</h2>
                  <button onClick={() => setShowAuditorForm(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombres</label>
                    <input value={auditorForm.nombres} onChange={(e) => setAuditorForm({ ...auditorForm, nombres: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
                    <input value={auditorForm.apellidos} onChange={(e) => setAuditorForm({ ...auditorForm, apellidos: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cédula</label>
                    <input value={auditorForm.numeroIdentificacion} onChange={(e) => setAuditorForm({ ...auditorForm, numeroIdentificacion: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" value={auditorForm.email} onChange={(e) => setAuditorForm({ ...auditorForm, email: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                    <input type="password" value={auditorForm.password} onChange={(e) => { setAuditorForm({ ...auditorForm, password: e.target.value }); setAuditorPwStrength(validatePasswordStrength(e.target.value)); }} className="w-full border rounded-lg px-3 py-2 text-sm" />
                    <PasswordStrengthBar score={auditorPwStrength.score} label={auditorPwStrength.label} />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 p-6 border-t">
                  <button onClick={() => setShowAuditorForm(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm">Cancelar</button>
                  <Button onClick={handleSaveAuditor} disabled={savingAuditor}>{savingAuditor ? 'Guardando...' : 'Crear'}</Button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : activeTab === 'enfermeros' ? (
        <>
          <div className="bg-white rounded-xl border border-neutral-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b bg-gray-50">
                    <th className="p-4 font-medium">Nombre</th>
                    <th className="p-4 font-medium">Email</th>
                    <th className="p-4 font-medium">Identificación</th>
                    <th className="p-4 font-medium">Rol</th>
                    <th className="p-4 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {enfermeros.map((e) => (
                    <tr key={e.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="p-4 font-medium text-gray-900">{e.nombres || e.email?.split('@')[0] || '-'} {e.apellidos || ''}</td>
                      <td className="p-4">{e.email}</td>
                      <td className="p-4 text-gray-500">{e.numeroIdentificacion || '-'}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          Enfermero
                        </span>
                      </td>
                      <td className="p-4">
                        <button onClick={() => handleDeleteEnfermero(e)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Eliminar">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {enfermeros.length === 0 && (
                    <tr><td colSpan={5} className="p-8 text-center text-gray-500">No hay enfermeros registrados</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {showEnfermeroForm && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
                <div className="flex items-center justify-between p-6 border-b">
                  <h2 className="text-lg font-bold">Nuevo Enfermero</h2>
                  <button onClick={() => setShowEnfermeroForm(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombres</label>
                    <input value={enfermeroForm.nombres} onChange={(e) => setEnfermeroForm({ ...enfermeroForm, nombres: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
                    <input value={enfermeroForm.apellidos} onChange={(e) => setEnfermeroForm({ ...enfermeroForm, apellidos: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cédula</label>
                    <input value={enfermeroForm.numeroIdentificacion} onChange={(e) => setEnfermeroForm({ ...enfermeroForm, numeroIdentificacion: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" value={enfermeroForm.email} onChange={(e) => setEnfermeroForm({ ...enfermeroForm, email: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                    <input type="password" value={enfermeroForm.password} onChange={(e) => { setEnfermeroForm({ ...enfermeroForm, password: e.target.value }); setEnfermeroPwStrength(validatePasswordStrength(e.target.value)); }} className="w-full border rounded-lg px-3 py-2 text-sm" />
                    <PasswordStrengthBar score={enfermeroPwStrength.score} label={enfermeroPwStrength.label} />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 p-6 border-t">
                  <button onClick={() => setShowEnfermeroForm(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm">Cancelar</button>
                  <Button onClick={handleSaveEnfermero} disabled={savingEnfermero}>{savingEnfermero ? 'Guardando...' : 'Crear'}</Button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-neutral-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b bg-gray-50">
                    <th className="p-4 font-medium">Nombre</th>
                    <th className="p-4 font-medium">Email</th>
                    <th className="p-4 font-medium">Identificación</th>
                    <th className="p-4 font-medium">Rol</th>
                    <th className="p-4 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {porteros.map((p) => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="p-4 font-medium text-gray-900">{p.nombres || p.email?.split('@')[0] || '-'} {p.apellidos || ''}</td>
                      <td className="p-4">{p.email}</td>
                      <td className="p-4 text-gray-500">{p.numeroIdentificacion || (p as any).detalle?.numeroIdentificacion || '-'}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          Portero
                        </span>
                      </td>
                      <td className="p-4">
                        <button onClick={() => handleDeletePortero(p)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Eliminar">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {porteros.length === 0 && (
                    <tr><td colSpan={5} className="p-8 text-center text-gray-500">No hay porteros registrados</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {showPorteroForm && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
                <div className="flex items-center justify-between p-6 border-b">
                  <h2 className="text-lg font-bold">Nuevo Portero</h2>
                  <button onClick={() => setShowPorteroForm(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombres</label>
                    <input value={porteroForm.nombres} onChange={(e) => setPorteroForm({ ...porteroForm, nombres: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
                    <input value={porteroForm.apellidos} onChange={(e) => setPorteroForm({ ...porteroForm, apellidos: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cédula</label>
                    <input value={porteroForm.numeroIdentificacion} onChange={(e) => setPorteroForm({ ...porteroForm, numeroIdentificacion: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" value={porteroForm.email} onChange={(e) => setPorteroForm({ ...porteroForm, email: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                    <input type="password" value={porteroForm.password} onChange={(e) => { setPorteroForm({ ...porteroForm, password: e.target.value }); setPorteroPwStrength(validatePasswordStrength(e.target.value)); }} className="w-full border rounded-lg px-3 py-2 text-sm" />
                    <PasswordStrengthBar score={porteroPwStrength.score} label={porteroPwStrength.label} />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 p-6 border-t">
                  <button onClick={() => setShowPorteroForm(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm">Cancelar</button>
                  <Button onClick={handleSavePortero} disabled={savingPortero}>{savingPortero ? 'Guardando...' : 'Crear'}</Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
