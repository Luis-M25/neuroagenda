'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { login } from '@/lib/auth';
import { validateEmail, validateRequired } from '@/lib/validators';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateField = useCallback((field: string, value: string) => {
    let err = '';
    if (field === 'email') { const r = validateEmail(value); if (!r.valid) err = r.message; }
    if (field === 'password') { const r = validateRequired(value, 'Contrasena'); if (!r.valid) err = r.message; }
    setFieldErrors((prev) => ({ ...prev, [field]: err }));
  }, []);

  const handleBlur = (field: string, value: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    validateField('email', email);
    validateField('password', password);
    let eErr = '';
    let pErr = '';
    const re = validateEmail(email);
    if (!re.valid) eErr = re.message;
    const rp = validateRequired(password, 'Contrasena');
    if (!rp.valid) pErr = rp.message;
    if (eErr || pErr) return;
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      if (data.user.rol === 'ESPECIALISTA') router.replace(ROUTES.especialista.dashboard);
      else if (data.user.rol === 'PORTERO') router.replace(ROUTES.portero.root);
      else if (data.user.rol === 'ENFERMERO') router.replace('/enfermero');
      else if (data.user.rol === 'AUDITOR') router.replace(ROUTES.auditor.dashboard);
      else router.replace(ROUTES.admin.dashboard);
    } catch (err: any) {
      setError(err.message || 'Credenciales invalidas');
    } finally {
      setLoading(false);
    }
  };

  const emailError = touched.email ? fieldErrors.email : '';
  const passwordError = touched.password ? fieldErrors.password : '';

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-xl border border-neutral-100 p-8">
          <div className="text-center mb-8">
            <Image
              src="/images/logo-color.png"
              alt="Logo Instituto de Neurociencias"
              width={100}
              height={100}
              className="mx-auto mb-4"
              priority
            />
            <h1 className="text-lg font-bold text-neutral-900">Instituto de Neurociencias</h1>
            <p className="text-sm text-neutral-500 mt-1">Sistema de Agendamiento</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {error && (
              <div className="bg-danger-50 text-danger-600 px-4 py-3 rounded-xl text-sm border border-danger-100">
                {error}
              </div>
            )}

            <Input
              label="Correo electronico"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (touched.email) validateField('email', e.target.value); }}
              onBlur={() => handleBlur('email', email)}
              icon={<Mail size={16} />}
              error={emailError}
              placeholder="admin@clinica.com"
              required
            />

            <Input
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (touched.password) validateField('password', e.target.value); }}
              onBlur={() => handleBlur('password', password)}
              icon={<Lock size={16} />}
              error={passwordError}
              placeholder="••••••••"
              required
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  onMouseDown={(e) => e.preventDefault()}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={showPassword}
                  title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="rounded p-0.5 text-neutral-400 transition-colors hover:text-neutral-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-200"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Iniciar sesion <ArrowRight size={16} />
            </Button>
          </form>

          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 p-3 bg-neutral-50 rounded-xl border border-neutral-100">
              <p className="text-[11px] text-neutral-500 font-medium mb-2">Credenciales de prueba:</p>
              <div className="text-[11px] text-neutral-400 space-y-0.5">
                <p>Admin: <strong className="text-neutral-600">admin@clinica.com</strong> / <strong className="text-neutral-600">admin123</strong></p>
                <p>Sub: <strong className="text-neutral-600">subadmin@clinica.com</strong> / <strong className="text-neutral-600">admin456</strong></p>
                <p>Dr. Paredes: <strong className="text-neutral-600">dr.paredes@clinica.com</strong> / <strong className="text-neutral-600">especialista123</strong></p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
