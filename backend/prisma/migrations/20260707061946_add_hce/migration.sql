/*
  Warnings:

  - You are about to drop the column `consultorio` on the `Especialista` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Pasante" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "especialistaId" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "tipoIdentificacion" TEXT NOT NULL,
    "numeroIdentificacion" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Pasante_especialistaId_fkey" FOREIGN KEY ("especialistaId") REFERENCES "Especialista" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CitaModificacion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "citaId" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT NOT NULL,
    "notasModificacion" TEXT,
    "modificadaPorId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CitaModificacion_citaId_fkey" FOREIGN KEY ("citaId") REFERENCES "Cita" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CitaModificacion_modificadaPorId_fkey" FOREIGN KEY ("modificadaPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Especialidad" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Sede" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Consultorio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "sede" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Consultorio_sede_fkey" FOREIGN KEY ("sede") REFERENCES "Sede" ("nombre") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SyncedChange" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entidad" TEXT NOT NULL,
    "entidadId" TEXT NOT NULL,
    "operacion" TEXT NOT NULL,
    "datos" TEXT NOT NULL,
    "syncedAt" DATETIME,
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Antecedente" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pacienteId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fecha" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Antecedente_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SignoVital" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pacienteId" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "presionArterial" TEXT,
    "frecuenciaCardiaca" INTEGER,
    "temperatura" REAL,
    "peso" REAL,
    "talla" REAL,
    "imc" REAL,
    "observaciones" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SignoVital_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExamenComplementario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pacienteId" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "resultado" TEXT,
    "archivoUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExamenComplementario_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Seguro" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "telefono" TEXT,
    "direccion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EspecialistaModuloHCE" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "especialistaId" TEXT NOT NULL,
    "modulo" TEXT NOT NULL,
    "habilitado" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "EspecialistaModuloHCE_especialistaId_fkey" FOREIGN KEY ("especialistaId") REFERENCES "Especialista" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConsultaHCE" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pacienteId" TEXT NOT NULL,
    "citaId" TEXT,
    "especialistaId" TEXT NOT NULL,
    "motivoConsulta" TEXT,
    "enfermedadActual" TEXT,
    "tiempoEvolucion" TEXT,
    "tratamientosPrevios" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'EN_CURSO',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ConsultaHCE_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ConsultaHCE_citaId_fkey" FOREIGN KEY ("citaId") REFERENCES "Cita" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ConsultaHCE_especialistaId_fkey" FOREIGN KEY ("especialistaId") REFERENCES "Especialista" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Diagnostico" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "consultaId" TEXT NOT NULL,
    "codigoCIE10" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'PRINCIPAL',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Diagnostico_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "ConsultaHCE" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Prescripcion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "consultaId" TEXT NOT NULL,
    "medicamento" TEXT NOT NULL,
    "dosis" TEXT NOT NULL,
    "via" TEXT,
    "frecuencia" TEXT NOT NULL,
    "duracion" TEXT,
    "indicaciones" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Prescripcion_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "ConsultaHCE" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Evolucion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pacienteId" TEXT NOT NULL,
    "consultaId" TEXT,
    "especialistaId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'SOAP',
    "subjetivo" TEXT,
    "objetivo" TEXT,
    "analisis" TEXT,
    "plan" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Evolucion_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Evolucion_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "ConsultaHCE" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Evolucion_especialistaId_fkey" FOREIGN KEY ("especialistaId") REFERENCES "Especialista" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PedidoExamen" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "consultaId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "urgente" BOOLEAN NOT NULL DEFAULT false,
    "resultadoUrl" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PedidoExamen_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "ConsultaHCE" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Vacuna" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pacienteId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL,
    "dosis" TEXT,
    "lote" TEXT,
    "aplicadoPor" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Vacuna_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Consentimiento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pacienteId" TEXT NOT NULL,
    "consultaId" TEXT,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "archivoUrl" TEXT,
    "firmado" BOOLEAN NOT NULL DEFAULT false,
    "fechaFirma" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Consentimiento_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Consentimiento_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "ConsultaHCE" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Cita" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "especialistaId" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT NOT NULL,
    "duracionMinutos" INTEGER NOT NULL,
    "especialidad" TEXT NOT NULL,
    "lugar" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "notaAdmin" TEXT,
    "notaEspecialista" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "esRecurrente" BOOLEAN NOT NULL DEFAULT false,
    "recurrenciaDiaSemana" INTEGER,
    "recurrenciaFechaFin" DATETIME,
    "recurrenciaDiasSemana" TEXT,
    "recurrenciaCantidad" INTEGER,
    "citaOrigenId" TEXT,
    "notasModificacion" TEXT,
    "fechaModificacion" DATETIME,
    "modificadaPorId" TEXT,
    "whatsappEnviado" BOOLEAN NOT NULL DEFAULT false,
    "whatsappConfirmado" BOOLEAN NOT NULL DEFAULT false,
    "whatsappConfirmadoEn" DATETIME,
    "notificacionEnviada5min" BOOLEAN NOT NULL DEFAULT false,
    "canceladaPor" TEXT,
    "motivoCancelacion" TEXT,
    "fechaCancelacion" DATETIME,
    "citaReagendadaId" TEXT,
    "atendidaPorId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Cita_especialistaId_fkey" FOREIGN KEY ("especialistaId") REFERENCES "Especialista" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Cita_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Cita_especialidad_fkey" FOREIGN KEY ("especialidad") REFERENCES "Especialidad" ("nombre") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Cita_citaOrigenId_fkey" FOREIGN KEY ("citaOrigenId") REFERENCES "Cita" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Cita_modificadaPorId_fkey" FOREIGN KEY ("modificadaPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Cita_citaReagendadaId_fkey" FOREIGN KEY ("citaReagendadaId") REFERENCES "Cita" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Cita_atendidaPorId_fkey" FOREIGN KEY ("atendidaPorId") REFERENCES "Pasante" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Cita" ("canceladaPor", "citaOrigenId", "citaReagendadaId", "createdAt", "duracionMinutos", "esRecurrente", "especialidad", "especialistaId", "estado", "fecha", "fechaCancelacion", "fechaModificacion", "horaFin", "horaInicio", "id", "lugar", "modificadaPorId", "motivo", "motivoCancelacion", "notaAdmin", "notaEspecialista", "notasModificacion", "notificacionEnviada5min", "pacienteId", "recurrenciaDiaSemana", "recurrenciaFechaFin", "updatedAt", "whatsappConfirmado", "whatsappConfirmadoEn", "whatsappEnviado") SELECT "canceladaPor", "citaOrigenId", "citaReagendadaId", "createdAt", "duracionMinutos", "esRecurrente", "especialidad", "especialistaId", "estado", "fecha", "fechaCancelacion", "fechaModificacion", "horaFin", "horaInicio", "id", "lugar", "modificadaPorId", "motivo", "motivoCancelacion", "notaAdmin", "notaEspecialista", "notasModificacion", "notificacionEnviada5min", "pacienteId", "recurrenciaDiaSemana", "recurrenciaFechaFin", "updatedAt", "whatsappConfirmado", "whatsappConfirmadoEn", "whatsappEnviado" FROM "Cita";
DROP TABLE "Cita";
ALTER TABLE "new_Cita" RENAME TO "Cita";
CREATE UNIQUE INDEX "Cita_citaReagendadaId_key" ON "Cita"("citaReagendadaId");
CREATE UNIQUE INDEX "Cita_especialistaId_fecha_horaInicio_key" ON "Cita"("especialistaId", "fecha", "horaInicio");
CREATE TABLE "new_Especialista" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "tipoIdentificacion" TEXT NOT NULL,
    "numeroIdentificacion" TEXT NOT NULL,
    "genero" TEXT NOT NULL,
    "fechaNacimiento" DATETIME,
    "fotoUrl" TEXT,
    "codigoMsp" TEXT NOT NULL,
    "especialidad" TEXT NOT NULL,
    "subEspecialidad" TEXT,
    "tituloProfesional" TEXT NOT NULL,
    "emailInstitucional" TEXT NOT NULL,
    "emailPersonal" TEXT,
    "telefono" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "sede" TEXT NOT NULL,
    "consultorioPredeterminado" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'HABILITADO',
    "fechaInicioSuspension" DATETIME,
    "fechaFinSuspension" DATETIME,
    "maxCitasPorHora" INTEGER NOT NULL DEFAULT 1,
    "tienePasantes" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Especialista_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Especialista_especialidad_fkey" FOREIGN KEY ("especialidad") REFERENCES "Especialidad" ("nombre") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Especialista_sede_fkey" FOREIGN KEY ("sede") REFERENCES "Sede" ("nombre") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Especialista_consultorioPredeterminado_sede_fkey" FOREIGN KEY ("consultorioPredeterminado", "sede") REFERENCES "Consultorio" ("nombre", "sede") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Especialista" ("apellidos", "codigoMsp", "createdAt", "direccion", "emailInstitucional", "emailPersonal", "especialidad", "estado", "fechaFinSuspension", "fechaInicioSuspension", "fechaNacimiento", "fotoUrl", "genero", "id", "nombres", "numeroIdentificacion", "sede", "subEspecialidad", "telefono", "tipoIdentificacion", "tituloProfesional", "updatedAt", "usuarioId") SELECT "apellidos", "codigoMsp", "createdAt", "direccion", "emailInstitucional", "emailPersonal", "especialidad", "estado", "fechaFinSuspension", "fechaInicioSuspension", "fechaNacimiento", "fotoUrl", "genero", "id", "nombres", "numeroIdentificacion", "sede", "subEspecialidad", "telefono", "tipoIdentificacion", "tituloProfesional", "updatedAt", "usuarioId" FROM "Especialista";
DROP TABLE "Especialista";
ALTER TABLE "new_Especialista" RENAME TO "Especialista";
CREATE UNIQUE INDEX "Especialista_usuarioId_key" ON "Especialista"("usuarioId");
CREATE UNIQUE INDEX "Especialista_numeroIdentificacion_key" ON "Especialista"("numeroIdentificacion");
CREATE UNIQUE INDEX "Especialista_codigoMsp_key" ON "Especialista"("codigoMsp");
CREATE UNIQUE INDEX "Especialista_emailInstitucional_key" ON "Especialista"("emailInstitucional");
CREATE TABLE "new_PermisosAdmin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "administracionId" TEXT NOT NULL,
    "verEspecialistas" BOOLEAN NOT NULL DEFAULT true,
    "crearEspecialista" BOOLEAN NOT NULL DEFAULT true,
    "editarEspecialista" BOOLEAN NOT NULL DEFAULT true,
    "deshabilitarEspecialista" BOOLEAN NOT NULL DEFAULT true,
    "bloquearEspecialistaGrupal" BOOLEAN NOT NULL DEFAULT false,
    "verPacientes" BOOLEAN NOT NULL DEFAULT true,
    "crearPaciente" BOOLEAN NOT NULL DEFAULT true,
    "editarPaciente" BOOLEAN NOT NULL DEFAULT true,
    "verInasistenciasPaciente" BOOLEAN NOT NULL DEFAULT true,
    "bloquearPaciente" BOOLEAN NOT NULL DEFAULT true,
    "verTodasCitas" BOOLEAN NOT NULL DEFAULT true,
    "crearCita" BOOLEAN NOT NULL DEFAULT true,
    "editarCita" BOOLEAN NOT NULL DEFAULT true,
    "cancelarCita" BOOLEAN NOT NULL DEFAULT true,
    "reagendarCita" BOOLEAN NOT NULL DEFAULT true,
    "marcarNoAsistio" BOOLEAN NOT NULL DEFAULT true,
    "verCalendario" BOOLEAN NOT NULL DEFAULT true,
    "verReportes" BOOLEAN NOT NULL DEFAULT false,
    "gestionarAdmins" BOOLEAN NOT NULL DEFAULT false,
    "gestionarPermisos" BOOLEAN NOT NULL DEFAULT false,
    "eliminarAdmisionPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "verHistoriaClinica" BOOLEAN NOT NULL DEFAULT false,
    "editarHistoriaClinica" BOOLEAN NOT NULL DEFAULT false,
    "gestionarModulosHCE" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "PermisosAdmin_administracionId_fkey" FOREIGN KEY ("administracionId") REFERENCES "Administracion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PermisosAdmin" ("administracionId", "bloquearEspecialistaGrupal", "bloquearPaciente", "cancelarCita", "crearCita", "crearEspecialista", "crearPaciente", "deshabilitarEspecialista", "editarCita", "editarEspecialista", "editarPaciente", "eliminarAdmisionPrincipal", "gestionarAdmins", "gestionarPermisos", "id", "marcarNoAsistio", "reagendarCita", "verCalendario", "verEspecialistas", "verInasistenciasPaciente", "verPacientes", "verReportes", "verTodasCitas") SELECT "administracionId", "bloquearEspecialistaGrupal", "bloquearPaciente", "cancelarCita", "crearCita", "crearEspecialista", "crearPaciente", "deshabilitarEspecialista", "editarCita", "editarEspecialista", "editarPaciente", "eliminarAdmisionPrincipal", "gestionarAdmins", "gestionarPermisos", "id", "marcarNoAsistio", "reagendarCita", "verCalendario", "verEspecialistas", "verInasistenciasPaciente", "verPacientes", "verReportes", "verTodasCitas" FROM "PermisosAdmin";
DROP TABLE "PermisosAdmin";
ALTER TABLE "new_PermisosAdmin" RENAME TO "PermisosAdmin";
CREATE UNIQUE INDEX "PermisosAdmin_administracionId_key" ON "PermisosAdmin"("administracionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Especialidad_nombre_key" ON "Especialidad"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Sede_nombre_key" ON "Sede"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Consultorio_nombre_sede_key" ON "Consultorio"("nombre", "sede");

-- CreateIndex
CREATE UNIQUE INDEX "Seguro_nombre_key" ON "Seguro"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "EspecialistaModuloHCE_especialistaId_modulo_key" ON "EspecialistaModuloHCE"("especialistaId", "modulo");

-- CreateIndex
CREATE UNIQUE INDEX "ConsultaHCE_citaId_key" ON "ConsultaHCE"("citaId");
