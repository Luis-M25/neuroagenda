import { Expose, Type } from 'class-transformer';

/**
 * DTO para respuesta de usuario
 * Se usa en múltiples endpoints (login, profile, etc.)
 */
export class UserResponseDto {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  nombres?: string;

  @Expose()
  apellidos?: string;

  @Expose()
  rol?: string;

  @Expose()
  activo?: boolean;

  @Expose()
  createdAt?: Date;

  @Expose()
  updatedAt?: Date;
}

/**
 * DTO para respuesta de login
 * Incluye tokens y datos del usuario
 */
export class LoginResponseDto {
  @Expose()
  accessToken: string;

  @Expose()
  refreshToken: string;

  @Expose()
  expiresIn: number;

  @Expose()
  @Type(() => UserResponseDto)
  user: UserResponseDto;
}

/**
 * DTO para respuesta de cambio de contraseña
 */
export class ChangePasswordResponseDto {
  @Expose()
  message: string = 'Contraseña actualizada exitosamente';

  @Expose()
  success: boolean = true;
}
