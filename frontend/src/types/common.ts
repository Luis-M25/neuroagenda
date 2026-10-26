export interface ApiResponse<T> {
  data?: T;
  message?: string;
  statusCode?: number;
}

export interface Pagination {
  pagina: number;
  limite: number;
  total: number;
}

export interface Option {
  value: string;
  label: string;
}

export interface SelectItem {
  id: string;
  nombre: string;
}
