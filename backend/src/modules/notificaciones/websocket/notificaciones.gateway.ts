import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  namespace: '/notificaciones',
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:3001',
    credentials: true,
  },
})
export class NotificacionesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(NotificacionesGateway.name);

  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, string[]>();
  private socketUsers = new Map<string, { userId: string; rol: string }>();

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.query?.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token as string);
      const userId = payload.sub;
      const rol = payload.rol;

      const sockets = this.userSockets.get(userId) || [];
      sockets.push(client.id);
      this.userSockets.set(userId, sockets);
      this.socketUsers.set(client.id, { userId, rol });

      client.join(`usuario:${userId}`);
      if (rol === 'ESPECIALISTA') client.join('especialistas');
      if (['ADMISION_PRINCIPAL', 'ADMISION'].includes(rol)) client.join('admision');

      this.logger.log(`[WS] Conectado: ${userId} (${rol})`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const info = this.socketUsers.get(client.id);
    if (info) {
      const sockets = this.userSockets.get(info.userId) || [];
      const idx = sockets.indexOf(client.id);
      if (idx >= 0) sockets.splice(idx, 1);
      if (sockets.length === 0) this.userSockets.delete(info.userId);
      this.socketUsers.delete(client.id);
      this.logger.log(`[WS] Desconectado: ${info.userId}`);
    }
  }

  @SubscribeMessage('subscribe:citas')
  handleSubscribeCitas(client: Socket, citaIds: string[]) {
    for (const id of citaIds) {
      client.join(`cita:${id}`);
    }
  }

  notificarCitaProxima(data: { citaId: string; paciente: string; hora: string; especialistaUsuarioId: string }) {
    this.server.to(`usuario:${data.especialistaUsuarioId}`).emit('cita:proxima', {
      citaId: data.citaId,
      paciente: data.paciente,
      hora: data.hora,
      mensaje: `Su cita con ${data.paciente} es en 5 minutos`,
    });
  }

  notificarCambioEstadoCita(data: { citaId: string; estado: string; paciente: string; especialista: string }) {
    this.server.to('admision').emit('cita:estado-cambiado', data);
    this.server.to(`cita:${data.citaId}`).emit('cita:estado-cambiado', data);
  }

  alertarInasistencia(data: { paciente: string; especialidad: string; contador: number; severidad: string; timestamp: Date }) {
    this.server.to('admision').emit('inasistencia:nueva', {
      ...data,
      timestamp: data.timestamp || new Date(),
    });
  }

  notificarPacienteBloqueado(data: { pacienteId: string; paciente: string; accion: 'bloqueado' | 'desbloqueado' }) {
    this.server.to('admision').emit('paciente:bloqueo-cambiado', data);
  }

  emitToUser(userId: string, event: string, data: unknown) {
    this.server.to(`usuario:${userId}`).emit(event, data);
  }

  emitToAdmision(event: string, data: unknown) {
    this.server.to('admision').emit(event, data);
  }
}
