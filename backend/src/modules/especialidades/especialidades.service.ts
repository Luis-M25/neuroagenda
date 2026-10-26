import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateEspecialidadDto } from './dto/create-especialidad.dto';

@Injectable()
export class EspecialidadesService {
  constructor(private prisma: PrismaService) {}

  async findAll(activo?: boolean) {
    const where: any = {};
    if (activo !== undefined) where.activo = activo;
    return this.prisma.especialidad.findMany({ where, orderBy: { nombre: 'asc' } });
  }

  async findOne(id: string) {
    const item = await this.prisma.especialidad.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Especialidad no encontrada');
    return item;
  }

  async create(dto: CreateEspecialidadDto) {
    return this.prisma.especialidad.create({
      data: { nombre: dto.nombre, descripcion: dto.descripcion, activo: dto.activo ?? true },
    });
  }

  async update(id: string, dto: Partial<CreateEspecialidadDto>) {
    await this.findOne(id);
    const data: any = {};
    if (dto.nombre !== undefined) data.nombre = dto.nombre;
    if (dto.descripcion !== undefined) data.descripcion = dto.descripcion;
    if (dto.activo !== undefined) data.activo = dto.activo;
    return this.prisma.especialidad.update({ where: { id }, data });
  }

  async remove(id: string) {
    const espec = await this.findOne(id);
    const count = await this.prisma.especialista.count({
      where: { especialidad: espec.nombre },
    });
    if (count > 0) throw new ConflictException(`No se puede eliminar: ${count} especialista(s) usan esta especialidad`);
    await this.prisma.especialidad.delete({ where: { id } });
    return { message: 'Especialidad eliminada' };
  }
}
