import { useState, useCallback } from 'react';
import { citasApi } from '@/lib/api-client';
import { toast } from 'sonner';

export function useCitaDetail() {
  const [showDetail, setShowDetail] = useState<any>(null);

  const openDetail = useCallback(async (cita: any) => {
    try {
      const full = await citasApi.getById(cita.id);
      setShowDetail(full);
    } catch (e: any) {
      toast.error(e.message);
    }
  }, []);

  const closeDetail = useCallback(() => {
    setShowDetail(null);
  }, []);

  return {
    showDetail,
    openDetail,
    closeDetail,
  };
}