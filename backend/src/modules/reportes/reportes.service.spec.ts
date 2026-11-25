import { ReportesService } from './reportes.service';

describe('ReportesService', () => {
  const prisma: any = {
    cita: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    consultaHCE: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    paciente: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    especialista: {
      count: jest.fn(),
    },
  };
  const hceService: any = {
    ensureConsultaPdfPath: jest.fn(),
  };
  let service: ReportesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ReportesService(prisma, hceService);
  });

  it('pagina las asistencias y solicita orden cronológico ascendente', async () => {
    prisma.cita.count.mockResolvedValue(1);
    prisma.cita.findMany.mockResolvedValue([
      {
        id: 'cita-1',
        fecha: new Date('2026-01-10T05:00:00.000Z'),
        horaInicio: '08:00',
        horaFin: '09:00',
        estado: 'ATENDIDA',
        especialidad: 'Neurología',
        lugar: 'Consultorio 1',
        paciente: {
          id: 'pac-1',
          nombres: 'Ana',
          apellidos: 'Pérez',
          numeroIdentificacion: '0101',
        },
        especialista: {
          id: 'esp-1',
          nombres: 'María',
          apellidos: 'López',
          especialidad: 'Neurología',
        },
      },
    ]);

    const result = await service.getAsistencias({
      page: 1,
      limit: 50,
      estado: 'ATENDIDA',
    });

    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(prisma.cita.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { estado: 'ATENDIDA' },
      orderBy: [{ fecha: 'asc' }, { horaInicio: 'asc' }],
      skip: 0,
      take: 50,
    }));
  });

  it('devuelve el registro de HC sin exponer contenido clínico', async () => {
    prisma.consultaHCE.count.mockResolvedValue(1);
    prisma.consultaHCE.findMany.mockResolvedValue([
      {
        id: 'hc-1',
        numeroConsulta: 1,
        createdAt: new Date('2026-02-01T15:00:00.000Z'),
        firmada: true,
        firmadaEn: new Date('2026-02-01T16:00:00.000Z'),
        archivoPdfUrl: '/uploads/hce/hc-1.pdf',
        paciente: {
          id: 'pac-1',
          nombres: 'Ana',
          apellidos: 'Pérez',
          numeroIdentificacion: '0101',
        },
        especialista: {
          id: 'esp-1',
          nombres: 'María',
          apellidos: 'López',
          especialidad: 'Neurología',
        },
        cita: {
          fecha: new Date('2026-02-01T05:00:00.000Z'),
          horaInicio: '10:00',
        },
      },
    ]);

    const result = await service.getRegistroHistoriasClinicas({ page: 1, limit: 50 });

    expect(result.items[0]).toMatchObject({
      id: 'hc-1',
      estadoFirma: 'FIRMADA',
      pdfDisponible: false,
      horaAtencion: '10:00',
    });
    expect(result.items[0]).not.toHaveProperty('motivoConsulta');
    expect(result.items[0]).not.toHaveProperty('evoluciones');
  });

  it('prepara solo HC firmadas y numera los PDF de antigua a reciente', async () => {
    prisma.paciente.findUnique.mockResolvedValue({
      id: 'pac-1',
      nombres: 'Ana',
      apellidos: 'Pérez',
      numeroIdentificacion: '0101',
      consultasHCE: [
        {
          id: 'hc-reciente',
          numeroConsulta: 2,
          createdAt: new Date('2026-03-10T15:00:00.000Z'),
          firmada: true,
          archivoPdfUrl: '/uploads/hce/hc-reciente.pdf',
          cita: { fecha: new Date('2026-03-10T05:00:00.000Z'), horaInicio: '09:00' },
          especialista: { especialidad: 'Optometría', nombres: 'Eva', apellidos: 'Díaz' },
        },
        {
          id: 'hc-pendiente',
          numeroConsulta: 3,
          createdAt: new Date('2026-04-10T15:00:00.000Z'),
          firmada: false,
          archivoPdfUrl: null,
          cita: { fecha: new Date('2026-04-10T05:00:00.000Z'), horaInicio: '09:00' },
          especialista: { especialidad: 'Neurología', nombres: 'Eva', apellidos: 'Díaz' },
        },
        {
          id: 'hc-antigua',
          numeroConsulta: 1,
          createdAt: new Date('2026-01-10T15:00:00.000Z'),
          firmada: true,
          archivoPdfUrl: '/uploads/hce/hc-antigua.pdf',
          cita: { fecha: new Date('2026-01-10T05:00:00.000Z'), horaInicio: '08:00' },
          especialista: { especialidad: 'Neurología', nombres: 'Eva', apellidos: 'Díaz' },
        },
      ],
    });
    hceService.ensureConsultaPdfPath.mockImplementation(
      async (id: string) => `/uploads/hce/${id}.pdf`,
    );

    const result = await service.prepararZipHcPaciente('pac-1');

    expect(result.incluidas).toBe(2);
    expect(result.pendientes).toBe(1);
    expect(result.files.map((file) => file.consultaId)).toEqual(['hc-antigua', 'hc-reciente']);
    expect(result.files[0].name).toBe('001_2026-01-10_Neurologia_HC-001.pdf');
    expect(result.files[1].name).toBe('002_2026-03-10_Optometria_HC-002.pdf');
  });
});
