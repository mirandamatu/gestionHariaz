import type { Payment } from '@/types/domain'

import { seedClients } from '@/data/seeds/clients'

const now = '2026-03-15T10:00:00.000Z'

export const seedPayments: Payment[] = seedClients
  .filter((client) => client.plan !== 'Pendiente definir' || client.estadoPago !== 'pendiente')
  .map((client) => ({
    id: `payment-${client.id}`,
    clienteId: client.id,
    fechaVencimiento: client.proximaFechaCobro ?? '2026-03-31',
    fechaPago:
      client.estadoPago === 'al_dia' || client.estadoPago === 'no_facturar_aun'
        ? client.fechaUltimoPago
        : null,
    monto: client.precio ?? 0,
    moneda: client.moneda,
    medioPago: client.modalidadPago === 'pendiente' ? null : client.modalidadPago,
    estado: client.estadoPago,
    observaciones: client.modalidadEspecial,
    createdAt: now,
    updatedAt: now,
  }))
