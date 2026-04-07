import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
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
import { PRIORITIES, TASK_STATUSES } from '@/lib/constants'
import type { Client, Task, User } from '@/types/domain'

const TASK_TYPES = ['seguimiento', 'demo', 'implementacion', 'pago', 'soporte', 'reunion', 'interno'] as const

const taskSchema = z.object({
  clienteId: z.string().optional(),
  titulo: z.string().min(2),
  descripcion: z.string().optional(),
  tipo: z.enum(TASK_TYPES),
  fecha: z.string().min(1),
  hora: z.string().optional(),
  prioridad: z.enum(PRIORITIES),
  estado: z.enum(TASK_STATUSES),
  asignadoA: z.string().min(1),
})

type TaskFormValues = z.infer<typeof taskSchema>

export function TaskFormDialog({
  open,
  onOpenChange,
  task,
  users,
  clients,
  defaultAssignedUserId,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (value: boolean) => void
  task?: Task
  users: User[]
  clients: Client[]
  defaultAssignedUserId?: string
  onSubmit: (values: TaskFormValues) => void
}) {
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      clienteId: '',
      titulo: '',
      descripcion: '',
      tipo: 'seguimiento',
      fecha: '',
      hora: '',
      prioridad: 'Media',
      estado: 'pendiente',
      asignadoA: defaultAssignedUserId ?? users[0]?.id ?? '',
    },
  })

  useEffect(() => {
    if (!open) return
    form.reset({
      clienteId: task?.clienteId ?? '',
      titulo: task?.titulo ?? '',
      descripcion: task?.descripcion ?? '',
      tipo: task?.tipo ?? 'seguimiento',
      fecha: task?.fecha ?? '',
      hora: task?.hora ?? '',
      prioridad: task?.prioridad ?? 'Media',
      estado: task?.estado ?? 'pendiente',
      asignadoA: task?.asignadoA ?? defaultAssignedUserId ?? users[0]?.id ?? '',
    })
  }, [defaultAssignedUserId, form, open, task, users])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task ? 'Editar tarea' : 'Nueva tarea'}</DialogTitle>
          <DialogDescription>Organizá seguimientos, demos e implementación.</DialogDescription>
        </DialogHeader>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2 md:col-span-2">
            <Label>Título</Label>
            <Input {...form.register('titulo')} />
          </div>
          <div className="space-y-2">
            <Label>Cliente</Label>
            <Select {...form.register('clienteId')}>
              <option value="">Interna / sin cliente</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.nombreCliente}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Asignado a</Label>
            <Select {...form.register('asignadoA')}>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.nombre}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select {...form.register('tipo')}>
              {TASK_TYPES.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select {...form.register('estado')}>
              {TASK_STATUSES.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Fecha</Label>
            <Input type="date" {...form.register('fecha')} />
          </div>
          <div className="space-y-2">
            <Label>Hora</Label>
            <Input type="time" {...form.register('hora')} />
          </div>
          <div className="space-y-2">
            <Label>Prioridad</Label>
            <Select {...form.register('prioridad')}>
              {PRIORITIES.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Descripción</Label>
            <Textarea {...form.register('descripcion')} />
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

export type { TaskFormValues }
