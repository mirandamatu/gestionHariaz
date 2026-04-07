import { useEffect, useMemo, useRef, useState } from 'react'
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Edit3, GripVertical } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { commercialStatusTone, operationalStatusTone, priorityTone, riskTone } from '@/lib/formatters'
import { useCrmStore } from '@/store/crm-store'
import type { Client, CommercialStatus, OperationalStatus } from '@/types/domain'

function DroppableColumn({
  id,
  title,
  count,
  toneClassName,
  children,
}: {
  id: string
  title: string
  count: number
  toneClassName?: string
  children: React.ReactNode
}) {
  const { isOver, setNodeRef } = useDroppable({ id })
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-w-[280px] flex-1 rounded-3xl border bg-white/75 p-4',
        isOver && 'border-primary bg-primary/5',
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className={cn('inline-flex items-center rounded-lg border px-3 py-1 text-sm font-semibold', toneClassName)}>
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">{count} clientes</p>
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function DraggableCard({
  client,
  mode,
  onEditClient,
}: {
  client: Client
  mode: 'commercial' | 'operational'
  onEditClient: (client: Client) => void
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: client.id })
  const users = useCrmStore((state) => state.users)
  const responsible = users.find((user) => user.id === client.responsablePrincipal)?.nombre ?? 'Sin asignar'

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform) }}>
      <Card className="active:cursor-grabbing">
        <CardContent className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{client.nombreCliente}</p>
              <p className="text-sm text-muted-foreground">{client.plan} · {client.pais ?? 'Sin país'}</p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={(event) => {
                  event.stopPropagation()
                  onEditClient(client)
                }}
                onPointerDown={(event) => event.stopPropagation()}
              >
                <Edit3 className="size-4" />
              </Button>

              <GripVertical
                className="size-4 cursor-grab text-muted-foreground active:cursor-grabbing"
                aria-label={`Arrastrar ${client.nombreCliente}`}
                {...listeners}
                {...attributes}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge className={priorityTone(client.prioridad)}>{client.prioridad}</Badge>
            {client.nivelRiesgo ? (
              <Badge className={riskTone(client.nivelRiesgo)}>{client.nivelRiesgo}</Badge>
            ) : null}
          </div>

          {mode === 'commercial' ? (
            <>
              <p className="text-sm text-muted-foreground">Próxima acción: {client.proximaAccion ?? 'Pendiente definir'}</p>
              <p className="text-sm text-muted-foreground">
                Responsable: {responsible}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Bloqueo: {client.bloqueoActual ?? 'Sin bloqueos activos'}</p>
              <p className="text-sm text-muted-foreground">
                Seguimiento: {client.fechaProximoSeguimiento ?? 'Pendiente'}
              </p>
            </>
          )}

          <Button variant="ghost" className="h-auto justify-start px-0 text-primary underline" asChild>
            <Link to={`/clientes/${client.id}`}>Abrir ficha</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export function PipelineBoard({
  statuses,
  clients,
  mode,
  onMove,
  onEditClient,
}: {
  statuses: (CommercialStatus | OperationalStatus)[]
  clients: Client[]
  mode: 'commercial' | 'operational'
  onMove: (clientId: string, status: CommercialStatus | OperationalStatus) => void
  onEditClient: (client: Client) => void
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const [scrollMax, setScrollMax] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)

  const updateScroll = useMemo(
    () => () => {
      const el = scrollerRef.current
      if (!el) return
      const max = Math.max(0, el.scrollWidth - el.clientWidth)
      setScrollMax(max)
      setScrollLeft(el.scrollLeft)
    },
    [],
  )

  useEffect(() => {
    updateScroll()

    const el = scrollerRef.current
    if (!el) return

    const handleScroll = () => setScrollLeft(el.scrollLeft)
    el.addEventListener('scroll', handleScroll, { passive: true })

    const handleResize = () => updateScroll()
    window.addEventListener('resize', handleResize)

    return () => {
      el.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [updateScroll, statuses, mode, clients.length])

  return (
    <DndContext
      onDragEnd={({ active, over }) => {
        if (!over || active.id === over.id) return
        onMove(String(active.id), String(over.id) as CommercialStatus | OperationalStatus)
      }}
    >
      <div className="space-y-2">
        <input
          aria-label="Deslizar para ver el pipeline"
          type="range"
          min={0}
          max={scrollMax}
          step={1}
          value={scrollLeft}
          onChange={(event) => {
            const val = Number(event.target.value)
            const el = scrollerRef.current
            if (!el) return
            el.scrollLeft = val
            setScrollLeft(val)
          }}
          className="h-1 w-full accent-primary"
        />

        <div ref={scrollerRef} className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar-x">
          {statuses.map((status) => {
            const items = clients.filter((client) =>
              mode === 'commercial' ? client.estadoComercial === status : client.estadoOperativo === status,
            )

            const toneClassName =
              mode === 'commercial'
                ? commercialStatusTone(status as CommercialStatus)
                : operationalStatusTone(status as OperationalStatus)

            return (
              <DroppableColumn
                key={status}
                id={status}
                title={status}
                count={items.length}
                toneClassName={toneClassName}
              >
                {items.map((client) => (
                  <DraggableCard
                    key={client.id}
                    client={client}
                    mode={mode}
                    onEditClient={onEditClient}
                  />
                ))}
              </DroppableColumn>
            )
          })}
        </div>
      </div>
    </DndContext>
  )
}
