'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { especialistasApi } from '@/lib/api-client';

const ESTADO_OPTS = ['HABILITADO', 'DESHABILITADO', 'SUSPENDIDO_TEMPORAL'];

const normalizeText = (value: string | undefined | null) => (value || '').trim().toLowerCase();
const normalizeDigits = (value: string | undefined | null) => (value || '').replace(/\\D/g, '');
const getEspecialistaData = (record: any) => record.especialista || record;
const isSameEspecialistaRecord = (record: any, editingId: string | null) => {
  if (!editingId) return false;
  const esp = getEspecialistaData(record);
  return record.id === editingId || esp.id === editingId || esp.usuarioId === editingId;
};
const getEspecialistaName = (record: any) => {
  const esp = getEspecialistaData(record);
  return `${esp.nombres || ''} ${esp.apellidos || ''}`.trim();
};
const getRecordEmails = (record: any) => {
  const esp = getEspecialistaData(record);
  return [record.email, record.usuario?.email, esp.emailInstitucional, esp.emailPersonal]
    .map(normalizeText)
    .filter(Boolean);
};

export const useEspecialistaEstado = () => {
  const [showEstadoModal, setShowEstadoModal] = useState(false);
  const [estadoTarget, setEstadoTarget] = useState<any>(null);
  const [estadoData, setEstadoData] = useState({ estado: 'HABILITADO', fechaInicio: '', fechaFin: '' });
  const [estadoTouched, setEstadoTouched] = useState<Record<string, boolean>>({});
  const [estadoFieldErrors, setEstadoFieldErrors] = useState<Record<string, string>>({});

  const getEstadoByTarget = (target: any) => {
    const esp = target.especialista || target;
    return {
      estado: esp.estado || 'HABILITADO',
      fechaInicio: esp.fechaInicioSuspension ? esp.fechaInicioSuspension.split('T')[0] : '',
      fechaFin: esp.fechaFinSuspension ? esp.fechaFinSuspension.split('T')[0] : '',
    };
  };

  const validateEstadoField = useCallback((name: string, value: string) => {
    let err = '';
    if (estadoData.estado !== 'SUSPENDIDO_TEMPORAL') {
      setEstadoFieldErrors((prev) => ({ ...prev, [name]: '' }));
      return;
    }
    if (name === 'fechaInicio') {
      if (!value) err = 'Fecha de inicio es obligatoria (ISO 9001)';
    }
    if (name === 'fechaFin') {
      if (!value) err = 'Fecha de fin es obligatoria (ISO 9001)';
      else if (estadoData.fechaInicio && value <= estadoData.fechaInicio) err = 'Fecha fin debe ser posterior a fecha inicio (ISO 8601)';
    }
    setEstadoFieldErrors((prev) => ({ ...prev, [name]: err }));
  }, [estadoData.estado, estadoData.fechaInicio]);

  const openEstado = (target: any) => {
    setEstadoTarget(target);
    setEstadoData(getEstadoByTarget(target));
    setEstadoTouched({});
    setEstadoFieldErrors({});
    setShowEstadoModal(true);
  };

  const handleEstadoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, setEstadoDataFunc: React.Dispatch<React.SetStateAction<any>>) => {
    const { name, value } = e.target;
    const newEstado = { ...estadoData, [name]: value };
    setEstadoDataFunc(newEstado);
    if (estadoTouched[name]) {
      validateEstadoField(name, value);
    }
  };

  const handleEstadoBlur = (name: string, value: string, estadoTouchedFunc: React.Dispatch<React.SetStateAction<any>>, validateEstadoFieldFunc: any) => {
    estadoTouchedFunc((prev: Record<string, boolean>) => ({ ...prev, [name]: true }));
    validateEstadoFieldFunc(name, value);
  };

  const handleEstadoSave = async (
    estadoTarget: any,
    estadoData: any,
    setShowEstadoModalFunc: React.Dispatch<React.SetStateAction<boolean>>,
    loadListFunc: () => void,
    estadoFieldErrors: Record<string, string>,
    estadoTouched: Record<string, boolean>
  ) => {
    if (!estadoTarget) return;

    const newErrors: Record<string, string> = {};
    const newTouched: Record<string, boolean> = {};

    if (estadoData.estado === 'SUSPENDIDO_TEMPORAL') {
      newTouched.fechaInicio = true;
      newTouched.fechaFin = true;

      if (!estadoData.fechaInicio) {
        newErrors.fechaInicio = 'Fecha de inicio es obligatoria (ISO 9001)';
      }
      if (!estadoData.fechaFin) {
        newErrors.fechaFin = 'Fecha de fin es obligatoria (ISO 9001)';
      } else if (estadoData.fechaInicio && estadoData.fechaFin <= estadoData.fechaInicio) {
        newErrors.fechaFin = 'Fecha fin debe ser posterior a fecha inicio (ISO 8601)';
      }
    }

    const allTouched = { ...estadoTouched, ...newTouched };
    const allErrors = { ...estadoFieldErrors, ...newErrors };

    if (Object.keys(newErrors).length > 0) {
      toast.error('Corrija los errores antes de guardar');
      return;
    }

    try {
      const payload: any = { estado: estadoData.estado };
      if (estadoData.estado === 'SUSPENDIDO_TEMPORAL') {
        payload.fechaInicioSuspension = estadoData.fechaInicio;
        payload.fechaFinSuspension = estadoData.fechaFin;
      }
      await especialistasApi.updateEstado(estadoTarget.id, payload);
      toast.success('Estado actualizado');
      setShowEstadoModalFunc(false);
      loadListFunc();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return {
    showEstadoModal,
    setShowEstadoModal,
    estadoTarget,
    setEstadoTarget,
    estadoData,
    setEstadoData,
    estadoTouched,
    setEstadoTouched,
    estadoFieldErrors,
    setEstadoFieldErrors,
    getEstadoByTarget,
    validateEstadoField,
    openEstado,
    handleEstadoChange,
    handleEstadoBlur,
    handleEstadoSave,
  };
};