export const ROUTES = {
  login: '/login',

  admin: {
    root: '/admin',
    dashboard: '/admin',
    especialistas: '/admin/especialistas',
    especialidades: '/admin/especialidades',
    horarios: '/admin/horarios',
    bloquesEspecialidad: '/admin/bloques-especialidad',
    bloquesGrupales: '/admin/bloques-grupales',
    bloquesIndividuales: '/admin/bloques-individuales',
    pacientes: '/admin/pacientes',
    citas: '/admin/citas',
    calendario: '/admin/calendario',
    consultorios: '/admin/consultorios',
    sedes: '/admin/sedes',
    admins: '/admin/admins',
    auditoria: '/admin/auditoria',
    reportes: '/admin/reportes',
    hce: '/admin/hce',
    hceEspecialistas: '/admin/hce/especialistas',
    hceConfiguracion: '/admin/hce/configuracion',
    admision: '/admin/admision',
    derivaciones: '/admin/derivaciones',
    feriados: '/admin/feriados',
    porteroAdmin: '/admin/portero',
    permisos: '/admin/permisos',
    seguros: '/admin/seguros',
  },

  especialista: {
    root: '/especialista',
    dashboard: '/especialista',
    misCitas: '/especialista/mis-citas',
    atencion: (id: string) => `/especialista/mis-citas/${id}/atencion`,
    miPerfil: '/especialista/mi-perfil',
    miHorario: '/especialista/mi-horario',
    hce: '/especialista/hce',
    hceRecetas: '/especialista/hce/recetas',
    derivaciones: '/especialista/derivaciones',
  },

  enfermero: {
    root: '/enfermero',
    dashboard: '/enfermero',
  },

  auditor: {
    root: '/auditor',
    dashboard: '/auditor',
  },
} as const;
