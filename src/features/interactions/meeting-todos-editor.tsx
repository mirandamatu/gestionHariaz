import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/formatters'
import { useCrmStore } from '@/store/crm-store'

export function MeetingTodosEditor({
  interactionId,
  clientName,
  title,
  fechaEvento,
  compact = false,
}: {
  interactionId: string
  clientName: string
  title: string
  fechaEvento: string | null
  compact?: boolean
}) {
  const interaction = useCrmStore((s) => s.interactions.find((i) => i.id === interactionId))
  const updateMeetingTodo = useCrmStore((s) => s.updateMeetingTodo)
  const addMeetingTodoToInteraction = useCrmStore((s) => s.addMeetingTodoToInteraction)
  const [draft, setDraft] = useState('')

  function toggle(id: string, next: boolean) {
    if (!interaction) return
    const incomplete = interaction.pendientes.filter((p) => !p.completado)
    const isLastCompletion = next && incomplete.length === 1 && incomplete[0].id === id
    updateMeetingTodo(interactionId, id, next)
    if (isLastCompletion) {
      toast.success('✅ Reunión completada — desaparecerá del calendario')
    }
  }

  function add() {
    addMeetingTodoToInteraction(interactionId, draft)
    setDraft('')
  }

  if (!interaction) return null

  return (
    <div className="space-y-4">
      {!compact ? (
        <>
          <div>
            <p className="text-sm text-muted-foreground">Cliente</p>
            <p className="font-medium">{clientName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Reunión</p>
            <p className="text-lg font-semibold">{title}</p>
            {fechaEvento ? (
              <p className="text-sm text-muted-foreground">{formatDate(fechaEvento, 'dd MMM yyyy HH:mm')}</p>
            ) : null}
          </div>
        </>
      ) : null}
      <div className="space-y-3">
        <p className="text-sm font-medium">Pendientes</p>
        <ul className="space-y-3">
          {interaction.pendientes.map((p) => (
            <li key={p.id} className="flex items-start gap-3 rounded-2xl border bg-secondary/10 p-3">
              <input
                type="checkbox"
                className="mt-1 size-5 shrink-0 cursor-pointer accent-primary"
                checked={p.completado}
                onChange={(e) => toggle(p.id, e.target.checked)}
              />
              <span className={p.completado ? 'text-muted-foreground line-through' : 'font-medium'}>{p.texto}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          value={draft}
          placeholder="Nuevo pendiente…"
          className="min-h-11 flex-1"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
        />
        <Button type="button" variant="secondary" className="min-h-11" onClick={add} disabled={!draft.trim()}>
          + Agregar pendiente
        </Button>
      </div>
    </div>
  )
}
