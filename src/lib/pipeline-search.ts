import type { Client, User } from '@/types/domain'

export interface PipelineSearchResult {
  clientId: string
  clientName: string
  plan: string
  responsable: string
  estadoComercial: string
  estadoOperativo: string
  proximaAccion: string
  estadoPago: string
  riesgo: string
  pipelinePrincipal: 'commercial' | 'operational'
  pipelineLabel: string
  statusLabel: string
}

function resolveResponsable(userId: string | null, users: User[]) {
  return users.find((user) => user.id === userId)?.nombre ?? 'Sin asignar'
}

export function getPrimaryPipeline(client: Client): 'commercial' | 'operational' {
  if (client.estadoComercial === 'Cerrado ganado') return 'operational'
  if (client.estadoOperativo !== 'No iniciado') return 'operational'
  return 'commercial'
}

export function buildPipelineSearchResults(
  clients: Client[],
  users: User[],
  query: string,
): PipelineSearchResult[] {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return []

  return clients
    .filter((client) =>
      [
        client.nombreCliente,
        client.empresa ?? '',
        client.pais ?? '',
        client.rubro ?? '',
        client.plan,
        client.estadoComercial,
        client.estadoOperativo,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery),
    )
    .map((client) => {
      const pipelinePrincipal = getPrimaryPipeline(client)
      return {
        clientId: client.id,
        clientName: client.nombreCliente,
        plan: client.plan,
        responsable: resolveResponsable(client.responsablePrincipal, users),
        estadoComercial: client.estadoComercial,
        estadoOperativo: client.estadoOperativo,
        proximaAccion: client.proximaAccion ?? 'Definir siguiente paso',
        estadoPago: client.estadoPago,
        riesgo: client.nivelRiesgo ?? 'Sin marcar',
        pipelinePrincipal,
        pipelineLabel:
          pipelinePrincipal === 'commercial' ? 'Pipeline comercial' : 'Pipeline operativo',
        statusLabel:
          pipelinePrincipal === 'commercial' ? client.estadoComercial : client.estadoOperativo,
      }
    })
    .slice(0, 6)
}
