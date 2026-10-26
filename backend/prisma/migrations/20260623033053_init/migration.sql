-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "ultimoAcceso" DATETIME,
    "creadoPorId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Usuario_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Administracion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "tipoIdentificacion" TEXT NOT NULL,
    "numeroIdentificacion" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "fotoUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Administracion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PermisosAdmin" (
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
    CONSTRAINT "PermisosAdmin_administracionId_fkey" FOREIGN KEY ("administracionId") REFERENCES "Administracion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Especialista" (
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
    "consultorio" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'HABILITADO',
    "fechaInicioSuspension" DATETIME,
    "fechaFinSuspension" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Especialista_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HorarioEspecialista" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "especialistaId" TEXT NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT NOT NULL,
    "duracionMinutos" INTEGER NOT NULL,
    "observaciones" TEXT,
    "esFeriado" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HorarioEspecialista_especialistaId_fkey" FOREIGN KEY ("especialistaId") REFERENCES "Especialista" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Paciente" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "tipoIdentificacion" TEXT NOT NULL,
    "numeroIdentificacion" TEXT NOT NULL,
    "genero" TEXT NOT NULL,
    "fechaNacimiento" DATETIME NOT NULL,
    "estadoCivil" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "telefonoSecundario" TEXT,
    "direccion" TEXT NOT NULL,
    "provincia" TEXT NOT NULL,
    "canton" TEXT NOT NULL,
    "parroquia" TEXT,
    "zona" TEXT NOT NULL,
    "grupoSanguineo" TEXT NOT NULL,
    "tipoSeguro" TEXT NOT NULL,
    "nombreConvenio" TEXT,
    "alergias" TEXT,
    "enfermedadesPreexistentes" TEXT,
    "emergenciaNombre" TEXT NOT NULL,
    "emergenciaTelefono" TEXT NOT NULL,
    "emergenciaParentesco" TEXT NOT NULL,
    "laboralEmpresa" TEXT,
    "laboralCargo" TEXT,
    "laboralDireccion" TEXT,
    "laboralTelefono" TEXT,
    "bloqueado" BOOLEAN NOT NULL DEFAULT false,
    "motivoBloqueo" TEXT,
    "bloqueadoPorId" TEXT,
    "fechaBloqueo" DATETIME,
    "fechaDesbloqueo" DATETIME,
    "especialidadesBloqueadas" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Paciente_bloqueadoPorId_fkey" FOREIGN KEY ("bloqueadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InasistenciaPorEspecialidad" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pacienteId" TEXT NOT NULL,
    "especialidad" TEXT NOT NULL,
    "contador" INTEGER NOT NULL DEFAULT 0,
    "ultimaInasistencia" DATETIME,
    "notificacionEnviada" BOOLEAN NOT NULL DEFAULT false,
    "ultimaNotificacionSeveridad" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InasistenciaPorEspecialidad_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Cita" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Cita_especialistaId_fkey" FOREIGN KEY ("especialistaId") REFERENCES "Especialista" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Cita_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Cita_citaOrigenId_fkey" FOREIGN KEY ("citaOrigenId") REFERENCES "Cita" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Cita_modificadaPorId_fkey" FOREIGN KEY ("modificadaPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Cita_citaReagendadaId_fkey" FOREIGN KEY ("citaReagendadaId") REFERENCES "Cita" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BloqueoGrupal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fechaInicio" DATETIME NOT NULL,
    "fechaFin" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BloqueoGrupalEspecialista" (
    "bloqueoGrupalId" TEXT NOT NULL,
    "especialistaId" TEXT NOT NULL,

    PRIMARY KEY ("bloqueoGrupalId", "especialistaId"),
    CONSTRAINT "BloqueoGrupalEspecialista_bloqueoGrupalId_fkey" FOREIGN KEY ("bloqueoGrupalId") REFERENCES "BloqueoGrupal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BloqueoGrupalEspecialista_especialistaId_fkey" FOREIGN KEY ("especialistaId") REFERENCES "Especialista" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Feriado" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fecha" DATETIME NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Auditoria" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidadId" TEXT,
    "detalle" TEXT,
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Administracion_usuarioId_key" ON "Administracion"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Administracion_numeroIdentificacion_key" ON "Administracion"("numeroIdentificacion");

-- CreateIndex
CREATE UNIQUE INDEX "PermisosAdmin_administracionId_key" ON "PermisosAdmin"("administracionId");

-- CreateIndex
CREATE UNIQUE INDEX "Especialista_usuarioId_key" ON "Especialista"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Especialista_numeroIdentificacion_key" ON "Especialista"("numeroIdentificacion");

-- CreateIndex
CREATE UNIQUE INDEX "Especialista_codigoMsp_key" ON "Especialista"("codigoMsp");

-- CreateIndex
CREATE UNIQUE INDEX "Especialista_emailInstitucional_key" ON "Especialista"("emailInstitucional");

-- CreateIndex
CREATE UNIQUE INDEX "Paciente_numeroIdentificacion_key" ON "Paciente"("numeroIdentificacion");

-- CreateIndex
CREATE UNIQUE INDEX "InasistenciaPorEspecialidad_pacienteId_especialidad_key" ON "InasistenciaPorEspecialidad"("pacienteId", "especialidad");

-- CreateIndex
CREATE UNIQUE INDEX "Cita_citaReagendadaId_key" ON "Cita"("citaReagendadaId");

-- CreateIndex
CREATE UNIQUE INDEX "Feriado_fecha_key" ON "Feriado"("fecha");
