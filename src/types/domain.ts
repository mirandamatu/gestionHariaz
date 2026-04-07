export type UserProfile = 'ventas' | 'desarrollo' | 'customer_success'
export type CommercialStatus =
  | 'Lead'
  | 'Contactado'
  | 'Demo agendada'
  | 'Demo realizada'
  | 'Propuesta enviada'
  | 'Cerrado ganado'
  | 'Cerrado perdido'
  | 'En seguimiento'
export type OperationalStatus =
  | 'No iniciado'
  | 'Pendiente de implementación'
  | 'Implementando'
  | 'Esperando cliente'
  | 'Implementado'
  | 'Activo'
  | 'En riesgo'
  | 'Pausado'
  | 'Inactivo'
export type Priority = 'Alta' | 'Media' | 'Baja'
export type RiskLevel = 'Bajo' | 'Medio' | 'Alto' | 'Crítico'
export type PlanName = 'Basics' | 'Core' | 'Pro' | 'Custom' | 'Pendiente definir'
export type PaymentStatus =
  | 'al_dia'
  | 'pendiente'
  | 'vencido'
  | 'parcial'
  | 'pausado'
  | 'no_facturar_aun'
export type PaymentFrequency = 'mensual' | 'trimestral' | 'semestral' | 'anual' | 'especial' | 'pendiente'
export type PaymentMode = 'transferencia' | 'cripto' | 'efectivo' | 'tarjeta' | 'pendiente'
export type InteractionType =
  | 'whatsapp'
  | 'llamada'
  | 'email'
  | 'demo'
  | 'reunion'
  | 'meet'
  | 'nota interna'
export type TaskType =
  | 'seguimiento'
  | 'demo'
  | 'implementacion'
  | 'pago'
  | 'soporte'
  | 'reunion'
  | 'interno'
export type TaskStatus = 'pendiente' | 'en_progreso' | 'completada' | 'bloqueada'

export interface User {
  id: string
  nombre: string
  email: string
  password: string
  perfilPreferido: UserProfile
  esAdmin: boolean
  activo: boolean
  createdAt: string
  updatedAt: string
}

export interface Client {
  id: string
  nombreCliente: string
  empresa: string | null
  pais: string | null
  rubro: string | null
  tamanoCliente: string | null
  descripcion: string | null
  origenLead: string | null
  estadoComercial: CommercialStatus
  estadoOperativo: OperationalStatus
  prioridad: Priority
  nivelRiesgo: RiskLevel | null
  responsablePrincipal: string | null
  equipoInvolucrado: string[]
  plan: PlanName
  precio: number | null
  moneda: string
  descuento: number | null
  conversacionesIncluidas: number | null
  limiteMensual: number | null
  modalidadEspecial: string | null
  cantidadNumeros: number | null
  integraciones: string[]
  modalidadPago: PaymentMode
  frecuenciaPago: PaymentFrequency
  estadoPago: PaymentStatus
  proximaFechaCobro: string | null
  fechaUltimoPago: string | null
  fechaPrimerContacto: string | null
  fechaCierre: string | null
  fechaInicioImplementacion: string | null
  fechaEstimadaImplementacion: string | null
  fechaImplementacionReal: string | null
  fechaUltimoContacto: string | null
  fechaProximoSeguimiento: string | null
  proximaAccion: string | null
  bloqueoActual: string | null
  motivoDemora: string | null
  notasInternas: string | null
  googleSheetUrl?: string | null
  archivos?: ClientAsset[]
  credenciales: ClientCredential[]
  activo: boolean
  createdAt: string
  updatedAt: string
}

export interface ClientCredential {
  id: string
  plataforma: string
  usuario: string
  contrasena: string
  notas: string | null
  createdAt: string
  updatedAt: string
}

export interface ClientAsset {
  id: string
  fileName: string
  mimeType: string
  size: number
  dataUrl?: string
  linkUrl?: string
  createdAt: string
}

export type ManualType = 'pdf' | 'video' | 'link' | 'archivo'
export type ManualCategory = 'ventas' | 'onboarding' | 'operacion' | 'campanas' | 'soporte' | 'interno'

export interface ManualAsset {
  id: string
  titulo: string
  descripcion: string | null
  tipo: ManualType
  categoria: ManualCategory
  destacado: boolean
  fileName: string
  mimeType: string
  size: number
  dataUrl?: string
  linkUrl?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface MeetingTodo {
  id: string
  texto: string
  completado: boolean
  completadoAt: string | null
}

export interface Contact {
  id: string
  clienteId: string
  nombre: string
  cargo: string | null
  telefono: string | null
  email: string | null
  esPrincipal: boolean
  notas: string | null
  createdAt: string
  updatedAt: string
}

export interface Interaction {
  id: string
  clienteId: string
  tipo: InteractionType
  fecha: string
  titulo: string
  descripcion: string
  resultado: string | null
  proximaAccion: string | null
  fechaProximoSeguimiento: string | null
  pendientes: MeetingTodo[]
  visibleEnCalendario: boolean
  fechaEvento: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface Payment {
  id: string
  clienteId: string
  fechaVencimiento: string
  fechaPago: string | null
  monto: number
  moneda: string
  medioPago: string | null
  estado: PaymentStatus
  observaciones: string | null
  createdAt: string
  updatedAt: string
}

export interface Task {
  id: string
  clienteId: string | null
  titulo: string
  descripcion: string | null
  tipo: TaskType
  fecha: string
  hora: string | null
  prioridad: Priority
  estado: TaskStatus
  visibleEnCalendario: boolean
  asignadoA: string
  createdAt: string
  updatedAt: string
}

export interface CalendarEvent {
  id: string
  clienteId: string | null
  tareaId: string | null
  titulo: string
  tipoEvento: string
  fechaInicio: string
  fechaFin: string
  descripcion: string | null
  responsable: string
  createdAt: string
  updatedAt: string
}

export interface RiskAlert {
  id: string
  clienteId: string
  clienteNombre: string
  motivo: string
  severidad: RiskLevel
  proximaAccion: string | null
}

export interface CrmSnapshot {
  users: User[]
  clients: Client[]
  contacts: Contact[]
  interactions: Interaction[]
  payments: Payment[]
  tasks: Task[]
  calendarEvents: CalendarEvent[]
  manuals: ManualAsset[]
}
