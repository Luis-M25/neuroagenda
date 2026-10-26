import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AdminsService } from './admins.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { CreatePorteroDto } from './dto/create-portero.dto';
import { CreateAuditorDto } from './dto/create-auditor.dto';
import { CreateEnfermeroDto } from './dto/create-enfermero.dto';
import { UpdatePermisosDto } from './dto/update-permisos.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('admins')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminsController {
  constructor(private adminsService: AdminsService) {}

  @Post()
  @Roles('ADMISION_PRINCIPAL', 'ADMISION')
  @Permissions('gestionar_administradores')
  create(@Body() body: CreateAdminDto & { permisos?: Record<string, boolean> }, @CurrentUser('sub') userId: string) {
    const { permisos, ...dto } = body;
    return this.adminsService.create(dto, userId, permisos);
  }

  @Get()
  @Roles('ADMISION_PRINCIPAL', 'ADMISION')
  findAll() {
    return this.adminsService.findAll();
  }

  // Auditores
  @Get('auditores')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION')
  findAllAuditores() {
    return this.adminsService.findAllAuditores();
  }

  @Post('auditores')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION')
  createAuditor(@Body() dto: CreateAuditorDto, @CurrentUser('sub') userId: string) {
    return this.adminsService.createAuditor(dto, userId);
  }

  @Delete('auditores/:id')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION')
  removeAuditor(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.adminsService.removeAuditor(id, userId);
  }

  // Porteros (static routes before :id)
  @Get('porteros')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION')
  findAllPorteros() {
    return this.adminsService.findAllPorteros();
  }

  @Post('porteros')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION')
  createPortero(@Body() dto: CreatePorteroDto, @CurrentUser('sub') userId: string) {
    return this.adminsService.createPortero(dto, userId);
  }

  // Enfermeros (static routes before :id)
  @Get('enfermeros')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION')
  findAllEnfermeros() {
    return this.adminsService.findAllEnfermeros();
  }

  @Post('enfermeros')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION')
  createEnfermero(@Body() dto: CreateEnfermeroDto, @CurrentUser('sub') userId: string) {
    return this.adminsService.createEnfermero(dto, userId);
  }

  @Get(':id')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION')
  findOne(@Param('id') id: string) {
    return this.adminsService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION')
  @Permissions('gestionar_administradores')
  update(@Param('id') id: string, @Body() dto: Partial<CreateAdminDto>) {
    return this.adminsService.update(id, dto);
  }

  @Patch(':id/permisos')
  @Roles('ADMISION_PRINCIPAL')
  updatePermisos(
    @Param('id') id: string,
    @Body() dto: UpdatePermisosDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.adminsService.updatePermisos(id, dto, userId);
  }

  @Delete(':id')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION')
  @Permissions('gestionar_administradores')
  remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.adminsService.remove(id, userId);
  }

  @Delete('porteros/:id')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION')
  removePortero(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.adminsService.removePortero(id, userId);
  }

  @Delete('enfermeros/:id')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION')
  removeEnfermero(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.adminsService.removeEnfermero(id, userId);
  }
}
