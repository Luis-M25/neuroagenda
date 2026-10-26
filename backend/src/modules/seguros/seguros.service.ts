import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class SegurosService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.seguro.findMany({ where: { activo: true } });
  }

  create(dto: { nombre: string; tipo: string; telefono?: string; direccion?: string }) {
    return this.prisma.seguro.create({ data: dto });
  }

  update(id: string, dto: { nombre?: string; tipo?: string; telefono?: string; direccion?: string; activo?: boolean }) {
    return this.prisma.seguro.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.seguro.update({ where: { id }, data: { activo: false } });
  }
}
