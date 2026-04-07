import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { Client, Interaction, User } from '@/types/domain'

const INTERACTION_TYPES = [
  'whatsapp',
  'llamada',
  'email',
  'demo',
  'reunion',
  'meet',
  'nota interna',
] as const

const pendienteRowSchema = z.object({
  todoId: z.string().optional(),
  texto: z.string(),
})

const interactionSchema = z
  .object({
    clienteId: z.string().min(1),
    tipo: z.enum(INTERACTION_TYPES),
    fecha: z.string().min(1),
    titulo: z.string().min(2),
    descripcion: z.string().min(2),
    resultado: z.string().optional(),
    proximaAccion: z.string().optional(),
    fechaProximoSeguimiento: z.string().optional(),
    createdBy: z.string().min(1),
    visibleEnCalendario: z.boolean(),
    fechaEvento: z.string().optional(),
    pendientes: z.array(pendienteRowSchema),
  })
  .refine((data) => !data.visibleEnCalendario || Boolean(data.fechaEvento?.trim()), {
    message: 'Indicá fecha y hora del evento en calendario',
    path: ['fechaEvento'],
  })

type InteractionFormValues = z.infer<typeof interactionSchema>

export function InteractionFormDialog({
  open,
  onOpenChange,
  interaction,
  users,
  clients,
  defaultClienteId,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (value: boolean) => void
  interaction?: Interaction
  users: User[]
  clients: Client[]
  defaultClienteId?: string
  onSubmit: (values: InteractionFormValues) => void
}) {
  const form = useForm<InteractionFormValues>({
    resolver: zodResolver(interactionSchema),
    defaultValues: {
      clienteId: clients[0]?.id ?? '',
      tipo: 'whatsapp',
      fecha: '',
      titulo: '',
      descripcion: '',
      resultado: '',
      proximaAccion: '',
      fechaProximoSeguimiento: '',
      createdBy: users[0]?.id ?? '',
      visibleEnCalendario: false,
      fechaEvento: '',
      pendientes: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'pendientes',
    keyName: '_fieldId',
  })

  const visibleCal = form.watch('visibleEnCalendario')

  useEffect(() => {
    if (!open) return
    const pendientes =
      interaction?.pendientes?.map((p) => ({ todoId: p.id, texto: p.texto })) ?? []
    form.reset({
      clienteId: interaction?.clienteId ?? defaultClienteId ?? clients[0]?.id ?? '',
      tipo: interaction?.tipo ?? 'whatsapp',
      fecha: interaction?.fecha.slice(0, 16) ?? '',
      titulo: interaction?.titulo ?? '',
      descripcion: interaction?.descripcion ?? '',
      resultado: interaction?.resultado ?? '',
      proximaAccion: interaction?.proximaAccion ?? '',
      fechaProximoSeguimiento: interaction?.fechaProximoSeguimiento ?? '',
      createdBy: interaction?.createdBy ?? users[0]?.id ?? '',
      visibleEnCalendario: interaction?.visibleEnCalendario ?? false,
      fechaEvento: interaction?.fechaEvento ? interaction.fechaEvento.slice(0, 16) : '',
      pendientes: pendientes.length ? pendientes : [],
    })
  }, [clients, defaultClienteId, form, interaction, open, users])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,720px)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{interaction ? 'Editar interacción' : 'Nueva interacción'}</DialogTitle>
          <DialogDescription>
            Cargá el historial manual y dejá lista la estructura para futuras integraciones.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label>Cliente</Label>
            <Select {...form.register('clienteId')}>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.nombreCliente}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select {...form.register('tipo')}>
              {INTERACTION_TYPES.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Título</Label>
            <Input {...form.register('titulo')} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Descripción</Label>
            <Textarea {...form.register('descripcion')} />
          </div>
          <div className="space-y-2">
            <Label>Fecha</Label>
            <Input type="datetime-local" {...form.register('fecha')} />
          </div>
          <div className="space-y-2">
            <Label>Creado por</Label>
            <Select {...form.register('createdBy')}>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.nombre}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Resultado</Label>
            <Input {...form.register('resultado')} />
          </div>
          <div className="space-y-2">
            <Label>Próximo seguimiento</Label>
            <Input type="date" {...form.register('fechaProximoSeguimiento')} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Próxima acción</Label>
            <Input {...form.register('proximaAccion')} />
          </div>

          <div className="flex items-center gap-3 md:col-span-2">
            <input type="checkbox" id="vis-cal" className="size-5 accent-primary" {...form.register('visibleEnCalendario')} />
            <Label htmlFor="vis-cal" className="cursor-pointer font-medium">
              Mostrar en calendario (mientras haya pendientes sin completar)
            </Label>
          </div>
          {visibleCal ? (
            <div className="space-y-2 md:col-span-2">
              <Label>Fecha y hora en calendario</Label>
              <Input type="datetime-local" {...form.register('fechaEvento')} />
              {form.formState.errors.fechaEvento?.message ? (
                <p className="text-sm text-destructive">{String(form.formState.errors.fechaEvento.message)}</p>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center justify-between gap-2">
              <Label>Pendientes de esta reunión</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ todoId: undefined, texto: '' })}
              >
                + Agregar pendiente
              </Button>
            </div>
            <ul className="space-y-2">
              {fields.map((field, index) => (
                <li key={(field as unknown as { _fieldId: string })._fieldId} className="flex gap-2">
                  <input type="hidden" {...form.register(`pendientes.${index}.todoId` as const)} />
                  <Input
                    placeholder="Texto del pendiente"
                    className="min-h-11 flex-1"
                    {...form.register(`pendientes.${index}.texto` as const)}
                  />
                  <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                    Quitar
                  </Button>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Guardar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export type { InteractionFormValues }
