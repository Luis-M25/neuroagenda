import { apiClient } from './client';

interface CitaTriaje {
  id: string;
  paciente: {
    id: string; nombres: string; apellidos: string;
    tipoIdentificacion: string; numeroIdentificacion: string;
    genero: string; telefono: string;
    grupoSanguineo: string; tipoSeguro: string;
    alergias: string | null; enfermedadesPreexistentes: string | null;
  };
  especialista: {
    id: string; nombres: string; apellidos: string;
    especialidad: string; consultorioPredeterminado: string | null;
  };
  fecha: string; horaInicio: string; horaFin: string;
  estado: string; lugar: string;
}

export const enfermeroApi = {
  getCitasHoy: () => apiClient<CitaTriaje[]>('/enfermero/citas-hoy'),
  getDatosTriaje: (pacienteId: string) => apiClient<any>(`/enfermero/paciente/${pacienteId}/datos-triaje`),
  guardarSignosVitales: (citaId: string, data: any) =>
    apiClient(`/enfermero/hce/${citaId}/signos-vitales`, { method: 'POST', body: JSON.stringify(data) }),
  guardarAlergia: (citaId: string, data: any) =>
    apiClient(`/enfermero/hce/${citaId}/alergias`, { method: 'POST', body: JSON.stringify(data) }),
  guardarAntecedente: (citaId: string, data: any) =>
    apiClient(`/enfermero/hce/${citaId}/antecedentes`, { method: 'POST', body: JSON.stringify(data) }),
  getHceParcial: (citaId: string) => apiClient<any>(`/enfermero/hce/${citaId}`),
  finalizarTriaje: (citaId: string) =>
    apiClient<{ ok: boolean; estado: string }>(`/enfermero/hce/${citaId}/finalizar`, { method: 'POST' }),
};
