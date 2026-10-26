import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class PasantesService {
  constructor(private prisma: PrismaService) {}

  async findAll(especialistaId: string, userId: string, userRol: string) {
    if (userRol === 'ESPECIALISTA') {
      const esp = await this.prisma.especialista.findUnique({ where: { usuarioId: userId } });
      if (!esp || esp.id !== especialistaId) throw new ForbiddenException('No autorizado');
    }
    return this.prisma.pasante.findMany({ where: { especialistaId, activo: true } });
  }

  async create(especialistaId: string, dto: { nombres: string; apellidos: string; tipoIdentificacion: string; numeroIdentificacion: string }, userId: string, userRol: string) {
    if (userRol === 'ESPECIALISTA') {
      const esp = await this.prisma.especialista.findUnique({ where: { usuarioId: userId } });
      if (!esp || esp.id !== especialistaId) throw new ForbiddenException('No autorizado');
    }
    return this.prisma.pasante.create({ data: { ...dto, especialistaId } });
  }

  async update(id: string, dto: { nombres?: string; apellidos?: string; tipoIdentificacion?: string; numeroIdentificacion?: string; activo?: boolean }) {
    const pasante = await this.prisma.pasante.findUnique({ where: { id } });
    if (!pasante) throw new NotFoundException('Pasante no encontrado');
    return this.prisma.pasante.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    return this.prisma.pasante.update({ where: { id }, data: { activo: false } });
  }
}
