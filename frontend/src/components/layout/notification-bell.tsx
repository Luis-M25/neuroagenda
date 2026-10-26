'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Bell, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { getUser } from '@/lib/auth';
import { notificacionesApi, Notificacion } from '@/lib/api/notificaciones.api';
import { cn } from '@/lib/utils';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3000';

function getNotificacionHref(n: Notificacion): string | null {
  if (!n.refId || !n.refTipo) return null;
  switch (n.refTipo) {
    case 'paciente':
      return `/admin/pacientes/${n.refId}`;
    case 'consulta':
      return `/especialista/hce/${n.refId}/consulta`;
    case 'cita':
      return `/admin?cita=${n.refId}`;
    case 'derivacion':
      return getUser()?.rol === 'ESPECIALISTA' ? '/especialista/mis-citas' : '/admin/derivaciones';
    default:
      return null;
  }
}

function horaRelativa(createdAt: string): string {
  const diff = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `Hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs}h`;
  return new Date(createdAt).toLocaleDateString('es-EC', { day: 'numeric', month: 'short' });
}

export function NotificationBell() {
  const router = useRouter();
  const user = getUser();
  const userId = user?.id;
  const [open, setOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  const cargarNotificaciones = useCallback(async () => {
    if (!userId) return;
    try {
      const [lista, conteo] = await Promise.all([
        notificacionesApi.listar(),
        notificacionesApi.contarNoLeidas(),
      ]);
      setNotificaciones(lista);
      setNoLeidas(conteo.count);
    } catch {
      // fallo silencioso
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    cargarNotificaciones();
  }, [userId, cargarNotificaciones]);

  useEffect(() => {
    if (!userId) return;
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return;

    const socket = io(`${SOCKET_URL}/notificaciones`, {
      auth: { token: accessToken },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[NotificationBell] WS conectado');
    });

    socket.on('notificacion:nueva', (n: Notificacion) => {
      setNotificaciones((prev) => [n, ...prev]);
      setNoLeidas((prev) => prev + 1);
    });

    socket.on('connect_error', () => {
      // fallback silencioso — los datos también se cargan vía REST
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [userId]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleClickNotificacion = async (n: Notificacion) => {
    if (!n.leida) {
      try {
        await notificacionesApi.marcarLeida(n.id);
        setNotificaciones((prev) => prev.map((x) => x.id === n.id ? { ...x, leida: true } : x));
        setNoLeidas((prev) => Math.max(0, prev - 1));
      } catch {}
    }
    const href = getNotificacionHref(n);
    setOpen(false);
    if (href) router.push(href);
  };

  const handleMarcarTodas = async () => {
    try {
      await notificacionesApi.marcarTodasLeidas();
      setNotificaciones((prev) => prev.map((x) => ({ ...x, leida: true })));
      setNoLeidas(0);
    } catch {}
  };

  return (
    <div className="relative" ref={bellRef}>
      <button
        onClick={() => { setOpen(!open); if (!open) cargarNotificaciones(); }}
        className={cn(
          'relative p-2 rounded-lg hover:bg-neutral-100 transition-colors',
          open && 'bg-neutral-100',
        )}
      >
        <Bell size={20} className="text-neutral-600" />
        {noLeidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {noLeidas > 99 ? '99+' : noLeidas}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-[70vh] overflow-y-auto bg-white rounded-xl shadow-lg border border-neutral-100 z-50">
          <div className="flex items-center justify-between p-3 border-b border-neutral-100">
            <h3 className="text-sm font-semibold text-neutral-800">Notificaciones</h3>
            {noLeidas > 0 && (
              <button
                onClick={handleMarcarTodas}
                className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                <Check size={12} />
                Todas leídas
              </button>
            )}
          </div>

          {notificaciones.length === 0 ? (
            <div className="p-6 text-center text-sm text-neutral-400">
              No hay notificaciones
            </div>
          ) : (
            <div className="divide-y divide-neutral-50">
              {notificaciones.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClickNotificacion(n)}
                  className={cn(
                    'w-full text-left p-3 hover:bg-neutral-50 transition-colors',
                    !n.leida && 'bg-primary-50/50',
                  )}
                >
                  <div className="flex items-start gap-2">
                    {!n.leida && (
                      <span className="mt-1.5 w-2 h-2 rounded-full bg-primary-500 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-neutral-800 truncate">{n.titulo}</p>
                        <span className="text-[10px] text-neutral-400 shrink-0">{horaRelativa(n.createdAt)}</span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{n.mensaje}</p>
                      {getNotificacionHref(n) && (
                        <span className="text-[10px] text-primary-600 mt-1 inline-block">
                          Ver detalle →
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}