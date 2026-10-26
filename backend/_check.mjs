import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
try {
  const admins = await prisma.usuario.findMany({ where: { email: { contains: 'admin' } }, select: { id: true, email: true, rol: true, activo: true } });
  console.log('ADMIN USERS:', JSON.stringify(admins, null, 2));
  const ur = await prisma.usuarioRol.findMany({ where: { usuario: { email: { contains: 'admin' } } }, include: { rol: { select: { clave: true } }, usuario: { select: { email: true } } } });
  console.log('USER ROLES:', JSON.stringify(ur, null, 2));
  const perms = await prisma.permiso.findMany({ select: { clave: true } });
  console.log('ALL PERMS:', perms.map(p => p.clave));
} catch(e) { console.error(e); } finally { await prisma.$disconnect(); }
