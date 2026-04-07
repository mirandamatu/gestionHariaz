import type {
  CommercialStatus,
  OperationalStatus,
  PaymentStatus,
  PlanName,
  Priority,
  RiskLevel,
  TaskStatus,
  UserProfile,
} from '@/types/domain'

export const USER_PROFILES: UserProfile[] = ['ventas', 'desarrollo', 'customer_success']
export const COMMERCIAL_STATUSES: CommercialStatus[] = [
  'Lead',
  'Contactado',
  'Demo agendada',
  'Demo realizada',
  'Propuesta enviada',
  'En seguimiento',
  'Cerrado ganado',
  'Cerrado perdido',
]
export const OPERATIONAL_STATUSES: OperationalStatus[] = [
  'No iniciado',
  'Pendiente de implementación',
  'Implementando',
  'Esperando cliente',
  'Implementado',
  'Activo',
  'En riesgo',
  'Pausado',
  'Inactivo',
]
export const PRIORITIES: Priority[] = ['Alta', 'Media', 'Baja']
export const RISK_LEVELS: RiskLevel[] = ['Bajo', 'Medio', 'Alto', 'Crítico']
export const PLAN_NAMES: PlanName[] = ['Basics', 'Core', 'Pro', 'Custom', 'Pendiente definir']
export const PAYMENT_STATUSES: PaymentStatus[] = [
  'al_dia',
  'pendiente',
  'vencido',
  'parcial',
  'pausado',
  'no_facturar_aun',
]
export const TASK_STATUSES: TaskStatus[] = ['pendiente', 'en_progreso', 'completada', 'bloqueada']

export const PROFILE_COPY: Record<UserProfile, { title: string; quickLinks: string[] }> = {
  ventas: {
    title: 'Ventas primero',
    quickLinks: ['Pipeline ventas', 'Demos', 'Clientes', 'Calendario'],
  },
  desarrollo: {
    title: 'Operación e implementación',
    quickLinks: ['Pipeline ops', 'Tareas', 'Manuales', 'Clientes'],
  },
  customer_success: {
    title: 'Seguimiento y salud de cuentas',
    quickLinks: ['Clientes', 'Pagos', 'Manuales', 'Calendario'],
  },
}
