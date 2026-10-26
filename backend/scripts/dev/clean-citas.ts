import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Buscando citas inválidas (especialista sin horario ese día)...');

  const citas = await prisma.cita.findMany();
  let invalidas = 0;

  for (const cita of citas) {
    const diaSemana = cita.fecha.getDay();
    const horarios = await prisma.horarioEspecialista.findMany({
      where: { 
        especialistaId: cita.especialistaId, 
        diaSemana, 
        activo: true 
      },
    });

    if (horarios.length === 0) {
      await prisma.cita.delete({ where: { id: cita.id } });
      invalidas++;
      continue;
    }

    // También validar que la hora esté dentro del horario
    let dentroDeHorario = false;
    for (const h of horarios) {
      const [hSh, hSm] = h.horaInicio.split(':').map(Number);
      const [hEh, hEm] = h.horaFin.split(':').map(Number);
      const hStart = hSh * 60 + hSm;
      const hEnd = hEh * 60 + hEm;
      const [cSh, cSm] = cita.horaInicio.split(':').map(Number);
      const [cEh, cEm] = cita.horaFin.split(':').map(Number);
      const cStart = cSh * 60 + cSm;
      const cEnd = cEh * 60 + cEm;
      if (cStart >= hStart && cEnd <= hEnd) {
        dentroDeHorario = true;
        break;
      }
    }

    if (!dentroDeHorario) {
      await prisma.cita.delete({ where: { id: cita.id } });
      invalidas++;
    }
  }

  console.log(`${invalidas} citas inválidas eliminadas.`);
  console.log(`Quedan ${citas.length - invalidas} citas válidas.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
