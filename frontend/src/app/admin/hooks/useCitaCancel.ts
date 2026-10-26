import { useState, useCallback } from 'react';
import { citasApi } from '@/lib/api-client';
import { toast } from 'sonner';

export function useCitaCancel() {
  const [showCancel, setShowCancel] = useState<any>(null);
  const [cancelMotivo, setCancelMotivo] = useState('');

  const openCancel = useCallback((cita: any) => {
    setShowCancel(cita);
    setCancelMotivo('');
  }, []);

  const closeCancel = useCallback(() => {
    setShowCancel(null);
    setCancelMotivo('');
  }, []);

  const handleCancel = useCallback(async (onSuccess?: () => void) => {
    if (!showCancel) return;
    try {
      await citasApi.updateEstado(showCancel.id, { estado: 'CANCELADA', motivoCancelacion: cancelMotivo });
      toast.success('Cita cancelada');
      closeCancel();
      onSuccess?.();
    } catch (e: any) {
      toast.error(e.message);
    }
  }, [showCancel, cancelMotivo, closeCancel]);

  return {
    showCancel,
    cancelMotivo,
    setCancelMotivo,
    openCancel,
    closeCancel,
    handleCancel,
  };
}