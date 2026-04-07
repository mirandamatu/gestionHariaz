import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { resolveUserName } from '@/lib/analytics'
import { formatDate } from '@/lib/formatters'
import { useCrmStore } from '@/store/crm-store'
import type { CommercialStatus, Task } from '@/types/domain'

const DEMO_STATUSES: CommercialStatus[] = ['Demo agendada', 'Demo realizada', 'Propuesta enviada']

function nextDemoTaskForClient(clientId: string, tasks: Task[]): Task | undefined {
  const demos = tasks.filter((t) => t.clienteId === clientId && t.tipo === 'demo')
  if (!demos.length) return undefined
  return [...demos].sort((a, b) => a.fecha.localeCompare(b.fecha))[0]
}

export function DemosPage() {
  const clients = useCrmStore((s) => s.clients)
  const users = useCrmStore((s) => s.users)
  const tasks = useCrmStore((s) => s.tasks)
  const upsertClient = useCrmStore((s) => s.upsertClient)
  const upsertTask = useCrmStore((s) => s.upsertTask)
  const snapshot = useMemo(
    () => ({ users, clients, contacts: [], interactions: [], payments: [], tasks, calendarEvents: [], manuals: [] }),
    [clients, tasks, users],
  )

  const [filterEstado, setFilterEstado] = useState<string>('all')
  const [filterResponsable, setFilterResponsable] = useState<string>('all')
  const [filterDesde, setFilterDesde] = useState('')
  const [filterHasta, setFilterHasta] = useState('')
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [scheduleClienteId, setScheduleClienteId] = useState('')
  const [scheduleFecha, setScheduleFecha] = useState('')
  const [scheduleHora, setScheduleHora] = useState('10:00')

  const demoClients = useMemo(
    () => clients.filter((c) => DEMO_STATUSES.includes(c.estadoComercial)),
    [clients],
  )

  const filtered = useMemo(() => {
    return demoClients.filter((c) => {
      if (filterEstado !== 'all' && c.estadoComercial !== filterEstado) return false
      if (filterResponsable !== 'all' && c.responsablePrincipal !== filterResponsable) return false
      const demo = nextDemoTaskForClient(c.id, tasks)
      const demoDate = demo?.fecha
      if (filterDesde && demoDate && demoDate < filterDesde) return false
      if (filterHasta && demoDate && demoDate > filterHasta) return false
      return true
    })
  }, [demoClients, filterDesde, filterEstado, filterHasta, filterResponsable, tasks])

  const summary = useMemo(
    () => ({
      agendadas: demoClients.filter((client) => client.estadoComercial === 'Demo agendada').length,
      realizadas: demoClients.filter((client) => client.estadoComercial === 'Demo realizada').length,
      propuestas: demoClients.filter((client) => client.estadoComercial === 'Propuesta enviada').length,
    }),
    [demoClients],
  )

  function agendarDemo() {
    const cid = scheduleClienteId || clients[0]?.id
    if (!cid) {
      toast.error('Seleccioná un cliente')
      return
    }
    if (!scheduleFecha.trim()) {
      toast.error('Indicá la fecha')
      return
    }
    const client = clients.find((c) => c.id === cid)
    if (!client) return
    const ts = new Date().toISOString()
    upsertTask({
      id: crypto.randomUUID(),
      clienteId: cid,
      titulo: `Demo — ${client.nombreCliente}`,
      descripcion: 'Demo agendada desde vista Demos',
      tipo: 'demo',
      fecha: scheduleFecha,
      hora: scheduleHora || '10:00',
      prioridad: 'Alta',
      estado: 'pendiente',
      visibleEnCalendario: true,
      asignadoA: client.responsablePrincipal || users[0]?.id || 'ponce',
      createdAt: ts,
      updatedAt: ts,
    })
    upsertClient({
      ...client,
      estadoComercial: 'Demo agendada',
      updatedAt: ts,
    })
    toast.success('Demo agendada')
    setScheduleOpen(false)
    setScheduleClienteId('')
    setScheduleFecha('')
    setScheduleHora('10:00')
  }

  function updateDemoStage(clientId: string, estado: CommercialStatus) {
    const client = clients.find((entry) => entry.id === clientId)
    if (!client) return
    upsertClient({
      ...client,
      estadoComercial: estado,
      updatedAt: new Date().toISOString(),
    })
    toast.success(`Estado actualizado a ${estado}`)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pipeline"
        title="Demos"
        description="Cuentas en etapa demo o propuesta: seguimiento rápido y agendado."
        actions={
          <Button
            onClick={() => {
              setScheduleClienteId(demoClients[0]?.id ?? clients[0]?.id ?? '')
              setScheduleOpen(true)
            }}
          >
            + Agendar demo
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StageCard title="Agendadas" value={summary.agendadas} active={filterEstado === 'Demo agendada'} onClick={() => setFilterEstado(filterEstado === 'Demo agendada' ? 'all' : 'Demo agendada')} />
        <StageCard title="Realizadas" value={summary.realizadas} active={filterEstado === 'Demo realizada'} onClick={() => setFilterEstado(filterEstado === 'Demo realizada' ? 'all' : 'Demo realizada')} />
        <StageCard title="Propuestas" value={summary.propuestas} active={filterEstado === 'Propuesta enviada'} onClick={() => setFilterEstado(filterEstado === 'Propuesta enviada' ? 'all' : 'Propuesta enviada')} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)}>
            <option value="all">Todos los estados</option>
            {DEMO_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <Select value={filterResponsable} onChange={(e) => setFilterResponsable(e.target.value)}>
            <option value="all">Todos los responsables</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre}
              </option>
            ))}
          </Select>
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Demo desde (fecha tarea)</p>
            <Input type="date" value={filterDesde} onChange={(e) => setFilterDesde(e.target.value)} />
          </div>
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Demo hasta</p>
            <Input type="date" value={filterHasta} onChange={(e) => setFilterHasta(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((c) => {
          const demo = nextDemoTaskForClient(c.id, tasks)
          return (
            <Card key={c.id}>
              <CardHeader className="space-y-2">
                <CardTitle className="text-lg">{c.nombreCliente}</CardTitle>
                <Badge className="border-muted-foreground/30 bg-muted text-muted-foreground">{c.estadoComercial}</Badge>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Fecha demo (tarea)</p>
                  <p className="font-medium">
                    {demo ? `${formatDate(demo.fecha)}${demo.hora ? ` · ${demo.hora}` : ''}` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Responsable</p>
                  <p className="font-medium">{resolveUserName(snapshot, c.responsablePrincipal)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Notas</p>
                  <p>{c.notasInternas ?? '—'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {c.estadoComercial !== 'Demo realizada' ? (
                    <Button size="sm" variant="secondary" onClick={() => updateDemoStage(c.id, 'Demo realizada')}>
                      Marcar realizada
                    </Button>
                  ) : null}
                  {c.estadoComercial !== 'Propuesta enviada' ? (
                    <Button size="sm" variant="outline" onClick={() => updateDemoStage(c.id, 'Propuesta enviada')}>
                      Pasar a propuesta
                    </Button>
                  ) : null}
                  <Button size="sm" variant="ghost" asChild>
                    <Link to={`/clientes/${c.id}`}>Ver cliente</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">No hay cuentas que coincidan con los filtros.</p>
      ) : null}

      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agendar demo</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <p className="mb-1 text-sm text-muted-foreground">Cliente</p>
              <Select value={scheduleClienteId} onChange={(e) => setScheduleClienteId(e.target.value)}>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombreCliente}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <p className="mb-1 text-sm text-muted-foreground">Fecha</p>
                <Input type="date" value={scheduleFecha} onChange={(e) => setScheduleFecha(e.target.value)} />
              </div>
              <div className="w-32">
                <p className="mb-1 text-sm text-muted-foreground">Hora</p>
                <Input type="time" value={scheduleHora} onChange={(e) => setScheduleHora(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="button" onClick={agendarDemo}>
                Guardar
              </Button>
              <Button type="button" variant="ghost" onClick={() => setScheduleOpen(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StageCard({
  title,
  value,
  active,
  onClick,
}: {
  title: string
  value: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-3xl border p-4 text-left transition ${active ? 'border-primary bg-primary/5' : 'bg-white/80 hover:bg-white'}`}
    >
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </button>
  )
}
