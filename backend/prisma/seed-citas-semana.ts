import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function localDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

async function main() {
  console.log('=== Seed citas para la semana del 29 Junio al 3 Julio 2026 ===\n');

  const espPassword = await bcrypt.hash('especialista123', 10);
  const admin = await prisma.usuario.findUnique({ where: { email: 'admin@agendamiento.com' } });
  if (!admin) { console.error('Ejecute primero el seed principal'); return; }

  const adminEsp = await prisma.usuario.findUnique({ where: { email: 'subadmin@agendamiento.com' } });

  // ── Crear 3 especialistas nuevos ──
  const nuevos = [
    {
      email: 'dr.sanchez@clinica.com',
      nombres: 'Roberto', apellidos: 'Sanchez',
      identificacion: '1000000003', codigoMsp: 'MSP-003',
      especialidad: 'Traumatologia', titulo: 'Medico Traumatologo',
      consultorio: 'Consultorio 102',
      horarios: [
        { diaSemana: 1, horaInicio: '08:00', horaFin: '12:00', duracionMinutos: 30 },
        { diaSemana: 1, horaInicio: '14:00', horaFin: '17:00', duracionMinutos: 30 },
        { diaSemana: 2, horaInicio: '08:00', horaFin: '12:00', duracionMinutos: 30 },
        { diaSemana: 3, horaInicio: '08:00', horaFin: '12:00', duracionMinutos: 30 },
        { diaSemana: 3, horaInicio: '14:00', horaFin: '17:00', duracionMinutos: 30 },
        { diaSemana: 4, horaInicio: '08:00', horaFin: '12:00', duracionMinutos: 30 },
        { diaSemana: 5, horaInicio: '08:00', horaFin: '12:00', duracionMinutos: 30 },
      ],
    },
    {
      email: 'dra.gomez@clinica.com',
      nombres: 'Ana', apellidos: 'Gomez',
      identificacion: '1000000004', codigoMsp: 'MSP-004',
      especialidad: 'Pediatria', titulo: 'Medica Pediatra',
      consultorio: 'Consultorio 304',
      horarios: [
        { diaSemana: 1, horaInicio: '08:00', horaFin: '13:00', duracionMinutos: 30 },
        { diaSemana: 2, horaInicio: '08:00', horaFin: '13:00', duracionMinutos: 30 },
        { diaSemana: 3, horaInicio: '08:00', horaFin: '13:00', duracionMinutos: 30 },
        { diaSemana: 4, horaInicio: '08:00', horaFin: '13:00', duracionMinutos: 30 },
        { diaSemana: 5, horaInicio: '08:00', horaFin: '12:00', duracionMinutos: 30 },
      ],
    },
    {
      email: 'dr.torres@clinica.com',
      nombres: 'Luis', apellidos: 'Torres',
      identificacion: '1000000005', codigoMsp: 'MSP-005',
      especialidad: 'Dermatologia', titulo: 'Medico Dermatologo',
      consultorio: 'Consultorio 201',
      horarios: [
        { diaSemana: 1, horaInicio: '09:00', horaFin: '13:00', duracionMinutos: 30 },
        { diaSemana: 2, horaInicio: '09:00', horaFin: '13:00', duracionMinutos: 30 },
        { diaSemana: 2, horaInicio: '15:00', horaFin: '18:00', duracionMinutos: 30 },
        { diaSemana: 3, horaInicio: '09:00', horaFin: '13:00', duracionMinutos: 30 },
        { diaSemana: 4, horaInicio: '09:00', horaFin: '13:00', duracionMinutos: 30 },
        { diaSemana: 4, horaInicio: '15:00', horaFin: '18:00', duracionMinutos: 30 },
        { diaSemana: 5, horaInicio: '09:00', horaFin: '13:00', duracionMinutos: 30 },
      ],
    },
  ];

  const usuariosIds: string[] = [];

  for (const n of nuevos) {
    const u = await prisma.usuario.upsert({
      where: { email: n.email },
      update: {},
      create: {
        email: n.email,
        passwordHash: espPassword,
        rol: 'ESPECIALISTA',
        creadoPorId: admin.id,
        especialista: {
          create: {
            nombres: n.nombres,
            apellidos: n.apellidos,
            tipoIdentificacion: 'CEDULA',
            numeroIdentificacion: n.identificacion,
            genero: 'MASCULINO',
            codigoMsp: n.codigoMsp,
            especialidad: n.especialidad,
            tituloProfesional: n.titulo,
            emailInstitucional: n.email,
            telefono: '0988888883',
            direccion: 'Clinica Central',
            sede: 'Clinica Central',
            consultorioPredeterminado: n.consultorio,
            horarios: { create: n.horarios },
          },
        },
      },
      include: { especialista: true },
    });
    console.log(`  Especialista creado: ${n.nombres} ${n.apellidos} (${n.especialidad})`);
    usuariosIds.push(u.id);
  }

  // ── Crear 8 pacientes nuevos ──
  const pacientesData = [
    { id: '2000000003', nombres: 'Pedro', apellidos: 'Ramirez', telefono: '0977777773' },
    { id: '2000000004', nombres: 'Laura', apellidos: 'Castillo', telefono: '0977777774' },
    { id: '2000000005', nombres: 'Diego', apellidos: 'Moreno', telefono: '0977777775' },
    { id: '2000000006', nombres: 'Carmen', apellidos: 'Vera', telefono: '0977777776' },
    { id: '2000000007', nombres: 'Andres', apellidos: 'Silva', telefono: '0977777777' },
    { id: '2000000008', nombres: 'Valeria', apellidos: 'Ortiz', telefono: '0977777778' },
    { id: '2000000009', nombres: 'Miguel', apellidos: 'Rios', telefono: '0977777779' },
    { id: '2000000010', nombres: 'Patricia', apellidos: 'Guzman', telefono: '0977777780' },
  ];

  const pacientesIds: string[] = [];
  for (const p of pacientesData) {
    const pac = await prisma.paciente.upsert({
      where: { numeroIdentificacion: p.id },
      update: {},
      create: {
        nombres: p.nombres, apellidos: p.apellidos,
        tipoIdentificacion: 'CEDULA', numeroIdentificacion: p.id,
        genero: 'MASCULINO', fechaNacimiento: localDate('1990-01-01'),
        estadoCivil: 'SOLTERO', telefono: p.telefono,
        direccion: 'Direccion prueba',
        provincia: '09', canton: '0901', zona: 'Urbana',
        grupoSanguineo: 'O_POSITIVO', tipoSeguro: 'IESS',
        emergenciaNombre: 'Familiar', emergenciaTelefono: '0999999999',
        emergenciaParentesco: 'Familiar',
      },
    });
    pacientesIds.push(pac.id);
    console.log(`  Paciente creado: ${p.nombres} ${p.apellidos}`);
  }

  // Obtener IDs existentes
  const usr1 = await prisma.usuario.findUnique({ where: { email: 'dr.paredes@clinica.com' }, include: { especialista: true } });
  const usr2 = await prisma.usuario.findUnique({ where: { email: 'dra.martinez@clinica.com' }, include: { especialista: true } });
  const usr3 = await prisma.usuario.findUnique({ where: { email: 'dr.sanchez@clinica.com' }, include: { especialista: true } });
  const usr4 = await prisma.usuario.findUnique({ where: { email: 'dra.gomez@clinica.com' }, include: { especialista: true } });
  const usr5 = await prisma.usuario.findUnique({ where: { email: 'dr.torres@clinica.com' }, include: { especialista: true } });

  const especialistas = [
    { id: usr1!.especialista!.id, nombre: 'Dr. Paredes', especialidad: 'Cardiologia' },
    { id: usr2!.especialista!.id, nombre: 'Dra. Martinez', especialidad: 'Neurologia' },
    { id: usr3!.especialista!.id, nombre: 'Dr. Sanchez', especialidad: 'Traumatologia' },
    { id: usr4!.especialista!.id, nombre: 'Dra. Gomez', especialidad: 'Pediatria' },
    { id: usr5!.especialista!.id, nombre: 'Dr. Torres', especialidad: 'Dermatologia' },
  ];

  const pacientes = [
    { id: (await prisma.paciente.findUnique({ where: { numeroIdentificacion: '2000000001' } }))!.id, nombre: 'Juan Perez' },
    { id: (await prisma.paciente.findUnique({ where: { numeroIdentificacion: '2000000002' } }))!.id, nombre: 'Sofia Lopez' },
    ...pacientesIds.map((id, i) => ({ id, nombre: `${pacientesData[i].nombres} ${pacientesData[i].apellidos}` })),
  ];

  // ── Semana: Lun 29 Jun → Vie 3 Jul 2026 ──
  const fechas = [
    '2026-06-29', // Lunes
    '2026-06-30', // Martes
    '2026-07-01', // Miercoles
    '2026-07-02', // Jueves
    '2026-07-03', // Viernes
  ];

  // Slots para cada dia (diferentes combinaciones)
  const slots: Record<string, { hora: string; espIdx: number; pacIdx: number }[]> = {
    '2026-06-29': [
      { hora: '08:00', espIdx: 0, pacIdx: 0 },  // Paredes - Juan
      { hora: '08:00', espIdx: 2, pacIdx: 1 },  // Sanchez - Sofia
      { hora: '08:00', espIdx: 3, pacIdx: 2 },  // Gomez - Pedro
      { hora: '08:30', espIdx: 0, pacIdx: 3 },  // Paredes - Laura
      { hora: '08:30', espIdx: 2, pacIdx: 4 },  // Sanchez - Diego
      { hora: '08:30', espIdx: 3, pacIdx: 5 },  // Gomez - Carmen
      { hora: '09:00', espIdx: 1, pacIdx: 6 },  // Martinez - Andres
      { hora: '09:00', espIdx: 4, pacIdx: 7 },  // Torres - Valeria
      { hora: '09:00', espIdx: 0, pacIdx: 8 },  // Paredes - Miguel
      { hora: '09:30', espIdx: 1, pacIdx: 9 },  // Martinez - Patricia
      { hora: '09:30', espIdx: 4, pacIdx: 0 },  // Torres - Juan
      { hora: '10:00', espIdx: 0, pacIdx: 1 },  // Paredes - Sofia
      { hora: '10:00', espIdx: 2, pacIdx: 6 },  // Sanchez - Andres
      { hora: '10:30', espIdx: 0, pacIdx: 4 },  // Paredes - Diego
      { hora: '11:00', espIdx: 2, pacIdx: 8 },  // Sanchez - Miguel
    ],
    '2026-06-30': [
      { hora: '08:00', espIdx: 0, pacIdx: 2 },  // Paredes - Pedro
      { hora: '08:00', espIdx: 2, pacIdx: 3 },  // Sanchez - Laura
      { hora: '08:00', espIdx: 3, pacIdx: 7 },  // Gomez - Valeria
      { hora: '08:30', espIdx: 0, pacIdx: 5 },  // Paredes - Carmen
      { hora: '08:30', espIdx: 3, pacIdx: 9 },  // Gomez - Patricia
      { hora: '09:00', espIdx: 1, pacIdx: 0 },  // Martinez - Juan
      { hora: '09:00', espIdx: 4, pacIdx: 1 },  // Torres - Sofia
      { hora: '09:00', espIdx: 0, pacIdx: 6 },  // Paredes - Andres
      { hora: '09:30', espIdx: 1, pacIdx: 8 },  // Martinez - Miguel
      { hora: '09:30', espIdx: 4, pacIdx: 4 },  // Torres - Diego
      { hora: '10:00', espIdx: 0, pacIdx: 7 },  // Paredes - Valeria
      { hora: '10:00', espIdx: 2, pacIdx: 5 },  // Sanchez - Carmen
      { hora: '10:30', espIdx: 0, pacIdx: 9 },  // Paredes - Patricia
      { hora: '11:00', espIdx: 2, pacIdx: 0 },  // Sanchez - Juan
    ],
    '2026-07-01': [
      { hora: '08:00', espIdx: 0, pacIdx: 3 },  // Paredes - Laura
      { hora: '08:00', espIdx: 2, pacIdx: 6 },  // Sanchez - Andres
      { hora: '08:00', espIdx: 3, pacIdx: 1 },  // Gomez - Sofia
      { hora: '08:30', espIdx: 0, pacIdx: 7 },  // Paredes - Valeria
      { hora: '08:30', espIdx: 2, pacIdx: 9 },  // Sanchez - Patricia
      { hora: '08:30', espIdx: 3, pacIdx: 4 },  // Gomez - Diego
      { hora: '09:00', espIdx: 1, pacIdx: 2 },  // Martinez - Pedro
      { hora: '09:00', espIdx: 4, pacIdx: 5 },  // Torres - Carmen
      { hora: '09:00', espIdx: 0, pacIdx: 8 },  // Paredes - Miguel
      { hora: '09:30', espIdx: 1, pacIdx: 0 },  // Martinez - Juan
      { hora: '09:30', espIdx: 4, pacIdx: 3 },  // Torres - Laura
      { hora: '10:00', espIdx: 0, pacIdx: 1 },  // Paredes - Sofia
      { hora: '10:00', espIdx: 2, pacIdx: 7 },  // Sanchez - Valeria
      { hora: '10:30', espIdx: 0, pacIdx: 4 },  // Paredes - Diego
    ],
    '2026-07-02': [
      { hora: '08:00', espIdx: 0, pacIdx: 9 },  // Paredes - Patricia
      { hora: '08:00', espIdx: 2, pacIdx: 8 },  // Sanchez - Miguel
      { hora: '08:00', espIdx: 3, pacIdx: 0 },  // Gomez - Juan
      { hora: '08:30', espIdx: 0, pacIdx: 5 },  // Paredes - Carmen
      { hora: '08:30', espIdx: 3, pacIdx: 2 },  // Gomez - Pedro
      { hora: '09:00', espIdx: 1, pacIdx: 6 },  // Martinez - Andres
      { hora: '09:00', espIdx: 4, pacIdx: 7 },  // Torres - Valeria
      { hora: '09:00', espIdx: 0, pacIdx: 3 },  // Paredes - Laura
      { hora: '09:30', espIdx: 1, pacIdx: 4 },  // Martinez - Diego
      { hora: '09:30', espIdx: 4, pacIdx: 1 },  // Torres - Sofia
      { hora: '10:00', espIdx: 0, pacIdx: 6 },  // Paredes - Andres
      { hora: '10:00', espIdx: 2, pacIdx: 0 },  // Sanchez - Juan
      { hora: '10:30', espIdx: 0, pacIdx: 7 },  // Paredes - Valeria
    ],
    '2026-07-03': [
      { hora: '08:00', espIdx: 0, pacIdx: 4 },  // Paredes - Diego
      { hora: '08:00', espIdx: 2, pacIdx: 5 },  // Sanchez - Carmen
      { hora: '08:00', espIdx: 3, pacIdx: 9 },  // Gomez - Patricia
      { hora: '08:30', espIdx: 0, pacIdx: 2 },  // Paredes - Pedro
      { hora: '08:30', espIdx: 2, pacIdx: 7 },  // Sanchez - Valeria
      { hora: '08:30', espIdx: 3, pacIdx: 6 },  // Gomez - Andres
      { hora: '09:00', espIdx: 1, pacIdx: 8 },  // Martinez - Miguel
      { hora: '09:00', espIdx: 4, pacIdx: 3 },  // Torres - Laura
      { hora: '09:00', espIdx: 0, pacIdx: 1 },  // Paredes - Sofia
      { hora: '09:30', espIdx: 1, pacIdx: 0 },  // Martinez - Juan
      { hora: '09:30', espIdx: 4, pacIdx: 9 },  // Torres - Patricia
      { hora: '10:00', espIdx: 0, pacIdx: 8 },  // Paredes - Miguel
      { hora: '10:00', espIdx: 2, pacIdx: 3 },  // Sanchez - Laura
    ],
  };

  console.log('\nCreando citas...');
  let totalCitas = 0;

  for (const fecha of fechas) {
    const daySlots = slots[fecha];
    if (!daySlots) continue;

    for (const s of daySlots) {
      const esp = especialistas[s.espIdx];
      const pac = pacientes[s.pacIdx];
      const hora = s.hora;
      const [hh, mm] = hora.split(':').map(Number);
      const hhFin = hh + Math.floor((mm + 30) / 60);
      const mmFin = (mm + 30) % 60;
      const horaFin = `${String(hhFin).padStart(2, '0')}:${String(mmFin).padStart(2, '0')}`;

      await prisma.cita.create({
        data: {
          especialistaId: esp.id,
          pacienteId: pac.id,
          fecha: localDate(fecha),
          horaInicio: hora,
          horaFin,
          duracionMinutos: 30,
          especialidad: esp.especialidad,
          lugar: 'Clinica Central',
          motivo: 'Consulta de control',
          estado: Math.random() > 0.3 ? 'PENDIENTE' : 'CONFIRMADA',
        },
      });
      totalCitas++;
    }
  }

  console.log(`  ${totalCitas} citas creadas exitosamente`);
  console.log('\n=== Seed completado ===');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
