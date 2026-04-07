import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  BookOpenText,
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  LayoutDashboard,
  MessageSquareText,
  Presentation,
  ShieldAlert,
  SquareKanban,
  Users,
} from 'lucide-react'

export interface NavigationItem {
  title: string
  path: string
  icon: LucideIcon
}

export const navigationItems: NavigationItem[] = [
  { title: 'Inicio', path: '/', icon: LayoutDashboard },
  { title: 'Clientes', path: '/clientes', icon: Users },
  { title: 'Demos', path: '/demos', icon: Presentation },
  { title: 'Pipeline ventas', path: '/pipeline-comercial', icon: SquareKanban },
  { title: 'Pipeline ops', path: '/pipeline-operativo', icon: SquareKanban },
  { title: 'Manuales', path: '/manuales', icon: BookOpenText },
  { title: 'Pagos', path: '/pagos', icon: CircleDollarSign },
  { title: 'Interacciones', path: '/interacciones', icon: MessageSquareText },
  { title: 'Tareas', path: '/tareas', icon: ClipboardList },
  { title: 'Calendario', path: '/calendario', icon: CalendarDays },
  { title: 'Riesgo manual', path: '/riesgos', icon: ShieldAlert },
  { title: 'Reportes', path: '/reportes', icon: BarChart3 },
]
