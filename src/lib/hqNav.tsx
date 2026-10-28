import {
  Bot,
  CalendarDays,
  FolderKanban,
  Gamepad2,
  GraduationCap,
  Home,
  Settings,
  Share2,
  ShoppingBag,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

export type NavGroup = 'operacion' | 'crecimiento' | 'personal';

export interface HqNavItem {
  href: string;
  label: string;
  short: string;
  description: string;
  icon: LucideIcon;
  group: NavGroup;
}

export const HQ_NAV: HqNavItem[] = [
  {
    href: '/hq',
    label: 'Hoy',
    short: 'Hoy',
    description: 'Bloque actual, jornada y foco del día',
    icon: Home,
    group: 'operacion',
  },
  {
    href: '/hq/roles',
    label: 'Cambio de Piel',
    short: 'Roles',
    description: 'Entra y sale de los puestos CEO, CTO y CMO',
    icon: Users,
    group: 'operacion',
  },
  {
    href: '/hq/jornada',
    label: 'Jornada',
    short: 'Jornada',
    description: 'Estructura de 8 horas, bloques y días sagrados',
    icon: CalendarDays,
    group: 'operacion',
  },
  {
    href: '/hq/proyectos',
    label: 'Proyectos',
    short: 'Proyectos',
    description: 'Nilah AI, Vegi / Suna y Farmacia Familiar',
    icon: FolderKanban,
    group: 'operacion',
  },
  {
    href: '/hq/academia',
    label: 'Academia',
    short: 'Academia',
    description: 'Cápsulas de 3 minutos y árbol de habilidades',
    icon: GraduationCap,
    group: 'crecimiento',
  },
  {
    href: '/hq/redes',
    label: 'Redes & Leads',
    short: 'Redes',
    description: 'TikTok, métricas y bandeja de contactos',
    icon: Share2,
    group: 'crecimiento',
  },
  {
    href: '/hq/agentes',
    label: 'Agentes IA',
    short: 'Agentes',
    description: 'Korat-Dev y Maps-Hunter en segundo plano',
    icon: Bot,
    group: 'crecimiento',
  },
  {
    href: '/hq/tiempo',
    label: 'Pokémon Time Engine',
    short: 'Tiempo',
    description: 'Banco de tiempo y cartucho de recompensas',
    icon: Gamepad2,
    group: 'personal',
  },
  {
    href: '/hq/tienda',
    label: 'Bazar',
    short: 'Bazar',
    description: 'Tienda por pisos, bóveda y mercado de bayas',
    icon: ShoppingBag,
    group: 'personal',
  },
  {
    href: '/hq/caja',
    label: 'Caja & Ingresos',
    short: 'Caja',
    description: 'MRR, caja y slots de ingreso rápido',
    icon: Wallet,
    group: 'personal',
  },
  {
    href: '/hq/settings',
    label: 'Ajustes',
    short: 'Ajustes',
    description: 'Perfil, integraciones y sesión',
    icon: Settings,
    group: 'personal',
  },
];

export const HQ_DOCK: HqNavItem[] = [
  HQ_NAV[0],
  HQ_NAV[1],
  HQ_NAV[3],
  HQ_NAV[6],
];

export const NAV_GROUPS: { key: NavGroup; label: string }[] = [
  { key: 'operacion', label: 'Operación' },
  { key: 'crecimiento', label: 'Crecimiento' },
  { key: 'personal', label: 'Personal' },
];

export function isNavActive(pathname: string, href: string): boolean {
  if (href === '/hq') return pathname === '/hq';
  return pathname === href || pathname.startsWith(`${href}/`);
}


