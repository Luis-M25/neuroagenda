import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateSedeDto } from './dto/create-sede.dto';

@Injectable()
export class SedesService {
  constructor(private prisma: PrismaService) {}

  async findAll(activo?: boolean) {
    const where: any = {};
    if (activo !== undefined) where.activo = activo;
    return this.prisma.sede.findMany({ where, orderBy: { nombre: 'asc' } });
  }

  async findOne(id: string) {
    const sede = await this.prisma.sede.findUnique({ where: { id } });
    if (!sede) throw new NotFoundException('Sede no encontrada');
    return sede;
  }

  async create(dto: CreateSedeDto) {
    return this.prisma.sede.create({
      data: { nombre: dto.nombre, activo: dto.activo ?? true },
    });
  }

  async update(id: string, dto: Partial<CreateSedeDto>) {
    await this.findOne(id);
    const data: any = {};
    if (dto.nombre !== undefined) data.nombre = dto.nombre;
    if (dto.activo !== undefined) data.activo = dto.activo;
    return this.prisma.sede.update({ where: { id }, data });
  }

  async remove(id: string) {
    const sede = await this.findOne(id);
    const [consultorios, especialistas] = await Promise.all([
      this.prisma.consultorio.count({ where: { sede: sede.nombre } }),
      this.prisma.especialista.count({ where: { sede: sede.nombre } }),
    ]);
    if (consultorios > 0 || especialistas > 0) {
      throw new ConflictException(
        `No se puede eliminar: ${consultorios} consultorio(s) y ${especialistas} especialista(s) asociados`,
      );
    }
    await this.prisma.sede.delete({ where: { id } });
    return { message: 'Sede eliminada' };
  }
}
