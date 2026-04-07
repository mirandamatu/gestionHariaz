import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { OPERATIONAL_STATUSES } from '@/lib/constants'
import { getPlanCatalogItem } from '@/lib/plan-catalog'
import { useCrmStore } from '@/store/crm-store'
import type { Client, OperationalStatus } from '@/types/domain'
import { PipelineBoard } from '@/features/pipeline/pipeline-board'
import { ClientFormDialog, type ClientFormValues } from '@/features/clients/client-form-dialog'

export function OperationsPipelinePage() {
  const clients = useCrmStore((state) => state.clients)
  const upsertClient = useCrmStore((state) => state.upsertClient)
  const users = useCrmStore((state) => state.users)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | undefined>()
  const [query, setQuery] = useState('')
  const [responsable, setResponsable] = useState('all')

  const now = new Date().toISOString()

  const filtered = useMemo(
    () =>
      clients.filter((client) => {
        if (responsable !== 'all' && client.responsablePrincipal !== responsable) return false
        const search = [client.nombreCliente, client.estadoOperativo, client.bloqueoActual ?? '', client.proximaAccion ?? ''].join(' ').toLowerCase()
        return search.includes(query.trim().toLowerCase())
      }),
    [clients, query, responsable],
  )

  function handleSubmit(values: ClientFormValues) {
    const previous = editingClient

    upsertClient({
      ...(previous ?? {
        id: values.nombreCliente.toLowerCase().replaceAll(' ', '-'),
        empresa: values.nombreCliente,
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
      responsablePrincipal: values.responsablePrincipal,
      equipoInvolucrado: [values.responsablePrincipal],
      fechaProximoSeguimiento: values.fechaProximoSeguimiento || null,
      proximaAccion: values.proximaAccion || null,
      notasInternas: values.notasInternas || null,
      updatedAt: now,
    } as Client)

    toast.success(previous ? 'Cliente actualizado' : 'Cliente creado')
    setDialogOpen(false)
    setEditingClient(undefined)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pipeline"
        title="Pipeline operativo"
        description="Seguimiento visual de onboarding, bloqueos, activación y salud operativa con filtros rápidos por responsable."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Implementando" value={filtered.filter((client) => client.estadoOperativo === 'Implementando').length} />
        <MetricCard title="Esperando cliente" value={filtered.filter((client) => client.estadoOperativo === 'Esperando cliente').length} />
        <MetricCard title="En riesgo o pausado" value={filtered.filter((client) => ['En riesgo', 'Pausado'].includes(client.estadoOperativo)).length} />
      </div>
      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_220px]">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar cliente, bloqueo o próxima acción..." />
          <Select value={responsable} onChange={(event) => setResponsable(event.target.value)}>
            <option value="all">Todos los responsables</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.nombre}
              </option>
            ))}
          </Select>
        </CardContent>
      </Card>
      <PipelineBoard
        statuses={OPERATIONAL_STATUSES}
        clients={filtered}
        mode="operational"
        onEditClient={(client) => {
          setEditingClient(client)
          setDialogOpen(true)
        }}
        onMove={(clientId, status) => {
          const client = clients.find((entry) => entry.id === clientId)
          if (!client) return
          upsertClient({ ...client, estadoOperativo: status as OperationalStatus, updatedAt: new Date().toISOString() })
          toast.success(`"${client.nombreCliente}" actualizado a ${status}`)
        }}
      />

      <ClientFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        client={editingClient}
        users={users}
        onSubmit={handleSubmit}
      />
    </div>
  )
}

function MetricCard({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="mt-2 text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  )
}
