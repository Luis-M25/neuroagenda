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
    "slotLiberado" BOOLEAN NOT NULL DEFAULT false,
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
INSERT INTO "new_Cita" ("atendidaPorId", "canceladaPor", "citaOrigenId", "citaReagendadaId", "createdAt", "duracionMinutos", "esRecurrente", "especialidad", "especialistaId", "estado", "fecha", "fechaCancelacion", "fechaModificacion", "horaFin", "horaInicio", "id", "lugar", "modificadaPorId", "motivo", "motivoCancelacion", "notaAdmin", "notaEspecialista", "notasModificacion", "notificacionEnviada5min", "pacienteId", "recurrenciaCantidad", "recurrenciaDiaSemana", "recurrenciaDiasSemana", "recurrenciaFechaFin", "updatedAt", "whatsappConfirmado", "whatsappConfirmadoEn", "whatsappEnviado") SELECT "atendidaPorId", "canceladaPor", "citaOrigenId", "citaReagendadaId", "createdAt", "duracionMinutos", "esRecurrente", "especialidad", "especialistaId", "estado", "fecha", "fechaCancelacion", "fechaModificacion", "horaFin", "horaInicio", "id", "lugar", "modificadaPorId", "motivo", "motivoCancelacion", "notaAdmin", "notaEspecialista", "notasModificacion", "notificacionEnviada5min", "pacienteId", "recurrenciaCantidad", "recurrenciaDiaSemana", "recurrenciaDiasSemana", "recurrenciaFechaFin", "updatedAt", "whatsappConfirmado", "whatsappConfirmadoEn", "whatsappEnviado" FROM "Cita";
DROP TABLE "Cita";
ALTER TABLE "new_Cita" RENAME TO "Cita";
CREATE UNIQUE INDEX "Cita_citaReagendadaId_key" ON "Cita"("citaReagendadaId");
CREATE UNIQUE INDEX "Cita_especialistaId_fecha_horaInicio_key" ON "Cita"("especialistaId", "fecha", "horaInicio");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
