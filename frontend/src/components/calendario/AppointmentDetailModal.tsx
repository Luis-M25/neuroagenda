'use client';

import React from 'react';
import { X, Stethoscope, CalendarDays, User, Clock, MapPin, Phone, CreditCard, Save, Pencil, FileText } from 'lucide-react';
import Link from 'next/link';
import type { EstadoCita, Cita, CitaFallback, EditFormCita, UsuarioConEspecialista } from '@/types/api';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';
import { STATUS_COLORS, STATUS_LABELS, isCita, formatDateEs, type TabKey } from './calendar-utils';

interface AppointmentDetailModalProps {
  detailModal: Cita | CitaFallback | null;
  loadingDetail: boolean;
  activeTab: TabKey;
  editForm: EditFormCita;
  saving: boolean;
  canEditCita: boolean;
  userRole: string;
  especialistas: UsuarioConEspecialista[];
  especialidades: string[];
  detailModalRef: React.RefObject<HTMLDivElement>;
  onClose: () => void;
  onTabChange: (tab: TabKey) => void;
  onEditFormChange: (form: EditFormCita) => void;
  onSave: () => void;
  onChangeEstado: (citaId: string, estado: EstadoCita) => void;
  onCancelCita: (citaId: string) => void;
}

export default function AppointmentDetailModal({
  detailModal,
  loadingDetail,
  activeTab,
  editForm,
  saving,
  canEditCita,
  userRole,
  especialistas,
  especialidades,
  detailModalRef,
  onClose,
  onTabChange,
  onEditFormChange,
  onSave,
  onChangeEstado,
  onCancelCita,
}: AppointmentDetailModalProps) {
  if (!detailModal) return null;

  const tabs = [
    { key: 'estado', label: 'Estado', icon: Stethoscope },
    { key: 'cita', label: 'Cita / Especialista', icon: CalendarDays },
    { key: 'paciente', label: 'Paciente', icon: User },
  ] as const;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
      tabIndex={-1}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        ref={detailModalRef}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Detalle de cita"
      >
        <div className="flex items-center justify-between p-5 border-b bg-neutral-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
              <User size={20} className="text-primary-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-neutral-900">Detalle de cita</h3>
              <p className="text-xs text-neutral-500">
                {isCita(detailModal)
                  ? `${detailModal.paciente.nombres} ${detailModal.paciente.apellidos}`
                  : detailModal.paciente}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: STATUS_COLORS[detailModal.estado] || '#6b7280' }}
            >
              {STATUS_LABELS[detailModal.estado] || detailModal.estado}
            </span>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-200 text-neutral-500">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex border-b">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
                activeTab === tab.key
                  ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50'
                  : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50',
              )}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5 overflow-y-auto">
          {loadingDetail ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
            </div>
          ) : (
            <>
              {activeTab === 'estado' && (
                <div className="space-y-4">
                  <div className="bg-neutral-50 rounded-xl p-4">
                    <p className="text-xs text-neutral-500 uppercase font-semibold mb-2">Estado actual</p>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS[detailModal.estado] || '#6b7280' }} />
                      <span className="font-medium text-neutral-900">{STATUS_LABELS[detailModal.estado] || detailModal.estado}</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-neutral-500 uppercase font-semibold mb-3">Cambiar estado</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {(['CONFIRMADA', 'EN_ESPERA'] as EstadoCita[]).map((est) => (
                        <button
                          key={est}
                          onClick={() => onChangeEstado(detailModal.id, est)}
                          disabled={detailModal.estado === est}
                          className="py-2.5 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ backgroundColor: STATUS_COLORS[est] }}
                        >
                          {STATUS_LABELS[est]}
                        </button>
                      ))}
                      {userRole === 'ESPECIALISTA' && (
                        <>
                          <button
                            onClick={() => onChangeEstado(detailModal.id, 'EN_ATENCION')}
                            disabled={detailModal.estado === 'EN_ATENCION'}
                            className="py-2.5 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                            style={{ backgroundColor: STATUS_COLORS.EN_ATENCION }}
                          >
                            {STATUS_LABELS.EN_ATENCION}
                          </button>
                          <button
                            onClick={() => onChangeEstado(detailModal.id, 'ATENDIDA')}
                            disabled={detailModal.estado === 'ATENDIDA'}
                            className="py-2.5 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                            style={{ backgroundColor: STATUS_COLORS.ATENDIDA }}
                          >
                            {STATUS_LABELS.ATENDIDA}
                          </button>
                        </>
                      )}
                      {userRole !== 'ESPECIALISTA' && (
                        <>
                          <button
                            onClick={() => onChangeEstado(detailModal.id, 'NO_ASISTIO')}
                            disabled={detailModal.estado === 'NO_ASISTIO'}
                            className="py-2.5 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                            style={{ backgroundColor: STATUS_COLORS.NO_ASISTIO }}
                          >
                            {STATUS_LABELS.NO_ASISTIO}
                          </button>
                          <button
                            onClick={() => onCancelCita(detailModal.id)}
                            disabled={detailModal.estado === 'CANCELADA'}
                            className="py-2.5 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                            style={{ backgroundColor: STATUS_COLORS.CANCELADA }}
                          >
                            {STATUS_LABELS.CANCELADA}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {detailModal.estado === 'CANCELADA' && isCita(detailModal) && (
                    <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                      <p className="text-xs text-red-500 uppercase font-semibold mb-1">Información de anulación</p>
                      <p className="text-sm text-red-700">
                        Anulada por: <span className="font-medium">{detailModal.canceladaPor === 'PACIENTE' ? 'Paciente' : 'Administrador'}</span>
                      </p>
                      {detailModal.motivoCancelacion && (
                        <p className="text-sm text-red-700 mt-0.5">Motivo: {detailModal.motivoCancelacion}</p>
                      )}
                      {detailModal.fechaCancelacion && (
                        <p className="text-sm text-red-700 mt-0.5">Fecha: {formatDateEs(detailModal.fechaCancelacion)}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'cita' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1">Especialista</label>
                      <select
                        value={editForm.especialistaId}
                        onChange={(e) => onEditFormChange({ ...editForm, especialistaId: e.target.value })}
                        disabled={!canEditCita}
                        className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm disabled:bg-neutral-50 disabled:text-neutral-500"
                      >
                        <option value="">Seleccione</option>
                        {especialistas.map((u) => {
                          const esp = u.especialista;
                          return <option key={esp.id} value={esp.id}>{esp.nombres} {esp.apellidos}</option>;
                        })}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1">Especialidad</label>
                      <select
                        value={editForm.especialidad}
                        onChange={(e) => onEditFormChange({ ...editForm, especialidad: e.target.value })}
                        disabled={!canEditCita}
                        className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm disabled:bg-neutral-50 disabled:text-neutral-500"
                      >
                        <option value="">Seleccione</option>
                        {especialidades.map((esp) => (
                          <option key={esp} value={esp}>{esp}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1">Fecha</label>
                      <input
                        type="date"
                        value={editForm.fecha}
                        onChange={(e) => onEditFormChange({ ...editForm, fecha: e.target.value })}
                        disabled={!canEditCita}
                        className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm disabled:bg-neutral-50 disabled:text-neutral-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1">Hora inicio</label>
                        <input
                          type="time"
                          value={editForm.horaInicio}
                          onChange={(e) => onEditFormChange({ ...editForm, horaInicio: e.target.value })}
                          disabled={!canEditCita}
                          className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm disabled:bg-neutral-50 disabled:text-neutral-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1">Hora fin</label>
                        <input
                          type="time"
                          value={editForm.horaFin}
                          onChange={(e) => onEditFormChange({ ...editForm, horaFin: e.target.value })}
                          disabled={!canEditCita}
                          className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm disabled:bg-neutral-50 disabled:text-neutral-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1">Lugar</label>
                      <input
                        type="text"
                        value={editForm.lugar}
                        onChange={(e) => onEditFormChange({ ...editForm, lugar: e.target.value })}
                        disabled={!canEditCita}
                        className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm disabled:bg-neutral-50 disabled:text-neutral-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1">Motivo</label>
                      <input
                        type="text"
                        value={editForm.motivo}
                        onChange={(e) => onEditFormChange({ ...editForm, motivo: e.target.value })}
                        disabled={!canEditCita}
                        className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm disabled:bg-neutral-50 disabled:text-neutral-500"
                      />
                    </div>
                  </div>

                  {canEditCita && isCita(detailModal) && (
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1">Notas de modificación</label>
                      <textarea
                        value={editForm.notasModificacion}
                        onChange={(e) => onEditFormChange({ ...editForm, notasModificacion: e.target.value })}
                        rows={3}
                        className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
                        placeholder="Indique el motivo de la modificación"
                      />
                    </div>
                  )}

                  {canEditCita && isCita(detailModal) && (
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={onSave}
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                      >
                        <Save size={16} />
                        {saving ? 'Guardando...' : 'Guardar cambios'}
                      </button>
                    </div>
                  )}
                  {!isCita(detailModal) && (
                    <div className="bg-amber-50 rounded-xl p-4 text-sm text-amber-700">
                      No se pudieron cargar los datos completos de la cita. La edición no está disponible en este momento.
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'paciente' && isCita(detailModal) && (
                <div className="space-y-4">
                  <div className="bg-neutral-50 rounded-xl p-4">
                    <p className="text-xs text-neutral-500 uppercase font-semibold mb-2">Datos personales</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="block text-xs text-neutral-400">Nombres</span>
                        <span className="font-medium text-neutral-900">{detailModal.paciente.nombres}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-neutral-400">Apellidos</span>
                        <span className="font-medium text-neutral-900">{detailModal.paciente.apellidos}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-neutral-400">Identificación</span>
                        <span className="font-medium text-neutral-900">{detailModal.paciente.numeroIdentificacion}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-neutral-400">Teléfono</span>
                        <span className="font-medium text-neutral-900">{detailModal.paciente.telefono || '-'}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-neutral-400">Email</span>
                        <span className="font-medium text-neutral-900">{detailModal.paciente.email || '-'}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-neutral-400">Fecha de nacimiento</span>
                        <span className="font-medium text-neutral-900">{detailModal.paciente.fechaNacimiento ? formatDateEs(detailModal.paciente.fechaNacimiento) : '-'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-neutral-600 bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <FileText size={18} className="text-blue-500" />
                    <p>Para editar los datos del paciente, accede a su ficha completa.</p>
                  </div>

                  <div className="flex justify-end">
                    <Link
                      href={`${ROUTES.admin.pacientes}?pacienteId=${detailModal.paciente.id}&accion=editar`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 text-neutral-700 text-sm font-medium rounded-lg hover:bg-neutral-50 transition-colors"
                    >
                      <Pencil size={16} />
                      Editar ficha del paciente
                    </Link>
                  </div>
                </div>
              )}
              {activeTab === 'paciente' && !isCita(detailModal) && (
                <div className="flex items-center justify-center py-16 text-neutral-400 text-sm">
                  Información del paciente no disponible en este momento
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
