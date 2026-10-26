import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function today(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

async function main() {
  console.log('Iniciando seed masivo...');

  // ───────────────────────────────────
  // ESPECIALISTAS ADICIONALES
  // ───────────────────────────────────
  const adminPrincipal = await prisma.usuario.findFirst({ where: { rol: 'ADMISION_PRINCIPAL' } });
  const espPassword = await bcrypt.hash('especialista123', 10);

  const especialistasData = [
    {
      email: 'luis.vega@clinica.com', nombres: 'Luis', apellidos: 'Vega',
      cedula: '1715555559', genero: 'MASCULINO', msp: 'MSP-003',
      especialidad: 'Pediatria', titulo: 'Medico Pediatra',
      emailInst: 'luis.vega@clinica.com', telefono: '0988888883',
      direccion: 'Av. Los Andes 789', sede: 'Clinica Central', consultorio: 'Consultorio 301',
      horarios: [
        { diaSemana: 1, horaInicio: '08:00', horaFin: '16:00', duracionMinutos: 30 },
        { diaSemana: 2, horaInicio: '08:00', horaFin: '16:00', duracionMinutos: 30 },
        { diaSemana: 3, horaInicio: '08:00', horaFin: '16:00', duracionMinutos: 30 },
        { diaSemana: 4, horaInicio: '08:00', horaFin: '16:00', duracionMinutos: 30 },
        { diaSemana: 5, horaInicio: '08:00', horaFin: '16:00', duracionMinutos: 30 },
      ],
    },
    {
      email: 'ana.ruiz@clinica.com', nombres: 'Ana', apellidos: 'Ruiz',
      cedula: '1716666664', genero: 'FEMENINO', msp: 'MSP-004',
      especialidad: 'Dermatologia', titulo: 'Medica Dermatologa',
      emailInst: 'ana.ruiz@clinica.com', telefono: '0988888884',
      direccion: 'Av. Principal 456', sede: 'Clinica Central', consultorio: 'Consultorio 205',
      horarios: [
        { diaSemana: 1, horaInicio: '09:00', horaFin: '14:00', duracionMinutos: 30 },
        { diaSemana: 2, horaInicio: '09:00', horaFin: '14:00', duracionMinutos: 30 },
        { diaSemana: 3, horaInicio: '09:00', horaFin: '14:00', duracionMinutos: 30 },
        { diaSemana: 4, horaInicio: '09:00', horaFin: '14:00', duracionMinutos: 30 },
      ],
    },
    {
      email: 'pedro.mora@clinica.com', nombres: 'Pedro', apellidos: 'Mora',
      cedula: '1717777779', genero: 'MASCULINO', msp: 'MSP-005',
      especialidad: 'Traumatologia', titulo: 'Medico Traumatologo',
      emailInst: 'pedro.mora@clinica.com', telefono: '0988888885',
      direccion: 'Calle Norte 123', sede: 'Sucursal Norte', consultorio: 'Consultorio 101',
      horarios: [
        { diaSemana: 1, horaInicio: '07:00', horaFin: '13:00', duracionMinutos: 45 },
        { diaSemana: 2, horaInicio: '07:00', horaFin: '13:00', duracionMinutos: 45 },
        { diaSemana: 3, horaInicio: '07:00', horaFin: '13:00', duracionMinutos: 45 },
        { diaSemana: 4, horaInicio: '07:00', horaFin: '13:00', duracionMinutos: 45 },
        { diaSemana: 5, horaInicio: '07:00', horaFin: '13:00', duracionMinutos: 45 },
        { diaSemana: 6, horaInicio: '08:00', horaFin: '12:00', duracionMinutos: 45 },
      ],
    },
    {
      email: 'lucia.rojas@clinica.com', nombres: 'Lucia', apellidos: 'Rojas',
      cedula: '1718888884', genero: 'FEMENINO', msp: 'MSP-006',
      especialidad: 'Cardiologia', titulo: 'Medica Cardiologa',
      emailInst: 'lucia.rojas@clinica.com', telefono: '0988888886',
      direccion: 'Av. Secundaria 789', sede: 'Clinica Central', consultorio: 'Consultorio 301',
      tienePasantes: true,
      horarios: [
        { diaSemana: 2, horaInicio: '14:00', horaFin: '18:00', duracionMinutos: 30 },
        { diaSemana: 3, horaInicio: '14:00', horaFin: '18:00', duracionMinutos: 30 },
      ],
    },
    {
      email: 'jorge.diaz@clinica.com', nombres: 'Jorge', apellidos: 'Diaz',
      cedula: '1719999999', genero: 'MASCULINO', msp: 'MSP-007',
      especialidad: 'Neurologia', titulo: 'Medico Neurocirujano',
      emailInst: 'jorge.diaz@clinica.com', telefono: '0988888887',
      direccion: 'Calle Eloy Alfaro 101', sede: 'Sucursal Norte', consultorio: 'Consultorio 101',
      horarios: [
        { diaSemana: 1, horaInicio: '13:00', horaFin: '17:00', duracionMinutos: 30 },
        { diaSemana: 2, horaInicio: '13:00', horaFin: '17:00', duracionMinutos: 30 },
        { diaSemana: 3, horaInicio: '13:00', horaFin: '17:00', duracionMinutos: 30 },
        { diaSemana: 4, horaInicio: '13:00', horaFin: '17:00', duracionMinutos: 30 },
        { diaSemana: 5, horaInicio: '13:00', horaFin: '16:00', duracionMinutos: 30 },
      ],
    },
  ];

  const especialistasIds: string[] = [];

  for (const ed of especialistasData) {
    const user = await prisma.usuario.upsert({
      where: { email: ed.email },
      update: {},
      create: {
        email: ed.email, passwordHash: espPassword, rol: 'ESPECIALISTA',
        creadoPorId: adminPrincipal?.id,
        especialista: {
          create: {
            nombres: ed.nombres, apellidos: ed.apellidos,
            tipoIdentificacion: 'CEDULA', numeroIdentificacion: ed.cedula,
            genero: ed.genero, codigoMsp: ed.msp,
            especialidad: ed.especialidad,
            tituloProfesional: ed.titulo,
            emailInstitucional: ed.emailInst, telefono: ed.telefono,
            direccion: ed.direccion, sede: ed.sede,
            consultorioPredeterminado: ed.consultorio,
            tienePasantes: ed.tienePasantes || false,
            horarios: { create: ed.horarios },
          },
        },
      },
      include: { especialista: true },
    });
    if (user.especialista) {
      especialistasIds.push(user.especialista.id);
    }
    console.log(`Especialista: ${ed.nombres} ${ed.apellidos}`);
  }

  // ───────────────────────────────────
  // PASANTES PARA LUCIA ROJAS (tienePasantes=true)
  // ───────────────────────────────────
  const lucia = await prisma.especialista.findFirst({ where: { emailInstitucional: 'lucia.rojas@clinica.com' } });
  if (lucia) {
    await prisma.pasante.upsert({
      where: { id: 'pasante-lucia-1' },
      update: {},
      create: { id: 'pasante-lucia-1', especialistaId: lucia.id, nombres: 'Andres', apellidos: 'Salazar', tipoIdentificacion: 'CEDULA', numeroIdentificacion: '1711234568' },
    });
    await prisma.pasante.upsert({
      where: { id: 'pasante-lucia-2' },
      update: {},
      create: { id: 'pasante-lucia-2', especialistaId: lucia.id, nombres: 'Diana', apellidos: 'Castro', tipoIdentificacion: 'CEDULA', numeroIdentificacion: '1716543218' },
    });
    console.log('Pasantes creados para Lucia Rojas');
  }

  // ───────────────────────────────────
  // PACIENTES ADICIONALES (10)
  // ───────────────────────────────────
  const pacientesData = [
    { nombres: 'Miguel', apellidos: 'Torres', cedula: '1712222227', genero: 'MASCULINO', fecha: '1978-03-12', telefono: '0922222221', provincia: '17', canton: '1701' },
    { nombres: 'Carmen', apellidos: 'Vargas', cedula: '1712233332', genero: 'FEMENINO', fecha: '1982-07-25', telefono: '0922222222', provincia: '09', canton: '0901' },
    { nombres: 'Roberto', apellidos: 'Castro', cedula: '1712244447', genero: 'MASCULINO', fecha: '1965-11-08', telefono: '0922222223', provincia: '17', canton: '1701' },
    { nombres: 'Elena', apellidos: 'Mendoza', cedula: '1712255552', genero: 'FEMENINO', fecha: '1995-01-30', telefono: '0922222224', provincia: '09', canton: '0907' },
    { nombres: 'Francisco', apellidos: 'Ortega', cedula: '1712266667', genero: 'MASCULINO', fecha: '1970-09-15', telefono: '0922222225', provincia: '13', canton: '1301' },
    { nombres: 'Gabriela', apellidos: 'Silva', cedula: '1712277772', genero: 'FEMENINO', fecha: '1988-06-20', telefono: '0922222226', provincia: '17', canton: '1701' },
    { nombres: 'Ricardo', apellidos: 'Lara', cedula: '1712288887', genero: 'MASCULINO', fecha: '2000-12-03', telefono: '0922222227', provincia: '01', canton: '0101' },
    { nombres: 'Patricia', apellidos: 'Rios', cedula: '1712299992', genero: 'FEMENINO', fecha: '1992-04-18', telefono: '0922222228', provincia: '17', canton: '1707' },
    { nombres: 'Alberto', apellidos: 'Ponce', cedula: '1712311111', genero: 'MASCULINO', fecha: '1958-08-22', telefono: '0922222229', provincia: '09', canton: '0901' },
    { nombres: 'Daniela', apellidos: 'Cruz', cedula: '1712322226', genero: 'FEMENINO', fecha: '1998-10-05', telefono: '0922222230', provincia: '18', canton: '1801' },
  ];

  const pacientesIds: string[] = [];

  // Cargar pacientes existentes del seed principal
  const existingPacientes = await prisma.paciente.findMany();
  existingPacientes.forEach(p => pacientesIds.push(p.id));

  for (const pd of pacientesData) {
    const p = await prisma.paciente.upsert({
      where: { numeroIdentificacion: pd.cedula },
      update: {},
      create: {
        nombres: pd.nombres, apellidos: pd.apellidos,
        tipoIdentificacion: 'CEDULA', numeroIdentificacion: pd.cedula,
        genero: pd.genero, fechaNacimiento: new Date(pd.fecha),
        estadoCivil: 'SOLTERO', telefono: pd.telefono,
        direccion: 'Direccion de prueba', provincia: pd.provincia,
        canton: pd.canton, zona: 'URBANA', grupoSanguineo: 'O_POSITIVO',
        tipoSeguro: 'IESS', emergenciaNombre: 'Familiar', emergenciaTelefono: '0911111111', emergenciaParentesco: 'Hermano/a',
      },
    });
    pacientesIds.push(p.id);
  }
  console.log(`${pacientesData.length} pacientes adicionales creados`);

  // ───────────────────────────────────
  // GENERAR CITAS POR 3 SEMANAS
  // ───────────────────────────────────
  const hoy = today();
  const semanaPasada = addDays(hoy, -7);
  const estadosSemanaPasada = ['ATENDIDA', 'ATENDIDA', 'ATENDIDA', 'NO_ASISTIO', 'CANCELADA', 'ATENDIDA'];
  const estadosSemanaActual = ['PENDIENTE', 'PENDIENTE', 'CONFIRMADA', 'CONFIRMADA', 'EN_ESPERA', 'PENDIENTE', 'CONFIRMADA', 'EN_ATENCION'];
  const estadosSemanaProxima = ['PENDIENTE', 'PENDIENTE', 'PENDIENTE', 'CONFIRMADA', 'CONFIRMADA', 'PENDIENTE'];


  let totalCitas = 0;

  // Generar para cada especialista, cada dia
  for (let semana = -1; semana <= 1; semana++) {
    for (let diaOffset = 0; diaOffset < 5; diaOffset++) {
      const fecha = addDays(hoy, semana * 7 + diaOffset - hoy.getDay() + 1); // lunes a viernes
      const diaSemana = fecha.getDay();

      // Cantidad de citas por día: lunes/viernes 15-20, martes-jueves 30-50
      const esPico = diaSemana >= 2 && diaSemana <= 4;
      const citasDelDia = esPico ? randomInt(30, 50) : randomInt(15, 20);

      for (let i = 0; i < citasDelDia; i++) {
        const especialistaId = pick(especialistasIds);

        const horarios = await prisma.horarioEspecialista.findMany({
          where: { especialistaId, diaSemana, activo: true },
          orderBy: { horaInicio: 'asc' },
        });

        if (horarios.length === 0) continue;

        const horario = pick(horarios);
        const [hStart] = horario.horaInicio.split(':').map(Number);
        const [hEnd] = horario.horaFin.split(':').map(Number);
        const duracion = horario.duracionMinutos || 30;

        // Elegir un slot disponible
        const maxSlot = Math.floor(((hEnd - hStart) * 60) / duracion) - 1;
        if (maxSlot < 0) continue;
        const slotIndex = randomInt(0, maxSlot);
        const startMin = hStart * 60 + slotIndex * duracion;
        const horaInicio = `${String(Math.floor(startMin / 60)).padStart(2, '0')}:${String(startMin % 60).padStart(2, '0')}`;
        const endMin = startMin + duracion;
        const horaFin = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;

        // Verificar que no haya conflicto con citas existentes en este dia
        const conflicto = await prisma.cita.findFirst({
          where: {
            especialistaId,
            fecha: {
              gte: new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()),
              lt: new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + 1),
            },
            horaInicio,
            estado: { notIn: ['CANCELADA'] },
          },
        });
        if (conflicto) continue; // ya existe cita a esta hora exacta para este especialista

        const solapamiento = await prisma.cita.findFirst({
          where: {
            OR: [
              { especialistaId, fecha: new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()) },
              { pacienteId: pick(pacientesIds), fecha: new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()) },
            ],
            estado: { notIn: ['CANCELADA'] },
          },
          select: { horaInicio: true, horaFin: true },
        });

        if (solapamiento) {
          const [cSh, cSm] = solapamiento.horaInicio.split(':').map(Number);
          const [cEh, cEm] = solapamiento.horaFin.split(':').map(Number);
          const cStart = cSh * 60 + cSm;
          const cEnd = cEh * 60 + cEm;
          if (startMin < cEnd && endMin > cStart) continue;
        }

        // Determinar estado según la semana
        let estado: string;
        if (semana === -1) {
          estado = pick(estadosSemanaPasada);
        } else if (semana === 0) {
          estado = pick(estadosSemanaActual);
        } else {
          estado = pick(estadosSemanaProxima);
        }

        const especialista = await prisma.especialista.findUnique({ where: { id: especialistaId } });
        const pacienteId = pick(pacientesIds);
        const lugar = `${especialista?.consultorioPredeterminado || 'Consultorio'} (${especialista?.sede || 'Sede'})`;
        const motivos = ['Control general', 'Revisión de exámenes', 'Primera consulta', 'Seguimiento', 'Dolor agudo', 'Chequeo rutinario', 'Evaluación pre-quirúrgica', 'Resultados', 'Terapia', 'Consulta especializada'];
        const motivo = pick(motivos);

        try {
          await prisma.cita.create({
            data: {
              especialistaId,
              pacienteId,
              fecha: new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()),
              horaInicio, horaFin, duracionMinutos: duracion,
              especialidad: especialista?.especialidad || '',
              lugar, motivo, estado,
            },
          });
          totalCitas++;
        } catch (e: any) {
          if (e?.code === 'P2002') continue; // unique constraint, ya existe
          throw e;
        }
      }
      console.log(`Semana ${semana + 2}/3, dia ${diaOffset + 1}/5: ${citasDelDia} citas -> ${fecha.toISOString().split('T')[0]}`);
    }
  }

  // ───────────────────────────────────
  // CITAS RECURRENTES (8)
  // ───────────────────────────────────
  const recurrentesData = [
    { cant: 4, motivo: 'Sesión de terapia' },
    { cant: 4, motivo: 'Rehabilitación' },
    { cant: 4, motivo: 'Seguimiento post-operatorio' },
    { cant: 4, motivo: 'Diálisis' },
    { cant: 5, motivo: 'Quimioterapia' },
    { cant: 4, motivo: 'Control prenatal' },
    { cant: 3, motivo: 'Vacunación programada' },
    { cant: 4, motivo: 'Fisioterapia' },
  ];

  for (const rec of recurrentesData) {
    // Elegir especialista que tenga horario el día de inicio
    let especialistaId = pick(especialistasIds);
    const fechaInicio = addDays(hoy, randomInt(1, 7));
    const diaInicio = fechaInicio.getDay();
    let especialista = await prisma.especialista.findUnique({ where: { id: especialistaId } });
    
    // Buscar un especialista que trabaje ese día Y tenga horario para las 10:00
    let intentos = 0;
    while (intentos < 20) {
      const horarios = await prisma.horarioEspecialista.findMany({
        where: { especialistaId: especialista?.id || especialistaId, diaSemana: diaInicio, activo: true },
      });
      if (horarios.length > 0) {
        // Verificar que 10:00-10:30 caiga dentro del horario
        const cStart = 600; // 10:00
        const cEnd = 630;   // 10:30
        const dentro = horarios.some(h => {
          const [hSh, hSm] = h.horaInicio.split(':').map(Number);
          const [hEh, hEm] = h.horaFin.split(':').map(Number);
          return cStart >= (hSh * 60 + hSm) && cEnd <= (hEh * 60 + hEm);
        });
        if (dentro) break;
      }
      especialistaId = pick(especialistasIds);
      especialista = await prisma.especialista.findUnique({ where: { id: especialistaId } });
      intentos++;
    }
    if (!especialista) continue;
    
    const lugar = `${especialista?.consultorioPredeterminado || 'Consultorio'} (${especialista?.sede || 'Sede'})`;

    const [y, m, d] = [fechaInicio.getFullYear(), fechaInicio.getMonth(), fechaInicio.getDate()];

    let citaOrigen: any = null;
    try {
      citaOrigen = await prisma.cita.create({
        data: {
          especialistaId, pacienteId: pick(pacientesIds),
          fecha: new Date(y, m, d),
          horaInicio: '10:00', horaFin: '10:30', duracionMinutos: 30,
          especialidad: especialista?.especialidad || '',
          lugar, motivo: rec.motivo, estado: 'PENDIENTE',
          esRecurrente: true,
          recurrenciaCantidad: rec.cant,
          recurrenciaDiasSemana: JSON.stringify([fechaInicio.getDay()]),
        },
      });
    } catch (e: any) {
      if (e?.code === 'P2002') continue;
      throw e;
    }

    // Crear citas derivadas semanalmente
    for (let semana = 1; semana < rec.cant; semana++) {
      const f = addDays(fechaInicio, semana * 7);
      const diaDerivada = f.getDay();
      const horariosDerivada = await prisma.horarioEspecialista.findMany({
        where: { especialistaId, diaSemana: diaDerivada, activo: true },
      });
      // Validar que 10:00-10:30 esté dentro del horario
      const cStart = 600, cEnd = 630;
      const dentro = horariosDerivada.some(h => {
        const [hSh, hSm] = h.horaInicio.split(':').map(Number);
        const [hEh, hEm] = h.horaFin.split(':').map(Number);
        return cStart >= (hSh * 60 + hSm) && cEnd <= (hEh * 60 + hEm);
      });
      if (!dentro) continue;
      try {
        await prisma.cita.create({
          data: {
            especialistaId, pacienteId: pick(pacientesIds),
            fecha: new Date(f.getFullYear(), f.getMonth(), f.getDate()),
            horaInicio: '10:00', horaFin: '10:30', duracionMinutos: 30,
            especialidad: especialista?.especialidad || '',
            lugar, motivo: rec.motivo, estado: 'PENDIENTE',
            esRecurrente: true, citaOrigenId: citaOrigen.id,
            recurrenciaCantidad: rec.cant,
          },
        });
      } catch (e: any) {
        if (e?.code === 'P2002') continue;
        throw e;
      }
    }
    console.log(`Cita recurrente: ${rec.motivo} (${rec.cant} sesiones)`);
  }

  console.log(`\nTOTAL: ${totalCitas} citas creadas + 8 recurrentes`);
  // ── HCE: Inicializar módulos para todas las especialidades ──
  const MODULOS = ['consulta', 'antecedentes', 'alergias', 'signos_vitales', 'examen_fisico', 'diagnosticos', 'examenes', 'pedidos', 'prescripcion', 'tratamiento', 'evolucion', 'vacunas', 'consentimientos', 'proxima_cita', 'observaciones'];
  const especialidades = await prisma.especialidad.findMany();
  for (const esp of especialidades) {
    for (let i = 0; i < MODULOS.length; i++) {
      await prisma.especialidadModuloHCE.upsert({
        where: { especialidad_modulo: { especialidad: esp.nombre, modulo: MODULOS[i] } },
        update: {},
        create: { especialidad: esp.nombre, modulo: MODULOS[i], habilitado: false, orden: i },
      });
    }
  }

  console.log('Seed masivo completado!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
