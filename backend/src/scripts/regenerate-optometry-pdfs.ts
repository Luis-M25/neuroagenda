import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as path from 'path';
import {
  buildDevolucionOptometriaPdf,
  buildHistoriaClinicaOptometriaPdf,
  optometriaConsultaInclude,
} from '../modules/hce/optometry-pdf.builder';
import { esOptometria } from '../modules/hce/optometry-pdf.utils';

/**
 * Regenera la Historia Clínica y la Devolución de Resultados de todas las
 * consultas de Optometría ya firmadas. Útil tras cambios en el formato PDF:
 * los archivos existentes en uploads/hce no se actualizan solos.
 *
 * Uso:
 *   npm run regenerate:optometry-pdfs
 *   npm run regenerate:optometry-pdfs -- <consultaId>
 */
async function main() {
  const consultaId = process.argv[2]?.trim();
  const prisma = new PrismaClient();

  try {
    const consultas = await prisma.consultaHCE.findMany({
      where: {
        firmada: true,
        ...(consultaId ? { id: consultaId } : {}),
      },
      include: optometriaConsultaInclude,
      orderBy: { createdAt: 'asc' },
    });

    const optometrias = consultas.filter((consulta) =>
      esOptometria(consulta.especialista?.especialidad),
    );

    if (!optometrias.length) {
      console.log('No se encontraron consultas de Optometría firmadas.');
      return;
    }

    const outputDir = path.join(process.cwd(), 'uploads', 'hce');
    let generados = 0;

    for (const consulta of optometrias) {
      const hcPath = path.join(outputDir, `${consulta.id}.pdf`);
      await buildHistoriaClinicaOptometriaPdf({ consulta }, hcPath);

      const firmaDevolucion = await prisma.firma.findFirst({
        where: { consultaId: consulta.id, tipo: 'DEVOLUCION_RESULTADOS' },
        orderBy: { fechaFirma: 'desc' },
      });

      let devolucionPath = '';
      if (consulta.optometriaInforme && firmaDevolucion) {
        devolucionPath = path.join(outputDir, `devolucion-${consulta.id}.pdf`);
        await buildDevolucionOptometriaPdf(
          { consulta, hashDocumento: firmaDevolucion.hashDocumento || '' },
          devolucionPath,
        );
      }

      generados += 1;
      console.log(
        `OK ${consulta.id} — HC: ${path.basename(hcPath)}` +
          (devolucionPath
            ? ` | Devolución: ${path.basename(devolucionPath)}`
            : consulta.optometriaInforme
              ? ' | Sin firma de devolución'
              : ' | Sin informe de optometría'),
      );
    }

    console.log(`\nConsultas regeneradas: ${generados}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Error regenerando PDFs de Optometría:', error);
  process.exitCode = 1;
});
