import { isAuthenticated, setUser, getUser, hasPermission, hasRole, logout } from './auth';

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

describe('auth helpers', () => {
  it('isAuthenticated retorna false sin token y true con token', () => {
    expect(isAuthenticated()).toBe(false);
    localStorage.setItem('accessToken', 'some-token');
    expect(isAuthenticated()).toBe(true);
  });

  it('setUser/getUser hacen round-trip del usuario', () => {
    const user = { id: '1', email: 'test@test.com', rol: 'ADMISION' };
    setUser(user as any);
    expect(getUser()).toEqual(user);
  });

  it('hasPermission retorna true solo si el permiso esta en el usuario', () => {
    const user = {
      id: '1',
      email: 'test@test.com',
      rol: 'ENFERMERO',
      permisos: ['ver_citas'],
      administracion: { permisos: {} },
    };
    setUser(user as any);
    expect(hasPermission('ver_citas')).toBe(true);
    expect(hasPermission('editar_citas')).toBe(false);
  });

  it('hasRole retorna true si el rol principal o algun rol adicional coincide', () => {
    const user = {
      id: '1',
      email: 'test@test.com',
      rol: 'ADMISION',
      roles: ['AUDITOR'],
    };
    setUser(user as any);
    expect(hasRole('ADMISION')).toBe(true);
    expect(hasRole('AUDITOR')).toBe(true);
    expect(hasRole('ENFERMERO')).toBe(false);
  });

  it('logout limpia el estado de autenticacion', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
      text: async () => '{}',
    });

    localStorage.setItem('accessToken', 'some-token');
    localStorage.setItem('user', JSON.stringify({ id: '1', email: 'test@test.com' }));

    await logout();

    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });
});
