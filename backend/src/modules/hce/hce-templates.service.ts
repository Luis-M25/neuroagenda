import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class HceTemplatesService {
  constructor(private prisma: PrismaService) {}

  async getTemplates(especialidad: string, formName: string, fieldName: string) {
    return this.prisma.templateHCE.findMany({
      where: { especialidad, formName, fieldName },
      orderBy: { orden: 'asc' },
    });
  }

  async createTemplate(data: {
    especialidad: string;
    formName: string;
    fieldName: string;
    titulo: string;
    contenido: string;
    orden?: number;
  }) {
    return this.prisma.templateHCE.create({
      data: {
        especialidad: data.especialidad,
        formName: data.formName,
        fieldName: data.fieldName,
        titulo: data.titulo,
        contenido: data.contenido,
        orden: data.orden ?? 0,
      },
    });
  }

  async updateTemplate(id: string, data: {
    titulo?: string;
    contenido?: string;
    orden?: number;
  }) {
    return this.prisma.templateHCE.update({
      where: { id },
      data,
    });
  }

  async deleteTemplate(id: string) {
    return this.prisma.templateHCE.delete({ where: { id } });
  }
}
