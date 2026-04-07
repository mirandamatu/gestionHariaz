import type { Client, Payment, RiskAlert } from '@/types/domain'

export function calculateClientRisks(clients: Client[], _payments: Payment[]): RiskAlert[] {
  return clients
    .filter((client) => client.nivelRiesgo)
    .map((client) => ({
      id: `${client.id}-manual-risk`,
      clienteId: client.id,
      clienteNombre: client.nombreCliente,
      motivo: 'Riesgo cargado manualmente por el equipo',
      severidad: client.nivelRiesgo ?? 'Medio',
      proximaAccion: client.proximaAccion,
    }))
}
