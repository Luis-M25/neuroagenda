import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

type PermisoSpec = { clave: string; nombre: string; descripcion: string; categoria: string };
type RolSpec = { clave: string; nombre: string; descripcion?: string; permisos: string[] };

const PERMISOS: PermisoSpec[] = [
  { clave: 'ver_especialistas', nombre: 'Ver especialistas', descripcion: 'Listar y consultar especialistas', categoria: 'Especialistas' },
  { clave: 'crear_especialista', nombre: 'Crear especialista', descripcion: 'Crear un nuevo especialista en el sistema', categoria: 'Especialistas' },
  { clave: 'editar_especialista', nombre: 'Editar especialista', descripcion: 'Modificar datos del especialista', categoria: 'Especialistas' },
  { clave: 'deshabilitar_especialista', nombre: 'Deshabilitar especialista', descripcion: 'Cambiar estado habilitado/inhabilitado', categoria: 'Especialistas' },
  { clave: 'configurar_horarios', nombre: 'Configurar horarios', descripcion: 'Crear y editar horarios semanales del especialista', categoria: 'Especialistas' },
  { clave: 'configurar_bloqueos_especialista', nombre: 'Bloqueo individual de especialista', descripcion: 'Bloquear especialista con rango de fechas', categoria: 'Especialistas' },
  { clave: 'bloqueo_grupal_especialistas', nombre: 'Bloqueo grupal de especialistas', descripcion: 'Bloquear lista de especialistas a la vez', categoria: 'Especialistas' },
  { clave: 'bloqueo_por_especialidad', nombre: 'Bloqueo por especialidad', descripcion: 'Bloquear todos los especialistas de una especialidad', categoria: 'Especialistas' },

  { clave: 'ver_pacientes', nombre: 'Ver pacientes', descripcion: 'Listar y consultar pacientes', categoria: 'Pacientes' },
  { clave: 'crear_paciente', nombre: 'Crear paciente', descripcion: 'Crear un nuevo paciente en el sistema', categoria: 'Pacientes' },
  { clave: 'editar_paciente', nombre: 'Editar paciente', descripcion: 'Modificar datos del paciente', categoria: 'Pacientes' },
  { clave: 'bloquear_paciente', nombre: 'Bloquear paciente', descripcion: 'Bloquear paciente y notificar', categoria: 'Pacientes' },

  { clave: 'ver_inasistencias', nombre: 'Ver inasistencias', descripcion: 'Ver listado de inasistencias', categoria: 'Inasistencias' },
  { clave: 'cancelar_protocolo', nombre: 'Cancelar protocolo', descripcion: 'Cancelar protocolo completo de un paciente', categoria: 'Inasistencias' },
  { clave: 'marcar_no_asistio', nombre: 'Marcar no asistio', descripcion: 'Marcar una cita como no asistida', categoria: 'Inasistencias' },

  { clave: 'ver_todas_las_citas', nombre: 'Ver todas las citas', descripcion: 'Ver todas las citas del sistema', categoria: 'Citas' },
  { clave: 'crear_cita', nombre: 'Crear cita', descripcion: 'Crear citas nuevas', categoria: 'Citas' },
  { clave: 'editar_cita', nombre: 'Editar cita', descripcion: 'Modificar citas existentes', categoria: 'Citas' },
  { clave: 'cancelar_cita', nombre: 'Cancelar cita', descripcion: 'Cancelar citas', categoria: 'Citas' },
  { clave: 'reagendar_cita', nombre: 'Reagendar cita', descripcion: 'Reagendar citas individual o masivamente', categoria: 'Citas' },
  { clave: 'reasignar_cita', nombre: 'Reasignar cita', descripcion: 'Mover una cita a otro especialista', categoria: 'Citas' },
  { clave: 'reasignar_horario', nombre: 'Reasignar horario', descripcion: 'Mover una cita a otro horario del mismo especialista', categoria: 'Citas' },

  { clave: 'ver_calendario', nombre: 'Ver calendario', descripcion: 'Ver calendario de citas', categoria: 'Calendario' },
  { clave: 'configurar_dia_bloqueado', nombre: 'Dia bloqueado', descripcion: 'Bloquear un dia especifico', categoria: 'Calendario' },

  { clave: 'ver_reportes', nombre: 'Ver reportes', descripcion: 'Listar y exportar reportes', categoria: 'Reportes' },

  { clave: 'gestionar_administradores', nombre: 'Gestionar administradores', descripcion: 'Crear, editar y eliminar administradores', categoria: 'Administracion' },
  { clave: 'gestionar_permisos', nombre: 'Gestionar permisos', descripcion: 'Configurar permisos y roles', categoria: 'Administracion' },
  { clave: 'crear_portero', nombre: 'Crear portero', descripcion: 'Crear usuario portero', categoria: 'Administracion' },

  { clave: 'ver_hce', nombre: 'Ver HCE', descripcion: 'Ver historia clinica electronica', categoria: 'HCE' },
  { clave: 'crear_hce', nombre: 'Crear HCE', descripcion: 'Llenar modulos de HCE', categoria: 'HCE' },
  { clave: 'editar_hce', nombre: 'Editar HCE', descripcion: 'Editar modulos abiertos de HCE', categoria: 'HCE' },
  { clave: 'cerrar_hce', nombre: 'Cerrar HCE', descripcion: 'Cerrar consulta tras atencion', categoria: 'HCE' },
  { clave: 'firmar_hce', nombre: 'Firmar HCE', descripcion: 'Aplicar firma digital a la consulta', categoria: 'HCE' },
  { clave: 'firmar_digitalmente', nombre: 'Firma digital servidor', descripcion: 'Re-password + generar PDF firmado', categoria: 'HCE' },
  { clave: 'revisar_hce', nombre: 'Revisar HCE', descripcion: 'Marcar HCE como revisada por auditor', categoria: 'HCE' },
  { clave: 'gestionar_modulos_hce', nombre: 'Modulos HCE', descripcion: 'Configurar modulos habilitados por especialidad', categoria: 'HCE' },

  { clave: 'gestionar_seguros', nombre: 'Gestionar seguros', descripcion: 'CRUD de seguros medicos', categoria: 'Catalogos' },
  { clave: 'gestionar_sedes', nombre: 'Gestionar sedes/consultorios', descripcion: 'CRUD de sedes y consultorios', categoria: 'Catalogos' },
  { clave: 'gestionar_especialidades', nombre: 'Gestionar especialidades', descripcion: 'CRUD de especialidades', categoria: 'Catalogos' },

  { clave: 'cambiar_estado_espera', nombre: 'Cambiar a en espera', descripcion: 'Portero/enfermero marcara cita como en espera', categoria: 'Auxiliares' },
  { clave: 'ver_mis_citas', nombre: 'Ver mis citas', descripcion: 'Especialista ve sus propias citas', categoria: 'Auxiliares' },
  { clave: 'ver_mis_horarios', nombre: 'Ver mis horarios', descripcion: 'Especialista ve sus horarios asignados', categoria: 'Auxiliares' },
  { clave: 'ver_mis_pacientes', nombre: 'Ver mis pacientes', descripcion: 'Especialista ve pacientes que ha atendido', categoria: 'Auxiliares' },
  { clave: 'crear_usuarios', nombre: 'Crear usuarios', descripcion: 'Permite crear usuarios administradores/porteros/enfermeros', categoria: 'Administracion' },
];

const ROLES: RolSpec[] = [
  {
    clave: 'ADMIN',
    nombre: 'Administrador',
    descripcion: 'Acceso total al sistema',
    permisos: PERMISOS.map((p) => p.clave),
  },
  {
    clave: 'ADMISION',
    nombre: 'Admision',
    descripcion: 'Personal de admision con permisos configurables',
    permisos: [
      'ver_especialistas',
      'ver_pacientes',
      'crear_paciente',
      'editar_paciente',
      'bloquear_paciente',
      'ver_todas_las_citas',
      'crear_cita',
      'editar_cita',
      'cancelar_cita',
      'reagendar_cita',
      'marcar_no_asistio',
      'ver_calendario',
      'ver_inasistencias',
      'ver_reportes',
      'ver_hce',
      'reasignar_horario',
    ],
  },
  {
    clave: 'ESPECIALISTA',
    nombre: 'Especialista',
    descripcion: 'Especialista medico con acceso clinico',
    permisos: [
      'ver_mis_citas',
      'ver_calendario',
      'ver_mis_horarios',
      'ver_mis_pacientes',
      'ver_hce',
      'crear_hce',
      'editar_hce',
      'cerrar_hce',
      'firmar_hce',
      'firmar_digitalmente',
    ],
  },
  {
    clave: 'ENFERMERO',
    nombre: 'Enfermero(a)',
    descripcion: 'Personal de enfermeria - triaje',
    permisos: [
      'ver_calendario',
      'ver_todas_las_citas',
      'crear_hce',
      'editar_hce',
      'cambiar_estado_espera',
    ],
  },
  {
    clave: 'AUDITOR',
    nombre: 'Auditor',
    descripcion: 'Auditor de historias clinicas',
    permisos: ['ver_calendario', 'ver_hce', 'revisar_hce'],
  },
  {
    clave: 'PORTERO',
    nombre: 'Portero',
    descripcion: 'Personal de porteria - gestion de citas del dia',
    permisos: ['ver_calendario', 'cambiar_estado_espera'],
  },
];

const ROL_BY_LEGACY: Record<string, string> = {
  ADMIN: 'ADMIN',
  ADMINISTRADOR: 'ADMIN',
  ADMISION: 'ADMISION',
  ADMISION_PRINCIPAL: 'ADMIN',
  ESPECIALISTA: 'ESPECIALISTA',
  ENFERMERO: 'ENFERMERO',
  ENFERMERA: 'ENFERMERO',
  AUDITOR: 'AUDITOR',
  PORTERO: 'PORTERO',
};

async function main() {
  console.log('[seed-permisos] Iniciando...');

  console.log('[1/4] Sincronizando permisos...');
  for (const p of PERMISOS) {
    await prisma.permiso.upsert({
      where: { clave: p.clave },
      update: { nombre: p.nombre, descripcion: p.descripcion, categoria: p.categoria },
      create: { clave: p.clave, nombre: p.nombre, descripcion: p.descripcion, categoria: p.categoria },
    });
  }
  console.log(`      OK (${PERMISOS.length} permisos)`);

  console.log('[2/4] Creando roles y asociando permisos...');
  for (const r of ROLES) {
    const rol = await prisma.rol.upsert({
      where: { clave: r.clave },
      update: { nombre: r.nombre, descripcion: r.descripcion },
      create: { clave: r.clave, nombre: r.nombre, descripcion: r.descripcion },
    });

    const permisos = await prisma.permiso.findMany({ where: { clave: { in: r.permisos } } });
    await prisma.rolPermiso.deleteMany({ where: { rolId: rol.id } });
    await prisma.rolPermiso.createMany({
      data: permisos.map((p) => ({ rolId: rol.id, permisoId: p.id })),
    });
    console.log(`      Rol ${r.clave} OK (${permisos.length} permisos)`);
  }

  console.log('[3/4] Migrando usuarios legacy a UsuarioRol...');
  const rolesById: Record<string, string> = {};
  RolesMap: for (const r of ROLES) {
    const rol = await prisma.rol.findUnique({ where: { clave: r.clave } });
    if (rol) rolesById[r.clave] = rol.id;
  }
  const usuarios = await prisma.usuario.findMany({ select: { id: true, rol: true } });
  for (const u of usuarios) {
    const claveNueva = ROL_BY_LEGACY[u.rol];
    if (!claveNueva) continue;
    const rolId = rolesById[claveNueva];
    if (!rolId) continue;
    await prisma.usuarioRol.upsert({
      where: { usuarioId_rolId: { usuarioId: u.id, rolId } },
      update: {},
      create: { usuarioId: u.id, rolId },
    });
  }
  console.log(`      OK (${usuarios.length} usuarios revisados)`);

  console.log('[4/4] Verificando super-admin...');
  const SUPER_EMAIL = 'admin@sistema.local';
  let superAdmin = await prisma.usuario.findUnique({
    where: { email: SUPER_EMAIL },
    include: { roles: { include: { rol: true } } },
  });

  if (!superAdmin) {
    const password = randomBytes(12).toString('base64url');
    const passwordHash = await bcrypt.hash(password, 10);
    superAdmin = await prisma.usuario.create({
      data: {
        email: SUPER_EMAIL,
        passwordHash,
        rol: 'ADMIN',
        activo: true,
        primerNombre: 'Super',
        primerApellido: 'Admin',
      },
      include: { roles: { include: { rol: true } } },
    });
    const rolAdmin = rolesById['ADMIN'];
    if (rolAdmin) {
      await prisma.usuarioRol.create({
        data: { usuarioId: superAdmin.id, rolId: rolAdmin },
      });
    }
    console.log('');
    console.log('================================================================');
    console.log('  SUPER-ADMIN CREADO. Guardar estas credenciales:');
    console.log(`  email:    ${SUPER_EMAIL}`);
    console.log(`  password: ${password}`);
    console.log('================================================================');
    console.log('');
  } else {
    const rolAdmin = rolesById['ADMIN'];
    if (rolAdmin) {
      await prisma.usuarioRol.upsert({
        where: { usuarioId_rolId: { usuarioId: superAdmin.id, rolId: rolAdmin } },
        update: {},
        create: { usuarioId: superAdmin.id, rolId: rolAdmin },
      });
    }
    console.log('      Super-admin ya existia, asegurado con rol ADMIN.');
  }

  const totalPermisos = await prisma.permiso.count();
  const totalRoles = await prisma.rol.count();
  console.log(`[seed-permisos] OK | roles=${totalRoles} permisos=${totalPermisos}`);
}

main()
  .catch((e) => {
    console.error('[seed-permisos] ERROR', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
