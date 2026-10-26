import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import * as defaultConfig from '../../config/hce-forms.config.json';

@Injectable()
export class HceConfigService {
  private readonly logger = new Logger(HceConfigService.name);
  private defaultForms: any;

  constructor(private prisma: PrismaService) {
    this.defaultForms = (defaultConfig as any).forms;
  }

  getDefaultConfig() {
    return defaultConfig;
  }

  async getFormsConfig(especialidad: string, especialistaId?: string) {
    const base = this.defaultForms;

    const specialidadOverrides = await this.prisma.hceFormConfig.findMany({
      where: { especialidad },
    });

    const merged = { ...base };

    for (const override of specialidadOverrides) {
      const parsed = JSON.parse(override.config);
      if (!override.habilitado) {
        delete (merged as any)[override.formName];
      } else {
        (merged as any)[override.formName] = parsed;
      }
    }

    if (especialistaId) {
      const specialistOverrides = await this.prisma.hceFormConfig.findMany({
        where: { especialistaId },
      });

      for (const override of specialistOverrides) {
        const parsed = JSON.parse(override.config);
        if (!override.habilitado) {
          delete (merged as any)[override.formName];
        } else {
          (merged as any)[override.formName] = parsed;
        }
      }
    }

    return merged;
  }

  async saveFormConfig(
    especialidad: string | null,
    especialistaId: string | null,
    formName: string,
    config: any,
    habilitado: boolean = true,
    orden: number = 0,
  ) {
    const where: any = {};
    if (especialidad) where.especialidad_formName = { especialidad, formName };
    if (especialistaId) where.especialistaId_formName = { especialistaId, formName };

    return this.prisma.hceFormConfig.upsert({
      where,
      create: {
        especialidad,
        especialistaId,
        formName,
        config: JSON.stringify(config),
        habilitado,
        orden,
      },
      update: {
        config: JSON.stringify(config),
        habilitado,
        orden,
      },
    });
  }

  async removeFormConfig(id: string) {
    return this.prisma.hceFormConfig.delete({ where: { id } });
  }

  async getAllSpecialtyConfigs(especialidad: string) {
    return this.prisma.hceFormConfig.findMany({
      where: { especialidad },
      orderBy: { orden: 'asc' },
    });
  }

  async getAllSpecialistConfigs(especialistaId: string) {
    return this.prisma.hceFormConfig.findMany({
      where: { especialistaId },
      orderBy: { orden: 'asc' },
    });
  }
}
