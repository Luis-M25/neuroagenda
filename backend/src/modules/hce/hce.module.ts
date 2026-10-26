import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { HceController } from './hce.controller';
import { HceService } from './hce.service';
import { HceConfigService } from './hce-config.service';
import { HceTemplatesService } from './hce-templates.service';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';

@Module({
  imports: [MulterModule.register({}), NotificacionesModule],
  controllers: [HceController],
  providers: [HceService, HceConfigService, HceTemplatesService],
  exports: [HceService, HceConfigService],
})
export class HceModule {}
