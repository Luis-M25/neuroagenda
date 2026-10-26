import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function main() {
  const lucia = await p.especialista.findFirst({ where: { emailInstitucional: 'lucia.rojas@clinica.com' } });
  if (!lucia) { console.log('Lucia no encontrada'); return; }
  const citas = await p.cita.findMany({ where: { especialistaId: lucia.id }, orderBy: { fecha: 'asc' } });
  const dias = ['Dom','Lun','Mar','Mie','Jue','Vie','Sab'];
  citas.forEach(c => console.log(dias[c.fecha.getDay()], c.fecha.toISOString().slice(0,10), c.horaInicio));
  console.log('Total Lucia:', citas.length, 'citas');
  await p.$disconnect();
}
main();
