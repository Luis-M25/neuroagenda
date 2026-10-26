import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { NotificacionesGateway } from './websocket/notificaciones.gateway';
import { NotificationDispatcher } from './dispatcher/notification-dispatcher.service';

export const TIPO_NOTIFICACION = {
  HCE_PENDIENTE: 'HCE_PENDIENTE',
  CITA_VENCIDA: 'CITA_VENCIDA',
  TRIAGE_COMPLETADO: 'TRIAGE_COMPLETADO',
  INASISTENCIA_CRITICA: 'INASISTENCIA_CRITICA',
  PROTOCOLO_CRITICO: 'PROTOCOLO_CRITICO',
} as const;

export interface CrearNotificacionParams {
  usuarioId: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  refId?: string;
  refTipo?: string; // "cita" | "consulta" | "paciente"
}

@Injectable()
export class NotificacionesService {
  private readonly logger = new Logger(NotificacionesService.name);

  constructor(
    private prisma: PrismaService,
    private gateway: NotificacionesGateway,
    private dispatcher: NotificationDispatcher,
  ) {}

  /** Crea una notificación persistente y la emite por WebSocket al usuario. */
  async crear(params: CrearNotificacionParams) {
    const notificacion = await this.prisma.notificacion.create({
      data: {
        usuarioId: params.usuarioId,
        tipo: params.tipo,
        titulo: params.titulo,
        mensaje: params.mensaje,
        refId: params.refId,
        refTipo: params.refTipo,
      },
    });
    try {
      this.gateway.emitToUser(params.usuarioId, 'notificacion:nueva', notificacion);
    } catch (e) {
      this.logger.warn('No se pudo emitir WS notificacion:nueva', e as any);
    }
    return notificacion;
  }

  /** Crea la notificación para todos los usuarios de admisión (ADMISION_PRINCIPAL + ADMISION). */
  async crearParaAdmision(params: Omit<CrearNotificacionParams, 'usuarioId'>) {
    const admins = await this.prisma.usuario.findMany({
      where: { rol: { in: ['ADMISION_PRINCIPAL', 'ADMISION'] }, activo: true },
      select: { id: true },
    });
    const results = [];
    for (const admin of admins) {
      results.push(await this.crear({ ...params, usuarioId: admin.id }));
    }
    return results;
  }

  /** Evita duplicados: ¿ya existe una notificación igual (mismo tipo+ref+usuario) reciente? */
  async existeReciente(params: { usuarioId: string; tipo: string; refId?: string; desdeHoras?: number }) {
    const desde = new Date(Date.now() - (params.desdeHoras ?? 24) * 3600_000);
    const count = await this.prisma.notificacion.count({
      where: {
        usuarioId: params.usuarioId,
        tipo: params.tipo,
        refId: params.refId ?? undefined,
        createdAt: { gte: desde },
      },
    });
    return count > 0;
  }

  async listar(usuarioId: string, limite = 20) {
    return this.prisma.notificacion.findMany({
      where: { usuarioId },
      orderBy: { createdAt: 'desc' },
      take: limite,
    });
  }

  async contarNoLeidas(usuarioId: string) {
    return this.prisma.notificacion.count({
      where: { usuarioId, leida: false },
    });
  }

  async marcarLeida(id: string, usuarioId: string) {
    return this.prisma.notificacion.updateMany({
      where: { id, usuarioId },
      data: { leida: true },
    });
  }

  async marcarTodasLeidas(usuarioId: string) {
    return this.prisma.notificacion.updateMany({
      where: { usuarioId, leida: false },
      data: { leida: true },
    });
  }
}
