export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
}

export interface AuthProfile extends User {
  id: string;
  email: string;
  especialista?: { id: string; nombres: string; apellidos: string; especialidad: string };
}

export interface User {
  id: string;
  email: string;
  nombre?: string;
  rol?: string;
  roles?: string[];
  permisos?: string[];
  administracion?: { permisos?: Record<string, boolean> };
  especialista?: any;
}
