import type { Contact } from '@/types/domain'

import { seedClients } from '@/data/seeds/clients'

const now = '2026-03-15T10:00:00.000Z'

export const seedContacts: Contact[] = seedClients.flatMap((client, index) => [
  {
    id: `${client.id}-main`,
    clienteId: client.id,
    nombre: `Contacto ${index + 1}`,
    cargo: 'Responsable principal',
    telefono: null,
    email: `${client.id}@cliente.com`,
    esPrincipal: true,
    notas: null,
    createdAt: now,
    updatedAt: now,
  },
])
