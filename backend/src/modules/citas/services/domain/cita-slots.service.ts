import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/prisma.service';
import { ecStartOfDay } from '../../../../common/utils/date-ec.utils';

@Injectable()
export class CitaSlotsService {
  constructor(private prisma: PrismaService) {}

  async getCitasDelDia(fecha?: Date) {
    const targetDate = fecha || new Date();
    const startOfDay = ecStartOfDay(targetDate.getFullYear(), targetDate.getMonth() + 1, targetDate.getDate());
    const endOfDay = ecStartOfDay(targetDate.getFullYear(), targetDate.getMonth() + 1, targetDate.getDate() + 1);

    const citas = await this.prisma.cita.findMany({
      where: {
        fecha: { gte: startOfDay, lt: endOfDay },
        NOT: { estado: 'CANCELADA', slotLiberado: true },
      },
      include: {
        paciente: { select: { nombres: true, apellidos: true, telefono: true } },
        especialista: { select: { id: true, nombres: true, apellidos: true, especialidad: true } },
      },
      orderBy: [{ horaInicio: 'asc' }],
    });

    return {
      fecha: startOfDay.toISOString().split('T')[0],
      total: citas.length,
      pendientes: citas.filter(c => c.estado === 'PENDIENTE').length,
      confirmadas: citas.filter(c => c.estado === 'CONFIRMADA').length,
      atendiendo: citas.filter(c => c.estado === 'EN_ATENCION').length,
      atendidas: citas.filter(c => c.estado === 'ATENDIDA').length,
      noAsistieron: citas.filter(c => c.estado === 'NO_ASISTIO').length,
      citas,
    };
  }
}
