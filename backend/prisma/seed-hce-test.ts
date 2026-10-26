import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== SEED HCE TEST — Semana actual ===\n');

  const now = new Date();
  const hoy = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayOfWeek = hoy.getDay();

  function nextWeekday(date: Date): Date {
    const d = new Date(date);
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
    return d;
  }

  const today = (dayOfWeek === 0 || dayOfWeek === 6) ? nextWeekday(hoy) : hoy;

  const fmtDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const ft = (h: number, m: number) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

  console.log(`  Hoy: ${fmtDate(today)} (${['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'][today.getDay()]})`);

  // ── Especialista ──
  const esp = await prisma.especialista.findFirst({ where: { emailInstitucional: 'carlos.paredes@clinica.com' } });
  if (!esp) { console.log('ERROR: No se encontró Dr. Carlos Paredes. Ejecuta el seed principal primero.'); return; }
  console.log(`  Especialista: Dr. ${esp.nombres} ${esp.apellidos} (${esp.id})`);

  // ── Pacientes ──
  const pJuan = await prisma.paciente.findUnique({ where: { numeroIdentificacion: '1713333336' } });
  const pSofia = await prisma.paciente.findUnique({ where: { numeroIdentificacion: '1714444445' } });
  const pMiguel = await prisma.paciente.findUnique({ where: { numeroIdentificacion: '1715555556' } });

  if (!pJuan || !pSofia || !pMiguel) { console.log('ERROR: Pacientes no encontrados. Ejecuta el seed principal primero.'); return; }

  // ── Agregar antecedentes de prueba a Juan Perez ──
  const existingAnt = await prisma.antecedente.findFirst({ where: { pacienteId: pJuan.id } });
  if (!existingAnt) {
    await prisma.antecedente.createMany({
      data: [
        { pacienteId: pJuan.id, categoria: 'PERSONAL', tipo: 'ENFERMEDAD_CRONICA', descripcion: 'Diabetes tipo 2', fechaDiagnostico: new Date('2020-03-15'), resuelto: false },
        { pacienteId: pJuan.id, categoria: 'PERSONAL', tipo: 'ENFERMEDAD_CRONICA', descripcion: 'Hipertensión arterial', fechaDiagnostico: new Date('2018-06-10'), resuelto: false },
        { pacienteId: pJuan.id, categoria: 'QUIRURGICO', tipo: 'CIRUGIA', descripcion: 'Apendicectomía', fechaDiagnostico: new Date('2015-01-20'), resuelto: true },
        { pacienteId: pJuan.id, categoria: 'FAMILIAR', tipo: 'ANTECEDENTE_FAMILIAR', descripcion: 'Padre con diabetes', resuelto: false },
        { pacienteId: pJuan.id, categoria: 'MEDICACION', tipo: 'MEDICACION_HABITUAL', descripcion: 'Metformina 850mg c/12h', resuelto: false },
        { pacienteId: pJuan.id, categoria: 'MEDICACION', tipo: 'MEDICACION_HABITUAL', descripcion: 'Losartán 50mg c/24h', resuelto: false },
      ],
    });
    console.log(`  ✓ 6 antecedentes creados para Juan Perez`);
  }

  // ── Agregar alergias a Juan Perez ──
  const existingAlergia = await prisma.alergia.findFirst({ where: { pacienteId: pJuan.id } });
  if (!existingAlergia) {
    await prisma.alergia.createMany({
      data: [
        { pacienteId: pJuan.id, tipo: 'MEDICAMENTO', descripcion: 'Penicilina', gravedad: 'GRAVE', activa: true },
        { pacienteId: pJuan.id, tipo: 'MEDICAMENTO', descripcion: 'Sulfa', gravedad: 'MODERADA', activa: true },
      ],
    });
    console.log(`  ✓ 2 alergias creadas para Juan Perez`);
  }

  // ── Agregar hábitos a Juan Perez ──
  const existingHabito = await prisma.habito.findFirst({ where: { pacienteId: pJuan.id } });
  if (!existingHabito) {
    await prisma.habito.createMany({
      data: [
        { pacienteId: pJuan.id, tipo: 'TABACO', afirmativo: false },
        { pacienteId: pJuan.id, tipo: 'ALCOHOL', afirmativo: true, cantidad: 'Social', desde: '2010' },
        { pacienteId: pJuan.id, tipo: 'EJERCICIO', afirmativo: true, cantidad: '3 veces/semana', desde: '2021' },
        { pacienteId: pJuan.id, tipo: 'SUENO', afirmativo: true, cantidad: '6-7 horas', observacion: 'Insomnio ocasional' },
      ],
    });
    console.log(`  ✓ 4 hábitos creados para Juan Perez`);
  }

  // ── Horario para el especialista HOY ──
  const diaSemana = today.getDay();
  const horarioHoy = await prisma.horarioEspecialista.findFirst({ where: { especialistaId: esp.id, diaSemana } });
  if (!horarioHoy) {
    await prisma.horarioEspecialista.create({
      data: { especialistaId: esp.id, diaSemana, horaInicio: '08:00', horaFin: '12:00', duracionMinutos: 30 },
    });
    console.log(`  ✓ Horario creado para ${['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'][diaSemana]} 08:00-12:00`);
  }

  // ── Citas para HOY ──
  const citasHoy = [
    { hora: '08:00', paciente: pJuan, estado: 'PENDIENTE' },
    { hora: '08:30', paciente: pSofia, estado: 'CONFIRMADA' },
    { hora: '09:00', paciente: pMiguel, estado: 'PENDIENTE' },
    { hora: '09:30', paciente: pJuan, estado: 'PENDIENTE' },
    { hora: '10:00', paciente: pSofia, estado: 'CONFIRMADA' },
  ];

  const hoyStr = fmtDate(today);
  for (const c of citasHoy) {
    const exists = await prisma.cita.findFirst({ where: { especialistaId: esp.id, fecha: today, horaInicio: c.hora } });
    if (!exists) {
      await prisma.cita.create({
        data: {
          especialistaId: esp.id, pacienteId: c.paciente.id,
          fecha: today, horaInicio: c.hora, horaFin: ft(parseInt(c.hora.split(':')[0]), parseInt(c.hora.split(':')[1]) + 30),
          duracionMinutos: 30, especialidad: esp.especialidad, lugar: esp.consultorioPredeterminado || 'Consultorio 301',
          motivo: 'Control de rutina', estado: c.estado,
        },
      });
    }
  }

  console.log(`  ✓ 5 citas creadas/verificadas para hoy (${hoyStr})`);

  // ── Citas para el resto de la semana ──
  const pacientes = [pJuan, pSofia, pMiguel];
  for (let offset = 1; offset <= 4; offset++) {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const df = fmtDate(d);

    const hora = `${8 + offset}:00`;
    const existe = await prisma.cita.findFirst({ where: { especialistaId: esp.id, fecha: d, horaInicio: hora } });
    if (!existe) {
      await prisma.cita.create({
        data: {
          especialistaId: esp.id, pacienteId: pacientes[offset % 3].id,
          fecha: d, horaInicio: hora, horaFin: ft(8 + offset, 30),
          duracionMinutos: 30, especialidad: esp.especialidad, lugar: 'Consultorio 301',
          motivo: 'Control', estado: 'PENDIENTE',
        },
      });
    }
  }
  console.log('  ✓ Citas para el resto de la semana creadas/verificadas');

  console.log('\n=== SEED COMPLETADO ===');
  console.log(`\nCredenciales para probar:`);
  console.log(`  Especialista: dr.paredes@clinica.com / especialista123`);
  console.log(`  Portero:       portero@clinica.com / portero123`);
  console.log(`  Pacientes:     Juan Perez (1713333336), Sofia Lopez (1714444445), Miguel Torres (1715555556)`);
  console.log(`  Juan Perez ya tiene antecedentes, alergias y hábitos pre-cargados para probar la sección de datos del paciente.`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
