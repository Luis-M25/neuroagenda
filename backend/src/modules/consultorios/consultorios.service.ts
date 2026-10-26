import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateConsultorioDto } from './dto/create-consultorio.dto';

@Injectable()
export class ConsultoriosService {
  constructor(private prisma: PrismaService) {}

  async findAll(activo?: boolean) {
    const where: any = {};
    if (activo !== undefined) where.activo = activo;
    return this.prisma.consultorio.findMany({
      where,
      orderBy: [{ sede: 'asc' }, { nombre: 'asc' }],
    });
  }

  async findOne(id: string) {
    const consultorio = await this.prisma.consultorio.findUnique({ where: { id } });
    if (!consultorio) throw new NotFoundException('Consultorio no encontrado');
    return consultorio;
  }

  async create(dto: CreateConsultorioDto) {
    return this.prisma.consultorio.create({
      data: {
        nombre: dto.nombre,
        sede: dto.sede,
        activo: dto.activo ?? true,
      },
    });
  }

  async update(id: string, dto: Partial<CreateConsultorioDto>) {
    await this.findOne(id);
    const data: any = {};
    if (dto.nombre !== undefined) data.nombre = dto.nombre;
    if (dto.sede !== undefined) data.sede = dto.sede;
    if (dto.activo !== undefined) data.activo = dto.activo;
    return this.prisma.consultorio.update({ where: { id }, data });
  }

  async remove(id: string) {
    const consultorio = await this.findOne(id);
    const count = await this.prisma.especialista.count({
      where: { consultorioPredeterminado: consultorio.nombre, sede: consultorio.sede },
    });
    if (count > 0) throw new ConflictException(`No se puede eliminar: ${count} especialista(s) usan este consultorio`);
    await this.prisma.consultorio.delete({ where: { id } });
    return { message: 'Consultorio eliminado' };
  }
}
