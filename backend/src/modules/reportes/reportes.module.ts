import { Module } from '@nestjs/common';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';
import { HceModule } from '../hce/hce.module';

@Module({
  imports: [HceModule],
  controllers: [ReportesController],
  providers: [ReportesService],
})
export class ReportesModule {}
