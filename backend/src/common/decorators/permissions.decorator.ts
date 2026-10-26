import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermiso = (...permisos: string[]) => SetMetadata(PERMISSIONS_KEY, permisos);
export const Permissions = RequirePermiso;
