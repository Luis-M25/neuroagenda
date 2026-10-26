import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const citas = await prisma.cita.findMany({
    where: { notasModificacion: { not: null } },
  });
  let count = 0;
  for (const c of citas) {
    const existing = await prisma.citaModificacion.findFirst({
      where: { citaId: c.id },
    });
    if (existing) continue;
    await prisma.citaModificacion.create({
      data: {
        citaId: c.id,
        fecha: c.fecha,
        horaInicio: c.horaInicio,
        horaFin: c.horaFin,
        notasModificacion: c.notasModificacion,
        modificadaPorId: c.modificadaPorId,
        createdAt: c.fechaModificacion || c.updatedAt,
      },
    });
    count++;
  }
  console.log(`Migrated ${count} cita modificaciones`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
