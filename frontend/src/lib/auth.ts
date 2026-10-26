import { authApi, setTokens, clearTokens, apiClient } from './api-client';
import type { User } from '@/types/auth';

export type { User };

export function getUser(): User | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('user');
  return stored ? JSON.parse(stored) : null;
}

export function setUser(user: User) {
  localStorage.setItem('user', JSON.stringify(user));
}

export async function login(email: string, password: string) {
  const data = await authApi.login(email, password);
  setTokens(data.accessToken);
  setUser(data.user);
  return data;
}

export async function logout() {
  try { await apiClient('/auth/logout', { method: 'POST' }); } catch {}
  clearTokens();
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('accessToken');
}

export function hasPermission(permiso: string): boolean {
  const user = getUser();
  if (!user) return false;
  const roles = new Set([...(user.roles ?? []), ...(user.rol ? [user.rol] : [])]);
  if (roles.has('ADMIN') || roles.has('ADMISION_PRINCIPAL')) return true;
  if (Array.isArray(user.permisos)) {
    // El backend entrega permisos de rol en snake_case y la UI usa camelCase.
    const snakeCase = permiso
      .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
      .toLowerCase();
    if (user.permisos.includes(permiso) || user.permisos.includes(snakeCase)) return true;
  }
  if (user.administracion?.permisos && typeof user.administracion.permisos === 'object') {
    return (user.administracion.permisos as Record<string, boolean>)[permiso] === true;
  }
  return false;
}

export function hasRole(role: string): boolean {
  const user = getUser();
  if (!user) return false;
  if (Array.isArray(user.roles) && user.roles.includes(role)) return true;
  return user.rol === role;
}
