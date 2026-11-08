import { IsString, IsOptional } from 'class-validator';

// ── Optometría: Informe Integral ──
export class SaveOptometriaDto {
  @IsOptional() @IsString() procedencia?: string;

  // Rx en uso (gafas actuales) — fórmula + AV, ADD, AV VP, OBS
  @IsOptional() @IsString() rxUsoOd?: string;
  @IsOptional() @IsString() rxUsoOdAv?: string;
  @IsOptional() @IsString() rxUsoOdAdd?: string;
  @IsOptional() @IsString() rxUsoOdAvVp?: string;
  @IsOptional() @IsString() rxUsoOdObs?: string;
  @IsOptional() @IsString() rxUsoOi?: string;
  @IsOptional() @IsString() rxUsoOiAv?: string;
  @IsOptional() @IsString() rxUsoOiAdd?: string;
  @IsOptional() @IsString() rxUsoOiAvVp?: string;
  @IsOptional() @IsString() rxUsoOiObs?: string;
  @IsOptional() @IsString() rxUsoAo?: string;
  @IsOptional() @IsString() rxUsoAoAv?: string;
  @IsOptional() @IsString() rxUsoAoAdd?: string;
  @IsOptional() @IsString() rxUsoAoAvVp?: string;
  @IsOptional() @IsString() rxUsoAoObs?: string;
  @IsOptional() @IsString() tipoLente?: string;

  // Agudeza visual + optotipo
  @IsOptional() @IsString() avOptotipo?: string;
  @IsOptional() @IsString() avOdVl?: string;
  @IsOptional() @IsString() avOdPh?: string;
  @IsOptional() @IsString() avOdVp?: string;
  @IsOptional() @IsString() avOdObs?: string;
  @IsOptional() @IsString() avOiVl?: string;
  @IsOptional() @IsString() avOiPh?: string;
  @IsOptional() @IsString() avOiVp?: string;
  @IsOptional() @IsString() avOiObs?: string;
  @IsOptional() @IsString() avAoVl?: string;
  @IsOptional() @IsString() avAoPh?: string;
  @IsOptional() @IsString() avAoVp?: string;
  @IsOptional() @IsString() avAoObs?: string;

  // Rx final
  @IsOptional() @IsString() rxFinalOd?: string;
  @IsOptional() @IsString() rxFinalOdAvVl?: string;
  @IsOptional() @IsString() rxFinalOdAdd?: string;
  @IsOptional() @IsString() rxFinalOdAvVp?: string;
  @IsOptional() @IsString() rxFinalOdDnp?: string;
  @IsOptional() @IsString() rxFinalOdAlt?: string;
  @IsOptional() @IsString() rxFinalOi?: string;
  @IsOptional() @IsString() rxFinalOiAvVl?: string;
  @IsOptional() @IsString() rxFinalOiAdd?: string;
  @IsOptional() @IsString() rxFinalOiAvVp?: string;
  @IsOptional() @IsString() rxFinalOiDnp?: string;
  @IsOptional() @IsString() rxFinalOiAlt?: string;
  @IsOptional() @IsString() rxFinalAo?: string;
  @IsOptional() @IsString() rxFinalAoAvVl?: string;
  @IsOptional() @IsString() rxFinalAoAdd?: string;
  @IsOptional() @IsString() rxFinalAoAvVp?: string;
  @IsOptional() @IsString() rxFinalAoDnp?: string;
  @IsOptional() @IsString() rxFinalAoAlt?: string;

  // Examen motor (fila V.L.; motorVp* se conserva por compatibilidad)
  @IsOptional() @IsString() motorVlTecnica?: string;
  @IsOptional() @IsString() motorVlPpc?: string;
  @IsOptional() @IsString() motorVlOr?: string;
  @IsOptional() @IsString() motorVlLuz?: string;
  @IsOptional() @IsString() motorVlVersiones?: string;
  @IsOptional() @IsString() motorVpTecnica?: string;
  @IsOptional() @IsString() motorVpPpc?: string;
  @IsOptional() @IsString() motorVpOr?: string;
  @IsOptional() @IsString() motorVpLuz?: string;
  @IsOptional() @IsString() motorVpVersiones?: string;

  // Sensorialidad (VL/VP)
  @IsOptional() @IsString() sentVlWorth?: string;
  @IsOptional() @IsString() sentVlBaseSup?: string;
  @IsOptional() @IsString() sentVlFusionRojo?: string;
  @IsOptional() @IsString() sentVpWorth?: string;
  @IsOptional() @IsString() sentVpBaseSup?: string;
  @IsOptional() @IsString() sentVpFusionRojo?: string;

  // Examen externo por ojo (O.D./O.I.)
  @IsOptional() @IsString() extPestanasOd?: string;
  @IsOptional() @IsString() extPestanasOi?: string;
  @IsOptional() @IsString() extParpadosOd?: string;
  @IsOptional() @IsString() extParpadosOi?: string;
  @IsOptional() @IsString() extConjuntivaOd?: string;
  @IsOptional() @IsString() extConjuntivaOi?: string;
  @IsOptional() @IsString() extCorneaOd?: string;
  @IsOptional() @IsString() extCorneaOi?: string;
  @IsOptional() @IsString() extEscleroticaOd?: string;
  @IsOptional() @IsString() extEscleroticaOi?: string;
  @IsOptional() @IsString() extIrisOd?: string;
  @IsOptional() @IsString() extIrisOi?: string;
  @IsOptional() @IsString() extCristalinoOd?: string;
  @IsOptional() @IsString() extCristalinoOi?: string;
  @IsOptional() @IsString() extPeliculaLacrimalOd?: string;
  @IsOptional() @IsString() extPeliculaLacrimalOi?: string;
  @IsOptional() @IsString() extPioOd?: string;
  @IsOptional() @IsString() extPioOi?: string;
  @IsOptional() @IsString() extPupilaOd?: string;
  @IsOptional() @IsString() extPupilaOi?: string;

  // Examen externo (legacy de un solo valor — se conserva por compatibilidad)
  @IsOptional() @IsString() extPestanas?: string;
  @IsOptional() @IsString() extParpados?: string;
  @IsOptional() @IsString() extConjuntiva?: string;
  @IsOptional() @IsString() extCornea?: string;
  @IsOptional() @IsString() extEsclerotica?: string;
  @IsOptional() @IsString() extIris?: string;
  @IsOptional() @IsString() extCristalino?: string;
  @IsOptional() @IsString() extPeliculaLacrimal?: string;
  @IsOptional() @IsString() extPio?: string;
  @IsOptional() @IsString() extPupila?: string;

  // Reflejos / oftalmoscopía / color / campo visual
  @IsOptional() @IsString() reflFotomotor?: string;
  @IsOptional() @IsString() reflConsensual?: string;
  @IsOptional() @IsString() oftOd?: string;
  @IsOptional() @IsString() oftOi?: string;
  @IsOptional() @IsString() colorOd?: string;
  @IsOptional() @IsString() colorOi?: string;
  @IsOptional() @IsString() cvOd?: string;
  @IsOptional() @IsString() cvOi?: string;
  @IsOptional() @IsString() cvObs?: string;

  // Cierre del informe
  @IsOptional() @IsString() diagnosticoAO?: string;
  @IsOptional() @IsString() tratamiento?: string;
  @IsOptional() @IsString() recomendaciones?: string;
  @IsOptional() @IsString() evaluacion?: string;
  @IsOptional() @IsString() observacion?: string;
  @IsOptional() @IsString() disposicion?: string;
  @IsOptional() @IsString() notasAdicionales?: string;
}
