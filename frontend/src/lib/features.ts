export const FEATURES = {
  useNuevoBackendHCE: process.env.NEXT_PUBLIC_HCE_V2 === 'true',
  useNuevoEndpointDiagnosticos: false,
  useNuevoEndpointPrescripciones: false,
  useNuevoEndpointPedidos: false,
  useNuevoEndpointSignosVitales: false,
  useNuevoEndpointEvoluciones: false,
  useNuevoEndpointDocumentos: false,
  useNuevoEndpointIndicaciones: false,
};
