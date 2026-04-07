import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import timeGridPlugin from '@fullcalendar/timegrid'
import { useMemo, useState } from 'react'

import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { MeetingTodosEditor } from '@/features/interactions/meeting-todos-editor'
import { resolveUserName } from '@/lib/analytics'
import { formatDate, statusLabel } from '@/lib/formatters'
import { localDateKey } from '@/lib/briefing'
import { useCrmStore } from '@/store/crm-store'

const MEETING_EVENT_BG = '#ea580c'
const MEETING_EVENT_BORDER = '#c2410c'

interface CalendarEventDetail {
  id: string
  title: string
  clientName: string
  description: string
  start: string
  end: string
  typeLabel: string
  ownerName: string
  statusLabel?: string
}

function interactionEventId(rawId: string) {
  return `interaction-${rawId}`
}

export function CalendarPage() {
  const tasks = useCrmStore((state) => state.tasks)
  const payments = useCrmStore((state) => state.payments)
  const clients = useCrmStore((state) => state.clients)
  const users = useCrmStore((state) => state.users)
  const interactions = useCrmStore((state) => state.interactions)
  const calendarEvents = useCrmStore((state) => state.calendarEvents)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventDetail | null>(null)
  const [meetingInteractionId, setMeetingInteractionId] = useState<string | null>(null)
  const todayKey = useMemo(() => localDateKey(new Date()), [])

  const events = useMemo(
    () => [
      ...tasks
        .filter((task) => task.visibleEnCalendario)
        .map((task) => ({
          id: task.id,
          title: task.titulo,
          start: `${task.fecha}T${task.hora ?? '09:00'}:00`,
          end: `${task.fecha}T${task.hora ?? '10:00'}:00`,
          backgroundColor: '#2563eb',
          borderColor: '#1d4ed8',
          extendedProps: {
            kind: 'task' as const,
            clientName: task.clienteId
              ? clients.find((client) => client.id === task.clienteId)?.nombreCliente ?? 'Cliente no encontrado'
              : 'Tarea interna',
            description: task.descripcion ?? 'Sin descripción cargada para esta tarea.',
            typeLabel: `Tarea · ${task.tipo}`,
            ownerName: resolveUserName(
              { users, clients, contacts: [], interactions: [], payments, tasks, calendarEvents: [], manuals: [] },
              task.asignadoA,
            ),
            statusLabel: task.estado,
          },
        })),
      ...payments.map((payment) => ({
        id: `due-${payment.id}`,
        title: `Cobro · ${clients.find((client) => client.id === payment.clienteId)?.nombreCliente ?? 'Cliente'}`,
        start: payment.fechaVencimiento,
        end: payment.fechaVencimiento,
        backgroundColor: '#7c3aed',
        borderColor: '#6d28d9',
        extendedProps: {
          kind: 'payment' as const,
          clientName: clients.find((client) => client.id === payment.clienteId)?.nombreCliente ?? 'Cliente no encontrado',
          description: payment.observaciones ?? 'Sin observaciones adicionales para este cobro.',
          typeLabel: 'Cobro',
          ownerName: 'Equipo administrativo',
          statusLabel: statusLabel(payment.estado),
        },
      })),
      ...interactions
        .filter(
          (i) =>
            i.visibleEnCalendario &&
            i.fechaEvento &&
            i.pendientes.length > 0 &&
            i.pendientes.some((p) => !p.completado),
        )
        .map((i) => {
          const start = i.fechaEvento!
          const end = new Date(new Date(start).getTime() + 60 * 60 * 1000).toISOString()
          return {
            id: interactionEventId(i.id),
            title: `Reunión · ${i.titulo}`,
            start,
            end,
            backgroundColor: MEETING_EVENT_BG,
            borderColor: MEETING_EVENT_BORDER,
            extendedProps: {
              kind: 'interaction' as const,
              interactionId: i.id,
              clientName: clients.find((c) => c.id === i.clienteId)?.nombreCliente ?? 'Cliente',
              description: i.descripcion,
              typeLabel: 'Reunión (pendientes)',
              ownerName: resolveUserName(
                { users, clients, contacts: [], interactions: [], payments, tasks, calendarEvents: [], manuals: [] },
                i.createdBy,
              ),
            },
          }
        }),
    ],
    [clients, calendarEvents, interactions, payments, tasks, users],
  )

  const meetingInteraction = meetingInteractionId
    ? interactions.find((i) => i.id === meetingInteractionId)
    : undefined
  const meetingClientName = meetingInteraction
    ? clients.find((c) => c.id === meetingInteraction.clienteId)?.nombreCliente ?? 'Cliente'
    : ''
  const summary = useMemo(
    () => ({
      tareasHoy: tasks.filter((task) => task.visibleEnCalendario && task.fecha === todayKey).length,
      reunionesPendientes: interactions.filter(
        (interaction) =>
          interaction.visibleEnCalendario &&
          interaction.fechaEvento &&
          interaction.fechaEvento.slice(0, 10) === todayKey &&
          interaction.pendientes.some((todo) => !todo.completado),
      ).length,
      cobrosHoy: payments.filter((payment) => payment.fechaVencimiento.slice(0, 10) === todayKey).length,
    }),
    [interactions, payments, tasks, todayKey],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Calendario"
        title="Agenda operativa y comercial"
        description="Vista diaria para ejecutar: tareas calendarizadas, reuniones con pendientes y cobros a revisar."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard title="Tareas de hoy" value={summary.tareasHoy} />
        <SummaryCard title="Reuniones con pendientes" value={summary.reunionesPendientes} />
        <SummaryCard title="Cobros de hoy" value={summary.cobrosHoy} />
      </div>
      <Card>
        <CardContent className="p-4">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            events={events}
            height="auto"
            locale="es"
            eventClick={({ event }) => {
              const kind = event.extendedProps.kind as string | undefined
              if (kind === 'interaction' && typeof event.extendedProps.interactionId === 'string') {
                setMeetingInteractionId(event.extendedProps.interactionId)
                setSelectedEvent(null)
                return
              }
              setMeetingInteractionId(null)
              setSelectedEvent({
                id: event.id,
                title: event.title,
                clientName: String(event.extendedProps.clientName ?? 'Sin cliente'),
                description: String(event.extendedProps.description ?? 'Sin descripción'),
                start: event.startStr,
                end: event.endStr || event.startStr,
                typeLabel: String(event.extendedProps.typeLabel ?? 'Evento'),
                ownerName: String(event.extendedProps.ownerName ?? 'Sin responsable'),
                statusLabel:
                  typeof event.extendedProps.statusLabel === 'string' ? event.extendedProps.statusLabel : undefined,
              })
            }}
          />
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedEvent)} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
            <DialogDescription>
              {selectedEvent?.clientName} · {selectedEvent?.typeLabel}
            </DialogDescription>
          </DialogHeader>
          {selectedEvent ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge>{selectedEvent.typeLabel}</Badge>
                {selectedEvent.statusLabel ? (
                  <Badge className="border-muted-foreground/30 bg-muted text-muted-foreground">{selectedEvent.statusLabel}</Badge>
                ) : null}
              </div>
              <div className="grid gap-4 rounded-3xl border bg-secondary/20 p-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Fecha</p>
                  <p className="mt-1 font-medium">{formatDate(selectedEvent.start, 'dd MMM yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Horario</p>
                  <p className="mt-1 font-medium">
                    {formatDate(selectedEvent.start, 'HH:mm')}
                    {selectedEvent.end !== selectedEvent.start
                      ? ` - ${formatDate(selectedEvent.end, 'HH:mm')}`
                      : ''}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="mt-1 font-medium">{selectedEvent.clientName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Responsable</p>
                  <p className="mt-1 font-medium">{selectedEvent.ownerName}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Descripción</p>
                <p className="mt-2 rounded-3xl border bg-white p-4 text-sm leading-6">{selectedEvent.description}</p>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(meetingInteractionId)} onOpenChange={(open) => !open && setMeetingInteractionId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Pendientes de reunión</DialogTitle>
            <DialogDescription>Marcá los ítems completados; al terminar todos, el evento sale del calendario.</DialogDescription>
          </DialogHeader>
          {meetingInteractionId && meetingInteraction ? (
            <MeetingTodosEditor
              interactionId={meetingInteractionId}
              clientName={meetingClientName}
              title={meetingInteraction.titulo}
              fechaEvento={meetingInteraction.fechaEvento}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SummaryCard({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="mt-2 text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  )
}
