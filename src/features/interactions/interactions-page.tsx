import { Edit3, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { formatDate } from '@/lib/formatters'
import { useCrmStore } from '@/store/crm-store'
import type { Interaction, MeetingTodo } from '@/types/domain'
import {
  InteractionFormDialog,
  type InteractionFormValues,
} from '@/features/interactions/interaction-form-dialog'

const now = new Date().toISOString()

export function InteractionsPage() {
  const interactions = useCrmStore((state) => state.interactions)
  const clients = useCrmStore((state) => state.clients)
  const users = useCrmStore((state) => state.users)
  const upsertInteraction = useCrmStore((state) => state.upsertInteraction)
  const deleteInteraction = useCrmStore((state) => state.deleteInteraction)
  const [selectedClient, setSelectedClient] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Interaction | undefined>()

  const filteredInteractions = useMemo(
    () =>
      [...interactions]
        .filter((interaction) => selectedClient === 'all' || interaction.clienteId === selectedClient)
        .sort((a, b) => b.fecha.localeCompare(a.fecha)),
    [interactions, selectedClient],
  )

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

  function handleSubmit(values: InteractionFormValues) {
    const pendientes = mergePendientes(values.pendientes, editing)
    upsertInteraction({
      ...(editing ?? {
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      }),
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
      createdAt: editing?.createdAt ?? now,
      updatedAt: now,
    })
    toast.success(editing ? 'Interacción actualizada' : 'Interacción creada')
    setDialogOpen(false)
    setEditing(undefined)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Interacciones"
        title="Timeline global y por cliente"
        description="Registro manual listo para futuras integraciones con WhatsApp, email, Google Calendar y Meet."
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" />
            Nueva interacción
          </Button>
        }
      />

      <div className="rounded-3xl border bg-white/80 p-4">
        <Select value={selectedClient} onChange={(event) => setSelectedClient(event.target.value)}>
          <option value="all">Todos los clientes</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.nombreCliente}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-4">
        {filteredInteractions.map((interaction) => {
          const client = clients.find((entry) => entry.id === interaction.clienteId)
          return (
            <Card key={interaction.id}>
              <CardContent className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{interaction.tipo}</Badge>
                      <p className="text-sm text-muted-foreground">{formatDate(interaction.fecha, 'dd MMM yyyy HH:mm')}</p>
                    </div>
                    <p className="mt-3 text-lg font-semibold">{interaction.titulo}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {client?.nombreCliente} · {users.find((user) => user.id === interaction.createdBy)?.nombre}
                    </p>
                    <p className="mt-4 text-sm">{interaction.descripcion}</p>
                    {interaction.proximaAccion ? (
                      <p className="mt-3 text-sm text-primary">Próxima acción: {interaction.proximaAccion}</p>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setEditing(interaction)
                        setDialogOpen(true)
                      }}
                    >
                      <Edit3 className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        deleteInteraction(interaction.id)
                        toast.success('Interacción eliminada')
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <InteractionFormDialog
        open={dialogOpen}
        onOpenChange={(value) => {
          setDialogOpen(value)
          if (!value) setEditing(undefined)
        }}
        interaction={editing}
        users={users}
        clients={clients}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
