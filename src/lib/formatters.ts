import { format, isValid, parseISO } from 'date-fns'

import type {
  CommercialStatus,
  OperationalStatus,
  PaymentStatus,
  Priority,
  RiskLevel,
  TaskStatus,
  TaskType,
} from '@/types/domain'
import { currencySymbol } from '@/lib/utils'

export function formatDate(value: string | null, dateFormat = 'dd MMM yyyy') {
  if (!value) return 'Pendiente'
  const parsed = parseISO(value)
  if (!isValid(parsed)) return value
  return format(parsed, dateFormat)
}

export function formatCurrency(amount: number | null, currency: string) {
  if (amount === null) return 'Pendiente'
  return `${currencySymbol(currency)} ${amount.toLocaleString('es-AR')}`
}

export function statusLabel(status: PaymentStatus) {
  return {
    al_dia: 'Al día',
    pendiente: 'Pendiente',
    vencido: 'Vencido',
    parcial: 'Parcial',
    pausado: 'Pausado',
    no_facturar_aun: 'No facturar aún',
  }[status]
}

export function taskStatusLabel(status: TaskStatus) {
  return {
    pendiente: 'Pendiente',
    en_progreso: 'En progreso',
    completada: 'Completada',
    bloqueada: 'Bloqueada',
  }[status]
}

export function taskStatusTone(status: TaskStatus) {
  return {
    pendiente: 'bg-amber-100 text-amber-800 border-amber-200',
    en_progreso: 'bg-sky-100 text-sky-800 border-sky-200',
    completada: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    bloqueada: 'bg-rose-100 text-rose-800 border-rose-200',
  }[status]
}

export function taskTypeLabel(type: TaskType) {
  return {
    seguimiento: 'Seguimiento',
    demo: 'Demo',
    implementacion: 'Implementación',
    pago: 'Pago',
    soporte: 'Soporte',
    reunion: 'Reunión',
    interno: 'Interno',
  }[type]
}

export function priorityTone(priority: Priority) {
  return {
    Alta: 'bg-rose-100 text-rose-700 border-rose-200',
    Media: 'bg-amber-100 text-amber-700 border-amber-200',
    Baja: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  }[priority]
}

export function riskTone(risk: RiskLevel | null | undefined) {
  return {
    Bajo: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    Medio: 'bg-amber-100 text-amber-700 border-amber-200',
    Alto: 'bg-orange-100 text-orange-700 border-orange-200',
    Crítico: 'bg-rose-100 text-rose-700 border-rose-200',
  }[risk ?? 'Medio']
}

export function commercialStatusTone(status: CommercialStatus) {
  return {
    Lead: 'bg-sky-50 text-sky-700 border-sky-200',
    Contactado: 'bg-amber-50 text-amber-700 border-amber-200',
    'Demo agendada': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Demo realizada': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Propuesta enviada': 'bg-violet-50 text-violet-700 border-violet-200',
    'En seguimiento': 'bg-orange-50 text-orange-700 border-orange-200',
    'Cerrado ganado': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Cerrado perdido': 'bg-rose-50 text-rose-700 border-rose-200',
  }[status]
}

export function operationalStatusTone(status: OperationalStatus) {
  return {
    'No iniciado': 'bg-slate-50 text-slate-700 border-slate-200',
    'Pendiente de implementación': 'bg-amber-50 text-amber-700 border-amber-200',
    Implementando: 'bg-sky-50 text-sky-700 border-sky-200',
    'Esperando cliente': 'bg-yellow-50 text-yellow-700 border-yellow-200',
    Implementado: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Activo: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'En riesgo': 'bg-rose-50 text-rose-700 border-rose-200',
    Pausado: 'bg-orange-50 text-orange-700 border-orange-200',
    Inactivo: 'bg-slate-100 text-slate-700 border-slate-200',
  }[status]
}
