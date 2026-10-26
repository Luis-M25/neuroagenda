'use client';

import { useEffect, useState, useCallback } from 'react';
import { authApi } from '@/lib/api-client';
import { toast } from 'sonner';
import { validateRequired, validatePasswordStrength } from '@/lib/validators';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { PasswordStrengthBar } from '@/components/shared/FormField';

export default function MiPerfilPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => { authApi.profile().then(setProfile).catch(console.error).finally(() => setLoading(false)); }, []);

  const passwordStrength = validatePasswordStrength(passwords.newPassword);

  const validateField = useCallback((field: string, value: string): string => {
    let err = '';
    if (field === 'currentPassword') { const r = validateRequired(value, 'Contrasena actual'); if (!r.valid) err = r.message; }
    if (field === 'newPassword') {
      const r = validateRequired(value, 'Nueva contrasena'); if (!r.valid) err = r.message;
      else { const s = validatePasswordStrength(value); if (s.score < 3) err = 'La contrasena debe ser al menos nivel Medio: ' + s.issues.join(', '); }
    }
    setFieldErrors((prev) => ({ ...prev, [field]: err })); return err;
  }, []);

  const handleBlur = (f: string, v: string) => { setTouched((p) => ({ ...p, [f]: true })); validateField(f, v); };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ currentPassword: true, newPassword: true });
    const e1 = validateField('currentPassword', passwords.currentPassword);
    const e2 = validateField('newPassword', passwords.newPassword);
    if (e1 || e2) return;
    try {
      await authApi.changePassword(passwords.currentPassword, passwords.newPassword);
      toast.success('Contrasena actualizada');
      setPasswords({ currentPassword: '', newPassword: '' }); setTouched({}); setFieldErrors({});
    } catch (err: any) { toast.error(err.message); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full" /></div>;

  const esp = profile?.especialista;

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <PageHeader title="Mi Perfil" />

      <Card>
        <h3 className="font-semibold text-neutral-900 pb-3 mb-3 border-b border-neutral-100">Datos Personales</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-neutral-500 text-xs">Nombre</span><p className="font-medium text-neutral-800">{esp?.nombres} {esp?.apellidos}</p></div>
          <div><span className="text-neutral-500 text-xs">Identificacion</span><p className="font-medium text-neutral-800">{esp?.numeroIdentificacion}</p></div>
          <div><span className="text-neutral-500 text-xs">Genero</span><p className="font-medium text-neutral-800">{esp?.genero}</p></div>
          <div><span className="text-neutral-500 text-xs">Codigo MSP</span><p className="font-medium text-neutral-800">{esp?.codigoMsp}</p></div>
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold text-neutral-900 pb-3 mb-3 border-b border-neutral-100">Datos Profesionales</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-neutral-500 text-xs">Especialidad</span><p className="font-medium text-neutral-800">{esp?.especialidad}</p></div>
          <div><span className="text-neutral-500 text-xs">Subespecialidad</span><p className="font-medium text-neutral-800">{esp?.subEspecialidad || '-'}</p></div>
          <div className="col-span-2"><span className="text-neutral-500 text-xs">Titulo</span><p className="font-medium text-neutral-800">{esp?.tituloProfesional}</p></div>
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold text-neutral-900 pb-3 mb-3 border-b border-neutral-100">Contacto</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-neutral-500 text-xs">Email Institucional</span><p className="font-medium text-neutral-800">{esp?.emailInstitucional}</p></div>
          <div><span className="text-neutral-500 text-xs">Email Personal</span><p className="font-medium text-neutral-800">{esp?.emailPersonal || '-'}</p></div>
          <div><span className="text-neutral-500 text-xs">Telefono</span><p className="font-medium text-neutral-800">{esp?.telefono}</p></div>
          <div><span className="text-neutral-500 text-xs">Direccion</span><p className="font-medium text-neutral-800">{esp?.direccion}</p></div>
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold text-neutral-900 pb-3 mb-3 border-b border-neutral-100">Ubicacion de Atencion</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-neutral-500 text-xs">Sede</span><p className="font-medium text-neutral-800">{esp?.sede}</p></div>
          <div><span className="text-neutral-500 text-xs">Consultorio</span><p className="font-medium text-neutral-800">{esp?.consultorio}</p></div>
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold text-neutral-900 pb-3 mb-3 border-b border-neutral-100">Cambiar Contrasena</h3>
        <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm" noValidate>
          <Input type="password" label="Contrasena actual" required value={passwords.currentPassword}
            onChange={(e) => { setPasswords((p) => ({ ...p, currentPassword: e.target.value })); if (touched.currentPassword) validateField('currentPassword', e.target.value); }}
            onBlur={() => handleBlur('currentPassword', passwords.currentPassword)}
            error={touched.currentPassword ? fieldErrors.currentPassword : ''} />

          <div>
            <Input type="password" label="Nueva contrasena" required value={passwords.newPassword}
              onChange={(e) => { setPasswords((p) => ({ ...p, newPassword: e.target.value })); if (touched.newPassword) validateField('newPassword', e.target.value); }}
              onBlur={() => handleBlur('newPassword', passwords.newPassword)}
              error={touched.newPassword ? fieldErrors.newPassword : ''} />
            {passwords.newPassword.length > 0 && <PasswordStrengthBar score={passwordStrength.score} label={passwordStrength.label} />}
            {passwordStrength.issues.length > 0 && passwords.newPassword.length > 0 && (
              <ul className="mt-1 space-y-0.5">
                {passwordStrength.issues.map((issue, i) => <li key={i} className="text-xs text-neutral-500 flex items-center gap-1"><span className="text-warning-500">●</span> {issue}</li>)}
              </ul>
            )}
          </div>

          <Button type="submit">Actualizar Contrasena</Button>
        </form>
      </Card>
    </div>
  );
}
