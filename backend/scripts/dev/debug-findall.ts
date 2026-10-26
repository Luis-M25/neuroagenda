import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function main() {
  // Replicar exactamente lo que findAll haría
  const where: any = {};

  const fechaInicio = '2026-07-20';
  const fechaFin = '2026-07-20';

  if (fechaInicio || fechaFin) {
    where.fecha = {};
    if (fechaInicio) {
      const [yi, mi, di] = fechaInicio.split('-').map(Number);
      where.fecha.gte = new Date(yi, mi - 1, di);
    }
    if (fechaFin) {
      const [yf, mf, df] = fechaFin.split('-').map(Number);
      where.fecha.lt = new Date(yf, mf - 1, df + 1);
    }
  }

  console.log('where:', JSON.stringify(where, (k, v) => v instanceof Date ? v.toISOString() : v));

  // Con el select que puse en findAll
  const citas = await p.cita.findMany({
    where,
    select: {
      id: true, especialistaId: true, estado: true, horaInicio: true,
      esRecurrente: true, citaOrigenId: true, citaReagendadaId: true,
      especialista: { select: { id: true, nombres: true, apellidos: true } },
      paciente: { select: { id: true, nombres: true } },
    },
    orderBy: [{ fecha: 'desc' }, { horaInicio: 'desc' }],
  });

  console.log('\nfindAll devuelve ' + citas.length + ' citas:');
  citas.forEach(c => {
    console.log(`  espId: ${c.especialistaId} | esp.id: ${c.especialista.id} | match: ${c.especialistaId === c.especialista.id} | ${c.estado} | ${c.horaInicio} | ${c.especialista.nombres} | recurrente:${c.esRecurrente} | origenId:${c.citaOrigenId ? 'si' : 'no'}`);
  });

  // También verificar con consulta simple (sin select)
  const raw = await p.cita.findMany({
    where: { fecha: { gte: new Date(2026,6,20), lt: new Date(2026,6,21) } },
  });
  console.log('\nConsulta simple: ' + raw.length + ' citas');

  await p.$disconnect();
}
main();
