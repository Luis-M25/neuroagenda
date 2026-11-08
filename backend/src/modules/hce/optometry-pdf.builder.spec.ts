import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { PDFDocument as PdfLibDocument } from 'pdf-lib';
import {
  buildDevolucionOptometriaPdf,
  buildHistoriaClinicaOptometriaPdf,
} from './optometry-pdf.builder';

const HASH = 'a'.repeat(64);

function consultaOptometria(overrides: Record<string, any> = {}) {
  return {
    id: 'consulta-1',
    numeroConsulta: 7,
    createdAt: new Date('2026-10-14T14:30:00.000Z'),
    tipoConsulta: 'Consulta externa',
    condicionConsulta: 'Subsecuente',
    formaConsulta: 'Presencial',
    tipoAtencion: 'Consulta externa',
    motivoConsulta: 'Disminución de la agudeza visual de lejos.',
    enfermedadActual: 'Paciente refiere visión borrosa al leer de lejos desde hace dos años.',
    tiempoEvolucion: '2 años',
    tratamientosPrevios: 'Uso de lentes previos',
    efEstadoGeneral: 'NORMAL',
    efObsGeneral: 'Paciente orientado, afebril.',
    efCardiovascular: 'NORMAL',
    efRespiratorio: 'NORMAL',
    efAbdomen: 'NO_EVALUADO',
    efNeurologico: 'NORMAL',
    efExtremidades: 'NORMAL',
    efPiel: 'NORMAL',
    efCabezaCuello: 'NORMAL',
    paciente: {
      nombres: 'Ana María',
      apellidos: 'Pérez Andrade',
      tipoIdentificacion: 'Cédula',
      numeroIdentificacion: '1712345678',
      fechaNacimiento: new Date('2000-03-12T00:00:00.000Z'),
      genero: 'FEMENINO',
      estadoCivil: 'SOLTERA',
      telefono: '0999999999',
      direccion: 'Av. Amazonas y Colón',
      canton: 'Quito',
      provincia: 'Pichincha',
      tipoSeguro: 'IESS',
      nombreConvenio: null,
      grupoSanguineo: 'O+',
      emergenciaNombre: 'María Andrade',
      emergenciaParentesco: 'Madre',
      emergenciaTelefono: '0988888888',
      alergias: 'Penicilina',
      antecedentes: [
        {
          ambito: 'PERSONAL',
          tipo: 'QUIRURGICO',
          descripcion: 'Cirugía de cataratas en ojo derecho',
          fecha: new Date('2024-06-01T00:00:00.000Z'),
          observacion: 'Sin complicaciones',
        },
      ],
      historialAlergias: [
        { tipo: 'MEDICAMENTO', descripcion: 'Penicilina', gravedad: 'MODERADA', activa: true },
      ],
      habitos: [
        { tipo: 'TABACO', afirmativo: false, cantidad: null, desde: null, observacion: 'Niega' },
      ],
    },
    especialista: {
      nombres: 'Carlos',
      apellidos: 'Rosero Cadena',
      especialidad: 'Optometría',
      codigoMsp: 'MSP-1234',
      sede: 'Clínica Central',
    },
    cita: {
      fecha: new Date('2026-10-14T00:00:00.000Z'),
      horaInicio: '09:00',
      horaFin: '09:30',
      lugar: 'Consultorio 205',
    },
    diagnosticos: [
      {
        codigoCIE10: 'H52.2',
        descripcion: 'Astigmatismo',
        tipo: 'PRINCIPAL',
        estado: 'DEFINITIVO',
        esPrincipal: true,
      },
    ],
    prescripciones: [
      {
        medicamento: 'Lágrimas artificiales',
        dosis: '1 gota',
        via: 'Oftálmica',
        frecuencia: 'Cada 6 horas',
        duracion: '30 días',
        indicaciones: 'Aplicar en ambos ojos',
      },
    ],
    pedidos: [
      { tipo: 'LABORATORIO', descripcion: 'Biometría hemática', urgente: false, estado: 'PENDIENTE' },
    ],
    examenes: [
      {
        fecha: new Date('2026-10-10T00:00:00.000Z'),
        tipo: 'IMAGEN',
        nombre: 'Topografía corneal',
        resultado: 'Astigmatismo regular',
      },
    ],
    indicaciones: [
      { tipo: 'CUIDADO', descripcion: 'Uso permanente de lentes correctivos.' },
    ],
    evoluciones: [
      {
        createdAt: new Date('2026-10-14T15:00:00.000Z'),
        nota: 'Paciente tolera adecuadamente la corrección.',
      },
    ],
    signosVitales: [
      {
        fecha: new Date('2026-10-14T13:55:00.000Z'),
        presionArterial: '120/80',
        frecuenciaCardiaca: 72,
        temperatura: 36.5,
        saturacionOxigeno: 98,
        peso: 60,
        talla: 165,
        imc: 22.04,
        dolorEVA: 0,
        observaciones: 'Sin novedad',
      },
    ],
    optometriaInforme: {
      tipo: 'INTEGRAL',
      procedencia: 'Consulta externa',
      rxUsoOd: '-1.00 -0.50 x 180',
      rxUsoOdAv: '20/40',
      rxUsoOdAdd: '+1.00',
      rxUsoOdAvVp: '20/25',
      rxUsoOdObs: 'Uso diario',
      rxUsoOi: '-0.75 -0.25 x 175',
      rxUsoOiAv: '20/30',
      rxUsoOiAdd: '+1.00',
      rxUsoOiAvVp: '20/25',
      rxUsoOiObs: 'Uso diario',
      tipoLente: 'Monofocal',
      avOptotipo: 'SNELLEN',
      avOdVl: '20/40',
      avOdPh: '20/25',
      avOdVp: '20/30',
      avOdObs: 'Mejora con corrección',
      avOiVl: '20/30',
      avOiPh: '20/20',
      avOiVp: '20/25',
      avOiObs: 'Sin alteraciones',
      rxFinalOd: '-1.00 -0.50 x 180',
      rxFinalOdAvVl: '20/20',
      rxFinalOdAdd: '+1.00',
      rxFinalOdAvVp: '20/25',
      rxFinalOdDnp: '32',
      rxFinalOdAlt: '16',
      rxFinalOi: '-0.75 -0.25 x 175',
      rxFinalOiAvVl: '20/20',
      rxFinalOiAdd: '+1.00',
      rxFinalOiAvVp: '20/25',
      rxFinalOiDnp: '31',
      rxFinalOiAlt: '15',
      motorVlTecnica: 'Cover test',
      motorVlPpc: '8 cm',
      motorVlOr: 'Ortoforia',
      motorVlLuz: 'Normal',
      motorVlVersiones: 'Sin limitación',
      sentVlWorth: '4 luces',
      sentVlBaseSup: 'Normal',
      sentVlFusionRojo: 'Presente',
      sentVpWorth: '4 luces',
      sentVpBaseSup: 'Normal',
      sentVpFusionRojo: 'Presente',
      extPestanasOd: 'SIN ALTERACION',
      extPestanasOi: 'SIN ALTERACION',
      extParpadosOd: 'SIN ALTERACION',
      extParpadosOi: 'SIN ALTERACION',
      extConjuntivaOd: 'SIN ALTERACION',
      extConjuntivaOi: 'SIN ALTERACION',
      extCorneaOd: 'SIN ALTERACION',
      extCorneaOi: 'SIN ALTERACION',
      extEscleroticaOd: 'SIN ALTERACION',
      extEscleroticaOi: 'SIN ALTERACION',
      extIrisOd: 'SIN ALTERACION',
      extIrisOi: 'SIN ALTERACION',
      extCristalinoOd: 'SIN ALTERACION',
      extCristalinoOi: 'SIN ALTERACION',
      extPeliculaLacrimalOd: 'SIN ALTERACION',
      extPeliculaLacrimalOi: 'SIN ALTERACION',
      extPioOd: '14',
      extPioOi: '15',
      extPupilaOd: 'REACTIVO',
      extPupilaOi: 'REACTIVO',
      reflFotomotor: 'Presente',
      reflConsensual: 'Presente',
      oftOd: 'Fondo de ojo normal',
      oftOi: 'Fondo de ojo normal',
      colorOd: 'Normal',
      colorOi: 'Normal',
      cvOd: 'Normal',
      cvOi: 'Normal',
      cvObs: 'Sin defectos',
      diagnosticoAO: 'Astigmatismo miópico compuesto',
      tratamiento: 'Corrección óptica',
      disposicion: 'Control en 6 meses',
      observacion: 'Paciente estable',
      recomendaciones: 'Uso permanente de lentes con protección UV.',
      evaluacion: 'Buena adaptación',
      notasAdicionales: 'Sin observaciones adicionales',
      createdAt: new Date('2026-10-14T14:45:00.000Z'),
    },
    firmas: [
      {
        fechaFirma: new Date('2026-10-14T15:10:00.000Z'),
        hashDocumento: HASH,
      },
    ],
    ...overrides,
  };
}

async function loadPdf(filePath: string) {
  return PdfLibDocument.load(new Uint8Array(fs.readFileSync(filePath)));
}

describe('PDF de Optometría', () => {
  let dir: string;

  beforeAll(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'optometry-pdf-'));
  });

  afterAll(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  describe('buildDevolucionOptometriaPdf', () => {
    it('genera la devolución con el hash en metadatos y sin imprimirlo', async () => {
      const output = path.join(dir, 'devolucion.pdf');
      await buildDevolucionOptometriaPdf({ consulta: consultaOptometria(), hashDocumento: HASH }, output);

      const buffer = fs.readFileSync(output);
      expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
      expect(buffer.length).toBeGreaterThan(5_000);

      const pdf = await loadPdf(output);
      expect(pdf.getPageCount()).toBe(1);
      expect(pdf.getTitle()).toContain('Informe de Resultados');
      expect(pdf.getKeywords()).toContain(HASH);
      expect(pdf.getAuthor()).toContain('Carlos Rosero');
    });

    it('pagina recomendaciones largas sin perder el bloque de firma', async () => {
      const consulta = consultaOptometria();
      consulta.optometriaInforme.recomendaciones = 'Uso permanente de lentes. '.repeat(300);
      const output = path.join(dir, 'devolucion-larga.pdf');

      await buildDevolucionOptometriaPdf({ consulta, hashDocumento: HASH }, output);

      const pdf = await loadPdf(output);
      expect(pdf.getPageCount()).toBeGreaterThan(1);
    });
  });

  describe('buildHistoriaClinicaOptometriaPdf', () => {
    it('genera una HC completa con todas las secciones', async () => {
      const output = path.join(dir, 'historia.pdf');
      await buildHistoriaClinicaOptometriaPdf({ consulta: consultaOptometria(), hashDocumento: HASH }, output);

      const buffer = fs.readFileSync(output);
      expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
      expect(buffer.length).toBeGreaterThan(10_000);

      const pdf = await loadPdf(output);
      expect(pdf.getPageCount()).toBeGreaterThanOrEqual(2);
      expect(pdf.getTitle()).toContain('Historia Clínica');
      expect(pdf.getKeywords()).toContain(HASH);
    });

    it('genera la HC aunque la consulta no tenga informe optométrico', async () => {
      const consulta = consultaOptometria({ optometriaInforme: null });
      const output = path.join(dir, 'historia-sin-informe.pdf');

      await buildHistoriaClinicaOptometriaPdf({ consulta }, output);

      const pdf = await loadPdf(output);
      expect(pdf.getPageCount()).toBeGreaterThanOrEqual(1);
    });

    it('rechaza consultas que no son de Optometría', async () => {
      const consulta = consultaOptometria();
      consulta.especialista.especialidad = 'Neurología';
      await expect(
        buildHistoriaClinicaOptometriaPdf({ consulta }, path.join(dir, 'otra.pdf')),
      ).rejects.toThrow('no pertenece a Optometría');
    });
  });
});
