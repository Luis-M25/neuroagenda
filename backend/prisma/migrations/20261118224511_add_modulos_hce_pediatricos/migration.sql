-- CreateTable
CREATE TABLE "HceOcupacionEscolaridadNino" (
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

    CONSTRAINT "HceOcupacionEscolaridadNino_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResponsableCuidadoNino" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "registroId" TEXT,
    "nombre" TEXT NOT NULL,
    "contacto" TEXT,
    "parentesco" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResponsableCuidadoNino_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HceActividadFuncionalNino" (
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

    CONSTRAINT "HceActividadFuncionalNino_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HceOcupacionEscolaridadNino_pacienteId_activo_idx" ON "HceOcupacionEscolaridadNino"("pacienteId", "activo");

-- CreateIndex
CREATE INDEX "ResponsableCuidadoNino_pacienteId_activo_idx" ON "ResponsableCuidadoNino"("pacienteId", "activo");

-- CreateIndex
CREATE INDEX "HceActividadFuncionalNino_pacienteId_activo_idx" ON "HceActividadFuncionalNino"("pacienteId", "activo");

-- AddForeignKey
ALTER TABLE "HceOcupacionEscolaridadNino" ADD CONSTRAINT "HceOcupacionEscolaridadNino_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HceOcupacionEscolaridadNino" ADD CONSTRAINT "HceOcupacionEscolaridadNino_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponsableCuidadoNino" ADD CONSTRAINT "ResponsableCuidadoNino_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponsableCuidadoNino" ADD CONSTRAINT "ResponsableCuidadoNino_registroId_fkey" FOREIGN KEY ("registroId") REFERENCES "HceOcupacionEscolaridadNino"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HceActividadFuncionalNino" ADD CONSTRAINT "HceActividadFuncionalNino_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HceActividadFuncionalNino" ADD CONSTRAINT "HceActividadFuncionalNino_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
