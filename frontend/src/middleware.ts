import { NextRequest, NextResponse } from 'next/server';

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  process.env.NEXTAUTH_URL || '',
  'http://localhost:3000',
  'http://localhost:3001',
].filter(Boolean);

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true;
  return ALLOWED_ORIGINS.some((allowed) => {
    if (allowed.endsWith('/')) allowed = allowed.slice(0, -1);
    return origin === allowed || origin.startsWith(allowed);
  });
}

export function middleware(req: NextRequest) {
  const method = req.method.toUpperCase();

  if (SAFE_METHODS.includes(method)) {
    return NextResponse.next();
  }

  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');

  // Mismo origen (p.ej. detras de un tunel con dominio dinamico): siempre permitido.
  const requestHost = (req.headers.get('x-forwarded-host') || req.headers.get('host') || '')
    .split(':')[0]
    .toLowerCase();
  const isSameHost = (value: string | null): boolean => {
    if (!value || !requestHost) return false;
    try {
      return new URL(value).host.split(':')[0].toLowerCase() === requestHost;
    } catch {
      return false;
    }
  };

  if (origin && !isAllowedOrigin(origin) && !isSameHost(origin)) {
    return NextResponse.json({ error: 'Origen no permitido' }, { status: 403 });
  }

  const refererOrigin = referer ? new URL(referer).origin : null;
  if (refererOrigin && !isAllowedOrigin(refererOrigin) && !isSameHost(refererOrigin)) {
    return NextResponse.json({ error: 'Origen no permitido' }, { status: 403 });
  }

  if (origin && refererOrigin && origin !== refererOrigin) {
    return NextResponse.json({ error: 'Origen y Referer no coinciden' }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/especialista/:path*', '/enfermero/:path*', '/auditor/:path*', '/portero/:path*'],
};
