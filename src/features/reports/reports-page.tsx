import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, Tooltip, XAxis, YAxis } from 'recharts'

import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/formatters'
import { localDateKey } from '@/lib/briefing'
import { useCrmStore } from '@/store/crm-store'

function group(items: string[]) {
  return Object.entries(
    items.reduce<Record<string, number>>((acc, item) => {
      acc[item] = (acc[item] ?? 0) + 1
      return acc
    }, {}),
  ).map(([name, value]) => ({ name, value }))
}

export function ReportsPage() {
  const [chartsReady, setChartsReady] = useState(false)
  const clients = useCrmStore((state) => state.clients)
  const payments = useCrmStore((state) => state.payments)
  const tasks = useCrmStore((state) => state.tasks)
  const todayKey = useMemo(() => localDateKey(new Date()), [])

  const planData = useMemo(() => group(clients.map((client) => client.plan)), [clients])
  const countryData = useMemo(() => group(clients.map((client) => client.pais ?? 'Sin país')), [clients])
  const paymentData = useMemo(() => group(payments.map((payment) => payment.estado)), [payments])
  const taskData = useMemo(() => group(tasks.map((task) => task.estado)), [tasks])

  const operationalCards = useMemo(
    () => ({
      overdueTasks: tasks.filter((task) => ['pendiente', 'en_progreso'].includes(task.estado) && task.fecha < todayKey).length,
      demoClients: clients.filter((client) => ['Demo agendada', 'Demo realizada', 'Propuesta enviada'].includes(client.estadoComercial)).length,
      droppedFollowUps: clients.filter((client) => client.fechaProximoSeguimiento && client.fechaProximoSeguimiento.slice(0, 10) < todayKey).length,
      blockedClients: clients.filter((client) => client.bloqueoActual).length,
      duePayments: payments.filter((payment) => payment.fechaVencimiento.slice(0, 10) <= todayKey && payment.estado !== 'al_dia').length,
      mrr: clients
        .filter((client) => client.estadoPago === 'al_dia' && client.precio != null)
        .reduce((acc, client) => acc + (client.precio ?? 0), 0),
    }),
    [clients, payments, tasks, todayKey],
  )

  const reportCards = [
    { title: 'Clientes por plan', data: planData },
    { title: 'Clientes por país', data: countryData },
    { title: 'Pagos por estado', data: paymentData },
    { title: 'Tareas por estado', data: taskData },
  ]

  useEffect(() => {
    const timer = window.setTimeout(() => setChartsReady(true), 180)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Reportes"
        title="Reportes operables"
        description="Lectura de cartera, tareas, seguimientos, bloqueos, demos y cobros para decidir dónde intervenir."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard title="Tareas vencidas" value={operationalCards.overdueTasks} />
        <MetricCard title="Cuentas en demos" value={operationalCards.demoClients} />
        <MetricCard title="Seguimientos caídos" value={operationalCards.droppedFollowUps} />
        <MetricCard title="Clientes bloqueados" value={operationalCards.blockedClients} />
        <MetricCard title="Cobros para revisar" value={operationalCards.duePayments} />
        <MetricCard title="MRR aprox." value={formatCurrency(operationalCards.mrr, 'USD')} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {reportCards.map((report) => (
          <Card key={report.title}>
            <CardHeader>
              <CardTitle>{report.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex h-80 min-w-0 items-center justify-center overflow-x-auto">
              {chartsReady ? (
                <BarChart width={420} height={280} data={report.data}>
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#6366f1" />
                </BarChart>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function MetricCard({ title, value }: { title: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="mt-2 text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  )
}
