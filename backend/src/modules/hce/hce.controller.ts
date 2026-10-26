import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, UseInterceptors, UploadedFile, BadRequestException, Res, StreamableFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { extname } from 'path';
import { HceService } from './hce.service';
import { HceConfigService } from './hce-config.service';
import { HceTemplatesService } from './hce-templates.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  CreateConsultaDto, UpdateConsultaDto, AddDiagnosticoDto, AddPrescripcionDto,
  AddEvolucionDto, AddPedidoDto, AddIndicacionDto, AddSignoVitalDto, AddVacunaDto, UpdateModulosDto,
  AddAlergiaDto, AddHabitoDto, AddProblemaActivoDto,
} from './dto/hce.dto';
import {
  SaveFormConfigDto, CreateTemplateDto, UpdateTemplateDto,
  ExamenMentalDto, HistoriaFamiliarDto,
} from './dto/hce-forms.dto';
import {
  SaveEvalNeuroconductualDto, SaveEvalNeuropsicometricaDto, SaveDiscusionDiagnosticaDto,
  CreatePlanTratamientoDto, UpdatePlanTratamientoDto, ExtenderPlanDto, FinalizarPlanDto,
} from './dto/neuropsicologia.dto';
import { FirmarConsultaDto } from './dto/firmar-consulta.dto';
import { CertificadoAsistenciaDto } from './dto/certificado-asistencia.dto';
import { SaveOptometriaDto } from './dto/optometria.dto';
import {
  AddAntecedenteDto, GenerarRecetaDto, GenerarCertificadoDto,
  DarAltaDto, CrearDerivacionDto, ProgramarDerivacionDto, PrivacidadDiagnosticosDto,
} from './dto/hce-clinico.dto';
import * as fs from 'fs';
@ApiTags('HCE')
@ApiBearerAuth()
@Controller('hce')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HceController {
  constructor(
    private hceService: HceService,
    private hceConfigService: HceConfigService,
    private templatesService: HceTemplatesService,
  ) {}

  // ── Admin: especialidades ──
  @Get('admin/especialidades')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION')
  getAdminEspecialidades() {
    return this.hceService.getAdminEspecialidades();
  }

  // ── Admin: especialistas (doctores individuales) ──
  @Get('admin/especialistas')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION')
  getAdminEspecialistas() {
    return this.hceService.getAdminEspecialistas();
  }

  // ── Admin: módulos de todas las especialidades ──
  @Get('admin/especialidades/modulos')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION')
  getEspecialidadesModulos() {
    return this.hceService.getEspecialidadesModulos();
  }

  // ── Admin: pacientes por especialista ──
  @Get('admin/especialista/:id/pacientes')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  getPacientesPorEspecialista(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('rol') userRol: string,
  ) {
    return this.hceService.getPacientesPorEspecialista(id, userId, userRol);
  }

  // ── Admin: módulos de especialista (busca por especialidad) ──
  @Get('admin/especialista/:id/modulos')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  getModulos(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('rol') userRol: string,
  ) {
    return this.hceService.getModulos(id, userId, userRol);
  }

  // ── Admin: actualizar módulos de especialidad ──
  @Patch('admin/especialidad/:especialidad/modulos')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION')
  updateModulos(@Param('especialidad') especialidad: string, @Body() dto: UpdateModulosDto) {
    return this.hceService.updateModulos(especialidad, dto);
  }

  // ── Admin: ver consulta ──
  @Get('admin/consulta/:id')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION')
  getConsultaAdmin(
    @Param('id') id: string,
    @CurrentUser('sub') userId?: string,
    @CurrentUser('rol') userRol?: string,
  ) {
    return this.hceService.getConsulta(id, userId, userRol);
  }

  // ── Historial completo del paciente ──
  @Get('paciente/:id/historial')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA', 'ENFERMERO', 'AUDITOR')
  getHistorialPaciente(
    @Param('id') pacienteId: string,
    @Query('especialistaId') especialistaId?: string,
    @CurrentUser('sub') userId?: string,
    @CurrentUser('rol') userRol?: string,
  ) {
    return this.hceService.getHistorialPaciente(pacienteId, especialistaId, userId, userRol);
  }

  // ── Consultas de especialista filtradas por módulo ──
  @Get('especialista/:id/modulo/:modulo')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  getConsultasPorModulo(
    @Param('id') espId: string,
    @Param('modulo') modulo: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('rol') userRol: string,
  ) {
    return this.hceService.getConsultasPorModulo(espId, modulo, userId, userRol);
  }

  // ── Consultas ──
  @Post('consulta')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  @ApiOperation({ summary: 'Crear consulta', description: 'Crea una nueva consulta en la historia clínica' })
  @ApiResponse({ status: 201, description: 'Consulta creada exitosamente' })
  createConsulta(@Body() dto: CreateConsultaDto, @CurrentUser('sub') userId: string) {
    return this.hceService.createConsulta(dto, userId);
  }

  @Get('consulta/by-cita/:citaId')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA', 'ENFERMERO')
  @ApiOperation({ summary: 'Obtener consulta HCE por citaId' })
  getConsultaByCita(
    @Param('citaId') citaId: string,
    @CurrentUser('sub') userId?: string,
    @CurrentUser('rol') userRol?: string,
  ) {
    return this.hceService.getConsultaByCitaId(citaId, userId, userRol);
  }

  @Get('consulta/:id')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  @ApiOperation({ summary: 'Obtener consulta', description: 'Obtiene una consulta por su ID' })
  @ApiResponse({ status: 200, description: 'Consulta encontrada' })
  getConsulta(
    @Param('id') id: string,
    @CurrentUser('sub') userId?: string,
    @CurrentUser('rol') userRol?: string,
  ) {
    return this.hceService.getConsulta(id, userId, userRol);
  }

  @Patch('consulta/:id')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  updateConsulta(
    @Param('id') id: string,
    @Body() dto: UpdateConsultaDto,
    @CurrentUser('sub') userId?: string,
    @CurrentUser('rol') userRol?: string,
  ) {
    return this.hceService.updateConsulta(id, dto, userId, userRol);
  }

  @Post('consulta/:id/firmar')
  @Roles('ESPECIALISTA')
  @ApiOperation({ summary: 'Firmar consulta', description: 'Firma electrónicamente una consulta con verificación de contraseña' })
  @ApiResponse({ status: 200, description: 'Consulta firmada exitosamente' })
  firmarConsulta(@Param('id') id: string, @Body() dto: FirmarConsultaDto, @CurrentUser('sub') userId: string) {
    return this.hceService.firmarConsulta(id, dto.password, userId);
  }

  @Get('consulta/:id/pdf')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA', 'ENFERMERO', 'AUDITOR')
  @ApiOperation({ summary: 'Descargar PDF de la consulta' })
  async descargarPdf(
    @Param('id') id: string,
    @Res() res: Response,
    @CurrentUser('sub') userId?: string,
    @CurrentUser('rol') userRol?: string,
  ) {
    await this.hceService.assertPuedeDescargarConsulta(id, userId, userRol);
    const consulta = await this.hceService.getConsulta(id, userId, userRol);
    if (!consulta.archivoPdfUrl || !fs.existsSync(consulta.archivoPdfUrl)) {
      throw new BadRequestException('PDF no disponible. La consulta debe estar firmada.');
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="consulta-${id}.pdf"`);
    const stream = fs.createReadStream(consulta.archivoPdfUrl);
    stream.pipe(res);
  }

  @Post('consulta/:id/certificado-asistencia')
  @Roles('ESPECIALISTA')
  @ApiOperation({ summary: 'Generar certificado médico de asistencia', description: 'Genera un certificado de asistencia firmado digitalmente con verificación de contraseña' })
  generarCertificado(
    @Param('id') id: string,
    @Body() dto: CertificadoAsistenciaDto,
    @CurrentUser('sub') userId?: string,
    @CurrentUser('rol') userRol?: string,
  ) {
    return this.hceService.generarCertificadoAsistencia(id, dto.password, dto.observaciones, userId, userRol);
  }

  @Get('consulta/:id/certificado-asistencia/pdf')
  @Roles('ESPECIALISTA', 'ADMISION_PRINCIPAL', 'ADMISION', 'ENFERMERO', 'AUDITOR')
  @ApiOperation({ summary: 'Descargar certificado de asistencia en PDF' })
  async descargarCertificadoPdf(@Param('id') id: string, @Res() res: Response) {
    const pdfPath = await this.hceService.getCertificadoPdfPath(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="certificado-${id}.pdf"`);
    const stream = fs.createReadStream(pdfPath);
    stream.pipe(res);
  }

  @Get('consulta/:id/devolucion/pdf')
  @Roles('ESPECIALISTA', 'ADMISION_PRINCIPAL', 'ADMISION', 'ENFERMERO', 'AUDITOR')
  @ApiOperation({ summary: 'Descargar devolución de resultados (Optometría) en PDF' })
  async descargarDevolucionPdf(@Param('id') id: string, @Res() res: Response) {
    const pdfPath = await this.hceService.getDevolucionPdfPath(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="devolucion-${id}.pdf"`);
    const stream = fs.createReadStream(pdfPath);
    stream.pipe(res);
  }

  // ── Diagnósticos ──
  @Post('consulta/:id/diagnostico')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  addDiagnostico(@Param('id') id: string, @Body() dto: AddDiagnosticoDto) {
    return this.hceService.addDiagnostico(id, dto);
  }

  @Patch('diagnostico/:id/confirmar')
  @Roles('ADMISION_PRINCIPAL', 'ESPECIALISTA')
  @ApiOperation({ summary: 'Confirmar un diagnóstico presuntivo como definitivo' })
  confirmarDiagnostico(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('rol') userRol: string,
  ) {
    return this.hceService.confirmarDiagnostico(id, userId, userRol);
  }

  @Delete('diagnostico/:id')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  removeDiagnostico(@Param('id') id: string) {
    return this.hceService.removeDiagnostico(id);
  }

  // ── Historial unificado de diagnósticos ──
  @Get('paciente/:id/diagnosticos')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA', 'ENFERMERO', 'AUDITOR')
  getHistorialDiagnosticos(
    @Param('id') pacienteId: string,
    @CurrentUser('sub') userId?: string,
    @CurrentUser('rol') userRol?: string,
  ) {
    return this.hceService.getHistorialDiagnosticos(pacienteId, userId, userRol);
  }

  @Get('diagnosticos/search')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  searchDiagnosticos(@Query('q') query: string, @Query('sistema') sistema?: string) {
    return this.hceService.searchDiagnosticos(query, sistema);
  }

  // ── Prescripciones ──
  @Post('consulta/:id/prescripcion')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  addPrescripcion(@Param('id') id: string, @Body() dto: AddPrescripcionDto) {
    return this.hceService.addPrescripcion(id, dto);
  }

  @Delete('prescripcion/:id')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  removePrescripcion(@Param('id') id: string) {
    return this.hceService.removePrescripcion(id);
  }

  // ── Evoluciones (solo el especialista titular; lectura según privacidad) ──
  @Post('consulta/:id/evolucion')
  @Roles('ESPECIALISTA')
  async addEvolucion(
    @Param('id') id: string,
    @Body() dto: AddEvolucionDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('rol') userRol: string,
  ) {
    return this.hceService.addEvolucionFromConsulta(id, dto, userId, userRol);
  }

  // ── Pedidos ──
  @Post('consulta/:id/pedido')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  addPedido(@Param('id') id: string, @Body() dto: AddPedidoDto) {
    return this.hceService.addPedido(id, dto);
  }

  // ── Indicaciones ──
  @Post('consulta/:id/indicacion')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  addIndicacion(@Param('id') id: string, @Body() dto: AddIndicacionDto) {
    return this.hceService.addIndicacion(id, dto);
  }

  @Delete('pedido/:id')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  removePedido(@Param('id') id: string) {
    return this.hceService.removePedido(id);
  }

  @Delete('indicacion/:id')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  removeIndicacion(@Param('id') id: string) {
    return this.hceService.removeIndicacion(id);
  }

  // ── Signos Vitales ──
  @Post('paciente/:id/signo-vital')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  addSignoVital(@Param('id') id: string, @Body() dto: AddSignoVitalDto) {
    return this.hceService.addSignoVital(id, dto);
  }

  // ── Vacunas ──
  @Get('paciente/:id/vacunas')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  getVacunas(@Param('id') id: string) {
    return this.hceService.getVacunas(id);
  }

  @Post('paciente/:id/vacunas')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  addVacuna(@Param('id') id: string, @Body() dto: AddVacunaDto) {
    return this.hceService.addVacuna(id, dto);
  }

  // ── Inicializar módulos para especialidad ──
  @Post('admin/especialidad/:especialidad/inicializar-modulos')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION')
  inicializarModulos(@Param('especialidad') especialidad: string) {
    return this.hceService.inicializarModulos(especialidad);
  }

  // ── Forms Config ──
  @Get('config/:especialidad')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  getFormsConfig(
    @Param('especialidad') especialidad: string,
    @Query('especialistaId') especialistaId?: string,
  ) {
    return this.hceConfigService.getFormsConfig(especialidad, especialistaId);
  }

  @Get('config/default')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION')
  getDefaultConfig() {
    return this.hceConfigService.getDefaultConfig();
  }

  @Post('config')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION')
  saveFormConfig(@Body() dto: SaveFormConfigDto) {
    return this.hceConfigService.saveFormConfig(
      dto.especialidad ?? null,
      dto.especialistaId ?? null,
      dto.formName,
      dto.config,
      dto.habilitado,
      dto.orden,
    );
  }

  @Get('config/especialidad/:especialidad')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION')
  getSpecialtyConfigs(@Param('especialidad') especialidad: string) {
    return this.hceConfigService.getAllSpecialtyConfigs(especialidad);
  }

  @Get('config/especialista/:especialistaId')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  getSpecialistConfigs(@Param('especialistaId') especialistaId: string) {
    return this.hceConfigService.getAllSpecialistConfigs(especialistaId);
  }

  @Delete('config/:id')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION')
  removeFormConfig(@Param('id') id: string) {
    return this.hceConfigService.removeFormConfig(id);
  }

  // ── Templates ──
  @Get('templates/:especialidad/:formName/:fieldName')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  getTemplates(
    @Param('especialidad') especialidad: string,
    @Param('formName') formName: string,
    @Param('fieldName') fieldName: string,
  ) {
    return this.templatesService.getTemplates(especialidad, formName, fieldName);
  }

  @Post('templates')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  createTemplate(@Body() dto: CreateTemplateDto) {
    return this.templatesService.createTemplate(dto);
  }

  @Patch('templates/:id')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  updateTemplate(@Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    return this.templatesService.updateTemplate(id, dto);
  }

  @Delete('templates/:id')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  deleteTemplate(@Param('id') id: string) {
    return this.templatesService.deleteTemplate(id);
  }

  // ── Examen Mental ──
  @Post('consulta/:id/examen-mental')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  saveExamenMental(@Param('id') id: string, @Body() dto: ExamenMentalDto) {
    return this.hceService.saveExamenMental(id, dto);
  }

  @Get('consulta/:id/examen-mental')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  getExamenMental(@Param('id') id: string) {
    return this.hceService.getExamenMental(id);
  }

  // ── Historia Familiar ──
  @Post('consulta/:id/historia-familiar')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  saveHistoriaFamiliar(@Param('id') id: string, @Body() dto: HistoriaFamiliarDto) {
    return this.hceService.saveHistoriaFamiliar(id, dto);
  }

  @Get('consulta/:id/historia-familiar')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  getHistoriaFamiliar(@Param('id') id: string) {
    return this.hceService.getHistoriaFamiliar(id);
  }

  // ── Neuropsicología: Evaluación Neuroconductual ──
  @Post('consulta/:id/eval-neuroconductual')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  saveEvalNeuroconductual(@Param('id') id: string, @Body() dto: SaveEvalNeuroconductualDto) {
    return this.hceService.saveEvalNeuroconductual(id, dto);
  }

  @Get('consulta/:id/eval-neuroconductual')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  getEvalNeuroconductual(@Param('id') id: string) {
    return this.hceService.getEvalNeuroconductual(id);
  }

  // ── Neuropsicología: Evaluación Neuropsicométrica ──
  @Post('consulta/:id/eval-neuropsicometrica')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  saveEvalNeuropsicometrica(@Param('id') id: string, @Body() dto: SaveEvalNeuropsicometricaDto) {
    return this.hceService.saveEvalNeuropsicometrica(id, dto);
  }

  @Get('consulta/:id/eval-neuropsicometrica')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  getEvalNeuropsicometrica(@Param('id') id: string) {
    return this.hceService.getEvalNeuropsicometrica(id);
  }

  // ── Neuropsicología: Discusión Diagnóstica ──
  @Post('consulta/:id/discusion-diagnostica')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  saveDiscusionDiagnostica(@Param('id') id: string, @Body() dto: SaveDiscusionDiagnosticaDto) {
    return this.hceService.saveDiscusionDiagnostica(id, dto);
  }

  @Get('consulta/:id/discusion-diagnostica')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  getDiscusionDiagnostica(@Param('id') id: string) {
    return this.hceService.getDiscusionDiagnostica(id);
  }

  // ── Neuropsicología: Plan de Tratamiento (SMART) ──
  @Post('consulta/:id/plan-tratamiento')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  createPlanTratamiento(@Param('id') id: string, @Body() dto: CreatePlanTratamientoDto) {
    return this.hceService.createPlanTratamiento(id, dto);
  }

  @Get('consulta/:id/plan-tratamiento')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  getPlanTratamiento(@Param('id') id: string) {
    return this.hceService.getPlanTratamiento(id);
  }

  @Patch('plan-tratamiento/:id')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  updatePlanTratamiento(@Param('id') id: string, @Body() dto: UpdatePlanTratamientoDto) {
    return this.hceService.updatePlanTratamiento(id, dto);
  }

  @Post('plan-tratamiento/:id/extension')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  extenderPlanTratamiento(@Param('id') id: string, @Body() dto: ExtenderPlanDto) {
    return this.hceService.extenderPlanTratamiento(id, dto);
  }

  @Post('plan-tratamiento/:id/finalizar')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  finalizarPlanTratamiento(@Param('id') id: string, @Body() dto: FinalizarPlanDto) {
    return this.hceService.finalizarPlanTratamiento(id, dto);
  }

  // ── Optometría: Informe (Integral / Tamizaje) ──
  @Post('consulta/:id/optometria')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  saveOptometria(@Param('id') id: string, @Body() dto: SaveOptometriaDto) {
    return this.hceService.saveOptometria(id, dto);
  }

  @Get('consulta/:id/optometria')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  getOptometria(@Param('id') id: string) {
    return this.hceService.getOptometria(id);
  }

  // ── Tratamientos públicos: todas las especialidades del paciente ──
  @Get('paciente/:id/tratamientos')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA', 'ENFERMERO', 'AUDITOR')
  getTratamientosPaciente(@Param('id') id: string) {
    return this.hceService.getTratamientosPaciente(id);
  }

  // ── Subir examen complementario ──
  @Post('consulta/:id/examen')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  @ApiOperation({ summary: 'Subir examen', description: 'Sube un archivo de examen complementario a una consulta' })
  @ApiResponse({ status: 201, description: 'Examen subido exitosamente' })
  @UseInterceptors(FileInterceptor('archivo', {
    limits: { fileSize: 25 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const allowedExt = /\.(pdf|png|jpe?g|tiff?|dicom?)$/i;
      const allowedMime = ['application/pdf', 'image/png', 'image/jpeg', 'image/tiff'];
      const ok = allowedExt.test(extname(file.originalname)) && allowedMime.includes(file.mimetype);
      cb(ok ? null : new BadRequestException('Tipo de archivo no permitido. Solo PDF, PNG, JPG, TIFF, DICOM.'), false);
    },
  }))
  uploadExamen(
    @Param('id') consultaId: string,
    @Body('pacienteId') pacienteId: string,
    @Body('nombre') nombre: string,
    @Body('resultados') resultados: string,
    @Body('fechaResultado') fechaResultado: string,
    @Body('fase') fase: string,
    @UploadedFile() file: any,
  ) {
    return this.hceService.uploadExamen(consultaId, pacienteId, file, {
      nombre,
      resultados,
      fechaResultado,
      fase,
    });
  }

  // ── CIE-10 Search (compatibilidad) ──
  @Get('cie10/search')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  searchCIE10(@Query('q') query: string) {
    return this.hceService.searchCIE10(query);
  }

  // ── Historial clínico organizado ──
  @Get('paciente/:id/historial-clinico')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA', 'ENFERMERO', 'AUDITOR')
  getHistorialClinico(
    @Param('id') pacienteId: string,
    @CurrentUser('sub') userId?: string,
    @CurrentUser('rol') userRol?: string,
  ) {
    return this.hceService.getHistorialClinico(pacienteId, userId, userRol);
  }

  // ── Antecedentes personales / familiares ──
  @Get('paciente/:id/antecedentes')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA', 'ENFERMERO', 'AUDITOR')
  getAntecedentes(@Param('id') pacienteId: string, @Query('ambito') ambito?: string) {
    return this.hceService.getAntecedentes(pacienteId, ambito);
  }

  @Post('paciente/:id/antecedentes')
  @Roles('ESPECIALISTA', 'ADMISION_PRINCIPAL', 'ADMISION')
  addAntecedente(
    @Param('id') pacienteId: string,
    @Body() dto: AddAntecedenteDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.hceService.addAntecedente(pacienteId, dto, userId);
  }

  // ── Privacidad de diagnósticos por especialidad ──
  @Get('admin/privacidad-diagnosticos')
  @Roles('ADMISION_PRINCIPAL')
  getPrivacidadDiagnosticos() {
    return this.hceService.getPrivacidadDiagnosticos();
  }

  @Patch('admin/privacidad-diagnosticos/:especialidad')
  @Roles('ADMISION_PRINCIPAL')
  updatePrivacidadDiagnosticos(
    @Param('especialidad') especialidad: string,
    @Body() dto: PrivacidadDiagnosticosDto,
  ) {
    return this.hceService.updatePrivacidadDiagnosticos(especialidad, dto);
  }

  // ── Recetas médicas ──
  @Post('consulta/:id/receta')
  @Roles('ESPECIALISTA')
  @ApiOperation({ summary: 'Generar receta médica firmada desde la consulta' })
  generarReceta(
    @Param('id') id: string,
    @Body() dto: GenerarRecetaDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('rol') userRol: string,
  ) {
    return this.hceService.generarReceta(id, dto, userId, userRol);
  }

  @Get('consulta/:id/recetas')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA', 'ENFERMERO', 'AUDITOR')
  getRecetasConsulta(@Param('id') consultaId: string) {
    return this.hceService.getRecetasConsulta(consultaId);
  }

  @Get('paciente/:id/recetas')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA', 'ENFERMERO', 'AUDITOR')
  getRecetasPaciente(@Param('id') pacienteId: string) {
    return this.hceService.getRecetasPaciente(pacienteId);
  }

  @Get('recetas')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA', 'AUDITOR')
  getRecetas(
    @CurrentUser('sub') userId: string,
    @CurrentUser('rol') userRol: string,
    @Query('pacienteId') pacienteId?: string,
    @Query('q') q?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.hceService.getRecetas(userId, userRol, { pacienteId, q, desde, hasta, page, limit });
  }

  @Get('receta/:id')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA', 'ENFERMERO', 'AUDITOR')
  getReceta(@Param('id') id: string) {
    return this.hceService.getReceta(id);
  }

  @Get('receta/:id/pdf')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA', 'ENFERMERO', 'AUDITOR')
  async descargarRecetaPdf(@Param('id') id: string, @Res() res: Response) {
    const pdfPath = await this.hceService.getRecetaPdfPath(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="receta-${id}.pdf"`);
    fs.createReadStream(pdfPath).pipe(res);
  }

  // ── Certificados de asistencia / reposo ──
  @Post('consulta/:id/certificado')
  @Roles('ESPECIALISTA')
  @ApiOperation({ summary: 'Generar certificado de asistencia o reposo firmado' })
  generarCertificadoMedico(
    @Param('id') id: string,
    @Body() dto: GenerarCertificadoDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('rol') userRol: string,
  ) {
    return this.hceService.generarCertificado(id, dto, userId, userRol);
  }

  @Get('paciente/:id/certificados')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA', 'ENFERMERO', 'AUDITOR')
  getCertificadosPaciente(@Param('id') pacienteId: string) {
    return this.hceService.getCertificadosPaciente(pacienteId);
  }

  @Get('certificado-medico/:id/pdf')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA', 'ENFERMERO', 'AUDITOR')
  async descargarCertificadoMedicoPdf(@Param('id') id: string, @Res() res: Response) {
    const pdfPath = await this.hceService.getCertificadoMedicoPdfPath(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="certificado-${id}.pdf"`);
    fs.createReadStream(pdfPath).pipe(res);
  }

  // ── Alta por especialidad ──
  @Post('paciente/:id/alta')
  @Roles('ESPECIALISTA', 'ADMISION_PRINCIPAL', 'ADMISION')
  @ApiOperation({ summary: 'Dar de alta al paciente en una especialidad y liberar sus citas pendientes' })
  darAlta(
    @Param('id') pacienteId: string,
    @Body() dto: DarAltaDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('rol') userRol: string,
  ) {
    return this.hceService.darAlta(pacienteId, dto, userId, userRol);
  }

  @Get('paciente/:id/altas')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA', 'AUDITOR')
  getAltasPaciente(@Param('id') pacienteId: string) {
    return this.hceService.getAltasPaciente(pacienteId);
  }

  // ── Derivaciones ──
  @Get('especialistas-destino')
  @Roles('ESPECIALISTA', 'ADMISION_PRINCIPAL', 'ADMISION')
  @ApiOperation({ summary: 'Listar especialistas habilitados para derivación' })
  getEspecialistasDestino(
    @CurrentUser('sub') userId?: string,
    @CurrentUser('rol') userRol?: string,
  ) {
    return this.hceService.getEspecialistasDestino(userId, userRol);
  }

  @Post('derivaciones')
  @Roles('ESPECIALISTA', 'ADMISION_PRINCIPAL', 'ADMISION')
  @ApiOperation({ summary: 'Derivar a uno o varios especialistas' })
  crearDerivacion(
    @Body() dto: CrearDerivacionDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('rol') userRol: string,
  ) {
    return this.hceService.crearDerivacion(dto, userId, userRol);
  }

  @Get('derivaciones')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA', 'AUDITOR')
  getDerivaciones(
    @Query('estado') estado?: string,
    @Query('prioridad') prioridad?: string,
    @Query('especialistaId') especialistaId?: string,
    @Query('pacienteId') pacienteId?: string,
    @CurrentUser('sub') userId?: string,
    @CurrentUser('rol') userRol?: string,
  ) {
    return this.hceService.getDerivaciones({ estado, prioridad, especialistaId, pacienteId }, userId, userRol);
  }

  @Get('paciente/:id/derivaciones')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA', 'AUDITOR')
  getDerivacionesPaciente(@Param('id') pacienteId: string) {
    return this.hceService.getDerivacionesPaciente(pacienteId);
  }

  @Patch('derivacion-destino/:id/programar')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION')
  @ApiOperation({ summary: 'Vincular la cita programada al destino de una derivación' })
  programarDerivacionDestino(@Param('id') id: string, @Body() dto: ProgramarDerivacionDto) {
    return this.hceService.programarDerivacionDestino(id, dto.citaId);
  }

  // ── Alergias ──
  @Get('paciente/:id/alergias')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  getAlergias(@Param('id') id: string) {
    return this.hceService.getAlergias(id);
  }

  @Post('paciente/:id/alergias')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  addAlergia(@Param('id') id: string, @Body() dto: AddAlergiaDto) {
    return this.hceService.addAlergia(id, dto);
  }

  @Delete('alergia/:id')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  removeAlergia(@Param('id') id: string) {
    return this.hceService.removeAlergia(id);
  }

  // ── Hábitos ──
  @Get('paciente/:id/habitos')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  getHabitos(@Param('id') id: string) {
    return this.hceService.getHabitos(id);
  }

  @Post('paciente/:id/habitos')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  addHabito(@Param('id') id: string, @Body() dto: AddHabitoDto) {
    return this.hceService.addHabito(id, dto);
  }

  @Delete('habito/:id')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  removeHabito(@Param('id') id: string) {
    return this.hceService.removeHabito(id);
  }

  // ── Problemas Activos ──
  @Get('paciente/:id/problemas-activos')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  getProblemasActivos(@Param('id') id: string) {
    return this.hceService.getProblemasActivos(id);
  }

  @Post('paciente/:id/problemas-activos')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  addProblemaActivo(@Param('id') id: string, @Body() dto: AddProblemaActivoDto) {
    return this.hceService.addProblemaActivo(id, dto);
  }

  @Patch('problema-activo/:id/resolver')
  @Roles('ADMISION_PRINCIPAL', 'ADMISION', 'ESPECIALISTA')
  resolverProblemaActivo(@Param('id') id: string) {
    return this.hceService.resolverProblemaActivo(id);
  }
}
