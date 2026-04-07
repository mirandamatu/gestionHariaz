import type { PlanName } from '@/types/domain'

export interface PlanCatalogItem {
  name: PlanName
  displayName: string
  firstMonthPrice: number
  monthlyPrice: number
  annualDiscount: string | null
  annualSavingsEstimate: string | null
  overageLabel: string
  tagline: string
  features: string[]
  includedChannels: number | null
  isPopular?: boolean
}

export const PLAN_CATALOG: Record<PlanName, PlanCatalogItem> = {
  Basics: {
    name: 'Basics',
    displayName: 'Basic',
    firstMonthPrice: 160,
    monthlyPrice: 177,
    annualDiscount: '-10% anual',
    annualSavingsEstimate: '~$212/año',
    overageLabel: '$0,35/conv',
    tagline: 'Para negocios que estan empezando a ordenar su WhatsApp.',
    includedChannels: 1,
    features: [
      'Atencion automatica con IA',
      'Canales de venta: 1 incluido',
      'Metricas de prospectos y campanas',
      'Seguimiento global',
      'ULIS para campanas de WhatsApp',
      'Instrucciones inteligentes',
      'Panel CRM y App Movil',
      'Integraciones nativas',
      'Implementacion incluida',
    ],
  },
  Core: {
    name: 'Core',
    displayName: 'Core',
    firstMonthPrice: 190,
    monthlyPrice: 287,
    annualDiscount: '-15% anual',
    annualSavingsEstimate: '~$517/año',
    overageLabel: '$0,30/conv',
    tagline: 'Para empresas con equipo, procesos y marketing fuerte.',
    includedChannels: 2,
    isPopular: true,
    features: [
      'Todo lo de Basic',
      'Canales de venta: 2 incluidos',
      'Metricas de clientes y operadores',
      'Multioperadores: 3 usuarios incluidos',
      'HARI: 100 consultas/mes incluidas',
      'Excedente HARI: $0,5 c/u',
      'Registro automatico de clientes: 250/mes incluidos',
      'Excedente registro automatico: $0,30 c/u',
      'Optimizacion CAPI Meta Ads incluida',
      'Analisis masivo de conversaciones',
    ],
  },
  Pro: {
    name: 'Pro',
    displayName: 'Pro',
    firstMonthPrice: 390,
    monthlyPrice: 497,
    annualDiscount: null,
    annualSavingsEstimate: null,
    overageLabel: '$0,25/conv',
    tagline: 'Para equipos grandes con muchos vendedores y logicas complejas.',
    includedChannels: 3,
    features: [
      'Todo lo de Core',
      'Canales de venta: 3 incluidos',
      'Metricas Panoptico',
      'Multioperadores: 15 usuarios incluidos',
      'Expansion empresarial jerarquica: 3 paneles incluidos',
      'Registro automatico de clientes: 500/mes incluidos',
      'Excedente registro automatico: $0,20 c/u',
      'Integracion personalizada incluida',
      'Logicas avanzadas incluidas',
    ],
  },
  Custom: {
    name: 'Custom',
    displayName: 'Custom',
    firstMonthPrice: 0,
    monthlyPrice: 0,
    annualDiscount: null,
    annualSavingsEstimate: null,
    overageLabel: 'A definir',
    tagline: 'Configuracion a medida para cuentas especiales.',
    includedChannels: null,
    features: ['Se define caso por caso.'],
  },
  'Pendiente definir': {
    name: 'Pendiente definir',
    displayName: 'Pendiente definir',
    firstMonthPrice: 0,
    monthlyPrice: 0,
    annualDiscount: null,
    annualSavingsEstimate: null,
    overageLabel: 'A definir',
    tagline: 'Oportunidad comercial en analisis.',
    includedChannels: null,
    features: ['Completar informacion comercial.'],
  },
}

export function getPlanCatalogItem(plan: PlanName) {
  return PLAN_CATALOG[plan]
}
