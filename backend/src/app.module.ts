import { Module, Global, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './common/prisma.module';
import { ConfigService } from './common/config.service';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { EspecialistaValidator } from './common/validators/especialista.validator';
import { AuthModule } from './modules/auth/auth.module';
import { AdminsModule } from './modules/admins/admins.module';
import { EspecialistasModule } from './modules/especialistas/especialistas.module';
import { PacientesModule } from './modules/pacientes/pacientes.module';
import { CitasModule } from './modules/citas/citas.module';
import { HorariosModule } from './modules/horarios/horarios.module';
import { NotificacionesModule } from './modules/notificaciones/notificaciones.module';
import { CalendarioModule } from './modules/calendario/calendario.module';
import { ReportesModule } from './modules/reportes/reportes.module';
import { UbicacionModule } from './modules/ubicacion/ubicacion.module';
import { AuditoriaModule } from './modules/auditoria/auditoria.module';
import { FeriadosModule } from './modules/feriados/feriados.module';
import { ConsultoriosModule } from './modules/consultorios/consultorios.module';
import { SedesModule } from './modules/sedes/sedes.module';
import { EspecialidadesModule } from './modules/especialidades/especialidades.module';
import { SyncModule } from './modules/sync/sync.module';
import { PasantesModule } from './modules/pasantes/pasantes.module';
import { SegurosModule } from './modules/seguros/seguros.module';
import { HceModule } from './modules/hce/hce.module';
import { HealthModule } from './modules/health/health.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { EnfermeroModule } from './modules/enfermero/enfermero.module';
import { AuditorModule } from './modules/auditor/auditor.module';

@Global()
@Module({
  imports: [
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    PrismaModule,
    AuthModule,
    AdminsModule,
    EspecialistasModule,
    PacientesModule,
    CitasModule,
    HorariosModule,
    NotificacionesModule,
    CalendarioModule,
    ReportesModule,
    UbicacionModule,
    AuditoriaModule,
    FeriadosModule,
    ConsultoriosModule,
    SedesModule,
    EspecialidadesModule,
    SyncModule,
    PasantesModule,
    SegurosModule,
    HceModule,
    HealthModule,
    UsuariosModule,
    EnfermeroModule,
    AuditorModule,
  ],
  providers: [
    ConfigService,
    EspecialistaValidator,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
  exports: [ConfigService, EspecialistaValidator],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
