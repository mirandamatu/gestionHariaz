import type { Client, Payment } from '@/types/domain'

export interface ClientHealthResult {
  client: Client
  score: number
  label: 'Saludable' | 'Atención' | 'En riesgo' | 'Crítico'
  tone: 'green' | 'yellow' | 'orange' | 'red'
}

function daysSince(isoDate: string | null | undefined): number | null {
  if (!isoDate) return null
  const d = new Date(isoDate)
  if (Number.isNaN(d.getTime())) return null
  const now = new Date()
  return Math.floor((now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000))
}

export function computeClientHealthScore(client: Client, _payments: Payment[]): number {
  let score = 100
  const days = daysSince(client.fechaUltimoContacto)
  if (days !== null) {
    if (days > 30) score -= 40
    else if (days > 14) score -= 20
  }
  if (client.estadoPago === 'vencido') score -= 30
  if (client.estadoPago === 'pendiente') score -= 15
  if (client.nivelRiesgo === 'Alto') score -= 20
  if (client.nivelRiesgo === 'Crítico') score -= 40
  if (client.bloqueoActual) score -= 15
  if (client.estadoOperativo === 'En riesgo') score -= 20
  if (client.estadoOperativo === 'Pausado' || client.estadoOperativo === 'Inactivo') score -= 30

  return Math.max(0, Math.min(100, score))
}

function classifyHealth(score: number): Pick<ClientHealthResult, 'label' | 'tone'> {
  if (score >= 80) return { label: 'Saludable', tone: 'green' }
  if (score >= 60) return { label: 'Atención', tone: 'yellow' }
  if (score >= 40) return { label: 'En riesgo', tone: 'orange' }
  return { label: 'Crítico', tone: 'red' }
}

export function listClientsBelowHealthThreshold(
  clients: Client[],
  payments: Payment[],
  maxScoreExclusive = 60,
): ClientHealthResult[] {
  return clients
    .map((client) => {
      const score = computeClientHealthScore(client, payments)
      const { label, tone } = classifyHealth(score)
      return { client, score, label, tone }
    })
    .filter((r) => r.score < maxScoreExclusive)
    .sort((a, b) => a.score - b.score)
}
