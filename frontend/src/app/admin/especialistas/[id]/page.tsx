'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { especialistasApi, auditoriaApi } from '@/lib/api-client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { toast } from 'sonner';
import {
  ArrowLeft, User, Mail, Phone, MapPin, Calendar, Briefcase, Building2, DoorOpen,
  Hash, Palette, Pen, Check, X,
} from 'lucide-react';

const ESTADO_COLOR: Record<string, string> = {
  HABILITADO: 'bg-green-100 text-green-700',
  DESHABILITADO: 'bg-red-100 text-red-700',
  SUSPENDIDO_TEMPORAL: 'bg-amber-100 text-amber-700',
};

type Tab = 'datos' | 'auditoria';

export default function EspecialistaDetallePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;

  const [tab, setTab] = useState<Tab>('datos');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [auditoria, setAuditoria] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [editingApariencia, setEditingApariencia] = useState(false);
  const [colorEdit, setColorEdit] = useState('');
  const [codigoEdit, setCodigoEdit] = useState('');

  const loadData = useCallback(() => {
    if (!id) return;
    setLoading(true);
    especialistasApi.getById(id)
      .then((d: any) => setData(d))
      .catch((e: any) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const loadAuditoria = useCallback(() => {
    if (!id) return;
    auditoriaApi.listar({ entidad: 'Especialista', accion: '', pagina: 1, limite: 50 })
      .then((r: any) => {
        const items = (r?.items ?? []).filter((it: any) => it.entidadId === id);
        setAuditoria(items);
        setTotal(items.length);
      })
      .catch((e: any) => console.error(e));
  }, [id]);

  useEffect(() => {
    loadData();
    loadAuditoria();
  }, [loadData, loadAuditoria]);

  const startEditingApariencia = () => {
    setColorEdit(esp.colorCalendario || '');
    setCodigoEdit(esp.codigoAlfabetico || '');
    setEditingApariencia(true);
  };

  const cancelEditingApariencia = () => {
    setEditingApariencia(false);
  };

  const saveApariencia = async () => {
    try {
      await especialistasApi.update(id, {
        colorCalendario: colorEdit || undefined,
        codigoAlfabetico: codigoEdit || undefined,
      } as any);
      toast.success('Apariencia en calendario actualizada');
      setEditingApariencia(false);
      loadData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <Link href="/admin/especialistas" className="inline-flex items-center gap-1 text-sm text-primary-600">
          <ArrowLeft size={14} /> Volver a especialistas
        </Link>
        <Card className="p-8 text-center text-neutral-500">
          No se encontró el especialista solicitado.
        </Card>
      </div>
    );
  }

  const esp = data.especialista || {};
  const nombreCompleto = [
    esp.primerNombre, esp.segundoNombre, esp.primerApellido, esp.segundoApellido,
  ].filter(Boolean).join(' ');

  const fData = {
    title: nombreCompleto || 'Especialista',
    description: `${esp.especialidad ?? ''}${esp.codigoMsp ? ` · MSP: ${esp.codigoMsp}` : ''}`,
    actions: (
      <Link href="/admin/especialistas">
        <Button variant="secondary" icon={<ArrowLeft size={16} />}>Volver</Button>
      </Link>
    ),
  } as any;

  return (
    <div className="space-y-6">
      <PageHeader {...fData} />

      <div className="flex gap-1 bg-white/60 rounded-lg p-0.5 w-fit">
        {(['datos', 'auditoria'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-1.5 rounded-md text-sm font-medium transition-all ${
              tab === t ? 'bg-primary-600 text-white shadow-sm' : 'text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            {t === 'datos' ? 'Datos' : `Auditoría (${auditoria.length})`}
          </button>
        ))}
      </div>

      {tab === 'datos' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2"><User size={16} /> Datos personales</h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_COLOR[esp.estado] || 'bg-neutral-100 text-neutral-700'}`}>
                {esp.estado || 'HABILITADO'}
              </span>
            </div>
            <Row k="Nombre" v={nombreCompleto || `${esp.nombres || ''} ${esp.apellidos || ''}`} />
            <Row k="Identificación" v={`${esp.tipoIdentificacion} ${esp.numeroIdentificacion}`} />
            <Row k="Género" v={esp.genero} />
            <Row k="Fecha de nacimiento" v={esp.fechaNacimiento ? new Date(esp.fechaNacimiento).toLocaleDateString('es-EC') : '-'} />
            <Row k="Estado civil" v={esp.estadoCivil || '-'} />
          </Card>

          <Card className="p-4 space-y-2">
            <h3 className="font-semibold flex items-center gap-2"><Mail size={16} /> Contacto</h3>
            <Row k="Email institucional" v={esp.emailInstitucional} />
            <Row k="Email secundario" v={esp.emailSecundario} />
            <Row k="Email personal" v={esp.emailPersonal} />
            <Row k="Teléfono" v={esp.telefono} />
            <Row k="Teléfono secundario" v={esp.telefonoSecundario} />
            <Row k="Dirección" v={esp.direccion} />
          </Card>

          <Card className="p-4 space-y-2">
            <h3 className="font-semibold flex items-center gap-2"><Briefcase size={16} /> Datos profesionales</h3>
            <Row k="Código MSP" v={esp.codigoMsp || '-'} />
            <Row k="Especialidad" v={esp.especialidad} />
            <Row k="Subespecialidad" v={esp.subEspecialidad || '-'} />
            <Row k="Título profesional" v={esp.tituloProfesional} />
            <Row k="Tiene pasantes" v={esp.tienePasantes ? 'Sí' : 'No'} />
          </Card>

          <Card className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2"><Building2 size={16} /> Ubicación de atención</h3>
              {!editingApariencia && (
                <button onClick={startEditingApariencia} className="p-1 hover:bg-neutral-100 rounded">
                  <Pen size={14} className="text-neutral-400" />
                </button>
              )}
            </div>
            <Row k="Sede" v={esp.sede} />
            <Row k="Consultorio predeterminado" v={esp.consultorioPredeterminado || '-'} />
            {editingApariencia ? (
              <div className="space-y-2 pt-1">
                <div>
                  <label className="text-xs text-neutral-500 block mb-1">Color en calendario</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={colorEdit} onChange={e => setColorEdit(e.target.value)} className="w-10 h-8 rounded border cursor-pointer" />
                    <input type="text" value={colorEdit} onChange={e => setColorEdit(e.target.value)} className="flex-1 border rounded px-2 py-1 text-sm" placeholder="#38C6DE" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-neutral-500 block mb-1">Código alfabético (máx 3 caracteres)</label>
                  <input type="text" value={codigoEdit} onChange={e => setCodigoEdit(e.target.value.slice(0, 3).toUpperCase())} className="w-full border rounded px-2 py-1 text-sm" maxLength={3} placeholder="CP" />
                </div>
                <div className="flex gap-2">
                  <button onClick={saveApariencia} className="flex items-center gap-1 px-3 py-1 bg-primary-600 text-white rounded text-xs"><Check size={12} /> Guardar</button>
                  <button onClick={cancelEditingApariencia} className="flex items-center gap-1 px-3 py-1 border rounded text-xs"><X size={12} /> Cancelar</button>
                </div>
              </div>
            ) : (
              <>
                <Row k="Color calendario" v={
                  esp.colorCalendario
                    ? <span className="inline-flex items-center gap-2"><span className="w-4 h-4 rounded-full" style={{ background: esp.colorCalendario }} />{esp.colorCalendario}</span>
                    : '-'
                } />
                <Row k="Código alfabético" v={esp.codigoAlfabetico || '-'} />
              </>
            )}
          </Card>

          <Card className="p-4 lg:col-span-2">
            <h3 className="font-semibold flex items-center gap-2 mb-3"><Calendar size={16} /> Login / Auditoría</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
              <Row k="Email de login" v={data.email || data.usuario?.email || esp.emailInstitucional} />
              <Row k="Último acceso" v={data.ultimoAcceso ? new Date(data.ultimoAcceso).toLocaleString('es-EC') : '-'} />
              <Row k="Código proveedor" v={esp.codigoMsp || '-'} />
            </div>
          </Card>
        </div>
      )}

      {tab === 'auditoria' && (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-500 border-b bg-neutral-50">
                  <th className="p-3 font-medium">Fecha</th>
                  <th className="p-3 font-medium">Acción</th>
                  <th className="p-3 font-medium">Usuario</th>
                  <th className="p-3 font-medium">Motivo</th>
                  <th className="p-3 font-medium">Entidad</th>
                </tr>
              </thead>
              <tbody>
                {auditoria.map((it, idx) => (
                  <tr key={it.id || idx} className="border-b last:border-0 hover:bg-neutral-50">
                    <td className="p-3 text-neutral-600">{new Date(it.createdAt).toLocaleString('es-EC')}</td>
                    <td className="p-3 font-medium">{it.accion}</td>
                    <td className="p-3">{it.usuario?.email || it.usuarioId || '-'}</td>
                    <td className="p-3 text-neutral-500">{it.motivo || '-'}</td>
                    <td className="p-3"><Badge variant="info">{it.entidad}</Badge></td>
                  </tr>
                ))}
                {auditoria.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-neutral-500">
                      Sin eventos de auditoría para este especialista
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: any }) {
  return (
    <div className="flex items-baseline gap-3 text-sm">
      <span className="text-xs text-neutral-500 min-w-[140px]">{k}</span>
      <span className="font-medium text-neutral-900 break-words">{v || '-'}</span>
    </div>
  );
}
