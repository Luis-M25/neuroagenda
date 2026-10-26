'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Contenedor de página estandarizado con padding y background.
 * Elimina clases Tailwind duplicadas en múltiples páginas.
 *
 * @example
 * <PageContainer>
 *   <h1>Título</h1>
 *   <p>Contenido...</p>
 * </PageContainer>
 */
export const PageContainer: React.FC<PageContainerProps> = ({ children, className }) => (
  <div className={cn('min-h-screen bg-gray-50 p-4 sm:p-6', className)}>
    {children}
  </div>
);
