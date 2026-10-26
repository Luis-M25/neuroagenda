import { Controller, Post, Get, Body, UseGuards, Patch, Req, Res, UnauthorizedException } from '@nestjs/common';
import { Request, Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangePasswordResponseDto, UserResponseDto } from './dto/auth-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

const REFRESH_COOKIE = 'refreshToken';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/api/v1/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
};

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({
    summary: 'Login de usuario',
    description: 'Autentica un usuario con email y contraseña. Máximo 5 intentos por minuto.',
  })
  @ApiResponse({
    status: 200,
    description: 'Login exitoso',
  })
  @ApiUnauthorizedResponse({ description: 'Email o contraseña inválidos' })
  @ApiBadRequestResponse({ description: 'Campos requeridos faltantes' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto);
    res.cookie(REFRESH_COOKIE, result.refreshToken, COOKIE_OPTIONS);
    const { refreshToken, ...safe } = result;
    return safe;
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Refrescar token de acceso',
    description: 'Genera un nuevo accessToken usando el refreshToken de la cookie',
  })
  @ApiResponse({
    status: 200,
    description: 'Token refrescado exitosamente',
  })
  @ApiUnauthorizedResponse({ description: 'RefreshToken inválido o expirado' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    if (!refreshToken) throw new UnauthorizedException('No hay refresh token');
    const result = await this.authService.refresh(refreshToken);
    res.cookie(REFRESH_COOKIE, result.refreshToken, COOKIE_OPTIONS);
    const { refreshToken: _, ...safe } = result;
    return safe;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cerrar sesión', description: 'Invalida el refresh token y limpia la cookie' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    if (refreshToken) {
      await this.authService.revoke(refreshToken).catch(() => {});
    }
    res.clearCookie(REFRESH_COOKIE, COOKIE_OPTIONS);
    return { message: 'Sesión cerrada exitosamente' };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cambiar contraseña',
    description: 'Cambia la contraseña del usuario autenticado',
  })
  @ApiResponse({
    status: 200,
    description: 'Contraseña actualizada exitosamente',
    type: ChangePasswordResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Contraseña actual incorrecta' })
  changePassword(
    @CurrentUser('sub') userId: string,
    @Body() dto: ChangePasswordDto,
  ): Promise<ChangePasswordResponseDto> {
    return this.authService.changePassword(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener perfil de usuario',
    description: 'Retorna la información del usuario autenticado',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil obtenido exitosamente',
    type: UserResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Token inválido o expirado' })
  getProfile(@CurrentUser('sub') userId: string): Promise<UserResponseDto> {
    return this.authService.getProfile(userId) as Promise<UserResponseDto>;
  }
}
