-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "ultimoAcceso" TIMESTAMP(3),
    "creadoPorId" TEXT,
    "primerNombre" TEXT,
    "segundoNombre" TEXT,
    "primerApellido" TEXT,
    "segundoApellido" TEXT,
    "nombres" TEXT,
    "apellidos" TEXT,
    "numeroIdentificacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rol" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permiso" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "categoria" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permiso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolPermiso" (
    "rolId" TEXT NOT NULL,
    "permisoId" TEXT NOT NULL,

    CONSTRAINT "RolPermiso_pkey" PRIMARY KEY ("rolId","permisoId")
);

-- CreateTable
CREATE TABLE "UsuarioRol" (
    "usuarioId" TEXT NOT NULL,
    "rolId" TEXT NOT NULL,

    CONSTRAINT "UsuarioRol_pkey" PRIMARY KEY ("usuarioId","rolId")
);

-- CreateTable
CREATE TABLE "UsuarioPermiso" (
    "usuarioId" TEXT NOT NULL,
    "permisoId" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UsuarioPermiso_pkey" PRIMARY KEY ("usuarioId","permisoId")
);

-- CreateTable
CREATE TABLE "Sesion" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "refreshHash" TEXT NOT NULL,
    "ip" TEXT,
    "ua" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "Sesion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Administracion" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "primerNombre" TEXT,
    "segundoNombre" TEXT,
    "primerApellido" TEXT,
    "segundoApellido" TEXT,
    "tipoIdentificacion" TEXT NOT NULL,
    "numeroIdentificacion" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "fotoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Administracion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PermisosAdmin" (
    "id" TEXT NOT NULL,
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

    CONSTRAINT "PermisosAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Especialista" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "primerNombre" TEXT,
    "segundoNombre" TEXT,
    "primerApellido" TEXT,
    "segundoApellido" TEXT,
    "tipoIdentificacion" TEXT NOT NULL,
    "numeroIdentificacion" TEXT NOT NULL,
    "genero" TEXT NOT NULL,
    "fechaNacimiento" TIMESTAMP(3),
    "estadoCivil" TEXT,
    "fotoUrl" TEXT,
    "codigoMsp" TEXT,
    "especialidad" TEXT NOT NULL,
    "subEspecialidad" TEXT,
    "tituloProfesional" TEXT NOT NULL,
    "emailInstitucional" TEXT NOT NULL,
    "emailSecundario" TEXT,
    "emailPersonal" TEXT,
    "telefono" TEXT NOT NULL,
    "telefonoSecundario" TEXT,
    "direccion" TEXT NOT NULL,
    "sede" TEXT NOT NULL,
    "consultorioPredeterminado" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'HABILITADO',
    "fechaInicioSuspension" TIMESTAMP(3),
    "fechaFinSuspension" TIMESTAMP(3),
    "maxCitasPorHora" INTEGER NOT NULL DEFAULT 1,
    "tienePasantes" BOOLEAN NOT NULL DEFAULT false,
    "colorCalendario" TEXT,
    "codigoAlfabetico" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Especialista_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pasante" (
    "id" TEXT NOT NULL,
    "especialistaId" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "primerNombre" TEXT,
    "segundoNombre" TEXT,
    "primerApellido" TEXT,
    "segundoApellido" TEXT,
    "tipoIdentificacion" TEXT NOT NULL,
    "numeroIdentificacion" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pasante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HorarioEspecialista" (
    "id" TEXT NOT NULL,
    "especialistaId" TEXT NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT NOT NULL,
    "duracionMinutos" INTEGER NOT NULL,
    "observaciones" TEXT,
    "esFeriado" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HorarioEspecialista_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Paciente" (
    "id" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "primerNombre" TEXT,
    "segundoNombre" TEXT,
    "primerApellido" TEXT,
    "segundoApellido" TEXT,
    "tipoIdentificacion" TEXT NOT NULL,
    "numeroIdentificacion" TEXT NOT NULL,
    "genero" TEXT NOT NULL,
    "fechaNacimiento" TIMESTAMP(3) NOT NULL,
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
    "fechaBloqueo" TIMESTAMP(3),
    "fechaDesbloqueo" TIMESTAMP(3),
    "especialidadesBloqueadas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Paciente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InasistenciaPorEspecialidad" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "especialidad" TEXT NOT NULL,
    "contador" INTEGER NOT NULL DEFAULT 0,
    "ultimaInasistencia" TIMESTAMP(3),
    "notificacionEnviada" BOOLEAN NOT NULL DEFAULT false,
    "ultimaNotificacionSeveridad" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InasistenciaPorEspecialidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CitaModificacion" (
    "id" TEXT NOT NULL,
    "citaId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT NOT NULL,
    "notasModificacion" TEXT,
    "modificadaPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CitaModificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cita" (
    "id" TEXT NOT NULL,
    "especialistaId" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT NOT NULL,
    "duracionMinutos" INTEGER NOT NULL,
    "especialidad" TEXT NOT NULL,
    "lugar" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "tipo" TEXT,
    "protocoloId" TEXT,
    "notaAdmin" TEXT,
    "notaEspecialista" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "esRecurrente" BOOLEAN NOT NULL DEFAULT false,
    "recurrenciaDiaSemana" INTEGER,
    "recurrenciaFechaFin" TIMESTAMP(3),
    "recurrenciaDiasSemana" TEXT,
    "recurrenciaCantidad" INTEGER,
    "citaOrigenId" TEXT,
    "notasModificacion" TEXT,
    "fechaModificacion" TIMESTAMP(3),
    "modificadaPorId" TEXT,
    "whatsappEnviado" BOOLEAN NOT NULL DEFAULT false,
    "whatsappConfirmado" BOOLEAN NOT NULL DEFAULT false,
    "whatsappConfirmadoEn" TIMESTAMP(3),
    "notificacionEnviada5min" BOOLEAN NOT NULL DEFAULT false,
    "canceladaPor" TEXT,
    "motivoCancelacion" TEXT,
    "fechaCancelacion" TIMESTAMP(3),
    "slotLiberado" BOOLEAN NOT NULL DEFAULT false,
    "citaReagendadaId" TEXT,
    "atendidaPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BloqueoGrupal" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BloqueoGrupal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BloqueoGrupalEspecialista" (
    "bloqueoGrupalId" TEXT NOT NULL,
    "especialistaId" TEXT NOT NULL,

    CONSTRAINT "BloqueoGrupalEspecialista_pkey" PRIMARY KEY ("bloqueoGrupalId","especialistaId")
);

-- CreateTable
CREATE TABLE "Especialidad" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Especialidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sede" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sede_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consultorio" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "sede" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consultorio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feriado" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feriado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Auditoria" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidadId" TEXT,
    "detalle" TEXT,
    "motivo" TEXT,
    "antes" TEXT,
    "despues" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncedChange" (
    "id" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidadId" TEXT NOT NULL,
    "operacion" TEXT NOT NULL,
    "datos" TEXT NOT NULL,
    "syncedAt" TIMESTAMP(3),
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncedChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Antecedente" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fecha" TIMESTAMP(3),
    "categoria" TEXT,
    "fechaDiagnostico" TIMESTAMP(3),
    "resuelto" BOOLEAN NOT NULL DEFAULT false,
    "observacion" TEXT,
    "ambito" TEXT NOT NULL DEFAULT 'PERSONAL',
    "parentesco" TEXT,
    "registradoPorId" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "supersededById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "Antecedente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignoVital" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "consultaId" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "presionArterial" TEXT,
    "frecuenciaCardiaca" INTEGER,
    "temperatura" DOUBLE PRECISION,
    "saturacionOxigeno" DOUBLE PRECISION,
    "peso" DOUBLE PRECISION,
    "talla" DOUBLE PRECISION,
    "imc" DOUBLE PRECISION,
    "dolorEVA" INTEGER,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SignoVital_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamenComplementario" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "consultaId" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "resultado" TEXT,
    "archivoUrl" TEXT,
    "fase" TEXT,
    "tipoDocumento" TEXT,
    "mimeType" TEXT,
    "storageKey" TEXT,
    "hashArchivo" TEXT,
    "checksum" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamenComplementario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Seguro" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "telefono" TEXT,
    "direccion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Seguro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EspecialidadModuloHCE" (
    "id" TEXT NOT NULL,
    "especialidad" TEXT NOT NULL,
    "modulo" TEXT NOT NULL,
    "habilitado" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EspecialidadModuloHCE_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultaHCE" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "citaId" TEXT,
    "especialistaId" TEXT NOT NULL,
    "tipoConsulta" TEXT,
    "formaConsulta" TEXT,
    "tipoAtencion" TEXT,
    "condicionConsulta" TEXT,
    "motivoConsulta" TEXT,
    "enfermedadActual" TEXT,
    "tiempoEvolucion" TEXT,
    "tratamientosPrevios" TEXT,
    "efEstadoGeneral" TEXT DEFAULT 'NO_EVALUADO',
    "efObsGeneral" TEXT,
    "efCardiovascular" TEXT DEFAULT 'NO_EVALUADO',
    "efObsCardio" TEXT,
    "efRespiratorio" TEXT DEFAULT 'NO_EVALUADO',
    "efObsResp" TEXT,
    "efAbdomen" TEXT DEFAULT 'NO_EVALUADO',
    "efObsAbdomen" TEXT,
    "efNeurologico" TEXT DEFAULT 'NO_EVALUADO',
    "efObsNeuro" TEXT,
    "efExtremidades" TEXT DEFAULT 'NO_EVALUADO',
    "efObsExtrem" TEXT,
    "efPiel" TEXT DEFAULT 'NO_EVALUADO',
    "efObsPiel" TEXT,
    "efCabezaCuello" TEXT DEFAULT 'NO_EVALUADO',
    "efObsCabeza" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firmada" BOOLEAN NOT NULL DEFAULT false,
    "firmadaEn" TIMESTAMP(3),
    "archivoPdfUrl" TEXT,
    "numeroConsulta" INTEGER,
    "observacionesCertificado" TEXT,

    CONSTRAINT "ConsultaHCE_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Diagnostico" (
    "id" TEXT NOT NULL,
    "consultaId" TEXT NOT NULL,
    "codigoCIE10" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'PRINCIPAL',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "accesoPortal" BOOLEAN,
    "observacion" TEXT,
    "esPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "sistema" TEXT NOT NULL DEFAULT 'CIE10',
    "codigo" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'DEFINITIVO',
    "confirmadoPorId" TEXT,
    "confirmadoEn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Diagnostico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prescripcion" (
    "id" TEXT NOT NULL,
    "consultaId" TEXT NOT NULL,
    "medicamento" TEXT NOT NULL,
    "dosis" TEXT NOT NULL,
    "via" TEXT,
    "frecuencia" TEXT NOT NULL,
    "duracion" TEXT,
    "indicaciones" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVA',
    "fechaInicio" TIMESTAMP(3),
    "fechaFin" TIMESTAMP(3),
    "esCronica" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prescripcion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evolucion" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "consultaId" TEXT,
    "especialistaId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'SOAP',
    "nota" TEXT,
    "subjetivo" TEXT,
    "objetivo" TEXT,
    "analisis" TEXT,
    "plan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evolucion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PedidoExamen" (
    "id" TEXT NOT NULL,
    "consultaId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "urgente" BOOLEAN NOT NULL DEFAULT false,
    "resultadoUrl" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PedidoExamen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vacuna" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "dosis" TEXT,
    "lote" TEXT,
    "aplicadoPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vacuna_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consentimiento" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "consultaId" TEXT,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "archivoUrl" TEXT,
    "firmado" BOOLEAN NOT NULL DEFAULT false,
    "fechaFirma" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Consentimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "family" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "replacedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HceFormConfig" (
    "id" TEXT NOT NULL,
    "especialidad" TEXT,
    "especialistaId" TEXT,
    "formName" TEXT NOT NULL,
    "config" TEXT NOT NULL,
    "habilitado" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HceFormConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateHCE" (
    "id" TEXT NOT NULL,
    "especialidad" TEXT NOT NULL,
    "formName" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TemplateHCE_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamenMental" (
    "id" TEXT NOT NULL,
    "consultaId" TEXT NOT NULL,
    "descripcionGeneral" TEXT,
    "conciencia" TEXT,
    "memoria" TEXT,
    "sensacionPercepcion" TEXT,
    "afectividad" TEXT,
    "funcionesConativas" TEXT,
    "juicioInsight" TEXT,
    "atencionConcentracion" TEXT,
    "orientacion" TEXT,
    "pensamiento" TEXT,
    "lenguaje" TEXT,
    "funcionesRelacionales" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamenMental_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoriaFamiliar" (
    "id" TEXT NOT NULL,
    "consultaId" TEXT NOT NULL,
    "edadEstadoSaludFamiliares" TEXT,
    "logrosEducativos" TEXT,
    "logrosOcupacionales" TEXT,
    "historialPerdidaVisualAuditiva" TEXT,
    "historialPsiquiatricoFamiliar" TEXT,
    "historialMedicoNeurologico" TEXT,
    "trasfondoCultural" TEXT,
    "estructuraDinamicaFamiliar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistoriaFamiliar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluacionNeuroconductual" (
    "id" TEXT NOT NULL,
    "consultaId" TEXT NOT NULL,
    "examen" TEXT,
    "funcionMotora" TEXT,
    "juicioInsight" TEXT,
    "aprendizajeMemoria" TEXT,
    "conciencia" TEXT,
    "lenguaje" TEXT,
    "visionEspacialConstruccional" TEXT,
    "atencionMemoriaTrabajo" TEXT,
    "habilidadesAritmeticas" TEXT,
    "abstraccionRazonamiento" TEXT,
    "afectividad" TEXT,
    "percepcionPensamiento" TEXT,
    "descripcionGeneral" TEXT,
    "orientacion" TEXT,
    "funcionesCognitivasRelacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvaluacionNeuroconductual_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluacionNeuropsicometrica" (
    "id" TEXT NOT NULL,
    "consultaId" TEXT NOT NULL,
    "alerta" TEXT,
    "funcionesMotoras" TEXT,
    "orientacion" TEXT,
    "atencionConcentracion" TEXT,
    "memoria" TEXT,
    "lenguaje" TEXT,
    "lectura" TEXT,
    "escritura" TEXT,
    "calculo" TEXT,
    "habilidadesMotorasComplejas" TEXT,
    "habilidadesVisoperceptuales" TEXT,
    "problemasAfectivos" TEXT,
    "otrasValoraciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvaluacionNeuropsicometrica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscusionDiagnostica" (
    "id" TEXT NOT NULL,
    "consultaId" TEXT NOT NULL,
    "diagnosticoClinico" TEXT,
    "discusionGeneral" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscusionDiagnostica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanTratamientoNeuropsi" (
    "id" TEXT NOT NULL,
    "consultaId" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "especialistaId" TEXT NOT NULL,
    "numeroCitas" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'BORRADOR',
    "motivoExtension" TEXT,
    "citasExtension" INTEGER,
    "extensionUsada" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanTratamientoNeuropsi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObjetivoTratamiento" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "descripcion" TEXT NOT NULL,
    "escalaMas2" TEXT,
    "escalaMas1" TEXT,
    "escalaCero" TEXT,
    "escalaMenos1" TEXT,
    "escalaMenos2" TEXT,
    "obsMas2" TEXT,
    "obsMas1" TEXT,
    "obsCero" TEXT,
    "obsMenos1" TEXT,
    "obsMenos2" TEXT,
    "observacion" TEXT,
    "resultadoFinal" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ObjetivoTratamiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptometriaInforme" (
    "id" TEXT NOT NULL,
    "consultaId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'INTEGRAL',
    "procedencia" TEXT,
    "hcNumero" TEXT,
    "rxUsoOd" TEXT,
    "rxUsoOdAv" TEXT,
    "rxUsoOdAdd" TEXT,
    "rxUsoOdAvVp" TEXT,
    "rxUsoOdObs" TEXT,
    "rxUsoOi" TEXT,
    "rxUsoOiAv" TEXT,
    "rxUsoOiAdd" TEXT,
    "rxUsoOiAvVp" TEXT,
    "rxUsoOiObs" TEXT,
    "rxUsoAo" TEXT,
    "rxUsoAoAv" TEXT,
    "rxUsoAoAdd" TEXT,
    "rxUsoAoAvVp" TEXT,
    "rxUsoAoObs" TEXT,
    "tipoLente" TEXT,
    "avOptotipo" TEXT,
    "avOdVl" TEXT,
    "avOdPh" TEXT,
    "avOdVp" TEXT,
    "avOdObs" TEXT,
    "avOiVl" TEXT,
    "avOiPh" TEXT,
    "avOiVp" TEXT,
    "avOiObs" TEXT,
    "avAoVl" TEXT,
    "avAoPh" TEXT,
    "avAoVp" TEXT,
    "avAoObs" TEXT,
    "rxFinalOd" TEXT,
    "rxFinalOdAvVl" TEXT,
    "rxFinalOdAdd" TEXT,
    "rxFinalOdAvVp" TEXT,
    "rxFinalOdDnp" TEXT,
    "rxFinalOdAlt" TEXT,
    "rxFinalOi" TEXT,
    "rxFinalOiAvVl" TEXT,
    "rxFinalOiAdd" TEXT,
    "rxFinalOiAvVp" TEXT,
    "rxFinalOiDnp" TEXT,
    "rxFinalOiAlt" TEXT,
    "rxFinalAo" TEXT,
    "rxFinalAoAvVl" TEXT,
    "rxFinalAoAdd" TEXT,
    "rxFinalAoAvVp" TEXT,
    "rxFinalAoDnp" TEXT,
    "rxFinalAoAlt" TEXT,
    "motorVlTecnica" TEXT,
    "motorVlPpc" TEXT,
    "motorVlOr" TEXT,
    "motorVlLuz" TEXT,
    "motorVlVersiones" TEXT,
    "motorVpTecnica" TEXT,
    "motorVpPpc" TEXT,
    "motorVpOr" TEXT,
    "motorVpLuz" TEXT,
    "motorVpVersiones" TEXT,
    "sentVlWorth" TEXT,
    "sentVlBaseSup" TEXT,
    "sentVlFusionRojo" TEXT,
    "sentVpWorth" TEXT,
    "sentVpBaseSup" TEXT,
    "sentVpFusionRojo" TEXT,
    "extPestanasOd" TEXT,
    "extPestanasOi" TEXT,
    "extParpadosOd" TEXT,
    "extParpadosOi" TEXT,
    "extConjuntivaOd" TEXT,
    "extConjuntivaOi" TEXT,
    "extCorneaOd" TEXT,
    "extCorneaOi" TEXT,
    "extEscleroticaOd" TEXT,
    "extEscleroticaOi" TEXT,
    "extIrisOd" TEXT,
    "extIrisOi" TEXT,
    "extCristalinoOd" TEXT,
    "extCristalinoOi" TEXT,
    "extPeliculaLacrimalOd" TEXT,
    "extPeliculaLacrimalOi" TEXT,
    "extPioOd" TEXT,
    "extPioOi" TEXT,
    "extPupilaOd" TEXT,
    "extPupilaOi" TEXT,
    "extPestanas" TEXT,
    "extParpados" TEXT,
    "extConjuntiva" TEXT,
    "extCornea" TEXT,
    "extEsclerotica" TEXT,
    "extIris" TEXT,
    "extCristalino" TEXT,
    "extPeliculaLacrimal" TEXT,
    "extPio" TEXT,
    "extPupila" TEXT,
    "reflFotomotor" TEXT,
    "reflConsensual" TEXT,
    "oftOd" TEXT,
    "oftOi" TEXT,
    "colorOd" TEXT,
    "colorOi" TEXT,
    "cvOd" TEXT,
    "cvOi" TEXT,
    "cvObs" TEXT,
    "diagnosticoAO" TEXT,
    "tratamiento" TEXT,
    "recomendaciones" TEXT,
    "evaluacion" TEXT,
    "observacion" TEXT,
    "disposicion" TEXT,
    "notasAdicionales" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OptometriaInforme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alergia" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'MEDICAMENTO',
    "descripcion" TEXT NOT NULL,
    "gravedad" TEXT NOT NULL DEFAULT 'LEVE',
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alergia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Habito" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'TABACO',
    "afirmativo" BOOLEAN NOT NULL DEFAULT false,
    "cantidad" TEXT,
    "desde" TEXT,
    "observacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Habito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProblemaActivo" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProblemaActivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertaManual" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'RIESGO_SUICIDA',
    "mensaje" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creadaPorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertaManual_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Indicacion" (
    "id" TEXT NOT NULL,
    "consultaId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Indicacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultaVersion" (
    "id" TEXT NOT NULL,
    "consultaId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" TEXT NOT NULL,
    "diff" TEXT,
    "usuarioId" TEXT NOT NULL,
    "motivoCambio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsultaVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditoriaHC" (
    "id" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidadId" TEXT NOT NULL,
    "consultaId" TEXT,
    "usuarioId" TEXT NOT NULL,
    "accion" TEXT NOT NULL DEFAULT 'VISUALIZAR',
    "modulo" TEXT,
    "valorAnterior" TEXT,
    "valorNuevo" TEXT,
    "ip" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditoriaHC_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Firma" (
    "id" TEXT NOT NULL,
    "consultaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'FIRMA',
    "fechaFirma" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hashDocumento" TEXT,
    "algoritmoHash" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Firma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlantillaHCE" (
    "id" TEXT NOT NULL,
    "especialidadId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlantillaHCE_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlantillaSeccion" (
    "id" TEXT NOT NULL,
    "plantillaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PlantillaSeccion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlantillaCampo" (
    "id" TEXT NOT NULL,
    "seccionId" TEXT NOT NULL,
    "campo" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "obligatorio" BOOLEAN NOT NULL DEFAULT false,
    "soloLectura" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PlantillaCampo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosticoFrecuente" (
    "id" TEXT NOT NULL,
    "especialistaId" TEXT,
    "especialidadId" TEXT,
    "codigoCIE10" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "contador" INTEGER NOT NULL DEFAULT 1,
    "ultimoUso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiagnosticoFrecuente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiaBloqueado" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "motivo" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiaBloqueado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditoriaHCRevision" (
    "id" TEXT NOT NULL,
    "consultaId" TEXT NOT NULL,
    "auditorId" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "observacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditoriaHCRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notificacion" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "refId" TEXT,
    "refTipo" TEXT,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Receta" (
    "id" TEXT NOT NULL,
    "consultaId" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "especialistaId" TEXT NOT NULL,
    "numeroReceta" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "indicaciones" TEXT,
    "estadoEnfermedad" TEXT,
    "diagnostico" TEXT,
    "signosAlarma" TEXT,
    "recomendacionesNoFarmacologicas" TEXT,
    "peso" TEXT,
    "talla" TEXT,
    "alergias" TEXT,
    "validezDias" INTEGER DEFAULT 3,
    "firmada" BOOLEAN NOT NULL DEFAULT false,
    "firmadaEn" TIMESTAMP(3),
    "archivoPdfUrl" TEXT,
    "hashDocumento" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Receta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecetaItem" (
    "id" TEXT NOT NULL,
    "recetaId" TEXT NOT NULL,
    "medicamento" TEXT NOT NULL,
    "presentacion" TEXT,
    "formaFarmaceutica" TEXT,
    "concentracion" TEXT,
    "dosis" TEXT,
    "via" TEXT,
    "frecuencia" TEXT,
    "duracion" TEXT,
    "cantidad" TEXT,
    "cantidadLetras" TEXT,
    "indicaciones" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RecetaItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CertificadoMedico" (
    "id" TEXT NOT NULL,
    "consultaId" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "especialistaId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "motivo" TEXT,
    "observaciones" TEXT,
    "diasReposo" INTEGER,
    "fechaInicio" TIMESTAMP(3),
    "fechaFin" TIMESTAMP(3),
    "hashDocumento" TEXT,
    "archivoPdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CertificadoMedico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AltaEspecialidad" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "especialidad" TEXT NOT NULL,
    "especialistaId" TEXT,
    "usuarioId" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "observacion" TEXT,
    "citasCanceladas" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AltaEspecialidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Derivacion" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "consultaId" TEXT,
    "especialistaOrigenId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "prioridad" TEXT NOT NULL DEFAULT 'MEDIA',
    "observacion" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Derivacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DerivacionDestino" (
    "id" TEXT NOT NULL,
    "derivacionId" TEXT NOT NULL,
    "especialistaId" TEXT NOT NULL,
    "especialidad" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "citaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DerivacionDestino_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HcePrivacidadConfig" (
    "id" TEXT NOT NULL,
    "especialidad" TEXT NOT NULL,
    "compartirDiagnosticos" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HcePrivacidadConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Rol_clave_key" ON "Rol"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "Permiso_clave_key" ON "Permiso"("clave");

-- CreateIndex
CREATE INDEX "Sesion_usuarioId_idx" ON "Sesion"("usuarioId");

-- CreateIndex
CREATE INDEX "Sesion_refreshHash_idx" ON "Sesion"("refreshHash");

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
CREATE UNIQUE INDEX "Especialista_emailInstitucional_key" ON "Especialista"("emailInstitucional");

-- CreateIndex
CREATE UNIQUE INDEX "Paciente_numeroIdentificacion_key" ON "Paciente"("numeroIdentificacion");

-- CreateIndex
CREATE UNIQUE INDEX "InasistenciaPorEspecialidad_pacienteId_especialidad_key" ON "InasistenciaPorEspecialidad"("pacienteId", "especialidad");

-- CreateIndex
CREATE UNIQUE INDEX "Cita_citaReagendadaId_key" ON "Cita"("citaReagendadaId");

-- CreateIndex
CREATE INDEX "Cita_fecha_idx" ON "Cita"("fecha");

-- CreateIndex
CREATE INDEX "Cita_pacienteId_idx" ON "Cita"("pacienteId");

-- CreateIndex
CREATE INDEX "Cita_especialistaId_idx" ON "Cita"("especialistaId");

-- CreateIndex
CREATE INDEX "Cita_estado_idx" ON "Cita"("estado");

-- CreateIndex
CREATE INDEX "Cita_especialistaId_fecha_idx" ON "Cita"("especialistaId", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "Cita_especialistaId_fecha_horaInicio_atendidaPorId_key" ON "Cita"("especialistaId", "fecha", "horaInicio", "atendidaPorId");

-- CreateIndex
CREATE UNIQUE INDEX "Especialidad_nombre_key" ON "Especialidad"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Sede_nombre_key" ON "Sede"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Consultorio_nombre_sede_key" ON "Consultorio"("nombre", "sede");

-- CreateIndex
CREATE UNIQUE INDEX "Feriado_fecha_key" ON "Feriado"("fecha");

-- CreateIndex
CREATE INDEX "Auditoria_entidad_entidadId_idx" ON "Auditoria"("entidad", "entidadId");

-- CreateIndex
CREATE INDEX "Auditoria_usuarioId_idx" ON "Auditoria"("usuarioId");

-- CreateIndex
CREATE INDEX "Auditoria_accion_idx" ON "Auditoria"("accion");

-- CreateIndex
CREATE INDEX "Auditoria_createdAt_idx" ON "Auditoria"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "Antecedente_pacienteId_categoria_idx" ON "Antecedente"("pacienteId", "categoria");

-- CreateIndex
CREATE INDEX "Antecedente_pacienteId_ambito_activo_idx" ON "Antecedente"("pacienteId", "ambito", "activo");

-- CreateIndex
CREATE INDEX "SignoVital_pacienteId_fecha_idx" ON "SignoVital"("pacienteId", "fecha" DESC);

-- CreateIndex
CREATE INDEX "SignoVital_consultaId_idx" ON "SignoVital"("consultaId");

-- CreateIndex
CREATE INDEX "ExamenComplementario_pacienteId_idx" ON "ExamenComplementario"("pacienteId");

-- CreateIndex
CREATE INDEX "ExamenComplementario_consultaId_idx" ON "ExamenComplementario"("consultaId");

-- CreateIndex
CREATE UNIQUE INDEX "Seguro_nombre_key" ON "Seguro"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "EspecialidadModuloHCE_especialidad_modulo_key" ON "EspecialidadModuloHCE"("especialidad", "modulo");

-- CreateIndex
CREATE UNIQUE INDEX "ConsultaHCE_citaId_key" ON "ConsultaHCE"("citaId");

-- CreateIndex
CREATE INDEX "ConsultaHCE_pacienteId_createdAt_idx" ON "ConsultaHCE"("pacienteId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ConsultaHCE_especialistaId_createdAt_idx" ON "ConsultaHCE"("especialistaId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ConsultaHCE_pacienteId_especialistaId_numeroConsulta_idx" ON "ConsultaHCE"("pacienteId", "especialistaId", "numeroConsulta");

-- CreateIndex
CREATE INDEX "Diagnostico_consultaId_estado_idx" ON "Diagnostico"("consultaId", "estado");

-- CreateIndex
CREATE INDEX "Prescripcion_consultaId_estado_idx" ON "Prescripcion"("consultaId", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_replacedById_key" ON "RefreshToken"("replacedById");

-- CreateIndex
CREATE INDEX "RefreshToken_usuarioId_family_idx" ON "RefreshToken"("usuarioId", "family");

-- CreateIndex
CREATE INDEX "RefreshToken_tokenHash_idx" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "HceFormConfig_especialidad_formName_key" ON "HceFormConfig"("especialidad", "formName");

-- CreateIndex
CREATE UNIQUE INDEX "HceFormConfig_especialistaId_formName_key" ON "HceFormConfig"("especialistaId", "formName");

-- CreateIndex
CREATE UNIQUE INDEX "ExamenMental_consultaId_key" ON "ExamenMental"("consultaId");

-- CreateIndex
CREATE UNIQUE INDEX "HistoriaFamiliar_consultaId_key" ON "HistoriaFamiliar"("consultaId");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluacionNeuroconductual_consultaId_key" ON "EvaluacionNeuroconductual"("consultaId");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluacionNeuropsicometrica_consultaId_key" ON "EvaluacionNeuropsicometrica"("consultaId");

-- CreateIndex
CREATE UNIQUE INDEX "DiscusionDiagnostica_consultaId_key" ON "DiscusionDiagnostica"("consultaId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanTratamientoNeuropsi_consultaId_key" ON "PlanTratamientoNeuropsi"("consultaId");

-- CreateIndex
CREATE INDEX "PlanTratamientoNeuropsi_pacienteId_idx" ON "PlanTratamientoNeuropsi"("pacienteId");

-- CreateIndex
CREATE INDEX "PlanTratamientoNeuropsi_especialistaId_idx" ON "PlanTratamientoNeuropsi"("especialistaId");

-- CreateIndex
CREATE UNIQUE INDEX "ObjetivoTratamiento_planId_numero_key" ON "ObjetivoTratamiento"("planId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "OptometriaInforme_consultaId_key" ON "OptometriaInforme"("consultaId");

-- CreateIndex
CREATE INDEX "Alergia_pacienteId_activa_idx" ON "Alergia"("pacienteId", "activa");

-- CreateIndex
CREATE INDEX "Habito_pacienteId_idx" ON "Habito"("pacienteId");

-- CreateIndex
CREATE INDEX "ProblemaActivo_pacienteId_estado_idx" ON "ProblemaActivo"("pacienteId", "estado");

-- CreateIndex
CREATE INDEX "AlertaManual_pacienteId_idx" ON "AlertaManual"("pacienteId");

-- CreateIndex
CREATE INDEX "Indicacion_consultaId_idx" ON "Indicacion"("consultaId");

-- CreateIndex
CREATE INDEX "ConsultaVersion_consultaId_idx" ON "ConsultaVersion"("consultaId");

-- CreateIndex
CREATE UNIQUE INDEX "ConsultaVersion_consultaId_version_key" ON "ConsultaVersion"("consultaId", "version");

-- CreateIndex
CREATE INDEX "AuditoriaHC_entidad_entidadId_createdAt_idx" ON "AuditoriaHC"("entidad", "entidadId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditoriaHC_consultaId_idx" ON "AuditoriaHC"("consultaId");

-- CreateIndex
CREATE INDEX "AuditoriaHC_usuarioId_createdAt_idx" ON "AuditoriaHC"("usuarioId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditoriaHC_createdAt_idx" ON "AuditoriaHC"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "Firma_consultaId_idx" ON "Firma"("consultaId");

-- CreateIndex
CREATE UNIQUE INDEX "PlantillaHCE_especialidadId_nombre_key" ON "PlantillaHCE"("especialidadId", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "PlantillaSeccion_plantillaId_nombre_key" ON "PlantillaSeccion"("plantillaId", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "DiagnosticoFrecuente_especialistaId_codigoCIE10_key" ON "DiagnosticoFrecuente"("especialistaId", "codigoCIE10");

-- CreateIndex
CREATE UNIQUE INDEX "DiagnosticoFrecuente_especialidadId_codigoCIE10_key" ON "DiagnosticoFrecuente"("especialidadId", "codigoCIE10");

-- CreateIndex
CREATE UNIQUE INDEX "DiaBloqueado_fecha_key" ON "DiaBloqueado"("fecha");

-- CreateIndex
CREATE INDEX "AuditoriaHCRevision_consultaId_idx" ON "AuditoriaHCRevision"("consultaId");

-- CreateIndex
CREATE INDEX "AuditoriaHCRevision_auditorId_idx" ON "AuditoriaHCRevision"("auditorId");

-- CreateIndex
CREATE INDEX "AuditoriaHCRevision_createdAt_idx" ON "AuditoriaHCRevision"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "Notificacion_usuarioId_leida_createdAt_idx" ON "Notificacion"("usuarioId", "leida", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Receta_pacienteId_fecha_idx" ON "Receta"("pacienteId", "fecha" DESC);

-- CreateIndex
CREATE INDEX "Receta_consultaId_idx" ON "Receta"("consultaId");

-- CreateIndex
CREATE INDEX "Receta_especialistaId_numeroReceta_idx" ON "Receta"("especialistaId", "numeroReceta");

-- CreateIndex
CREATE INDEX "RecetaItem_recetaId_idx" ON "RecetaItem"("recetaId");

-- CreateIndex
CREATE INDEX "CertificadoMedico_pacienteId_createdAt_idx" ON "CertificadoMedico"("pacienteId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "CertificadoMedico_consultaId_idx" ON "CertificadoMedico"("consultaId");

-- CreateIndex
CREATE INDEX "AltaEspecialidad_pacienteId_especialidad_createdAt_idx" ON "AltaEspecialidad"("pacienteId", "especialidad", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Derivacion_pacienteId_createdAt_idx" ON "Derivacion"("pacienteId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Derivacion_estado_idx" ON "Derivacion"("estado");

-- CreateIndex
CREATE INDEX "DerivacionDestino_especialistaId_estado_idx" ON "DerivacionDestino"("especialistaId", "estado");

-- CreateIndex
CREATE INDEX "DerivacionDestino_derivacionId_idx" ON "DerivacionDestino"("derivacionId");

-- CreateIndex
CREATE UNIQUE INDEX "HcePrivacidadConfig_especialidad_key" ON "HcePrivacidadConfig"("especialidad");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolPermiso" ADD CONSTRAINT "RolPermiso_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "Rol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolPermiso" ADD CONSTRAINT "RolPermiso_permisoId_fkey" FOREIGN KEY ("permisoId") REFERENCES "Permiso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioRol" ADD CONSTRAINT "UsuarioRol_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioRol" ADD CONSTRAINT "UsuarioRol_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "Rol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioPermiso" ADD CONSTRAINT "UsuarioPermiso_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioPermiso" ADD CONSTRAINT "UsuarioPermiso_permisoId_fkey" FOREIGN KEY ("permisoId") REFERENCES "Permiso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sesion" ADD CONSTRAINT "Sesion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Administracion" ADD CONSTRAINT "Administracion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermisosAdmin" ADD CONSTRAINT "PermisosAdmin_administracionId_fkey" FOREIGN KEY ("administracionId") REFERENCES "Administracion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Especialista" ADD CONSTRAINT "Especialista_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Especialista" ADD CONSTRAINT "Especialista_especialidad_fkey" FOREIGN KEY ("especialidad") REFERENCES "Especialidad"("nombre") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Especialista" ADD CONSTRAINT "Especialista_sede_fkey" FOREIGN KEY ("sede") REFERENCES "Sede"("nombre") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Especialista" ADD CONSTRAINT "Especialista_consultorioPredeterminado_sede_fkey" FOREIGN KEY ("consultorioPredeterminado", "sede") REFERENCES "Consultorio"("nombre", "sede") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pasante" ADD CONSTRAINT "Pasante_especialistaId_fkey" FOREIGN KEY ("especialistaId") REFERENCES "Especialista"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HorarioEspecialista" ADD CONSTRAINT "HorarioEspecialista_especialistaId_fkey" FOREIGN KEY ("especialistaId") REFERENCES "Especialista"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paciente" ADD CONSTRAINT "Paciente_bloqueadoPorId_fkey" FOREIGN KEY ("bloqueadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InasistenciaPorEspecialidad" ADD CONSTRAINT "InasistenciaPorEspecialidad_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CitaModificacion" ADD CONSTRAINT "CitaModificacion_citaId_fkey" FOREIGN KEY ("citaId") REFERENCES "Cita"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CitaModificacion" ADD CONSTRAINT "CitaModificacion_modificadaPorId_fkey" FOREIGN KEY ("modificadaPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cita" ADD CONSTRAINT "Cita_especialistaId_fkey" FOREIGN KEY ("especialistaId") REFERENCES "Especialista"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cita" ADD CONSTRAINT "Cita_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cita" ADD CONSTRAINT "Cita_especialidad_fkey" FOREIGN KEY ("especialidad") REFERENCES "Especialidad"("nombre") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cita" ADD CONSTRAINT "Cita_citaOrigenId_fkey" FOREIGN KEY ("citaOrigenId") REFERENCES "Cita"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cita" ADD CONSTRAINT "Cita_modificadaPorId_fkey" FOREIGN KEY ("modificadaPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cita" ADD CONSTRAINT "Cita_citaReagendadaId_fkey" FOREIGN KEY ("citaReagendadaId") REFERENCES "Cita"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cita" ADD CONSTRAINT "Cita_atendidaPorId_fkey" FOREIGN KEY ("atendidaPorId") REFERENCES "Pasante"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloqueoGrupalEspecialista" ADD CONSTRAINT "BloqueoGrupalEspecialista_bloqueoGrupalId_fkey" FOREIGN KEY ("bloqueoGrupalId") REFERENCES "BloqueoGrupal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloqueoGrupalEspecialista" ADD CONSTRAINT "BloqueoGrupalEspecialista_especialistaId_fkey" FOREIGN KEY ("especialistaId") REFERENCES "Especialista"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultorio" ADD CONSTRAINT "Consultorio_sede_fkey" FOREIGN KEY ("sede") REFERENCES "Sede"("nombre") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auditoria" ADD CONSTRAINT "Auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Antecedente" ADD CONSTRAINT "Antecedente_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignoVital" ADD CONSTRAINT "SignoVital_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignoVital" ADD CONSTRAINT "SignoVital_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "ConsultaHCE"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamenComplementario" ADD CONSTRAINT "ExamenComplementario_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamenComplementario" ADD CONSTRAINT "ExamenComplementario_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "ConsultaHCE"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultaHCE" ADD CONSTRAINT "ConsultaHCE_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultaHCE" ADD CONSTRAINT "ConsultaHCE_citaId_fkey" FOREIGN KEY ("citaId") REFERENCES "Cita"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultaHCE" ADD CONSTRAINT "ConsultaHCE_especialistaId_fkey" FOREIGN KEY ("especialistaId") REFERENCES "Especialista"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Diagnostico" ADD CONSTRAINT "Diagnostico_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "ConsultaHCE"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescripcion" ADD CONSTRAINT "Prescripcion_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "ConsultaHCE"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evolucion" ADD CONSTRAINT "Evolucion_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evolucion" ADD CONSTRAINT "Evolucion_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "ConsultaHCE"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evolucion" ADD CONSTRAINT "Evolucion_especialistaId_fkey" FOREIGN KEY ("especialistaId") REFERENCES "Especialista"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoExamen" ADD CONSTRAINT "PedidoExamen_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "ConsultaHCE"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vacuna" ADD CONSTRAINT "Vacuna_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consentimiento" ADD CONSTRAINT "Consentimiento_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consentimiento" ADD CONSTRAINT "Consentimiento_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "ConsultaHCE"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_replacedById_fkey" FOREIGN KEY ("replacedById") REFERENCES "RefreshToken"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamenMental" ADD CONSTRAINT "ExamenMental_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "ConsultaHCE"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoriaFamiliar" ADD CONSTRAINT "HistoriaFamiliar_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "ConsultaHCE"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluacionNeuroconductual" ADD CONSTRAINT "EvaluacionNeuroconductual_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "ConsultaHCE"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluacionNeuropsicometrica" ADD CONSTRAINT "EvaluacionNeuropsicometrica_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "ConsultaHCE"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscusionDiagnostica" ADD CONSTRAINT "DiscusionDiagnostica_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "ConsultaHCE"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanTratamientoNeuropsi" ADD CONSTRAINT "PlanTratamientoNeuropsi_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "ConsultaHCE"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObjetivoTratamiento" ADD CONSTRAINT "ObjetivoTratamiento_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PlanTratamientoNeuropsi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptometriaInforme" ADD CONSTRAINT "OptometriaInforme_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "ConsultaHCE"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alergia" ADD CONSTRAINT "Alergia_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Habito" ADD CONSTRAINT "Habito_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemaActivo" ADD CONSTRAINT "ProblemaActivo_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertaManual" ADD CONSTRAINT "AlertaManual_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertaManual" ADD CONSTRAINT "AlertaManual_creadaPorId_fkey" FOREIGN KEY ("creadaPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Indicacion" ADD CONSTRAINT "Indicacion_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "ConsultaHCE"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultaVersion" ADD CONSTRAINT "ConsultaVersion_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "ConsultaHCE"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Firma" ADD CONSTRAINT "Firma_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "ConsultaHCE"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantillaHCE" ADD CONSTRAINT "PlantillaHCE_especialidadId_fkey" FOREIGN KEY ("especialidadId") REFERENCES "Especialidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantillaSeccion" ADD CONSTRAINT "PlantillaSeccion_plantillaId_fkey" FOREIGN KEY ("plantillaId") REFERENCES "PlantillaHCE"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantillaCampo" ADD CONSTRAINT "PlantillaCampo_seccionId_fkey" FOREIGN KEY ("seccionId") REFERENCES "PlantillaSeccion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditoriaHCRevision" ADD CONSTRAINT "AuditoriaHCRevision_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "ConsultaHCE"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditoriaHCRevision" ADD CONSTRAINT "AuditoriaHCRevision_auditorId_fkey" FOREIGN KEY ("auditorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receta" ADD CONSTRAINT "Receta_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "ConsultaHCE"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receta" ADD CONSTRAINT "Receta_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receta" ADD CONSTRAINT "Receta_especialistaId_fkey" FOREIGN KEY ("especialistaId") REFERENCES "Especialista"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecetaItem" ADD CONSTRAINT "RecetaItem_recetaId_fkey" FOREIGN KEY ("recetaId") REFERENCES "Receta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificadoMedico" ADD CONSTRAINT "CertificadoMedico_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "ConsultaHCE"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificadoMedico" ADD CONSTRAINT "CertificadoMedico_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificadoMedico" ADD CONSTRAINT "CertificadoMedico_especialistaId_fkey" FOREIGN KEY ("especialistaId") REFERENCES "Especialista"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AltaEspecialidad" ADD CONSTRAINT "AltaEspecialidad_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AltaEspecialidad" ADD CONSTRAINT "AltaEspecialidad_especialistaId_fkey" FOREIGN KEY ("especialistaId") REFERENCES "Especialista"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AltaEspecialidad" ADD CONSTRAINT "AltaEspecialidad_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Derivacion" ADD CONSTRAINT "Derivacion_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Derivacion" ADD CONSTRAINT "Derivacion_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "ConsultaHCE"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Derivacion" ADD CONSTRAINT "Derivacion_especialistaOrigenId_fkey" FOREIGN KEY ("especialistaOrigenId") REFERENCES "Especialista"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Derivacion" ADD CONSTRAINT "Derivacion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DerivacionDestino" ADD CONSTRAINT "DerivacionDestino_derivacionId_fkey" FOREIGN KEY ("derivacionId") REFERENCES "Derivacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DerivacionDestino" ADD CONSTRAINT "DerivacionDestino_especialistaId_fkey" FOREIGN KEY ("especialistaId") REFERENCES "Especialista"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DerivacionDestino" ADD CONSTRAINT "DerivacionDestino_citaId_fkey" FOREIGN KEY ("citaId") REFERENCES "Cita"("id") ON DELETE SET NULL ON UPDATE CASCADE;

