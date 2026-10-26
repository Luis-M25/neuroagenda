'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { enfermeroApi } from '@/lib/api-client';
import { getUser } from '@/lib/auth';
import { cn, getEstadoCitaColor, todayStr } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';
import {
  HeartPulse, Users, Stethoscope, Activity, Search, User,
  ClipboardList, Thermometer, Weight, Ruler, Droplets,
  AlertTriangle, CheckCircle, X,
} from 'lucide-react';

type CitaTriaje = {
  id: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: string;
  lugar: string;
  triajeCompletado?: boolean;
  paciente: {
    id: string; nombres: string; apellidos: string;
    tipoIdentificacion: string; numeroIdentificacion: string;
    genero: string; telefono: string;
    grupoSanguineo: string; tipoSeguro: string;
    alergias: string | null; enfermedadesPreexistentes: string | null;
  };
  especialista: {
    id: string; nombres: string; apellidos: string;
    especialidad: string; consultorioPredeterminado: string | null;
  };
};

export default function EnfermeroDashboard() {
  const router = useRouter();
  const user = getUser();
  const [citas, setCitas] = useState<CitaTriaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCita, setSelectedCita] = useState<CitaTriaje | null>(null);
  const [step, setStep] = useState<'list' | 'triaje'>('list');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.rol !== 'ENFERMERO' && user?.rol !== 'ADMISION_PRINCIPAL') {
      router.replace('/login');
      return;
    }
    loadCitas();
  }, [user?.rol, router]);

  const loadCitas = async () => {
    setLoading(true);
    try {
      const data = await enfermeroApi.getCitasHoy();
      setCitas(Array.isArray(data) ? data : []);
    } catch (e: any) {
      toast.error(e.message);
      setCitas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCita = (cita: CitaTriaje) => {
    setSelectedCita(cita);
    setStep('triaje');
  };

  const handleBack = () => {
    setSelectedCita(null);
    setStep('list');
  };

  const totalCitas = citas.length;
  const pendientes = citas.filter((c) => c.estado === 'PENDIENTE' || c.estado === 'CONFIRMADA').length;

  if (step === 'triaje' && selectedCita) {
    return (
      <TriajeWizard
        cita={selectedCita}
        onBack={handleBack}
        onComplete={() => { loadCitas(); handleBack(); }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Triaje del Día"
        description="Pacientes con citas programadas para hoy"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
              <Users size={20} className="text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{totalCitas}</p>
              <p className="text-xs text-neutral-500">Citas del día</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning-100 flex items-center justify-center">
              <Activity size={20} className="text-warning-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{pendientes}</p>
              <p className="text-xs text-neutral-500">Pendientes de triaje</p>
            </div>
          </div>
        </Card>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
        </div>
      ) : citas.length === 0 ? (
        <EmptyState
          icon={<HeartPulse size={24} />}
          title="No hay citas para hoy"
          description="No se encontraron pacientes con citas programadas para el día de hoy"
        />
      ) : (
        <div className="space-y-3">
          {citas.map((cita) => (
            <div
              key={cita.id}
              className={cn(
                'bg-white rounded-xl border border-neutral-100 p-4 hover:shadow-md transition-shadow cursor-pointer border-l-4',
                cita.estado === 'EN_ESPERA' ? 'border-l-purple-500' :
                cita.estado === 'CONFIRMADA' ? 'border-l-blue-500' :
                'border-l-amber-500',
              )}
              onClick={() => handleSelectCita(cita)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <User size={16} className="text-neutral-400 shrink-0" />
                    <p className="font-semibold text-neutral-900 truncate">
                      {cita.paciente.nombres} {cita.paciente.apellidos}
                    </p>
                    <Badge variant={cita.estado === 'EN_ESPERA' ? 'info' : cita.estado === 'CONFIRMADA' ? 'success' : 'warning'}>
                      {cita.estado}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-500">
                    <span>{cita.horaInicio} - {cita.horaFin}</span>
                    <span>{cita.paciente.numeroIdentificacion}</span>
                    <span>{cita.paciente.telefono}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-sm text-neutral-500">
                    <Stethoscope size={14} className="text-neutral-400" />
                    <span>{cita.especialista.nombres} {cita.especialista.apellidos}</span>
                    <span className="text-neutral-300">|</span>
                    <span>{cita.especialista.especialidad}</span>
                    {cita.lugar && (
                      <>
                        <span className="text-neutral-300">|</span>
                        <span>{cita.lugar}</span>
                      </>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={cita.triajeCompletado ? 'outline' : 'primary'}
                  onClick={(e) => { e.stopPropagation(); handleSelectCita(cita); }}
                >
                  {cita.triajeCompletado ? 'Editar Triaje' : 'Iniciar Triaje'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Triaje Wizard ──
function TriajeWizard({
  cita,
  onBack,
  onComplete,
}: {
  cita: CitaTriaje;
  onBack: () => void;
  onComplete: () => void;
}) {
  const [tab, setTab] = useState<'signos' | 'alergias' | 'antecedentes'>('signos');
  const [saving, setSaving] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [datosTriaje, setDatosTriaje] = useState<any>(null);
  const [loadingDatos, setLoadingDatos] = useState(true);

  const [signosForm, setSignosForm] = useState({
    presionArterial: '', frecuenciaCardiaca: '', temperatura: '',
    saturacionOxigeno: '', peso: '', talla: '', imc: '',
    dolorEVA: '', observaciones: '',
  });

  const [alergiaForm, setAlergiaForm] = useState({ tipo: 'MEDICAMENTO', descripcion: '', gravedad: 'LEVE' });
  const [alergiasList, setAlergiasList] = useState<any[]>([]);

  const [antecedenteForm, setAntecedenteForm] = useState({ tipo: '', descripcion: '', categoria: '' });
  const [antecedentesList, setAntecedentesList] = useState<any[]>([]);

  useEffect(() => {
    enfermeroApi.getDatosTriaje(cita.paciente.id)
      .then((data) => {
        setDatosTriaje(data);
        if (data.alergias) setAlergiasList(data.alergias);
        if (data.antecedentes) setAntecedentesList(data.antecedentes);
        // Pre-poblar el formulario de signos vitales con el registro más reciente
        const ultimo = data.signosVitales?.[0];
        if (ultimo) {
          setSignosForm({
            presionArterial: ultimo.presionArterial ?? '',
            frecuenciaCardiaca: ultimo.frecuenciaCardiaca?.toString() ?? '',
            temperatura: ultimo.temperatura?.toString() ?? '',
            saturacionOxigeno: ultimo.saturacionOxigeno?.toString() ?? '',
            peso: ultimo.peso?.toString() ?? '',
            talla: ultimo.talla?.toString() ?? '',
            imc: ultimo.imc?.toString() ?? '',
            dolorEVA: ultimo.dolorEVA?.toString() ?? '',
            observaciones: ultimo.observaciones ?? '',
          });
        }
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoadingDatos(false));
  }, [cita.paciente.id]);

  const handleSignosChange = (field: string, value: string) => {
    const updated = { ...signosForm, [field]: value };
    if ((field === 'peso' || field === 'talla') && updated.peso && updated.talla) {
      const peso = parseFloat(updated.peso);
      const talla = parseFloat(updated.talla);
      if (peso > 0 && talla > 0) {
        const alturaMetros = talla / 100;
        updated.imc = (peso / (alturaMetros * alturaMetros)).toFixed(1);
      }
    }
    setSignosForm(updated);
  };

  const handleGuardarSignos = async () => {
    setSaving(true);
    try {
      const data: any = {};
      if (signosForm.presionArterial) data.presionArterial = signosForm.presionArterial;
      if (signosForm.frecuenciaCardiaca) data.frecuenciaCardiaca = parseInt(signosForm.frecuenciaCardiaca);
      if (signosForm.temperatura) data.temperatura = parseFloat(signosForm.temperatura);
      if (signosForm.saturacionOxigeno) data.saturacionOxigeno = parseFloat(signosForm.saturacionOxigeno);
      if (signosForm.peso) data.peso = parseFloat(signosForm.peso);
      if (signosForm.talla) data.talla = parseFloat(signosForm.talla);
      if (signosForm.dolorEVA) data.dolorEVA = parseInt(signosForm.dolorEVA);
      if (signosForm.observaciones) data.observaciones = signosForm.observaciones;

      await enfermeroApi.guardarSignosVitales(cita.id, data);
      toast.success('Signos vitales guardados');
      setTab('alergias');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAgregarAlergia = async () => {
    if (!alergiaForm.descripcion.trim()) { toast.error('Descripción requerida'); return; }
    setSaving(true);
    try {
      await enfermeroApi.guardarAlergia(cita.id, alergiaForm);
      setAlergiasList([...alergiasList, { ...alergiaForm, id: Date.now().toString() }]);
      setAlergiaForm({ tipo: 'MEDICAMENTO', descripcion: '', gravedad: 'LEVE' });
      toast.success('Alergia registrada');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAgregarAntecedente = async () => {
    if (!antecedenteForm.tipo.trim() || !antecedenteForm.descripcion.trim()) {
      toast.error('Tipo y descripción requeridos');
      return;
    }
    setSaving(true);
    try {
      await enfermeroApi.guardarAntecedente(cita.id, antecedenteForm);
      setAntecedentesList([...antecedentesList, { ...antecedenteForm, id: Date.now().toString() }]);
      setAntecedenteForm({ tipo: '', descripcion: '', categoria: '' });
      toast.success('Antecedente registrado');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleFinalizarTriaje = async () => {
    setFinalizando(true);
    try {
      await enfermeroApi.finalizarTriaje(cita.id);
      toast.success('Triaje finalizado. El paciente está en espera.');
      onComplete();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setFinalizando(false);
    }
  };

  const tabs = [
    { key: 'signos' as const, label: 'Signos Vitales', icon: Activity },
    { key: 'alergias' as const, label: 'Alergias', icon: AlertTriangle },
    { key: 'antecedentes' as const, label: 'Antecedentes', icon: ClipboardList },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <X size={18} />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-neutral-900">Triaje de Paciente</h1>
            <p className="text-sm text-neutral-500">
              {cita.paciente.nombres} {cita.paciente.apellidos} — {cita.horaInicio} | {cita.especialista.especialidad}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                tab === t.key
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-neutral-500 hover:bg-neutral-100',
              )}
            >
              <t.icon size={16} className="inline mr-1" />
              {t.label}
            </button>
          ))}
          <Button
            size="sm"
            onClick={handleFinalizarTriaje}
            disabled={finalizando}
            className="ml-2"
          >
            <CheckCircle size={16} className="mr-1" />
            {finalizando ? 'Finalizando...' : 'Finalizar Triaje'}
          </Button>
        </div>
      </div>

      {loadingDatos ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {tab === 'signos' && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">Signos Vitales</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Presión Arterial</label>
                    <input
                      type="text"
                      placeholder="ej: 120/80"
                      value={signosForm.presionArterial}
                      onChange={(e) => handleSignosChange('presionArterial', e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Frecuencia Cardíaca</label>
                    <input
                      type="number"
                      placeholder="lpm"
                      value={signosForm.frecuenciaCardiaca}
                      onChange={(e) => handleSignosChange('frecuenciaCardiaca', e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Temperatura (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="36.5"
                      value={signosForm.temperatura}
                      onChange={(e) => handleSignosChange('temperatura', e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Saturación O₂ (%)</label>
                    <input
                      type="number"
                      placeholder="98"
                      value={signosForm.saturacionOxigeno}
                      onChange={(e) => handleSignosChange('saturacionOxigeno', e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Peso (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="70.0"
                      value={signosForm.peso}
                      onChange={(e) => handleSignosChange('peso', e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Talla (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="170"
                      value={signosForm.talla}
                      onChange={(e) => handleSignosChange('talla', e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">IMC</label>
                    <input
                      type="text"
                      value={signosForm.imc}
                      readOnly
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-neutral-50 text-neutral-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Dolor EVA (0-10)</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={signosForm.dolorEVA}
                      onChange={(e) => handleSignosChange('dolorEVA', e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Observaciones</label>
                  <textarea
                    value={signosForm.observaciones}
                    onChange={(e) => handleSignosChange('observaciones', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="mt-4 flex justify-end">
                  <Button onClick={handleGuardarSignos} disabled={saving}>
                    {saving ? 'Guardando...' : 'Guardar Signos Vitales'}
                  </Button>
                </div>
              </Card>
            )}

            {tab === 'alergias' && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">Registro de Alergias</h2>
                <div className="space-y-3 mb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Tipo</label>
                      <select
                        value={alergiaForm.tipo}
                        onChange={(e) => setAlergiaForm({ ...alergiaForm, tipo: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm"
                      >
                        <option value="MEDICAMENTO">Medicamento</option>
                        <option value="ALIMENTO">Alimento</option>
                        <option value="AMBIENTAL">Ambiental</option>
                        <option value="OTRO">Otro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Gravedad</label>
                      <select
                        value={alergiaForm.gravedad}
                        onChange={(e) => setAlergiaForm({ ...alergiaForm, gravedad: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm"
                      >
                        <option value="LEVE">Leve</option>
                        <option value="MODERADA">Moderada</option>
                        <option value="GRAVE">Grave</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Descripción</label>
                    <input
                      type="text"
                      placeholder="ej: Penicilina, Frutos secos..."
                      value={alergiaForm.descripcion}
                      onChange={(e) => setAlergiaForm({ ...alergiaForm, descripcion: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <Button onClick={handleAgregarAlergia} disabled={saving} size="sm">
                    + Agregar Alergia
                  </Button>
                </div>

                {alergiasList.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-semibold text-neutral-700 mb-2">Alergias Registradas</h3>
                    <div className="space-y-2">
                      {alergiasList.map((a, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-neutral-50 rounded-lg">
                          <div>
                            <span className="text-sm font-medium text-neutral-800">{a.descripcion}</span>
                            <span className="text-xs text-neutral-500 ml-2">({a.tipo} - {a.gravedad})</span>
                          </div>
                          <Badge variant={a.gravedad === 'GRAVE' ? 'danger' : a.gravedad === 'MODERADA' ? 'warning' : 'info'}>
                            {a.gravedad}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {tab === 'antecedentes' && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">Antecedentes</h2>
                <div className="space-y-3 mb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Tipo</label>
                      <select
                        value={antecedenteForm.tipo}
                        onChange={(e) => setAntecedenteForm({ ...antecedenteForm, tipo: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="QUIRURGICO">Quirúrgico</option>
                        <option value="MEDICO">Médico</option>
                        <option value="FAMILIAR">Familiar</option>
                        <option value="TOXICO">Tóxico</option>
                        <option value="OTRO">Otro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Categoría</label>
                      <select
                        value={antecedenteForm.categoria}
                        onChange={(e) => setAntecedenteForm({ ...antecedenteForm, categoria: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="CARDIOPATIA">Cardiopatía</option>
                        <option value="DIABETES">Diabetes</option>
                        <option value="HIPERTENSION">Hipertensión</option>
                        <option value="CANCER">Cáncer</option>
                        <option value="TUBERCULOSIS">Tuberculosis</option>
                        <option value="ENFERMEDAD_MENTAL">Enfermedad Mental</option>
                        <option value="INFECCIOSA">Infecciosa</option>
                        <option value="MALFORMACION">Malformación</option>
                        <option value="OTRO">Otro</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Descripción</label>
                    <textarea
                      placeholder="Describa el antecedente..."
                      value={antecedenteForm.descripcion}
                      onChange={(e) => setAntecedenteForm({ ...antecedenteForm, descripcion: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <Button onClick={handleAgregarAntecedente} disabled={saving} size="sm">
                    + Agregar Antecedente
                  </Button>
                </div>

                {antecedentesList.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-semibold text-neutral-700 mb-2">Antecedentes Registrados</h3>
                    <div className="space-y-2">
                      {antecedentesList.map((a, i) => (
                        <div key={i} className="p-2 bg-neutral-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-neutral-800">{a.tipo}</span>
                            {a.categoria && <Badge>{a.categoria}</Badge>}
                          </div>
                          <p className="text-sm text-neutral-600 mt-1">{a.descripcion}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-neutral-700 mb-3">Paciente</h3>
              <div className="space-y-2 text-sm">
                <p className="font-medium text-neutral-900">
                  {cita.paciente.nombres} {cita.paciente.apellidos}
                </p>
                <p className="text-neutral-500">{cita.paciente.tipoIdentificacion}: {cita.paciente.numeroIdentificacion}</p>
                <p className="text-neutral-500">Tel: {cita.paciente.telefono}</p>
                <p className="text-neutral-500">Grupo: {cita.paciente.grupoSanguineo}</p>
                <p className="text-neutral-500">Seguro: {cita.paciente.tipoSeguro}</p>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="text-sm font-semibold text-neutral-700 mb-3">Especialista</h3>
              <div className="space-y-2 text-sm">
                <p className="font-medium text-neutral-900">
                  {cita.especialista.nombres} {cita.especialista.apellidos}
                </p>
                <p className="text-neutral-500">{cita.especialista.especialidad}</p>
                {cita.especialista.consultorioPredeterminado && (
                  <p className="text-neutral-500">Consultorio: {cita.especialista.consultorioPredeterminado}</p>
                )}
              </div>
            </Card>

            {datosTriaje?.signosVitales?.length > 0 && (
              <Card className="p-4">
                <h3 className="text-sm font-semibold text-neutral-700 mb-3">Últimos Signos</h3>
                <div className="space-y-1 text-sm text-neutral-600">
                  {datosTriaje.signosVitales.slice(0, 3).map((sv: any) => (
                    <p key={sv.id}>
                      {sv.presionArterial && `PA: ${sv.presionArterial}`}
                      {sv.frecuenciaCardiaca && ` | FC: ${sv.frecuenciaCardiaca}`}
                      {sv.temperatura && ` | T: ${sv.temperatura}°C`}
                    </p>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
