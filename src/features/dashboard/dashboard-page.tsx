import { AlertTriangle, BookOpenText, CalendarClock, Check, ClipboardList, Presentation, ShieldAlert } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { daysFromTodayTo, interactionVisibleOnCalendar, localDateKey, localDateKeyFromISO, ymd } from '@/lib/briefing'
import { PLAN_CATALOG } from '@/lib/plan-catalog'
import { calculateClientRisks } from '@/lib/risk-rules'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { useCrmStore } from '@/store/crm-store'
import type { Task } from '@/types/domain'

function nextDemoTaskForClient(clientId: string, tasks: Task[]) {
  return [...tasks]
    .filter((task) => task.clienteId === clientId && task.tipo === 'demo')
    .sort((a, b) => a.fecha.localeCompare(b.fecha))[0]
}

export function DashboardPage() {
  const clients = useCrmStore((s) => s.clients)
  const payments = useCrmStore((s) => s.payments)
  const tasks = useCrmStore((s) => s.tasks)
  const interactions = useCrmStore((s) => s.interactions)
  const users = useCrmStore((s) => s.users)
  const manuals = useCrmStore((s) => s.manuals)
  const activeUserId = useCrmStore((s) => s.activeUserId)

  const todayKey = useMemo(() => localDateKey(new Date()), [])
  const activeUser = users.find((user) => user.id === activeUserId) ?? users[0]

  const myOpenTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.asignadoA === activeUserId && (task.estado === 'pendiente' || task.estado === 'en_progreso'),
      ),
    [activeUserId, tasks],
  )
  const myTodayTasks = useMemo(() => myOpenTasks.filter((task) => task.fecha === todayKey), [myOpenTasks, todayKey])
  const urgentFollowUps = useMemo(
    () =>
      clients.filter((client) => {
        const nextFollowUp = ymd(client.fechaProximoSeguimiento)
        return nextFollowUp !== null && nextFollowUp <= todayKey
      }),
    [clients, todayKey],
  )
  const blockedClients = useMemo(() => clients.filter((client) => client.bloqueoActual), [clients])
  const manualRisks = useMemo(() => calculateClientRisks(clients, payments), [clients, payments])
  const cobrosVentana = useMemo(
    () =>
      payments
        .filter((payment) => {
          const dueDate = ymd(payment.fechaVencimiento)
          if (!dueDate) return false
          const diff = daysFromTodayTo(dueDate, todayKey)
          return diff !== null && diff >= 0 && diff <= 3
        })
        .slice(0, 5),
    [payments, todayKey],
  )
  const agendaHoy = useMemo(() => {
    const taskHits = tasks.filter((task) => task.visibleEnCalendario && task.fecha === todayKey)
    const meetHits = interactions.filter(
      (interaction) =>
        interactionVisibleOnCalendar(interaction) &&
        interaction.fechaEvento &&
        localDateKeyFromISO(interaction.fechaEvento) === todayKey,
    )
    return [...taskHits, ...meetHits]
  }, [interactions, tasks, todayKey])
  const demoCounts = useMemo(
    () => ({
      agendadas: clients.filter((client) => client.estadoComercial === 'Demo agendada').length,
      realizadas: clients.filter((client) => client.estadoComercial === 'Demo realizada').length,
      propuestas: clients.filter((client) => client.estadoComercial === 'Propuesta enviada').length,
    }),
    [clients],
  )
  const demoAgenda = useMemo(
    () =>
      clients
        .filter((client) => ['Demo agendada', 'Demo realizada', 'Propuesta enviada'].includes(client.estadoComercial))
        .map((client) => ({ client, demoTask: nextDemoTaskForClient(client.id, tasks) }))
        .sort((a, b) => (a.demoTask?.fecha ?? '9999-12-31').localeCompare(b.demoTask?.fecha ?? '9999-12-31'))
        .slice(0, 4),
    [clients, tasks],
  )
  const activos = clients.filter((client) => client.activo).length
  const mrr = useMemo(
    () =>
      clients
        .filter((client) => client.activo && client.estadoPago === 'al_dia' && client.precio != null)
        .reduce((acc, client) => acc + (client.precio ?? 0), 0),
    [clients],
  )
  const byPlan = useMemo(() => {
    const acc: Record<string, number> = {}
    for (const client of clients) acc[client.plan] = (acc[client.plan] ?? 0) + 1
    return acc
  }, [clients])

  const focusCards = [
    { title: 'Mis tareas abiertas', value: myOpenTasks.length, icon: ClipboardList, to: '/tareas?view=mine' },
    { title: 'Seguimientos urgentes', value: urgentFollowUps.length, icon: CalendarClock, to: '/clientes?focus=seguimientos' },
    { title: 'Demos activas', value: demoCounts.agendadas + demoCounts.realizadas + demoCounts.propuestas, icon: Presentation, to: '/demos' },
    { title: 'Manuales activos', value: manuals.length, icon: BookOpenText, to: '/manuales' },
  ]

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Inicio"
        title={`Briefing del día${activeUser ? ` · ${activeUser.nombre}` : ''}`}
        description="Tu centro de trabajo: tareas, seguimientos, demos, riesgos y cobros visibles sin navegar de más."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {focusCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title}>
              <CardContent className="flex items-start justify-between gap-4 p-5">
                <div>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className="mt-2 text-3xl font-semibold">{card.value}</p>
                  <Button variant="ghost" className="mt-3 h-auto p-0 text-primary underline" asChild>
                    <Link to={card.to}>Abrir</Link>
                  </Button>
                </div>
                <div className="rounded-2xl bg-secondary p-3">
                  <Icon className="size-5 text-primary" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </section>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr]">
        <SimpleListCard
          title="Mis tareas"
          emptyText="No tenés tareas abiertas asignadas en este momento."
          footerTo="/tareas?view=mine"
          footerLabel="Ver mis tareas"
          items={myOpenTasks.slice(0, 4).map((task) => ({
            id: task.id,
            title: task.titulo,
            body: `${clients.find((entry) => entry.id === task.clienteId)?.nombreCliente ?? 'Tarea interna'} · ${formatDate(task.fecha)}`,
            badge: task.fecha < todayKey ? 'Vencida' : undefined,
          }))}
        />
        <SimpleListCard
          title="Seguimientos urgentes"
          emptyText="No hay seguimientos vencidos ni para hoy."
          footerTo="/clientes?focus=seguimientos"
          footerLabel="Abrir seguimiento"
          items={urgentFollowUps.slice(0, 4).map((client) => ({
            id: client.id,
            title: client.nombreCliente,
            body: `${formatDate(client.fechaProximoSeguimiento)} · ${client.proximaAccion ?? 'Definir siguiente paso'}`,
          }))}
        />
        <SimpleListCard
          title="Agenda de hoy"
          emptyText="No tenés reuniones ni eventos visibles hoy en el calendario."
          footerTo="/calendario"
          footerLabel="Ir al calendario"
          items={agendaHoy.slice(0, 4).map((item) => ({
            id: item.id,
            title: item.titulo,
            body: 'hora' in item ? `Tarea · ${item.hora ?? '—'}` : 'Reunión con pendientes abiertos',
          }))}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline y demos</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <MetricBox label="Demos agendadas" value={demoCounts.agendadas} />
              <MetricBox label="Demos realizadas" value={demoCounts.realizadas} />
              <MetricBox label="Propuestas enviadas" value={demoCounts.propuestas} />
            </CardContent>
          </Card>
          <SimpleListCard
            title="Próximas demos"
            emptyText="No hay demos activas para revisar ahora."
            footerTo="/demos"
            footerLabel="Ir a demos"
            items={demoAgenda.map(({ client, demoTask }) => ({
              id: client.id,
              title: client.nombreCliente,
              body: `${client.estadoComercial}${demoTask ? ` · ${formatDate(demoTask.fecha)}${demoTask.hora ? ` · ${demoTask.hora}` : ''}` : ''}`,
            }))}
          />
          <SimpleListCard
            title="Cuentas trabadas"
            emptyText="No hay bloqueos activos en cuentas operativas."
            footerTo="/clientes?focus=bloqueados"
            footerLabel="Ver bloqueados"
            items={blockedClients.slice(0, 5).map((client) => ({
              id: client.id,
              title: client.nombreCliente,
              body: client.bloqueoActual ?? 'Sin bloqueo',
              icon: <AlertTriangle className="size-4 text-amber-600" />,
            }))}
          />
        </section>

        <section className="space-y-4">
          <SimpleListCard
            title="Riesgo manual"
            emptyText="No hay cuentas marcadas con riesgo manual. Buen trabajo."
            footerTo="/riesgos"
            footerLabel="Abrir riesgo"
            items={manualRisks.slice(0, 5).map((risk) => ({
              id: risk.id,
              title: risk.clienteNombre,
              body: risk.motivo,
              badge: risk.severidad,
              icon: <ShieldAlert className="size-4 text-rose-600" />,
            }))}
          />
          <SimpleListCard
            title="Cobros en ventana corta"
            emptyText="No hay cobros venciendo en la ventana corta."
            footerTo="/pagos"
            footerLabel="Abrir pagos"
            items={cobrosVentana.map((payment) => ({
              id: payment.id,
              title: clients.find((entry) => entry.id === payment.clienteId)?.nombreCliente ?? 'Cliente',
              body: `${formatCurrency(payment.monto, payment.moneda)} · vence ${formatDate(payment.fechaVencimiento)}`,
            }))}
          />
          <Card>
            <CardHeader>
              <CardTitle>Planes y monetización</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(['Basics', 'Core', 'Pro'] as const).map((plan) => {
                const item = PLAN_CATALOG[plan]
                return (
                  <div key={plan} className="rounded-2xl border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{item.displayName}</p>
                        <p className="text-sm text-muted-foreground">{item.tagline}</p>
                      </div>
                      <Badge className="border-muted-foreground/30 bg-muted text-muted-foreground">
                        {byPlan[plan] ?? 0} clientes
                      </Badge>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                      {formatCurrency(item.firstMonthPrice, 'USD')} primer mes · luego {formatCurrency(item.monthlyPrice, 'USD')}
                    </p>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </section>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:flex-wrap md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Clientes activos</p>
            <p className="text-2xl font-semibold">{activos}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">MRR aprox. (al día)</p>
            <p className="text-2xl font-semibold">{formatCurrency(mrr, 'USD')}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tareas para hoy</p>
            <p className="text-2xl font-semibold">{myTodayTasks.length}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild><Link to="/clientes">Clientes</Link></Button>
            <Button variant="outline" asChild><Link to="/demos">Demos</Link></Button>
            <Button variant="outline" asChild><Link to="/manuales">Manuales</Link></Button>
            <Button variant="outline" asChild><Link to="/reportes">Reportes</Link></Button>
            <Button variant="ghost" asChild><Link to="/calendario">Calendario</Link></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MetricBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  )
}

function SimpleListCard({
  title,
  emptyText,
  footerTo,
  footerLabel,
  items,
}: {
  title: string
  emptyText: string
  footerTo: string
  footerLabel: string
  items: { id: string; title: string; body: string; badge?: string; icon?: React.ReactNode }[]
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <EmptyOk text={emptyText} />
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-2xl border p-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  {item.icon}
                  <p className="font-medium">{item.title}</p>
                </div>
                {item.badge ? <Badge className="border-transparent bg-destructive text-destructive-foreground">{item.badge}</Badge> : null}
              </div>
              <p className="mt-1 text-muted-foreground">{item.body}</p>
            </div>
          ))
        )}
        <Button variant="ghost" className="h-auto p-0 text-primary underline" asChild>
          <Link to={footerTo}>{footerLabel}</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function EmptyOk({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-950">
      <Check className="mt-0.5 size-5 shrink-0 text-emerald-600" />
      <p>{text}</p>
    </div>
  )
}
