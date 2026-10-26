/**
 * Backfill one-off: asigna numeroConsulta secuencial (#001, #002, ...)
 * a las consultas HCE existentes, agrupadas por (pacienteId, especialistaId),
 * en orden cronológico (createdAt ASC).
 *
 * Uso: npx ts-node scripts/dev/backfill-numero-consulta.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const consultas = await prisma.consultaHCE.findMany({
    where: { numeroConsulta: null },
    orderBy: { createdAt: 'asc' },
    select: { id: true, pacienteId: true, especialistaId: true },
  });

  const counters = new Map<string, number>();

  // Inicializar contadores con el MAX existente (por si algunas ya tienen número)
  const grupos = new Set(consultas.map((c) => `${c.pacienteId}|${c.especialistaId}`));
  for (const key of grupos) {
    const [pacienteId, especialistaId] = key.split('|');
    const max = await prisma.consultaHCE.aggregate({
      where: { pacienteId, especialistaId },
      _max: { numeroConsulta: true },
    });
    counters.set(key, max._max.numeroConsulta ?? 0);
  }

  let updated = 0;
  for (const c of consultas) {
    const key = `${c.pacienteId}|${c.especialistaId}`;
    const next = (counters.get(key) ?? 0) + 1;
    counters.set(key, next);
    await prisma.consultaHCE.update({
      where: { id: c.id },
      data: { numeroConsulta: next },
    });
    updated++;
  }

  console.log(`Backfill completado: ${updated} consultas numeradas.`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
