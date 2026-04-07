import type { ColumnDef } from '@tanstack/react-table'
import { Edit3, Eye, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { DataTable } from '@/components/data-table'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  InteractionFormDialog,
  type InteractionFormValues,
} from '@/features/interactions/interaction-form-dialog'
import { MeetingTodosEditor } from '@/features/interactions/meeting-todos-editor'
import { PLAN_NAMES } from '@/lib/constants'
import { localDateKey, seguimientoToneClass } from '@/lib/briefing'
import { formatDate, riskTone, statusLabel } from '@/lib/formatters'
import { getPlanCatalogItem } from '@/lib/plan-catalog'
import { useCrmStore } from '@/store/crm-store'
import type { Client, Interaction, MeetingTodo, PlanName } from '@/types/domain'
import { ClientFormDialog, type ClientFormValues } from '@/features/clients/client-form-dialog'

const now = new Date().toISOString()

function mergePendientes(
  rows: { todoId?: string; texto: string }[],
  existing: Interaction | undefined,
): MeetingTodo[] {
  const out: MeetingTodo[] = []
  for (const r of rows) {
    const texto = r.texto.trim()
    if (!texto) continue
    const id = r.todoId?.trim() || crypto.randomUUID()
    const prev = existing?.pendientes.find((p) => p.id === id)
    out.push({
      id,
      texto,
      completado: prev?.completado ?? false,
      completadoAt: prev?.completadoAt ?? null,
    })
  }
  return out
}

export function ClientsPage() {
  const clients = useCrmStore((state) => state.clients)
  const users = useCrmStore((state) => state.users)
  const interactions = useCrmStore((state) => state.interactions)
  const upsertClient = useCrmStore((state) => state.upsertClient)
  const upsertInteraction = useCrmStore((state) => state.upsertInteraction)
  const deleteClient = useCrmStore((state) => state.deleteClient)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [selectedPlan, setSelectedPlan] = useState('all')
  const [selectedRisk, setSelectedRisk] = useState('all')
  const selectedFocus = searchParams.get('focus') ?? 'all'

  const todayKey = useMemo(() => localDateKey(new Date()), [])

  useEffect(() => {
    const plan = searchParams.get('plan')
    if (!plan) {
      setSelectedPlan('all')
      return
    }
    if (PLAN_NAMES.includes(plan as PlanName)) {
      setSelectedPlan(plan)
      return
    }
    setSelectedPlan('all')
  }, [searchParams])

  function handlePlanFilterChange(value: string) {
    setSelectedPlan(value)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value === 'all') next.delete('plan')
      else next.set('plan', value)
      return next
    })
  }

  function handleFocusChange(value: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value === 'all') next.delete('focus')
      else next.set('focus', value)
      return next
    })
  }
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | undefined>()
  const [pendientesClient, setPendientesClient] = useState<Client | null>(null)
  const [interactionQuickOpen, setInteractionQuickOpen] = useState(false)
  const [defaultClienteForInteraction, setDefaultClienteForInteraction] = useState<string | undefined>()

  const filteredClients = useMemo(
    () =>
      clients.filter((client) => {
        const searchable = [
          client.nombreCliente,
          client.pais ?? '',
          client.rubro ?? '',
          client.plan,
          client.estadoComercial,
          client.estadoOperativo,
        ]
          .join(' ')
          .toLowerCase()

        const matchesQuery = searchable.includes(query.toLowerCase())
        const matchesPlan = selectedPlan === 'all' || client.plan === selectedPlan
        const matchesRisk =
          selectedRisk === 'all'
            ? true
            : selectedRisk === 'none'
              ? !client.nivelRiesgo
              : client.nivelRiesgo === selectedRisk
        const hasUrgentFollowUp =
          client.fechaProximoSeguimiento && client.fechaProximoSeguimiento.slice(0, 10) <= todayKey
        const matchesFocus =
          selectedFocus === 'all'
            ? true
            : selectedFocus === 'seguimientos'
              ? Boolean(hasUrgentFollowUp)
              : selectedFocus === 'bloqueados'
                ? Boolean(client.bloqueoActual)
                : selectedFocus === 'riesgo'
                  ? Boolean(client.nivelRiesgo)
                  : selectedFocus === 'demos'
                    ? ['Demo agendada', 'Demo realizada', 'Propuesta enviada'].includes(client.estadoComercial)
                    : selectedFocus === 'sin-accion'
                      ? !client.proximaAccion
                      : true
        return matchesQuery && matchesPlan && matchesRisk && matchesFocus
      }),
    [clients, query, selectedPlan, selectedRisk, selectedFocus, todayKey],
  )

  const focusStats = useMemo(
    () => ({
      seguimientos: clients.filter((client) => client.fechaProximoSeguimiento && client.fechaProximoSeguimiento.slice(0, 10) <= todayKey).length,
      bloqueados: clients.filter((client) => client.bloqueoActual).length,
      riesgo: clients.filter((client) => client.nivelRiesgo).length,
      demos: clients.filter((client) => ['Demo agendada', 'Demo realizada', 'Propuesta enviada'].includes(client.estadoComercial)).length,
      sinAccion: clients.filter((client) => !client.proximaAccion).length,
    }),
    [clients, todayKey],
  )

  const interactionsForPendientes = useMemo(() => {
    if (!pendientesClient) return []
    return interactions.filter((i) => i.clienteId === pendientesClient.id && i.pendientes.length > 0)
  }, [interactions, pendientesClient])

  const columns = useMemo<ColumnDef<Client>[]>(
    () => [
      {
        accessorKey: 'nombreCliente',
        header: 'Cliente',
        cell: ({ row }) => (
          <Link
            to={`/clientes/${row.original.id}`}
            className="block min-w-[180px] rounded-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="font-medium text-primary">{row.original.nombreCliente}</p>
          </Link>
        ),
      },
      {
        id: 'quick',
        header: '',
        cell: ({ row }) => (
          <div
            className="flex min-w-[220px] justify-end gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
            onClick={(event) => event.stopPropagation()}
          >
            <Button type="button" size="sm" variant="secondary" onClick={() => setPendientesClient(row.original)}>
              📋 Pendientes
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setDefaultClienteForInteraction(row.original.id)
                setInteractionQuickOpen(true)
              }}
            >
              📞 Interacción
            </Button>
          </div>
        ),
      },
      {
        accessorKey: 'pais',
        header: 'País',
        cell: ({ row }) => <div className="min-w-[110px]">{row.original.pais ?? '—'}</div>,
      },
      {
        accessorKey: 'rubro',
        header: 'Rubro',
        cell: ({ row }) => <div className="min-w-[170px]">{row.original.rubro ?? '—'}</div>,
      },
      {
        accessorKey: 'tamanoCliente',
        header: 'Tamaño',
        cell: ({ row }) => <div className="min-w-[110px]">{row.original.tamanoCliente ?? '—'}</div>,
      },
      {
        accessorKey: 'plan',
        header: 'Plan',
        cell: ({ row }) => <div className="min-w-[80px]">{row.original.plan}</div>,
      },
      {
        accessorKey: 'estadoComercial',
        header: 'Estado comercial',
        cell: ({ row }) => (
          <div className="min-w-[140px]">
            <Badge>{row.original.estadoComercial}</Badge>
          </div>
        ),
      },
      {
        accessorKey: 'estadoOperativo',
        header: 'Estado operativo',
        cell: ({ row }) => (
          <div className="min-w-[145px]">
            <Badge>{row.original.estadoOperativo}</Badge>
          </div>
        ),
      },
      {
        accessorKey: 'estadoPago',
        header: 'Pago',
        cell: ({ row }) => (
          <div className="min-w-[90px]">
            <Badge>{statusLabel(row.original.estadoPago)}</Badge>
          </div>
        ),
      },
      {
        accessorKey: 'responsablePrincipal',
        header: 'Responsable',
        cell: ({ row }) =>
          users.find((user) => user.id === row.original.responsablePrincipal)?.nombre ?? 'Sin asignar',
      },
      {
        accessorKey: 'proximaAccion',
        header: 'Próxima acción',
        cell: ({ row }) => (
          <div className="min-w-[240px] whitespace-normal">
            <span className={row.original.proximaAccion ? '' : 'text-sm text-muted-foreground'}>
              {row.original.proximaAccion ?? 'Definir siguiente paso'}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'fechaProximoSeguimiento',
        header: 'Seguimiento',
        cell: ({ row }) => (
          <span className={seguimientoToneClass(row.original.fechaProximoSeguimiento, todayKey)}>
            {formatDate(row.original.fechaProximoSeguimiento)}
          </span>
        ),
      },
      {
        accessorKey: 'nivelRiesgo',
        header: 'Riesgo',
        cell: ({ row }) =>
          row.original.nivelRiesgo ? (
            <Badge className={riskTone(row.original.nivelRiesgo)}>{row.original.nivelRiesgo}</Badge>
          ) : (
            <span className="text-sm text-muted-foreground">Sin marcar</span>
          ),
      },
      {
        id: 'actions',
        header: 'Acciones',
        cell: ({ row }) => (
          <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
            <Button variant="outline" size="icon" asChild>
              <Link to={`/clientes/${row.original.id}`}>
                <Eye className="size-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setEditingClient(row.original)
                setDialogOpen(true)
              }}
            >
              <Edit3 className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                deleteClient(row.original.id)
                toast.success('Cliente eliminado del repositorio mock')
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ),
      },
    ],
    [deleteClient, todayKey, users],
  )

  function handleSubmit(values: ClientFormValues) {
    const previous = editingClient
    try {
      upsertClient({
        ...(previous ?? {
          id: values.nombreCliente.toLowerCase().replaceAll(' ', '-'),
          empresa: values.nombreCliente,
          tamanoCliente: null,
          descripcion: null,
          origenLead: 'manual',
          nivelRiesgo: null,
          equipoInvolucrado: [values.responsablePrincipal],
          precio: getPlanCatalogItem(values.plan).monthlyPrice || null,
          moneda: 'USD',
          descuento: null,
          conversacionesIncluidas: null,
          limiteMensual: null,
          modalidadEspecial: null,
          cantidadNumeros: 1,
          integraciones: [],
          modalidadPago: 'pendiente',
          frecuenciaPago: 'pendiente',
          proximaFechaCobro: null,
          fechaUltimoPago: null,
          fechaPrimerContacto: now,
          fechaCierre: null,
          fechaInicioImplementacion: null,
          fechaEstimadaImplementacion: null,
          fechaImplementacionReal: null,
          fechaUltimoContacto: now,
          activo: true,
          createdAt: now,
          updatedAt: now,
          motivoDemora: null,
          bloqueoActual: null,
          credenciales: [],
        }),
        ...previous,
        nombreCliente: values.nombreCliente,
        empresa: values.nombreCliente,
        pais: values.pais || null,
        rubro: values.rubro || null,
        plan: values.plan,
        precio: previous?.precio ?? (getPlanCatalogItem(values.plan).monthlyPrice || null),
        estadoComercial: values.estadoComercial,
        estadoOperativo: values.estadoOperativo,
        estadoPago: values.estadoPago,
        prioridad: values.prioridad,
        nivelRiesgo: values.nivelRiesgo || null,
        responsablePrincipal: values.responsablePrincipal || null,
        equipoInvolucrado: [values.responsablePrincipal].filter(Boolean),
        fechaProximoSeguimiento: values.fechaProximoSeguimiento || null,
        proximaAccion: values.proximaAccion || null,
        notasInternas: values.notasInternas || null,
        updatedAt: now,
      } as Client)
      toast.success(previous ? 'Cliente actualizado' : 'Cliente creado')
      setDialogOpen(false)
      setEditingClient(undefined)
    } catch (error) {
      console.error(error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'No se pudo guardar (p. ej. límite de almacenamiento del navegador).',
      )
    }
  }

  function handleQuickInteractionSubmit(values: InteractionFormValues) {
    const pendientes = mergePendientes(values.pendientes, undefined)
    upsertInteraction({
      id: crypto.randomUUID(),
      clienteId: values.clienteId,
      tipo: values.tipo,
      fecha: new Date(values.fecha).toISOString(),
      titulo: values.titulo,
      descripcion: values.descripcion,
      resultado: values.resultado || null,
      proximaAccion: values.proximaAccion || null,
      fechaProximoSeguimiento: values.fechaProximoSeguimiento || null,
      pendientes,
      visibleEnCalendario: values.visibleEnCalendario,
      fechaEvento:
        values.visibleEnCalendario && values.fechaEvento?.trim()
          ? new Date(values.fechaEvento).toISOString()
          : null,
      createdBy: values.createdBy,
      createdAt: now,
      updatedAt: now,
    })
    toast.success('Interacción creada')
    setInteractionQuickOpen(false)
    setDefaultClienteForInteraction(undefined)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Clientes"
        title={selectedPlan === 'all' ? 'Todos los clientes' : `Clientes · Plan ${selectedPlan}`}
        description={
          selectedFocus === 'seguimientos'
            ? 'Vista priorizada de cuentas con seguimiento vencido o para hoy.'
            : selectedFocus === 'bloqueados'
              ? 'Cuentas operativas que necesitan destrabe o resolución.'
              : selectedFocus === 'riesgo'
                ? 'Clientes donde el equipo cargó riesgo manual.'
                : selectedFocus === 'sin-accion'
                  ? 'Cuentas sin próximo paso definido, listas para ordenar.'
                  : selectedPlan === 'all'
                    ? 'Listado ejecutivo. Podés filtrar por plan, riesgo manual, foco operativo o búsqueda.'
                    : `Solo cuentas con plan ${selectedPlan}.`
        }
        actions={
          <Button
            onClick={() => {
              setEditingClient(undefined)
              setDialogOpen(true)
            }}
          >
            <Plus className="size-4" />
            Nuevo cliente
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <FocusCard title="Seguimientos urgentes" value={focusStats.seguimientos} active={selectedFocus === 'seguimientos'} onClick={() => handleFocusChange('seguimientos')} />
        <FocusCard title="Bloqueados" value={focusStats.bloqueados} active={selectedFocus === 'bloqueados'} onClick={() => handleFocusChange('bloqueados')} />
        <FocusCard title="Riesgo manual" value={focusStats.riesgo} active={selectedFocus === 'riesgo'} onClick={() => handleFocusChange('riesgo')} />
        <FocusCard title="Demos" value={focusStats.demos} active={selectedFocus === 'demos'} onClick={() => handleFocusChange('demos')} />
        <FocusCard title="Sin próxima acción" value={focusStats.sinAccion} active={selectedFocus === 'sin-accion'} onClick={() => handleFocusChange('sin-accion')} />
      </div>

      <div className="grid gap-3 rounded-3xl border bg-white/80 p-4 lg:grid-cols-[minmax(0,1fr)_180px_180px]">
        <Input placeholder="Buscar cliente, país, rubro, plan..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <Select value={selectedPlan} onChange={(event) => handlePlanFilterChange(event.target.value)}>
          <option value="all">Todos los planes</option>
          {PLAN_NAMES.map((plan) => (
            <option key={plan} value={plan}>
              {plan}
            </option>
          ))}
        </Select>
        <Select value={selectedRisk} onChange={(event) => setSelectedRisk(event.target.value)}>
          <option value="all">Todo el riesgo manual</option>
          <option value="none">Sin riesgo cargado</option>
          <option value="Bajo">Bajo</option>
          <option value="Medio">Medio</option>
          <option value="Alto">Alto</option>
          <option value="Crítico">Crítico</option>
        </Select>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant={selectedFocus === 'all' ? 'secondary' : 'outline'} onClick={() => handleFocusChange('all')}>
          Todo
        </Button>
        <Button type="button" variant={selectedFocus === 'seguimientos' ? 'secondary' : 'outline'} onClick={() => handleFocusChange('seguimientos')}>
          Seguimiento
        </Button>
        <Button type="button" variant={selectedFocus === 'bloqueados' ? 'secondary' : 'outline'} onClick={() => handleFocusChange('bloqueados')}>
          Bloqueo
        </Button>
        <Button type="button" variant={selectedFocus === 'riesgo' ? 'secondary' : 'outline'} onClick={() => handleFocusChange('riesgo')}>
          Riesgo
        </Button>
        <Button type="button" variant={selectedFocus === 'demos' ? 'secondary' : 'outline'} onClick={() => handleFocusChange('demos')}>
          Demos
        </Button>
        <Button type="button" variant={selectedFocus === 'sin-accion' ? 'secondary' : 'outline'} onClick={() => handleFocusChange('sin-accion')}>
          Sin próxima acción
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={filteredClients}
        onRowClick={(client) => navigate(`/clientes/${client.id}`)}
        getRowClassName={(client) =>
          `cursor-pointer ${client.bloqueoActual ? 'bg-amber-50/40' : client.fechaProximoSeguimiento && client.fechaProximoSeguimiento.slice(0, 10) <= todayKey ? 'bg-red-50/30' : ''}`
        }
      />

      <ClientFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        client={editingClient}
        users={users}
        onSubmit={handleSubmit}
      />

      <Dialog open={Boolean(pendientesClient)} onOpenChange={(open) => !open && setPendientesClient(null)}>
        <DialogContent className="max-h-[min(90vh,640px)] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pendientes de reuniones · {pendientesClient?.nombreCliente}</DialogTitle>
          </DialogHeader>
          {pendientesClient ? (
            <div className="space-y-6">
              {interactionsForPendientes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay interacciones con pendientes para este cliente.</p>
              ) : (
                interactionsForPendientes.map((i) => (
                  <div key={i.id} className="rounded-2xl border p-4">
                    <p className="font-semibold">{i.titulo}</p>
                    <div className="mt-3">
                      <MeetingTodosEditor
                        compact
                        interactionId={i.id}
                        clientName={pendientesClient.nombreCliente}
                        title={i.titulo}
                        fechaEvento={i.fechaEvento}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <InteractionFormDialog
        open={interactionQuickOpen}
        onOpenChange={(open) => {
          setInteractionQuickOpen(open)
          if (!open) setDefaultClienteForInteraction(undefined)
        }}
        users={users}
        clients={clients}
        defaultClienteId={defaultClienteForInteraction}
        onSubmit={handleQuickInteractionSubmit}
      />
    </div>
  )
}

function FocusCard({
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
