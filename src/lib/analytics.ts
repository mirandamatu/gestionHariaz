import { isAfter, parseISO, startOfToday } from 'date-fns'

import { calculateClientRisks } from '@/lib/risk-rules'
import type { CrmSnapshot, User } from '@/types/domain'

export function getUserById(snapshot: CrmSnapshot, userId: string) {
  return snapshot.users.find((user) => user.id === userId) as User | undefined
}

export function resolveUserName(snapshot: CrmSnapshot, userId: string | null) {
  if (!userId) return 'Sin asignar'
  return getUserById(snapshot, userId)?.nombre ?? userId
}

export function buildDashboardMetrics(snapshot: CrmSnapshot) {
  const today = startOfToday()
  const risks = calculateClientRisks(snapshot.clients, snapshot.payments)
  const riskyClientsCount = new Set(risks.map((risk) => risk.clienteId)).size
  const tasksToday = snapshot.tasks.filter((task) => task.fecha === today.toISOString().slice(0, 10))
  const pendingPayments = snapshot.payments.filter((payment) => payment.estado === 'pendiente')
  const overduePayments = snapshot.payments.filter((payment) => payment.estado === 'vencido')
  const upcomingFollowUps = snapshot.clients.filter((client) => {
    if (!client.fechaProximoSeguimiento) return false
    return isAfter(parseISO(client.fechaProximoSeguimiento), today)
  })

  const clientsBasics = snapshot.clients.filter((client) => client.plan === 'Basics').length
  const clientsCore = snapshot.clients.filter((client) => client.plan === 'Core').length
  const clientsPro = snapshot.clients.filter((client) => client.plan === 'Pro').length
  const clientsEnterprise = snapshot.clients.filter((client) => client.tamanoCliente === 'Enterprise').length

  return {
    totalClients: snapshot.clients.length,
    clientsBasics,
    clientsCore,
    clientsPro,
    clientsEnterprise,
    activeClients: snapshot.clients.filter((client) => client.estadoOperativo === 'Activo').length,
    implementingClients: snapshot.clients.filter((client) =>
      ['Implementando', 'Pendiente de implementación'].includes(client.estadoOperativo),
    ).length,
    waitingClient: snapshot.clients.filter((client) => client.estadoOperativo === 'Esperando cliente')
      .length,
    risks,
    riskyClientsCount,
    pendingPayments,
    overduePayments,
    upcomingFollowUps,
    tasksToday,
  }
}
