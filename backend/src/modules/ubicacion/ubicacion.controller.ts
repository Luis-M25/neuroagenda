import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { UbicacionService } from './ubicacion.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('ubicacion')
@UseGuards(JwtAuthGuard)
export class UbicacionController {
  constructor(private ubicacionService: UbicacionService) {}

  @Get('provincias')
  getProvincias() {
    return this.ubicacionService.getProvincias();
  }

  @Get('cantones/:provinciaCodigo')
  getCantones(@Param('provinciaCodigo') codigo: string) {
    return this.ubicacionService.getCantones(codigo);
  }
}
