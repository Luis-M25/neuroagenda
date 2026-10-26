import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { CreateFeriadoDto } from './dto/create-feriado.dto';

@Injectable()
export class FeriadosService {
  constructor(
    private prisma: PrismaService,
    private auditoriaService: AuditoriaService,
  ) {}

  async findAll() {
    return this.prisma.feriado.findMany({
      orderBy: { fecha: 'asc' },
    });
  }

  async create(dto: CreateFeriadoDto, usuarioId: string) {
    const feriado = await this.prisma.feriado.create({
      data: {
        fecha: new Date(dto.fecha),
        nombre: dto.nombre,
        activo: dto.activo ?? true,
      },
    });

    await this.auditoriaService.registrar({
      usuarioId,
      accion: 'CREAR_FERIADO',
      entidad: 'Feriado',
      entidadId: feriado.id,
      detalle: { fecha: dto.fecha, nombre: dto.nombre },
    });

    return feriado;
  }

  async update(id: string, dto: Partial<CreateFeriadoDto>, usuarioId: string) {
    const feriado = await this.prisma.feriado.findUnique({ where: { id } });
    if (!feriado) throw new NotFoundException('Feriado no encontrado');

    const data: any = {};
    if (dto.fecha) data.fecha = new Date(dto.fecha);
    if (dto.nombre !== undefined) data.nombre = dto.nombre;
    if (dto.activo !== undefined) data.activo = dto.activo;

    const updated = await this.prisma.feriado.update({ where: { id }, data });

    await this.auditoriaService.registrar({
      usuarioId,
      accion: 'ACTUALIZAR_FERIADO',
      entidad: 'Feriado',
      entidadId: id,
      detalle: dto,
    });

    return updated;
  }

  async remove(id: string, usuarioId: string) {
    await this.prisma.feriado.findUnique({ where: { id } });
    await this.prisma.feriado.delete({ where: { id } });

    await this.auditoriaService.registrar({
      usuarioId,
      accion: 'ELIMINAR_FERIADO',
      entidad: 'Feriado',
      entidadId: id,
    });

    return { message: 'Feriado eliminado' };
  }
}
