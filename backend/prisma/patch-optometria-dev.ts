// Script puntual NO destructivo: prepara la BD dev para probar el módulo de Optometría.
// - Crea la especialidad "Optometría" (si no existe)
// - Crea/actualiza las filas EspecialidadModuloHCE con los módulos de optometría habilitados
// - Crea el optómetra demo optometra.demo@clinica.com / optometria123 (si no existe)
// - Le asigna horarios L-V 08:30-13:30 (si no tiene)
// Uso: npx ts-node prisma/patch-optometria-dev.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const MODULOS_OPTOMETRIA = [
  'consulta', 'motivo_consulta', 'datos_generales', 'antecedentes', 'historial_enfermedad',
  'signos_vitales', 'examen_fisico', 'pedidos', 'optometria', 'examenes', 'diagnosticos', 'tratamiento', 'evolucion', 'observaciones', 'indicaciones',
];

async function main() {
  // 1. Especialidad
  await prisma.especialidad.upsert({
    where: { nombre: 'Optometría' },
    update: {},
    create: { nombre: 'Optometría' },
  });
  console.log('- Especialidad "Optometría" lista');

  // 2. Módulos HCE
  const existentes = await prisma.especialidadModuloHCE.findMany({ where: { especialidad: 'Optometría' } });
  if (existentes.length === 0) {
    await prisma.especialidadModuloHCE.createMany({
      data: MODULOS_OPTOMETRIA.map((m, i) => ({
        especialidad: 'Optometría',
        modulo: m,
        habilitado: true,
        orden: i,
      })),
    });
    console.log(`- ${MODULOS_OPTOMETRIA.length} módulos creados (habilitados)`);
  } else {
    for (const row of existentes) {
      await prisma.especialidadModuloHCE.update({
        where: { id: row.id },
        data: { habilitado: MODULOS_OPTOMETRIA.includes(row.modulo) },
      });
    }
    // Crea las filas que falten (p. ej. módulos nuevos añadidos a la lista)
    const faltantes = MODULOS_OPTOMETRIA.filter((m) => !existentes.some((r) => r.modulo === m));
    if (faltantes.length > 0) {
      await prisma.especialidadModuloHCE.createMany({
        data: faltantes.map((m, i) => ({
          especialidad: 'Optometría',
          modulo: m,
          habilitado: true,
          orden: existentes.length + i,
        })),
      });
      console.log(`- ${faltantes.length} módulos nuevos creados: ${faltantes.join(', ')}`);
    }
    console.log(`- ${existentes.length} módulos actualizados (marcados según Optometría)`);
  }

  // 3. Optómetra demo
  const email = 'optometra.demo@clinica.com';
  const cedula = '1707890123';
  const demoNombre = 'Paola';
  const demoApellido = 'Cevallos';
  let espId: string | null = null;
  const yaUsuario = await prisma.usuario.findUnique({ where: { email } });
  const yaEsp = await prisma.especialista.findUnique({ where: { numeroIdentificacion: cedula } });
  if (!yaUsuario && !yaEsp) {
    const admin = await prisma.usuario.findFirst({ where: { rol: 'ADMISION_PRINCIPAL' } });
    // Sede/consultorio válidos (FK compuesta consultorio→(nombre, sede))
    const sede =
      (await prisma.sede.findUnique({ where: { nombre: 'Clinica Central' } })) ||
      (await prisma.sede.findFirst({ orderBy: { nombre: 'asc' } }));
    if (!sede) throw new Error('No hay sedes en la BD; cree una antes de correr este script');
    const consultorio = await prisma.consultorio.findFirst({ where: { sede: sede.nombre } });
    const u = await prisma.usuario.create({
      data: {
        email,
        passwordHash: await bcrypt.hash('optometria123', 10),
        rol: 'ESPECIALISTA',
        creadoPorId: admin?.id,
        primerNombre: demoNombre,
        primerApellido: demoApellido,
        nombres: demoNombre,
        apellidos: demoApellido,
        numeroIdentificacion: cedula,
        especialista: {
          create: {
            nombres: demoNombre, apellidos: demoApellido,
            primerNombre: demoNombre, primerApellido: demoApellido,
            tipoIdentificacion: 'CEDULA',
            numeroIdentificacion: cedula, genero: 'FEMENINO', fechaNacimiento: new Date('1988-02-14'),
            codigoMsp: 'MSP-007', especialidad: 'Optometría', tituloProfesional: 'Optometrista',
            emailInstitucional: 'paola.cevallos@clinica.com', telefono: '0997890123',
            direccion: 'Av. 6 de Diciembre 123, Quito', sede: sede.nombre,
            consultorioPredeterminado: consultorio?.nombre,
          },
        },
      },
      include: { especialista: true },
    });
    espId = u.especialista?.id || null;
    console.log(`- Optómetra demo creado: ${email} / optometria123`);
  } else {
    // Backfill de nombres para registros creados con una versión anterior del script
    const nNombre = yaEsp?.primerNombre || yaEsp?.nombres || demoNombre;
    const nApellido = yaEsp?.primerApellido || yaEsp?.apellidos || demoApellido;
    if (yaEsp && (!yaEsp.primerNombre || !yaEsp.primerApellido)) {
      await prisma.especialista.update({
        where: { id: yaEsp.id },
        data: { primerNombre: nNombre, primerApellido: nApellido },
      });
      console.log('- Nombres del optómetra demo completados (Especialista)');
    }
    if (yaUsuario && (!yaUsuario.primerNombre || !yaUsuario.primerApellido)) {
      await prisma.usuario.update({
        where: { id: yaUsuario.id },
        data: {
          primerNombre: nNombre,
          primerApellido: nApellido,
          nombres: yaUsuario.nombres || nNombre,
          apellidos: yaUsuario.apellidos || nApellido,
          numeroIdentificacion: yaUsuario.numeroIdentificacion || yaEsp?.numeroIdentificacion || cedula,
        },
      });
      console.log('- Nombres del optómetra demo completados (Usuario)');
    }
    espId = yaEsp?.id || null;
    console.log('- Optómetra demo ya existía, se omite');
  }

  // 4. Horarios
  if (espId) {
    const hor = await prisma.horarioEspecialista.count({ where: { especialistaId: espId } });
    if (hor === 0) {
      for (const dia of [1, 2, 3, 4, 5]) {
        await prisma.horarioEspecialista.create({
          data: { especialistaId: espId, diaSemana: dia, horaInicio: '08:30', horaFin: '13:30', duracionMinutos: 30 },
        });
      }
      console.log('- Horarios creados (L-V 08:30-13:30)');
    } else {
      console.log('- Horarios ya existían, se omite');
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
