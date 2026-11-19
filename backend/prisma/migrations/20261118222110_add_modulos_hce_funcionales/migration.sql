-- CreateTable
CREATE TABLE "HceOcupacionEscolaridad" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "ocupacionTexto" TEXT,
    "ocupacionEtiquetas" TEXT[],
    "nivelAcademico" TEXT,
    "escolaridadTexto" TEXT,
    "escolaridadEtiquetas" TEXT[],
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "registradoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HceOcupacionEscolaridad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResponsableCuidado" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "registroId" TEXT,
    "nombre" TEXT NOT NULL,
    "contacto" TEXT,
    "parentesco" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResponsableCuidado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HceActividadFuncional" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "actividadSignificativa" TEXT,
    "medidaIndependencia" INTEGER,
    "cambiosDesempeno" TEXT,
    "actividadesVidaDiaria" TEXT[],
    "actividadesInstrumentales" TEXT[],
    "motricidadFina" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "registradoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HceActividadFuncional_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HceOcupacionEscolaridad_pacienteId_activo_idx" ON "HceOcupacionEscolaridad"("pacienteId", "activo");

-- CreateIndex
CREATE INDEX "ResponsableCuidado_pacienteId_activo_idx" ON "ResponsableCuidado"("pacienteId", "activo");

-- CreateIndex
CREATE INDEX "HceActividadFuncional_pacienteId_activo_idx" ON "HceActividadFuncional"("pacienteId", "activo");

-- AddForeignKey
ALTER TABLE "HceOcupacionEscolaridad" ADD CONSTRAINT "HceOcupacionEscolaridad_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HceOcupacionEscolaridad" ADD CONSTRAINT "HceOcupacionEscolaridad_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponsableCuidado" ADD CONSTRAINT "ResponsableCuidado_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponsableCuidado" ADD CONSTRAINT "ResponsableCuidado_registroId_fkey" FOREIGN KEY ("registroId") REFERENCES "HceOcupacionEscolaridad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HceActividadFuncional" ADD CONSTRAINT "HceActividadFuncional_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HceActividadFuncional" ADD CONSTRAINT "HceActividadFuncional_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
