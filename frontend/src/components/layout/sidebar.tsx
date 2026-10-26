'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { getUser, logout, hasPermission } from '@/lib/auth';
import {
  LayoutDashboard, Users, UserCog, Stethoscope, Clock, FileText,
  Settings, LogOut, Menu, X, ClipboardList, MapPin, Building2,
  ChevronDown, HeartPulse, CalendarDays, PanelLeftClose, PanelLeft,
  ShieldCheck, BadgeDollarSign, BarChart3, Share2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';

interface SidebarLinkBase {
  label: string;
  icon?: React.ElementType;
  permiso?: string;
}

interface SidebarLinkItem extends SidebarLinkBase {
  href: string;
}

interface SidebarLinkGroup extends SidebarLinkBase {
  key: string;
  items: SidebarLinkItem[];
}

type SidebarLink = SidebarLinkItem | SidebarLinkGroup;

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const pathname = usePathname();
  const router = useRouter();
  const user = getUser();
  const isEspecialista = user?.rol === 'ESPECIALISTA';
  const isEnfermero = user?.rol === 'ENFERMERO';
  const isAuditor = user?.rol === 'AUDITOR';

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const adminLinks: SidebarLink[] = [
    { href: ROUTES.admin.dashboard, label: 'Dashboard', icon: LayoutDashboard },
    {
      icon: Stethoscope, label: 'Especialistas', key: 'especialistas',
      permiso: 'verEspecialistas',
      items: [
        { href: ROUTES.admin.especialistas, label: 'Listado', permiso: 'verEspecialistas' },
        { href: ROUTES.admin.especialidades, label: 'Especialidades', permiso: 'verEspecialistas' },
        { href: ROUTES.admin.horarios, label: 'Horarios', permiso: 'verEspecialistas' },
        { href: ROUTES.admin.bloquesEspecialidad, label: 'Bloques por especialidad', permiso: 'bloquearEspecialistaGrupal' },
        { href: ROUTES.admin.bloquesGrupales, label: 'Bloques grupales', permiso: 'bloquearEspecialistaGrupal' },
        { href: ROUTES.admin.bloquesIndividuales, label: 'Bloques individuales', permiso: 'bloquearEspecialistaGrupal' },
      ],
    },
    { href: ROUTES.admin.pacientes, label: 'Pacientes', icon: Users, permiso: 'verPacientes' },
    { href: ROUTES.admin.citas, label: 'Citas', icon: CalendarDays, permiso: 'verTodasCitas' },
    { href: ROUTES.admin.admision, label: 'Admisión', icon: ClipboardList, permiso: 'verTodasCitas' },
    { href: ROUTES.admin.derivaciones, label: 'Derivaciones', icon: Share2, permiso: 'verTodasCitas' },
    { href: ROUTES.admin.feriados, label: 'Feriados', icon: CalendarDays, permiso: 'verEspecialistas' },
    { href: ROUTES.admin.porteroAdmin, label: 'Portero', icon: Building2 },
    { href: ROUTES.admin.calendario, label: 'Calendario', icon: CalendarDays, permiso: 'verCalendario' },
    {
      icon: Building2, label: 'Sedes', key: 'sedes', permiso: 'verEspecialistas',
      items: [
        { href: ROUTES.admin.consultorios, label: 'Consultorios', permiso: 'verEspecialistas' },
        { href: ROUTES.admin.sedes, label: 'Sedes', permiso: 'verEspecialistas' },
      ],
    },
    { href: ROUTES.admin.admins, label: 'Administradores', icon: UserCog, permiso: 'gestionarAdmins' },
    { href: ROUTES.admin.auditoria, label: 'Auditoria', icon: ClipboardList },
    { href: ROUTES.admin.permisos, label: 'Permisos', icon: ShieldCheck, permiso: 'gestionarPermisos' },
    { href: '/auditor', label: 'Auditoría HC', icon: FileText, permiso: 'revisar_hce' },
    { href: ROUTES.admin.seguros, label: 'Seguros', icon: BadgeDollarSign },
    { href: ROUTES.admin.reportes, label: 'Reportes', icon: BarChart3, permiso: 'verReportes' },
    {
      key: 'hce', label: 'HCE', icon: HeartPulse, permiso: 'verHistoriaClinica',
      items: [
        { href: ROUTES.admin.hceEspecialistas, label: 'Especialistas', permiso: 'verHistoriaClinica' },
        { href: ROUTES.admin.hceConfiguracion, label: 'Configuracion', permiso: 'gestionarModulosHCE' },
      ],
    },
  ];

  const especialistaLinks: SidebarLink[] = [
    { href: ROUTES.especialista.dashboard, label: 'Dashboard', icon: LayoutDashboard },
    { href: ROUTES.especialista.misCitas, label: 'Mis Citas', icon: CalendarDays },
    { href: ROUTES.especialista.miPerfil, label: 'Mi Perfil', icon: Settings },
    { href: ROUTES.especialista.miHorario, label: 'Mi Horario', icon: Clock },
    { href: ROUTES.especialista.hce, label: 'Historia Clinica', icon: HeartPulse },
    { href: ROUTES.especialista.derivaciones, label: 'Derivaciones', icon: Share2 },
  ];

  const enfermeroLinks: SidebarLink[] = [
    { href: ROUTES.enfermero.dashboard, label: 'Triaje', icon: HeartPulse },
  ];

  const auditorLinks: SidebarLink[] = [
    { href: ROUTES.auditor.dashboard, label: 'Auditoría HC', icon: FileText },
  ];

  const isActive = (href: string) => {
    if (href === ROUTES.admin.dashboard) return pathname === ROUTES.admin.dashboard;
    if (href === ROUTES.especialista.dashboard) return pathname === ROUTES.especialista.dashboard;
    return pathname.startsWith(href);
  };

  const isGroupActive = (items: { href: string }[]) => items.some((item) => isActive(item.href));

  const handleLogout = () => { logout(); router.replace(ROUTES.login); };

  const links = isEspecialista ? especialistaLinks : isEnfermero ? enfermeroLinks : isAuditor ? auditorLinks : adminLinks;

  const renderLink = (link: SidebarLinkItem) => {
    const active = isActive(link.href);
    const Icon = link.icon!;
    return (
      <Link
        key={link.href}
        href={link.href}
        onClick={() => setMobileOpen(false)}
        title={collapsed ? link.label : undefined}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150',
          collapsed && 'justify-center px-2',
          active
            ? 'bg-primary-50 text-primary-700 font-medium'
            : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700',
        )}
      >
        <Icon size={20} className={cn('shrink-0', active ? 'text-primary-500' : 'text-neutral-400')} />
        {!collapsed && <span className="flex-1 truncate">{link.label}</span>}
      </Link>
    );
  };

  const renderGroup = (link: SidebarLinkGroup) => {
    const visibleItems = link.items.filter((item: SidebarLinkItem) => !item.permiso || hasPermission(item.permiso));
    if (visibleItems.length === 0) return null;
    const groupOpen = expandedGroups[link.key] ?? isGroupActive(link.items);
    const groupActive = isGroupActive(link.items);
    const Icon = link.icon!;

    return (
      <div key={link.key}>
        <button
          onClick={() => { if (collapsed) { setCollapsed(false); setExpandedGroups(prev => ({ ...prev, [link.key]: true })); } else toggleGroup(link.key); }}
          title={collapsed ? link.label : undefined}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm transition-all duration-150 text-left',
            collapsed && 'justify-center px-2',
            groupActive ? 'bg-primary-50 text-primary-700 font-medium' : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700',
          )}
        >
          <Icon size={20} className={cn('shrink-0', groupActive ? 'text-primary-500' : 'text-neutral-400')} />
          {!collapsed && (
            <>
              <span className="flex-1">{link.label}</span>
              <ChevronDown size={14} className={cn('text-neutral-400 transition-transform duration-200', groupOpen && 'rotate-180')} />
            </>
          )}
        </button>
        {!collapsed && (
          <div className={cn('overflow-hidden transition-all duration-200', groupOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0')}>
            <div className="ml-4 mt-0.5 mb-0.5 space-y-0.5 border-l-2 border-neutral-100 pl-3">
              {visibleItems.map((item: SidebarLinkItem) => {
                const itemActive = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'block px-3 py-1.5 rounded-lg text-sm transition-colors',
                      itemActive ? 'bg-primary-50 text-primary-600 font-medium' : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50',
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-3 left-3 z-50 lg:hidden bg-white p-2.5 rounded-xl shadow-md border border-neutral-200"
      >
        {mobileOpen ? <X size={20} className="text-neutral-700" /> : <Menu size={20} className="text-neutral-700" />}
      </button>

      <aside className={cn(
        'fixed top-0 left-0 z-40 h-full bg-white border-r border-neutral-100',
        'flex flex-col transition-all duration-200',
        collapsed ? 'w-[68px]' : 'w-60',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0 lg:static lg:z-auto',
      )}>
        <div className={cn('border-b border-neutral-100 flex items-center', collapsed ? 'justify-center px-2 py-3' : 'px-3 py-2')}>
          {collapsed ? (
            <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center">
              <span className="text-xs font-bold text-primary-600">IN</span>
            </div>
          ) : (
            <Link href={isEspecialista ? ROUTES.especialista.dashboard : isEnfermero ? '/enfermero' : isAuditor ? ROUTES.auditor.dashboard : ROUTES.admin.dashboard} className="block w-full">
              <Image src="/images/logo-color.png" alt="Logo" width={200} height={50} className="object-contain w-full h-auto" priority />
            </Link>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5 scrollbar-thin">
          {links.filter((l) => !l.permiso || hasPermission(l.permiso)).map((link) =>
            'key' in link ? renderGroup(link as SidebarLinkGroup) : renderLink(link as SidebarLinkItem)
          )}
        </nav>

        <div className="border-t border-neutral-100 p-2 space-y-1">
          {!collapsed && (
            <div className="px-2 py-2 rounded-lg bg-neutral-50 mb-1">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
                  <span className="text-[11px] font-bold text-primary-600 uppercase">{user?.email?.charAt(0) || '?'}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-neutral-700 truncate">{user?.email}</p>
                  <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary-50 text-primary-600">
                    {isEspecialista ? 'Especialista' : isEnfermero ? 'Enfermero' : isAuditor ? 'Auditor' : user?.rol === 'ADMISION_PRINCIPAL' ? 'Admin' : 'Admision'}
                  </span>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            title="Cerrar sesion"
            className={cn(
              'flex items-center gap-3 w-full rounded-xl text-sm font-medium transition-all duration-150',
              collapsed ? 'justify-center px-2 py-2 text-neutral-400 hover:text-danger-600 hover:bg-danger-50' : 'px-3 py-2 text-neutral-400 hover:text-danger-600 hover:bg-danger-50',
            )}
          >
            <LogOut size={18} />
            {!collapsed && <span>Cerrar sesion</span>}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              'flex items-center gap-3 w-full rounded-xl text-sm text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 transition-all duration-150',
              collapsed ? 'justify-center px-2 py-2' : 'px-3 py-2',
            )}
            title={collapsed ? 'Expandir menu' : 'Colapsar menu'}
          >
            {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
            {!collapsed && <span>Colapsar</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
