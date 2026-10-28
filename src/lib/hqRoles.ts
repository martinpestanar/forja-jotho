export type RoleKey = 'ceo' | 'cto' | 'cmo';

export interface HqRole {
  key: RoleKey;
  label: string;
  title: string;
  accent: string;
  soft: string;
  mission: string;
  metrics: { key: string; label: string }[];
}

export const HQ_ROLES: Record<RoleKey, HqRole> = {
  ceo: {
    key: 'ceo',
    label: 'CEO',
    title: 'Dirección & Salud del Negocio',
    accent: 'var(--hq-ceo)',
    soft: 'var(--hq-ceo-soft)',
    mission: 'Mantener el rumbo, la rentabilidad y la relación con los clientes activos.',
    metrics: [
      { key: 'mrr', label: 'MRR' },
      { key: 'cash', label: 'Caja' },
      { key: 'clients', label: 'Clientes activos' },
      { key: 'pipeline', label: 'Pipeline' },
    ],
  },
  cto: {
    key: 'cto',
    label: 'CTO',
    title: 'Producto, Código & Estabilidad',
    accent: 'var(--hq-cto)',
    soft: 'var(--hq-cto-soft)',
    mission: 'Garantizar plataformas estables y ejecutar el vibe coding con criterio.',
    metrics: [
      { key: 'deploys', label: 'Deploys' },
      { key: 'errors', label: 'Errores' },
      { key: 'uptime', label: 'Uptime' },
      { key: 'modules', label: 'Módulos' },
    ],
  },
  cmo: {
    key: 'cmo',
    label: 'CMO',
    title: 'Marca, Contenido & Tracción',
    accent: 'var(--hq-cmo)',
    soft: 'var(--hq-cmo-soft)',
    mission: 'Conectar con las clientas, publicar contenido diario y calificar leads.',
    metrics: [
      { key: 'videos', label: 'Videos' },
      { key: 'reach', label: 'Alcance' },
      { key: 'leads', label: 'Leads' },
      { key: 'reply', label: 'Respuesta' },
    ],
  },
};

export const HQ_ROLE_LIST: HqRole[] = [HQ_ROLES.ceo, HQ_ROLES.cto, HQ_ROLES.cmo];

export function isRoleKey(value: string): value is RoleKey {
  return value === 'ceo' || value === 'cto' || value === 'cmo';
}
