import { renderHook, waitFor } from '@testing-library/react';
import { useEspecialistaDashboard } from '@/hooks/useEspecialistaDashboard';
import { citasApi } from '@/lib/api-client';

jest.mock('@/lib/api-client');

const mockCita = {
  id: '1',
  paciente: { nombres: 'Juan', apellidos: 'Pérez' },
  horaInicio: '10:00',
  horaFin: '10:30',
  lugar: 'Consultorio 1',
  motivo: 'Consulta',
  estado: 'CONFIRMADA',
};

describe('useEspecialistaDashboard Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('debe inicializar con loading true', () => {
    (citasApi.getAll as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useEspecialistaDashboard('2026-07-13'));

    expect(result.current.loading).toBe(true);
  });

  it('debe procesar citas correctamente', async () => {
    const mockCitas = [
      { ...mockCita, estado: 'CONFIRMADA' },
      { ...mockCita, id: '2', estado: 'PENDIENTE' },
    ];

    (citasApi.getAll as jest.Mock).mockResolvedValue(mockCitas);

    const { result } = renderHook(() => useEspecialistaDashboard('2026-07-13'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data.total).toBe(2);
    expect(result.current.data.confirmadas).toBe(1);
    expect(result.current.data.pendientes).toBe(1);
  });

  it('debe categorizar citas por horario (hoy)', async () => {
    // Configurar la hora actual a 10:30
    jest.setSystemTime(new Date('2026-07-13T10:30:00'));

    const mockCitas = [
      { ...mockCita, horaInicio: '09:00', estado: 'ATENDIDA' }, // Anterior
      { ...mockCita, id: '2', horaInicio: '10:00', estado: 'EN_ATENCION' }, // En curso
      { ...mockCita, id: '3', horaInicio: '11:00', estado: 'CONFIRMADA' }, // Próxima
    ];

    (citasApi.getAll as jest.Mock).mockResolvedValue(mockCitas);

    const { result } = renderHook(() => useEspecialistaDashboard('2026-07-13'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data.anteriores).toHaveLength(1);
    expect(result.current.data.enCurso).toHaveLength(1);
    expect(result.current.data.proximas).toHaveLength(1);
    expect(result.current.data.esHoy).toBe(true);
  });

  it('debe identificar correctamente si es hoy', async () => {
    jest.setSystemTime(new Date('2026-07-13T15:00:00'));

    (citasApi.getAll as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() =>
      useEspecialistaDashboard('2026-07-13'),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data.esHoy).toBe(true);
  });

  it('debe retornar goToday y addDays functions', () => {
    (citasApi.getAll as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useEspecialistaDashboard('2026-07-12'));

    jest.setSystemTime(new Date('2026-07-13T12:00:00'));

    const today = result.current.goToday();
    expect(today).toBe('2026-07-13');

    const tomorrow = result.current.addDays(1);
    expect(tomorrow).toBe('2026-07-13');

    const yesterday = result.current.addDays(-1);
    expect(yesterday).toBe('2026-07-11');
  });

  it('debe manejar array vacío de citas', async () => {
    (citasApi.getAll as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useEspecialistaDashboard('2026-07-13'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data.total).toBe(0);
    expect(result.current.data.confirmadas).toBe(0);
    expect(result.current.data.pendientes).toBe(0);
    expect(result.current.data.citas).toHaveLength(0);
  });

  it('debe refetchear cuando la fecha cambia', async () => {
    (citasApi.getAll as jest.Mock).mockResolvedValue([mockCita]);

    const { rerender } = renderHook(
      ({ fecha }: { fecha: string }) =>
        useEspecialistaDashboard(fecha),
      {
        initialProps: { fecha: '2026-07-13' },
      },
    );

    await waitFor(() => {
      expect(citasApi.getAll).toHaveBeenCalledWith({
        fechaInicio: '2026-07-13',
        fechaFin: '2026-07-13',
      });
    });

    // Cambiar fecha
    rerender({ fecha: '2026-07-14' });

    await waitFor(() => {
      expect(citasApi.getAll).toHaveBeenCalledWith({
        fechaInicio: '2026-07-14',
        fechaFin: '2026-07-14',
      });
    });

    expect(citasApi.getAll).toHaveBeenCalledTimes(2);
  });
});
