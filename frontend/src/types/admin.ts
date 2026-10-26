export interface Admin {
  id: string;
  email: string;
  nombre?: string;
  nombres?: string;
  apellidos?: string;
  tipoIdentificacion?: string;
  numeroIdentificacion?: string;
  telefono?: string;
  direccion?: string;
  permisos?: string[];
}

export interface Portero {
  id: string;
  email: string;
  nombre: string;
}
