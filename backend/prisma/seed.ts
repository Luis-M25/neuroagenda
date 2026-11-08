import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const MODULOS_HCE = [
  'consulta', 'antecedentes', 'alergias', 'signos_vitales',
  'examen_fisico', 'diagnosticos', 'examenes', 'pedidos',
  'prescripcion', 'tratamiento', 'evolucion', 'vacunas',
  'consentimientos', 'proxima_cita', 'observaciones',
  'motivo_consulta', 'datos_generales', 'historial_enfermedad',
  'eval_neuroconductual', 'eval_neuropsicometrica', 'diagnostico_discusion', 'optometria',
  'indicaciones',
];

const MODULOS_POR_ESPECIALIDAD: Record<string, string[]> = {
  'Medicina General': ['consulta', 'historial_enfermedad', 'antecedentes', 'alergias', 'signos_vitales', 'examen_fisico', 'diagnosticos', 'examenes', 'prescripcion', 'tratamiento', 'evolucion', 'vacunas', 'pedidos', 'indicaciones'],
  'Cardiologia': ['consulta', 'historial_enfermedad', 'antecedentes', 'alergias', 'signos_vitales', 'examen_fisico', 'diagnosticos', 'examenes', 'prescripcion', 'tratamiento', 'evolucion', 'pedidos', 'indicaciones'],
  'Neurologia': ['consulta', 'historial_enfermedad', 'antecedentes', 'signos_vitales', 'examen_fisico', 'diagnosticos', 'examenes', 'pedidos', 'prescripcion', 'tratamiento', 'evolucion', 'indicaciones'],
  'Traumatologia': ['consulta', 'historial_enfermedad', 'antecedentes', 'signos_vitales', 'examen_fisico', 'diagnosticos', 'examenes', 'pedidos', 'prescripcion', 'tratamiento', 'evolucion', 'indicaciones'],
  'Pediatria': ['consulta', 'historial_enfermedad', 'antecedentes', 'alergias', 'signos_vitales', 'examen_fisico', 'diagnosticos', 'examenes', 'prescripcion', 'tratamiento', 'evolucion', 'vacunas', 'indicaciones'],
  'Dermatologia': ['consulta', 'historial_enfermedad', 'antecedentes', 'alergias', 'examen_fisico', 'diagnosticos', 'prescripcion', 'tratamiento', 'evolucion', 'indicaciones'],
  'Neuropsicología': ['consulta', 'motivo_consulta', 'datos_generales', 'antecedentes', 'historial_enfermedad', 'eval_neuroconductual', 'eval_neuropsicometrica', 'diagnostico_discusion', 'tratamiento', 'evolucion'],
  'Optometría': ['consulta', 'motivo_consulta', 'datos_generales', 'antecedentes', 'historial_enfermedad', 'signos_vitales', 'optometria', 'examenes', 'diagnosticos', 'tratamiento', 'evolucion', 'observaciones', 'indicaciones'],
};

async function main() {
  console.clear();
  console.log('=== LIMPIANDO BASE DE DATOS ===\n');

  // Limpiar BD - orden correcto de FKs
  await prisma.citaModificacion.deleteMany();
  await prisma.cita.deleteMany();
  await prisma.bloqueoGrupalEspecialista.deleteMany();
  await prisma.bloqueoGrupal.deleteMany();
  await prisma.horarioEspecialista.deleteMany();
  await prisma.pasante.deleteMany();
  await prisma.consentimiento.deleteMany();
  await prisma.vacuna.deleteMany();
  await prisma.pedidoExamen.deleteMany();
  await prisma.prescripcion.deleteMany();
  await prisma.diagnostico.deleteMany();
  await prisma.evolucion.deleteMany();
  await prisma.indicacion.deleteMany();
  await prisma.consultaVersion.deleteMany();
  await prisma.auditoriaHC.deleteMany();
  await prisma.firma.deleteMany();
  await prisma.consultaHCE.deleteMany();
  await prisma.signoVital.deleteMany();
  await prisma.examenComplementario.deleteMany();
  await prisma.antecedente.deleteMany();
  await prisma.inasistenciaPorEspecialidad.deleteMany();
  await prisma.alergia.deleteMany();
  await prisma.habito.deleteMany();
  await prisma.problemaActivo.deleteMany();
  await prisma.alertaManual.deleteMany();
  await prisma.diagnosticoFrecuente.deleteMany();
  await prisma.inasistenciaPorEspecialidad.deleteMany();
  await prisma.paciente.deleteMany();
  await prisma.feriado.deleteMany();
  await prisma.seguro.deleteMany();
  await prisma.especialidadModuloHCE.deleteMany();
  await prisma.permisosAdmin.deleteMany();
  await prisma.administracion.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.consultorio.deleteMany();
  await prisma.sede.deleteMany();
  await prisma.especialidad.deleteMany();
  await prisma.syncedChange.deleteMany();
  await prisma.auditoria.deleteMany();
  await prisma.refreshToken.deleteMany();
  console.log('Base de datos limpia\n');

  const hash = async (pw: string) => bcrypt.hash(pw, 10);

  // Sedes y Consultorios
  console.log('--- Sedes y Consultorios ---');
  await prisma.sede.create({ data: { nombre: 'Clinica Central' } });
  await prisma.sede.create({ data: { nombre: 'Sucursal Norte' } });
  await prisma.sede.create({ data: { nombre: 'Sucursal Sur' } });
  await prisma.consultorio.create({ data: { nombre: 'Consultorio 301', sede: 'Clinica Central' } });
  await prisma.consultorio.create({ data: { nombre: 'Consultorio 205', sede: 'Clinica Central' } });
  await prisma.consultorio.create({ data: { nombre: 'Consultorio 101', sede: 'Sucursal Norte' } });
  await prisma.consultorio.create({ data: { nombre: 'Consultorio 102', sede: 'Sucursal Norte' } });
  await prisma.consultorio.create({ data: { nombre: 'Consultorio 201', sede: 'Sucursal Sur' } });
  console.log('  3 sedes, 5 consultorios');

  // Especialidades
  console.log('--- Especialidades ---');
  const especialidadesNombres = ['Medicina General', 'Cardiologia', 'Neurologia', 'Traumatologia', 'Pediatria', 'Dermatologia', 'Neuropsicología', 'Optometría'];
  for (const n of especialidadesNombres) {
    await prisma.especialidad.upsert({ where: { nombre: n }, update: {}, create: { nombre: n } });
  }
  console.log(`  ${especialidadesNombres.length} especialidades`);

  // Modulos HCE
  console.log('--- Modulos HCE ---');
  for (const esp of especialidadesNombres) {
    const hab = MODULOS_POR_ESPECIALIDAD[esp] || [];
    for (let i = 0; i < MODULOS_HCE.length; i++) {
      await prisma.especialidadModuloHCE.upsert({
        where: { especialidad_modulo: { especialidad: esp, modulo: MODULOS_HCE[i] } },
        update: { habilitado: hab.includes(MODULOS_HCE[i]) },
        create: { especialidad: esp, modulo: MODULOS_HCE[i], habilitado: hab.includes(MODULOS_HCE[i]), orden: i },
      });
    }
  }
  console.log('  Configurados por especialidad');

  // Form configs por defecto
  console.log('--- HCE Forms Config ---');
  const defaultFormsConfig = JSON.stringify((await import('../src/config/hce-forms.config.json')).default);
  const formsJson = JSON.parse(defaultFormsConfig);
  for (const esp of especialidadesNombres) {
    for (const [formName, formConfig] of Object.entries(formsJson.forms)) {
      await prisma.hceFormConfig.upsert({
        where: { especialidad_formName: { especialidad: esp, formName } },
        update: {},
        create: {
          especialidad: esp,
          formName,
          config: JSON.stringify(formConfig),
          habilitado: true,
          orden: 0,
        },
      });
    }
  }
  console.log('  Forms configurados para todas las especialidades');

  // Admin Principal
  console.log('\n--- Administradores ---');
  const adminP = await prisma.usuario.create({
    data: { email: 'admin@clinica.com', passwordHash: await hash('admin123'), rol: 'ADMISION_PRINCIPAL' },
  });
  console.log('  admin@clinica.com / admin123');

  // Sub-Admin
  await prisma.usuario.create({
    data: {
      email: 'subadmin@clinica.com', passwordHash: await hash('admin456'), rol: 'ADMISION', creadoPorId: adminP.id,
      administracion: {
        create: {
          nombres: 'Andrea', apellidos: 'Mendoza', tipoIdentificacion: 'CEDULA', numeroIdentificacion: '1712345679',
          telefono: '0998765432', direccion: 'Av. Colon 456, Quito',
          permisos: {
            create: {
              verEspecialistas: true, crearEspecialista: true, editarEspecialista: true, deshabilitarEspecialista: true,
              bloquearEspecialistaGrupal: true, verPacientes: true, crearPaciente: true, editarPaciente: true,
              verInasistenciasPaciente: true, bloquearPaciente: true, verTodasCitas: true, crearCita: true,
              editarCita: true, cancelarCita: true, reagendarCita: true, marcarNoAsistio: true,
              verCalendario: true, verReportes: true, gestionarAdmins: true, gestionarPermisos: true,
              verHistoriaClinica: true, editarHistoriaClinica: true, gestionarModulosHCE: true,
            },
          },
        },
      },
    },
  });
  console.log('  subadmin@clinica.com / admin456');

  // Portero
  await prisma.usuario.create({
    data: { email: 'portero@clinica.com', passwordHash: await hash('portero123'), rol: 'PORTERO', creadoPorId: adminP.id },
  });
  console.log('  portero@clinica.com / portero123');

  // Especialistas
  console.log('\n--- Especialistas ---');
  await prisma.usuario.create({
    data: {
      email: 'dr.paredes@clinica.com', passwordHash: await hash('especialista123'), rol: 'ESPECIALISTA', creadoPorId: adminP.id,
      especialista: { create: { nombres: 'Carlos', apellidos: 'Paredes', tipoIdentificacion: 'CEDULA', numeroIdentificacion: '1701234567', genero: 'MASCULINO', fechaNacimiento: new Date('1975-03-15'), codigoMsp: 'MSP-001', especialidad: 'Medicina General', tituloProfesional: 'Medico General', emailInstitucional: 'carlos.paredes@clinica.com', telefono: '0991234567', direccion: 'Av. Principal 123, Quito', sede: 'Clinica Central', consultorioPredeterminado: 'Consultorio 301', tienePasantes: true } },
    },
  });
  console.log('  Dr. Carlos Paredes (Medicina General, tienePasantes)');

  await prisma.usuario.create({
    data: {
      email: 'dra.martinez@clinica.com', passwordHash: await hash('especialista123'), rol: 'ESPECIALISTA', creadoPorId: adminP.id,
      especialista: { create: { nombres: 'Maria', apellidos: 'Martinez', tipoIdentificacion: 'CEDULA', numeroIdentificacion: '1702345678', genero: 'FEMENINO', fechaNacimiento: new Date('1982-07-22'), codigoMsp: 'MSP-002', especialidad: 'Cardiologia', tituloProfesional: 'Cardiologa', emailInstitucional: 'maria.martinez@clinica.com', telefono: '0992345678', direccion: 'Calle 10 456, Guayaquil', sede: 'Clinica Central', consultorioPredeterminado: 'Consultorio 301' } },
    },
  });
  console.log('  Dra. Maria Martinez (Cardiologia)');

  await prisma.usuario.create({
    data: {
      email: 'dr.vega@clinica.com', passwordHash: await hash('especialista123'), rol: 'ESPECIALISTA', creadoPorId: adminP.id,
      especialista: { create: { nombres: 'Luis', apellidos: 'Vega', tipoIdentificacion: 'CEDULA', numeroIdentificacion: '1703456789', genero: 'MASCULINO', fechaNacimiento: new Date('1980-11-05'), codigoMsp: 'MSP-003', especialidad: 'Pediatria', tituloProfesional: 'Pediatra', emailInstitucional: 'luis.vega@clinica.com', telefono: '0993456789', direccion: 'Av. Amazonas 789, Quito', sede: 'Clinica Central', consultorioPredeterminado: 'Consultorio 205' } },
    },
  });
  console.log('  Dr. Luis Vega (Pediatria)');

  await prisma.usuario.create({
    data: {
      email: 'dr.diaz@clinica.com', passwordHash: await hash('especialista123'), rol: 'ESPECIALISTA', creadoPorId: adminP.id,
      especialista: { create: { nombres: 'Jorge', apellidos: 'Diaz', tipoIdentificacion: 'CEDULA', numeroIdentificacion: '1704567890', genero: 'MASCULINO', fechaNacimiento: new Date('1978-01-30'), codigoMsp: 'MSP-004', especialidad: 'Neurologia', tituloProfesional: 'Neurologo', emailInstitucional: 'jorge.diaz@clinica.com', telefono: '0994567890', direccion: 'Calle B 234, Cuenca', sede: 'Sucursal Norte', consultorioPredeterminado: 'Consultorio 101' } },
    },
  });
  console.log('  Dr. Jorge Diaz (Neurologia)');

  await prisma.usuario.create({
    data: {
      email: 'dra.ruiz@clinica.com', passwordHash: await hash('especialista123'), rol: 'ESPECIALISTA', creadoPorId: adminP.id,
      especialista: { create: { nombres: 'Ana', apellidos: 'Ruiz', tipoIdentificacion: 'CEDULA', numeroIdentificacion: '1705678901', genero: 'FEMENINO', fechaNacimiento: new Date('1985-09-12'), codigoMsp: 'MSP-005', especialidad: 'Dermatologia', tituloProfesional: 'Dermatologa', emailInstitucional: 'ana.ruiz@clinica.com', telefono: '0995678901', direccion: 'Av. Sol 567, Manta', sede: 'Sucursal Norte', consultorioPredeterminado: 'Consultorio 102' } },
    },
  });
  console.log('  Dra. Ana Ruiz (Dermatologia)');

  await prisma.usuario.create({
    data: {
      email: 'dr.mora@clinica.com', passwordHash: await hash('especialista123'), rol: 'ESPECIALISTA', creadoPorId: adminP.id,
      especialista: { create: { nombres: 'Pedro', apellidos: 'Mora', tipoIdentificacion: 'CEDULA', numeroIdentificacion: '1706789012', genero: 'MASCULINO', fechaNacimiento: new Date('1972-05-18'), codigoMsp: 'MSP-006', especialidad: 'Traumatologia', tituloProfesional: 'Traumatologo', emailInstitucional: 'pedro.mora@clinica.com', telefono: '0996789012', direccion: 'Calle 5 890, Ambato', sede: 'Sucursal Sur', consultorioPredeterminado: 'Consultorio 201', tienePasantes: true } },
    },
  });
  console.log('  Dr. Pedro Mora (Traumatologia, tienePasantes)');

  await prisma.usuario.create({
    data: {
      email: 'optometra.demo@clinica.com', passwordHash: await hash('optometria123'), rol: 'ESPECIALISTA', creadoPorId: adminP.id,
      especialista: { create: { nombres: 'Paola', apellidos: 'Cevallos', tipoIdentificacion: 'CEDULA', numeroIdentificacion: '1707890123', genero: 'FEMENINO', fechaNacimiento: new Date('1988-02-14'), codigoMsp: 'MSP-007', especialidad: 'Optometría', tituloProfesional: 'Optometrista', emailInstitucional: 'paola.cevallos@clinica.com', telefono: '0997890123', direccion: 'Av. 6 de Diciembre 123, Quito', sede: 'Clinica Central', consultorioPredeterminado: 'Consultorio 205' } },
    },
  });
  console.log('  Opt. Paola Cevallos (Optometría) / optometria123');
  console.log('  Pass: especialista123');

  // Obtener IDs
  const getEspId = async (cedula: string) => (await prisma.especialista.findUnique({ where: { numeroIdentificacion: cedula } }))!.id;
  const eParedes = await getEspId('1701234567');
  const eMartinez = await getEspId('1702345678');
  const eVega = await getEspId('1703456789');
  const eDiaz = await getEspId('1704567890');
  const eRuiz = await getEspId('1705678901');
  const eMora = await getEspId('1706789012');
  const eCevallos = await getEspId('1707890123');

  // Horarios
  console.log('\n--- Horarios ---');
  const crearH = async (espId: string, dia: number, hi: string, hf: string) => {
    await prisma.horarioEspecialista.create({ data: { especialistaId: espId, diaSemana: dia, horaInicio: hi, horaFin: hf, duracionMinutos: 30 } });
  };
  for (const dia of [1, 2, 3, 4, 5]) { await crearH(eParedes, dia, '08:00', '12:00'); await crearH(eParedes, dia, '14:00', '17:00'); }
  for (const dia of [1, 2, 3, 4]) { await crearH(eMartinez, dia, '07:30', '13:00'); }
  for (const dia of [1, 2, 3, 4, 5]) { await crearH(eVega, dia, '09:00', '13:00'); }
  for (const dia of [1, 2, 3, 4, 5]) { await crearH(eDiaz, dia, '08:00', '16:00'); }
  for (const dia of [2, 3, 4, 5]) { await crearH(eRuiz, dia, '10:00', '15:00'); }
  for (const dia of [1, 2, 3, 4]) { await crearH(eMora, dia, '07:00', '14:00'); }
  for (const dia of [1, 2, 3, 4, 5]) { await crearH(eCevallos, dia, '08:30', '13:30'); }
  console.log('  Horarios asignados');

  // Pasantes
  console.log('\n--- Pasantes ---');
  const pAndres = await prisma.pasante.create({ data: { especialistaId: eParedes, nombres: 'Andres', apellidos: 'Salazar', tipoIdentificacion: 'CEDULA', numeroIdentificacion: '1711234568' } });
  const pDiana = await prisma.pasante.create({ data: { especialistaId: eParedes, nombres: 'Diana', apellidos: 'Castro', tipoIdentificacion: 'CEDULA', numeroIdentificacion: '1716543218' } });
  const pasSofia = await prisma.pasante.create({ data: { especialistaId: eMora, nombres: 'Sofia', apellidos: 'Lopez', tipoIdentificacion: 'CEDULA', numeroIdentificacion: '1719876543' } });
  console.log('  3 pasantes');

  // Pacientes
  console.log('\n--- Pacientes ---');
  const crearP = (d: any) => prisma.paciente.create({ data: d });
  const pJuan = await crearP({ nombres: 'Juan', apellidos: 'Perez', tipoIdentificacion: 'CEDULA', numeroIdentificacion: '1713333336', genero: 'MASCULINO', fechaNacimiento: new Date('1990-05-10'), estadoCivil: 'SOLTERO', telefono: '0991111111', direccion: 'Calle A 123, Quito', provincia: '17', canton: 'Quito', zona: 'Urbana', grupoSanguineo: 'O_POSITIVO', tipoSeguro: 'IESS', emergenciaNombre: 'Maria Perez', emergenciaTelefono: '0992222222', emergenciaParentesco: 'Madre', alergias: 'Penicilina, Sulfa' });
  const pSofia = await crearP({ nombres: 'Sofia', apellidos: 'Lopez', tipoIdentificacion: 'CEDULA', numeroIdentificacion: '1714444445', genero: 'FEMENINO', fechaNacimiento: new Date('1985-12-20'), estadoCivil: 'CASADO', telefono: '0993333333', direccion: 'Av. Principal 456, Guayaquil', provincia: '09', canton: 'Guayaquil', zona: 'URBANA', grupoSanguineo: 'A_POSITIVO', tipoSeguro: 'PRIVADO', nombreConvenio: 'SALUD SA', emergenciaNombre: 'Carlos Lopez', emergenciaTelefono: '0994444444', emergenciaParentesco: 'Esposo' });
  const pMiguel = await crearP({ nombres: 'Miguel', apellidos: 'Torres', tipoIdentificacion: 'CEDULA', numeroIdentificacion: '1715555556', genero: 'MASCULINO', fechaNacimiento: new Date('1965-03-08'), estadoCivil: 'CASADO', telefono: '0995555555', direccion: 'Calle B 789, Quito', provincia: '17', canton: 'Quito', zona: 'Urbana', grupoSanguineo: 'O_POSITIVO', tipoSeguro: 'IESS', emergenciaNombre: 'Lucia Torres', emergenciaTelefono: '0996666666', emergenciaParentesco: 'Esposa', alergias: 'Ibuprofeno' });
  const pGabriela = await crearP({ nombres: 'Gabriela', apellidos: 'Silva', tipoIdentificacion: 'CEDULA', numeroIdentificacion: '1716666667', genero: 'FEMENINO', fechaNacimiento: new Date('1992-07-15'), estadoCivil: 'SOLTERO', telefono: '0997777777', direccion: 'Av. Amazonas 101, Quito', provincia: '17', canton: 'Quito', zona: 'URBANA', grupoSanguineo: 'A_POSITIVO', tipoSeguro: 'IESS', emergenciaNombre: 'Pedro Silva', emergenciaTelefono: '0998888888', emergenciaParentesco: 'Padre' });
  const pRoberto = await crearP({ nombres: 'Roberto', apellidos: 'Castro', tipoIdentificacion: 'CEDULA', numeroIdentificacion: '1712244447', genero: 'MASCULINO', fechaNacimiento: new Date('1965-02-10'), estadoCivil: 'SOLTERO', telefono: '0997777770', direccion: 'Av. Naciones Unidas 456, Quito', provincia: '17', canton: 'Quito', zona: 'Urbana', grupoSanguineo: 'O_POSITIVO', tipoSeguro: 'PRIVADO', nombreConvenio: 'BMI', emergenciaNombre: 'Ana Castro', emergenciaTelefono: '0997777771', emergenciaParentesco: 'Hermana' });
  const pCarmen = await crearP({ nombres: 'Carmen', apellidos: 'Valencia', tipoIdentificacion: 'CEDULA', numeroIdentificacion: '1717777778', genero: 'FEMENINO', fechaNacimiento: new Date('1978-04-22'), estadoCivil: 'CASADO', telefono: '0999999999', direccion: 'Calle 10 345, Guayaquil', provincia: '09', canton: 'Guayaquil', zona: 'URBANA', grupoSanguineo: 'B_POSITIVO', tipoSeguro: 'IESS', emergenciaNombre: 'Jose Valencia', emergenciaTelefono: '0988888888', emergenciaParentesco: 'Esposo', enfermedadesPreexistentes: 'Hipertension arterial' });
  const pDaniel = await crearP({ nombres: 'Daniel', apellidos: 'Paz', tipoIdentificacion: 'CEDULA', numeroIdentificacion: '1718888889', genero: 'MASCULINO', fechaNacimiento: new Date('2000-11-30'), estadoCivil: 'SOLTERO', telefono: '0977777777', direccion: 'Calle L 999, Cuenca', provincia: '01', canton: 'Cuenca', zona: 'Urbana', grupoSanguineo: 'A_POSITIVO', tipoSeguro: 'PRIVADO', emergenciaNombre: 'Martha Paz', emergenciaTelefono: '0966666666', emergenciaParentesco: 'Madre' });
  const pLaura = await crearP({ nombres: 'Laura', apellidos: 'Mendez', tipoIdentificacion: 'CEDULA', numeroIdentificacion: '1719999990', genero: 'FEMENINO', fechaNacimiento: new Date('1995-06-18'), estadoCivil: 'SOLTERO', telefono: '0955555555', direccion: 'Av. Circunvalacion 234, Manta', provincia: '13', canton: 'Manta', zona: 'URBANA', grupoSanguineo: 'O_POSITIVO', tipoSeguro: 'IESS', emergenciaNombre: 'Carlos Mendez', emergenciaTelefono: '0944444444', emergenciaParentesco: 'Padre', alergias: 'Aspirina, Mariscos' });
  const pRicardo = await crearP({ nombres: 'Ricardo', apellidos: 'Nuñez', tipoIdentificacion: 'CEDULA', numeroIdentificacion: '1710000001', genero: 'MASCULINO', fechaNacimiento: new Date('1970-01-25'), estadoCivil: 'CASADO', telefono: '0933333333', direccion: 'Calle R 777, Ambato', provincia: '18', canton: 'Ambato', zona: 'URBANA', grupoSanguineo: 'AB_POSITIVO', tipoSeguro: 'IESS', emergenciaNombre: 'Patricia Nuñez', emergenciaTelefono: '0922222222', emergenciaParentesco: 'Esposa', enfermedadesPreexistentes: 'Diabetes tipo 2, Hipertension' });
  const pElena = await crearP({ nombres: 'Elena', apellidos: 'Rojas', tipoIdentificacion: 'CEDULA', numeroIdentificacion: '1711111112', genero: 'FEMENINO', fechaNacimiento: new Date('1988-09-03'), estadoCivil: 'SOLTERO', telefono: '0911111111', direccion: 'Av. Colon 900, Quito', provincia: '17', canton: 'Quito', zona: 'Urbana', grupoSanguineo: 'A_POSITIVO', tipoSeguro: 'IESS', emergenciaNombre: 'Rosa Rojas', emergenciaTelefono: '0900000000', emergenciaParentesco: 'Madre' });
  console.log('  10 pacientes');

  // Citas
  console.log('\n--- Citas ---');
  const now = new Date();
  const todayRaw = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayOfWeek = todayRaw.getDay();

  function nextWeekday(date: Date): Date {
    const d = new Date(date);
    while (d.getDay() === 0 || d.getDay() === 6) {
      d.setDate(d.getDate() + 1);
    }
    return d;
  }

  function prevWeekday(date: Date): Date {
    const d = new Date(date);
    while (d.getDay() === 0 || d.getDay() === 6) {
      d.setDate(d.getDate() - 1);
    }
    return d;
  }

  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const today = isWeekend ? nextWeekday(todayRaw) : todayRaw;

  if (isWeekend) {
    console.log(`  Hoy es fin de semana (${['domingo','lunes','martes','miércoles','jueves','viernes','sábado'][dayOfWeek]}).`);
    console.log(`  Las citas de "hoy" se generan para el lunes ${today.toISOString().slice(0, 10)}.`);
  }
  const ft = (h: number, m: number) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  const espIds = [eParedes, eMartinez, eVega, eDiaz, eRuiz, eMora];
  const espEsp = ['Medicina General', 'Cardiologia', 'Pediatria', 'Neurologia', 'Dermatologia', 'Traumatologia'];
  const espLug = ['Consultorio 301', 'Consultorio 301', 'Consultorio 205', 'Consultorio 101', 'Consultorio 102', 'Consultorio 201'];

  let totalCitas = 0;

  // Pasadas (días hábiles anteriores)
  const ayer = new Date(prevWeekday(new Date(today.getTime() - 86400000)));
  const anteayer = new Date(prevWeekday(new Date(ayer.getTime() - 86400000)));
  const viejas = new Date(prevWeekday(new Date(anteayer.getTime() - 86400000)));

  const pas2 = [pSofia, pMiguel, pGabriela, pCarmen, pDaniel, pLaura, pRoberto, pElena];
  const mots2 = ['Control de rutina', 'Dolor toracico', 'Revision examenes', 'Cefalea cronica', 'Lesion rodilla', 'Control pediatrico', 'Alergia cutanea', 'Colesterol alto'];
  const ests2 = ['ATENDIDA', 'ATENDIDA', 'ATENDIDA', 'ATENDIDA', 'NO_ASISTIO', 'CANCELADA', 'ATENDIDA', 'ATENDIDA'];
  const fechasPasadas = [ayer, ayer, anteayer, anteayer, anteayer, viejas, viejas, viejas];

  for (let i = 0; i < 8; i++) {
    const fecha = fechasPasadas[i];
    try {
      await prisma.cita.create({
        data: {
          especialistaId: espIds[i % 6], pacienteId: pas2[i].id,
          fecha, horaInicio: ft(8 + i, 0), horaFin: ft(8 + i, 30),
          duracionMinutos: 30, especialidad: espEsp[i % 6],
          lugar: espLug[i % 6], motivo: mots2[i], estado: ests2[i],
          ...(ests2[i] === 'CANCELADA' ? { canceladaPor: 'ADMIN', motivoCancelacion: 'Cancelacion administrativa', fechaCancelacion: new Date() } : {}),
        },
      });
      totalCitas++;
    } catch (e: any) { console.log(`  Omitiendo: ${mots2[i]} (${e?.code})`); }
  }

  // Hoy
  const hp2 = [pJuan, pSofia, pMiguel, pGabriela, pRoberto, pCarmen, pDaniel, pLaura, pRicardo, pElena, pJuan, pSofia];
  const hm2 = ['Control general', 'Electrocardiograma', 'Control pediatria', 'Terapia', 'Dolor lumbar cronico', 'Revision dermatologica', 'Dolor de cabeza', 'Rehabilitacion', 'Examenes de sangre', 'Dolor articular', 'Consulta general', 'Control de presion'];
  const he2 = ['PENDIENTE', 'CONFIRMADA', 'EN_ESPERA', 'EN_ESPERA', 'PENDIENTE', 'PENDIENTE', 'CANCELADA', 'PENDIENTE', 'PENDIENTE', 'CONFIRMADA', 'EN_ATENCION', 'PENDIENTE'];

  for (let i = 0; i < 12; i++) {
    const hi = ft(8 + (i % 6), i < 6 ? 0 : 30);
    const hf = ft(8 + (i % 6), i < 6 ? 30 : 0);
    try {
      await prisma.cita.create({
        data: {
          especialistaId: espIds[i % 6], pacienteId: hp2[i].id,
          fecha: today, horaInicio: hi, horaFin: hf,
          duracionMinutos: 30, especialidad: espEsp[i % 6],
          lugar: espLug[i % 6], motivo: hm2[i], estado: he2[i],
          ...(he2[i] === 'CANCELADA' ? { canceladaPor: 'ADMIN', motivoCancelacion: 'Cancelacion administrativa', fechaCancelacion: new Date() } : {}),
        },
      });
      totalCitas++;
    } catch (e: any) { console.log(`  Omitiendo: ${hm2[i]} (${e?.code})`); }
  }

  // Pasantes misma hora
  for (const [p, pid, m] of [
    [pJuan, pAndres.id, 'Control via pasante Andres'],
    [pSofia, pDiana.id, 'Control via pasante Diana'],
  ] as const) {
    try {
      await prisma.cita.create({
        data: {
          especialistaId: eParedes, pacienteId: p.id,
          fecha: today, horaInicio: '10:00', horaFin: '10:30',
          duracionMinutos: 30, especialidad: 'Medicina General',
          lugar: 'Consultorio 301', motivo: m, estado: 'CONFIRMADA',
          atendidaPorId: pid,
        },
      });
      totalCitas++;
    } catch (e: any) { console.log(`  Omitiendo pasante (${e?.code})`); }
  }

  // Futuras (próximos días hábiles)
  const fp2 = [pMiguel, pGabriela, pRoberto, pCarmen, pDaniel, pLaura, pRicardo, pElena, pJuan, pSofia, pMiguel, pGabriela, pRoberto, pCarmen, pDaniel, pLaura];
  const fm2 = ['Control mensual', 'Rehabilitacion', 'Terapia fisica', 'Control derma', 'Evaluacion neuro', 'Control post-op', 'Examen general', 'Vacunacion', 'Control trimestral', 'Evaluacion cardiaca', 'Rehabilitacion', 'Control pediatria', 'Revision tratamiento', 'Seguimiento', 'Evaluacion', 'Control'];
  const fe2 = ['PENDIENTE', 'CONFIRMADA', 'PENDIENTE', 'CONFIRMADA', 'PENDIENTE', 'PENDIENTE', 'CONFIRMADA', 'PENDIENTE', 'PENDIENTE', 'CONFIRMADA', 'PENDIENTE', 'PENDIENTE', 'CONFIRMADA', 'PENDIENTE', 'PENDIENTE', 'CONFIRMADA'];

  let futuraFecha = new Date(today);
  for (let i = 0; i < 16; i++) {
    futuraFecha.setDate(futuraFecha.getDate() + 1);
    futuraFecha = nextWeekday(futuraFecha);
    const hi = ft(8 + (i % 5), 0);
    const hf = ft(8 + (i % 5), 30);
    try {
      await prisma.cita.create({
        data: {
          especialistaId: espIds[i % 6], pacienteId: fp2[i].id,
          fecha: new Date(futuraFecha), horaInicio: hi, horaFin: hf,
          duracionMinutos: 30, especialidad: espEsp[i % 6],
          lugar: espLug[i % 6], motivo: fm2[i], estado: fe2[i],
        },
      });
      totalCitas++;
    } catch (e: any) { console.log(`  Omitiendo: ${fm2[i]} (${e?.code})`); }
  }

  // Citas HCE - casos especificos con datos clinicos
  const citaHCE1 = { e: 3, p: pRoberto, f: anteayer, hi: '09:00', hf: '09:30', est: 'ATENDIDA', mot: 'Dolor lumbar cronico' };
  const citaHCE2 = { e: 4, p: pCarmen, f: anteayer, hi: '11:00', hf: '11:30', est: 'ATENDIDA', mot: 'Revision dermatologica' };
  const citaHCE3 = { e: 0, p: pRoberto, f: today, hi: '15:00', hf: '15:30', est: 'EN_ATENCION', mot: 'Control general' };

  for (const c of [citaHCE1, citaHCE2, citaHCE3]) {
    try {
      await prisma.cita.create({
        data: {
          especialistaId: espIds[c.e], pacienteId: c.p.id,
          fecha: c.f, horaInicio: c.hi, horaFin: c.hf,
          duracionMinutos: 30, especialidad: espEsp[c.e],
          lugar: espLug[c.e], motivo: c.mot, estado: c.est,
        },
      });
      totalCitas++;
    } catch (e: any) { console.log(`  Omitiendo: ${c.mot} (${e?.code})`); }
  }

  console.log(`  ${totalCitas} citas creadas`);

  // HCE Consultas
  console.log('\n--- HCE Consultas ---');
  const citaRob = await prisma.cita.findFirst({ where: { pacienteId: pRoberto.id, especialistaId: eDiaz }, orderBy: { fecha: 'desc' } });
  if (citaRob) {
    const co = await prisma.consultaHCE.create({ data: { pacienteId: pRoberto.id, citaId: citaRob.id, especialistaId: eDiaz, motivoConsulta: 'Dolor lumbar cronico', enfermedadActual: 'Lumbalgia mecanica de 3 meses de evolucion', tiempoEvolucion: '3 meses', tratamientosPrevios: 'Ibuprofeno 400mg PRN' } });
    await prisma.diagnostico.create({ data: { consultaId: co.id, codigoCIE10: 'M54.5', descripcion: 'Lumbago no especificado', tipo: 'PRINCIPAL' } });
    await prisma.diagnostico.create({ data: { consultaId: co.id, codigoCIE10: 'M79.1', descripcion: 'Mialgia', tipo: 'SECUNDARIO' } });
    await prisma.prescripcion.create({ data: { consultaId: co.id, medicamento: 'Naproxeno 500mg', dosis: '1 tableta', via: 'Oral', frecuencia: 'Cada 12 horas', duracion: '10 dias', indicaciones: 'Tomar con alimentos' } });
    await prisma.evolucion.create({ data: { consultaId: co.id, pacienteId: pRoberto.id, especialistaId: eDiaz, subjetivo: 'Dolor 6/10 que empeora al estar sentado', objetivo: 'Lasegue negativo, fuerza 5/5', analisis: 'Lumbalgia mecanica sin compromiso radicular', plan: 'AINEs 10 dias + fisioterapia. Control en 15 dias.' } });
    console.log('  Roberto Castro (Neurologia): 2 diag, 1 presc, 1 evol');
  }

  const citaCar = await prisma.cita.findFirst({ where: { pacienteId: pCarmen.id, especialistaId: eRuiz }, orderBy: { fecha: 'desc' } });
  if (citaCar) {
    const co = await prisma.consultaHCE.create({ data: { pacienteId: pCarmen.id, citaId: citaCar.id, especialistaId: eRuiz, motivoConsulta: 'Revision dermatologica', enfermedadActual: 'Erupcion pruriginosa en brazos y cuello de 1 semana', tiempoEvolucion: '1 semana', tratamientosPrevios: 'Loratadina sin mejoria' } });
    await prisma.diagnostico.create({ data: { consultaId: co.id, codigoCIE10: 'L50.8', descripcion: 'Urticaria cronica', tipo: 'PRINCIPAL' } });
    await prisma.prescripcion.create({ data: { consultaId: co.id, medicamento: 'Cetirizina 10mg', dosis: '1 tableta', via: 'Oral', frecuencia: 'Cada 24 horas', duracion: '14 dias' } });
    await prisma.prescripcion.create({ data: { consultaId: co.id, medicamento: 'Hidrocortisona crema 1%', dosis: 'Aplicar capa fina', via: 'Topica', frecuencia: 'Cada 8 horas', duracion: '7 dias' } });
    console.log('  Carmen Valencia (Dermatologia): 1 diag, 2 presc');
  }

  const citaRic = await prisma.cita.findFirst({ where: { pacienteId: pRicardo.id, especialistaId: eParedes }, orderBy: { fecha: 'desc' } });
  if (citaRic) {
    const co = await prisma.consultaHCE.create({ data: { pacienteId: pRicardo.id, citaId: citaRic.id, especialistaId: eParedes, motivoConsulta: 'Examenes de sangre', enfermedadActual: 'Control de diabetes tipo 2 e hipertension', tiempoEvolucion: 'Cronico', tratamientosPrevios: 'Metformina 850mg, Enalapril 10mg' } });
    await prisma.diagnostico.create({ data: { consultaId: co.id, codigoCIE10: 'E11.9', descripcion: 'Diabetes mellitus tipo 2', tipo: 'PRINCIPAL' } });
    await prisma.diagnostico.create({ data: { consultaId: co.id, codigoCIE10: 'I10', descripcion: 'Hipertension arterial esencial', tipo: 'SECUNDARIO' } });
    await prisma.prescripcion.create({ data: { consultaId: co.id, medicamento: 'Metformina 850mg', dosis: '1 tableta', via: 'Oral', frecuencia: 'Cada 12 horas', duracion: 'Continuo' } });
    await prisma.prescripcion.create({ data: { consultaId: co.id, medicamento: 'Enalapril 20mg', dosis: '1 tableta', via: 'Oral', frecuencia: 'Cada 24 horas', duracion: 'Continuo' } });
    await prisma.evolucion.create({ data: { consultaId: co.id, pacienteId: pRicardo.id, especialistaId: eParedes, subjetivo: 'Asintomatico. Cumpliendo tratamiento.', objetivo: 'PA 130/85, FC 72, Peso 82kg', analisis: 'Buen control. Sobrepeso persiste.', plan: 'Continuar medicacion. Dieta + ejercicio. Control en 3 meses.' } });
    await prisma.pedidoExamen.create({ data: { consultaId: co.id, tipo: 'LABORATORIO', descripcion: 'Hemoglobina glicosilada, perfil lipidico, creatinina', urgente: false } });
    console.log('  Ricardo Nuñez (Med General): 2 diag, 2 presc, 1 evol, 1 pedido');
  }

  const citaRob2 = await prisma.cita.findFirst({ where: { pacienteId: pRoberto.id, especialistaId: eParedes, fecha: { gte: today, lt: new Date(today.getTime() + 86400000) } } });
  if (citaRob2) {
    const co = await prisma.consultaHCE.create({ data: { pacienteId: pRoberto.id, citaId: citaRob2.id, especialistaId: eParedes, motivoConsulta: 'Control general', enfermedadActual: 'Mejoria del dolor lumbar. Continuar tratamiento.', tiempoEvolucion: '4 meses', tratamientosPrevios: 'Naproxeno 500mg, fisioterapia' } });
    await prisma.diagnostico.create({ data: { consultaId: co.id, codigoCIE10: 'M54.5', descripcion: 'Lumbago no especificado', tipo: 'PRINCIPAL' } });
    await prisma.evolucion.create({ data: { consultaId: co.id, pacienteId: pRoberto.id, especialistaId: eParedes, subjetivo: 'Dolor reducido a 2/10. Mayor movilidad.', objetivo: 'ROM lumbar mejorado. Marcha normal.', analisis: 'Evolucion favorable.', plan: 'Completar AINEs. Continuar fisioterapia. Alta con recomendaciones.' } });
    console.log('  Roberto Castro (Med General, 2a consulta): 1 diag, 1 evol');
  }

  // Datos clinicos
  await prisma.antecedente.create({ data: { pacienteId: pRicardo.id, tipo: 'FAMILIAR', ambito: 'FAMILIAR', categoria: 'DIABETES', descripcion: 'Padre diabetico, madre hipertensa', fecha: new Date('2020-01-15') } });
  await prisma.antecedente.create({ data: { pacienteId: pRoberto.id, tipo: 'PERSONAL', ambito: 'PERSONAL', categoria: 'QUIRURGICO', descripcion: 'Apendicectomia 2019', fecha: new Date('2019-05-10') } });
  await prisma.antecedente.create({ data: { pacienteId: pMiguel.id, tipo: 'FAMILIAR', ambito: 'FAMILIAR', categoria: 'CARDIACA', descripcion: 'Padre con cardiopatia isquemica', fecha: new Date('2018-03-20') } });
  await prisma.signoVital.create({ data: { pacienteId: pRicardo.id, presionArterial: '130/85', frecuenciaCardiaca: 72, temperatura: 36.5, peso: 82, talla: 169, imc: 28.5 } });
  await prisma.signoVital.create({ data: { pacienteId: pRoberto.id, presionArterial: '120/80', frecuenciaCardiaca: 68, temperatura: 36.4, peso: 92, talla: 178, imc: 29.0 } });
  await prisma.vacuna.create({ data: { pacienteId: pJuan.id, nombre: 'COVID-19 Pfizer', fecha: new Date('2024-03-15'), dosis: '3ra dosis', lote: 'PF-001' } });
  await prisma.vacuna.create({ data: { pacienteId: pJuan.id, nombre: 'Tetanos', fecha: new Date('2023-01-10'), dosis: 'Refuerzo', lote: 'TET-2023' } });
  console.log('  Antecedentes, signos vitales, vacunas');

  // Feriados
  const feriados = [
    ['2026-01-01', 'Año Nuevo'], ['2026-02-16', 'Carnaval'], ['2026-02-17', 'Carnaval'],
    ['2026-04-02', 'Jueves Santo'], ['2026-04-03', 'Viernes Santo'], ['2026-05-01', 'Dia del Trabajo'],
    ['2026-05-24', 'Batalla de Pichincha'], ['2026-08-10', 'Primer Grito de Independencia'],
    ['2026-10-09', 'Independencia de Guayaquil'], ['2026-11-02', 'Difuntos'], ['2026-12-25', 'Navidad'],
  ];
  for (const [f, n] of feriados) {
    await prisma.feriado.upsert({ where: { fecha: new Date(f) }, update: {}, create: { fecha: new Date(f), nombre: n } });
  }
  console.log(`  ${feriados.length} feriados`);

  console.log('\n=== SEED COMPLETADO ===\n');
  console.log('Credenciales:');
  console.log('  Admin:  admin@clinica.com / admin123');
  console.log('  Sub:    subadmin@clinica.com / admin456');
  console.log('  Portero: portero@clinica.com / portero123');
  console.log('  Especialistas (c/u): especialista123');
  console.log(`  ${totalCitas} citas, 4 consultas HCE con datos clinicos`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
