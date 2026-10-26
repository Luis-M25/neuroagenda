import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard (nuevo)', () => {
  let guard: RolesGuard;

  const mockReflector: any = { getAllAndOverride: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new RolesGuard(mockReflector);
  });

  function ctx(user: any): ExecutionContext {
    return {
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  }

  it('permite si no hay roles/permisos requeridos', () => {
    mockReflector.getAllAndOverride
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce(undefined);
    expect(guard.canActivate(ctx({}) as any)).toBe(true);
  });

  it('deniega si no autenticado', () => {
    mockReflector.getAllAndOverride
      .mockReturnValueOnce(['ADMIN'])
      .mockReturnValueOnce(undefined);
    expect(() => guard.canActivate(ctx(undefined) as any)).toThrow(ForbiddenException);
  });

  it('permite si rol coincide en roles[]', () => {
    mockReflector.getAllAndOverride
      .mockReturnValueOnce(['ESPECIALISTA'])
      .mockReturnValueOnce(undefined);
    expect(guard.canActivate(ctx({ roles: ['ESPECIALISTA'] }) as any)).toBe(true);
  });

  it('deniega si rol no coincide', () => {
    mockReflector.getAllAndOverride
      .mockReturnValueOnce(['ADMIN'])
      .mockReturnValueOnce(undefined);
    expect(() => guard.canActivate(ctx({ roles: ['PORTERO'] }) as any)).toThrow(ForbiddenException);
  });

  it('ADMIN bypass checks de permiso', () => {
    mockReflector.getAllAndOverride
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce(['crear_paciente']);
    expect(guard.canActivate(ctx({ roles: ['ADMIN'] }) as any)).toBe(true);
  });

  it('deniega si permiso falta', () => {
    mockReflector.getAllAndOverride
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce(['crear_paciente']);
    expect(() =>
      guard.canActivate(ctx({ roles: ['ADMISION'], permisos: ['ver_pacientes'] }) as any),
    ).toThrow(ForbiddenException);
  });

  it('permite si permisos completos', () => {
    mockReflector.getAllAndOverride
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce(['crear_paciente', 'ver_pacientes']);
    expect(
      guard.canActivate(ctx({ roles: ['ADMISION'], permisos: ['crear_paciente', 'ver_pacientes'] }) as any),
    ).toBe(true);
  });
});
