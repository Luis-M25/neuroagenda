import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Feriados nacionales de Ecuador.
 * Los feriados movibles (Carnaval, Semana Santa) se calculan por año.
 * Fuente: Ley de Feriados del Ecuador (Ley Reformatoria a la Ley de Feriados)
 */
function getFeriadosFijos(year: number): { fecha: Date; nombre: string }[] {
  return [
    { fecha: new Date(year, 0, 1), nombre: 'Año Nuevo' },
    { fecha: new Date(year, 4, 1), nombre: 'Día del Trabajo' },
    { fecha: new Date(year, 4, 24), nombre: 'Batalla de Pichincha' },
    { fecha: new Date(year, 7, 10), nombre: 'Primer Grito de Independencia' },
    { fecha: new Date(year, 9, 9), nombre: 'Independencia de Guayaquil' },
    { fecha: new Date(year, 10, 2), nombre: 'Día de los Difuntos' },
    { fecha: new Date(year, 10, 3), nombre: 'Independencia de Cuenca' },
    { fecha: new Date(year, 11, 6), nombre: 'Fundación de Quito' },
    { fecha: new Date(year, 11, 25), nombre: 'Navidad' },
  ];
}

function getCarnaval(year: number): { fecha: Date; nombre: string }[] {
  // Cálculo aproximado: Carnaval es 47 días antes del Domingo de Pascua
  // Método simplificado usando la fecha de Pascua
  const pascua = getPascua(year);
  const lunesCarnaval = new Date(pascua);
  lunesCarnaval.setDate(pascua.getDate() - 48);
  const martesCarnaval = new Date(pascua);
  martesCarnaval.setDate(pascua.getDate() - 47);
  return [
    { fecha: lunesCarnaval, nombre: 'Carnaval (Lunes)' },
    { fecha: martesCarnaval, nombre: 'Carnaval (Martes)' },
  ];
}

function getSemanaSanta(year: number): { fecha: Date; nombre: string }[] {
  const pascua = getPascua(year);
  const viernesSanto = new Date(pascua);
  viernesSanto.setDate(pascua.getDate() - 2);
  return [
    { fecha: viernesSanto, nombre: 'Viernes Santo' },
  ];
}

function getPascua(year: number): Date {
  // Algoritmo de Gauss para calcular el Domingo de Pascua
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, mes - 1, dia);
}

async function seedFeriados(year: number) {
  const feriados = [
    ...getFeriadosFijos(year),
    ...getCarnaval(year),
    ...getSemanaSanta(year),
  ];

  for (const feriado of feriados) {
    const fecha = new Date(feriado.fecha);
    fecha.setHours(0, 0, 0, 0);

    const existente = await prisma.feriado.findUnique({ where: { fecha } });
    if (!existente) {
      await prisma.feriado.create({
        data: {
          fecha,
          nombre: feriado.nombre,
          activo: true,
        },
      });
      console.log(`  ✓ Creado feriado: ${feriado.nombre} (${fecha.toISOString().split('T')[0]})`);
    } else {
      console.log(`  - Ya existe: ${feriado.nombre} (${fecha.toISOString().split('T')[0]})`);
    }
  }
}

async function main() {
  console.log('=== SEMBRANDO FERIADOS NACIONALES DE ECUADOR ===\n');

  const yearActual = new Date().getFullYear();
  // Sembrar año actual + 2 años más
  for (let y = yearActual - 1; y <= yearActual + 2; y++) {
    console.log(`\n--- Año ${y} ---`);
    await seedFeriados(y);
  }

  console.log('\n✓ Feriados sembrados exitosamente');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
