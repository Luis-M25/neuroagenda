import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class AuditoriaService {
  constructor(private prisma: PrismaService) {}

  async registrar(params: {
    usuarioId: string;
    accion: string;
    entidad: string;
    entidadId?: string;
    detalle?: any;
    motivo?: string;
    ipAddress?: string;
    userAgent?: string;
    antes?: any;
    despues?: any;
  }) {
    return this.prisma.auditoria.create({
      data: {
        usuarioId: params.usuarioId === 'SISTEMA' ? null : params.usuarioId,
        accion: params.accion,
        entidad: params.entidad,
        entidadId: params.entidadId,
        detalle: params.detalle ? JSON.stringify(params.detalle) : null,
        motivo: params.motivo,
        antes: params.antes ? JSON.stringify(params.antes) : null,
        despues: params.despues ? JSON.stringify(params.despues) : null,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  }

  async listar(filtros: {
    usuarioId?: string;
    entidad?: string;
    accion?: string;
    desde?: string;
    hasta?: string;
    pagina?: number;
    limite?: number;
  }) {
    const where: any = {};
    if (filtros.usuarioId) where.usuarioId = filtros.usuarioId;
    if (filtros.entidad) where.entidad = filtros.entidad;
    if (filtros.accion) where.accion = { contains: filtros.accion };
    if (filtros.desde || filtros.hasta) {
      where.createdAt = {};
      if (filtros.desde) where.createdAt.gte = new Date(filtros.desde);
      if (filtros.hasta) where.createdAt.lte = new Date(filtros.hasta);
    }

    const pagina = filtros.pagina || 1;
    const limite = filtros.limite || 50;

    const [total, items] = await Promise.all([
      this.prisma.auditoria.count({ where }),
      this.prisma.auditoria.findMany({
        where,
        include: { usuario: { select: { email: true, rol: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (pagina - 1) * limite,
        take: limite,
      }),
    ]);

    return { total, pagina, limite, items };
  }
}
