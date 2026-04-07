import type { Interaction } from '@/types/domain'

import { seedClients } from '@/data/seeds/clients'

const ALLOWED_CLIENT_IDS = new Set(seedClients.map((client) => client.id))

const now = '2026-03-15T10:00:00.000Z'

function interaction(interactionItem: Interaction): Interaction {
  return interactionItem
}

export const seedInteractions: Interaction[] = [
  interaction({
    id: 'interaction-voice-review',
    clienteId: 'voice-net',
    tipo: 'reunion',
    fecha: '2026-03-11T15:00:00.000Z',
    titulo: 'Revisión operación Pro',
    descripcion: 'Enrutamiento actual; próximos pasos CAPI y multioperador.',
    resultado: 'Cliente alineado con roadmap técnico.',
    proximaAccion: 'Documentar requisitos CAPI',
    fechaProximoSeguimiento: '2026-03-19',
    pendientes: [
      {
        id: 'vn-t1',
        texto: 'Enviar acta de reunión',
        completado: false,
        completadoAt: null,
      },
      {
        id: 'vn-t2',
        texto: 'Coordinar kickoff CAPI con Quinte',
        completado: false,
        completadoAt: null,
      },
    ],
    visibleEnCalendario: true,
    fechaEvento: '2026-03-15T16:00:00.000Z',
    createdBy: 'ezequias',
    createdAt: now,
    updatedAt: now,
  }),
  interaction({
    id: 'interaction-bio-demo',
    clienteId: 'bio-salud',
    tipo: 'meet',
    fecha: '2026-03-12T13:30:00.000Z',
    titulo: 'Soporte PDFs e imágenes',
    descripcion: 'Líneas Itwell, Mobile-ac, Eco-hair — volumen de activos.',
    resultado: 'Plan de optimización acordado.',
    proximaAccion: 'Implementar mejoras de ingestión',
    fechaProximoSeguimiento: '2026-03-17',
    pendientes: [
      {
        id: 'bio-t1',
        texto: 'Subir muestra de PDFs pesados',
        completado: true,
        completadoAt: '2026-03-12T14:00:00.000Z',
      },
      {
        id: 'bio-t2',
        texto: 'Validar compresión en staging',
        completado: false,
        completadoAt: null,
      },
    ],
    visibleEnCalendario: true,
    fechaEvento: '2026-03-18T11:00:00.000Z',
    createdBy: 'miranda',
    createdAt: now,
    updatedAt: now,
  }),
  interaction({
    id: 'interaction-electric-phil',
    clienteId: 'electric-phil',
    tipo: 'email',
    fecha: '2026-03-13T17:00:00.000Z',
    titulo: 'Checklist Contabilium + normativas',
    descripcion: 'Accesos API y priorización de data sheets.',
    resultado: 'Cliente envió parte de la documentación.',
    proximaAccion: 'Completar mapeo técnico',
    fechaProximoSeguimiento: '2026-03-17',
    pendientes: [],
    visibleEnCalendario: false,
    fechaEvento: null,
    createdBy: 'quinte',
    createdAt: now,
    updatedAt: now,
  }),
  interaction({
    id: 'interaction-genco',
    clienteId: 'genco',
    tipo: 'nota interna',
    fecha: '2026-03-04T16:00:00.000Z',
    titulo: 'Propuesta Pro a dueña',
    descripcion: 'Unificación de sucursales; falta cierre con sponsor ejecutivo.',
    resultado: 'Seguimiento abierto.',
    proximaAccion: 'Agendar reunión con dueña',
    fechaProximoSeguimiento: '2026-03-17',
    pendientes: [],
    visibleEnCalendario: false,
    fechaEvento: null,
    createdBy: 'ponce',
    createdAt: now,
    updatedAt: now,
  }),
].filter((i) => ALLOWED_CLIENT_IDS.has(i.clienteId))
