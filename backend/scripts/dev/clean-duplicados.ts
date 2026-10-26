import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Buscando citas duplicadas...');

  const todas = await prisma.cita.findMany({
    orderBy: [{ especialistaId: 'asc' }, { fecha: 'asc' }, { horaInicio: 'asc' }, { createdAt: 'desc' }],
  });

  const seen = new Map<string, string>(); // key: "espId|fecha|horaInicio" → citaId (la más reciente)
  let duplicadas = 0;

  for (const cita of todas) {
    const key = `${cita.especialistaId}|${cita.fecha.toISOString().slice(0, 10)}|${cita.horaInicio}`;
    if (seen.has(key)) {
      await prisma.cita.delete({ where: { id: cita.id } });
      duplicadas++;
    } else {
      seen.set(key, cita.id);
    }
  }

  console.log(`${duplicadas} citas duplicadas eliminadas.`);
  console.log(`Quedan ${seen.size} citas únicas.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
