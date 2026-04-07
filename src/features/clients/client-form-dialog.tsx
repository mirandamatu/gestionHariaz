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
import {
  COMMERCIAL_STATUSES,
  OPERATIONAL_STATUSES,
  PAYMENT_STATUSES,
  PLAN_NAMES,
  PRIORITIES,
  RISK_LEVELS,
} from '@/lib/constants'
import { getPlanCatalogItem } from '@/lib/plan-catalog'
import type { Client, User } from '@/types/domain'

const clientSchema = z.object({
  nombreCliente: z.string().min(2),
  pais: z.string().optional(),
  rubro: z.string().optional(),
  plan: z.enum(PLAN_NAMES),
  estadoComercial: z.enum(COMMERCIAL_STATUSES),
  estadoOperativo: z.enum(OPERATIONAL_STATUSES),
  estadoPago: z.enum(PAYMENT_STATUSES),
  prioridad: z.enum(PRIORITIES),
  nivelRiesgo: z.union([z.enum(RISK_LEVELS), z.literal('')]).optional(),
  responsablePrincipal: z.string(),
  fechaProximoSeguimiento: z.string().optional(),
  proximaAccion: z.string().optional(),
  notasInternas: z.string().optional(),
})

type ClientFormValues = z.infer<typeof clientSchema>

export function ClientFormDialog({
  open,
  onOpenChange,
  client,
  users,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (value: boolean) => void
  client?: Client
  users: User[]
  onSubmit: (values: ClientFormValues) => void
}) {
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      nombreCliente: '',
      pais: '',
      rubro: '',
      plan: 'Pendiente definir',
      estadoComercial: 'Lead',
      estadoOperativo: 'No iniciado',
      estadoPago: 'pendiente',
      prioridad: 'Media',
      nivelRiesgo: '',
      responsablePrincipal: users[0]?.id ?? '',
      fechaProximoSeguimiento: '',
      proximaAccion: '',
      notasInternas: '',
    },
  })

  useEffect(() => {
    if (!open) return
    form.reset({
      nombreCliente: client?.nombreCliente ?? '',
      pais: client?.pais ?? '',
      rubro: client?.rubro ?? '',
      plan: client?.plan ?? 'Pendiente definir',
      estadoComercial: client?.estadoComercial ?? 'Lead',
      estadoOperativo: client?.estadoOperativo ?? 'No iniciado',
      estadoPago: client?.estadoPago ?? 'pendiente',
      prioridad: client?.prioridad ?? 'Media',
      nivelRiesgo: client?.nivelRiesgo ?? '',
      responsablePrincipal: client?.responsablePrincipal ?? users[0]?.id ?? '',
      fechaProximoSeguimiento: client?.fechaProximoSeguimiento ?? '',
      proximaAccion: client?.proximaAccion ?? '',
      notasInternas: client?.notasInternas ?? '',
    })
  }, [client, form, open, users])

  const {
    formState: { errors },
  } = form
  const selectedPlan = form.watch('plan')
  const planInfo = getPlanCatalogItem(selectedPlan)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{client ? 'Editar cliente' : 'Nuevo cliente'}</DialogTitle>
          <DialogDescription>
            Actualizá la ficha principal del cliente. Los campos no cargados quedan preparados para
            completarse después.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
          {Object.keys(errors).length > 0 && (
            <div
              role="alert"
              className="md:col-span-2 rounded-2xl border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              Revisá los campos marcados o completá los obligatorios antes de guardar.
            </div>
          )}
          <div className="space-y-2 md:col-span-2">
            <Label>Cliente</Label>
            <Input {...form.register('nombreCliente')} aria-invalid={!!errors.nombreCliente} />
            {errors.nombreCliente?.message ? (
              <p className="text-sm text-destructive">{String(errors.nombreCliente.message)}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label>País</Label>
            <Input {...form.register('pais')} />
          </div>
          <div className="space-y-2">
            <Label>Rubro</Label>
            <Input {...form.register('rubro')} />
          </div>
          <div className="space-y-2">
            <Label>Plan</Label>
            <Select {...form.register('plan')} aria-invalid={!!errors.plan}>
              {PLAN_NAMES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
            {errors.plan?.message ? (
              <p className="text-sm text-destructive">{String(errors.plan.message)}</p>
            ) : null}
            {planInfo.monthlyPrice > 0 ? (
              <p className="text-xs text-muted-foreground">
                {planInfo.displayName}: {planInfo.firstMonthPrice} USD el primer mes, luego {planInfo.monthlyPrice} USD/mes · overage {planInfo.overageLabel}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label>Responsable</Label>
            <Select {...form.register('responsablePrincipal')} aria-invalid={!!errors.responsablePrincipal}>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.nombre}
                </option>
              ))}
            </Select>
            {errors.responsablePrincipal?.message ? (
              <p className="text-sm text-destructive">{String(errors.responsablePrincipal.message)}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label>Estado comercial</Label>
            <Select {...form.register('estadoComercial')} aria-invalid={!!errors.estadoComercial}>
              {COMMERCIAL_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
            {errors.estadoComercial?.message ? (
              <p className="text-sm text-destructive">{String(errors.estadoComercial.message)}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label>Estado operativo</Label>
            <Select {...form.register('estadoOperativo')} aria-invalid={!!errors.estadoOperativo}>
              {OPERATIONAL_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
            {errors.estadoOperativo?.message ? (
              <p className="text-sm text-destructive">{String(errors.estadoOperativo.message)}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label>Pago</Label>
            <Select {...form.register('estadoPago')} aria-invalid={!!errors.estadoPago}>
              {PAYMENT_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
            {errors.estadoPago?.message ? (
              <p className="text-sm text-destructive">{String(errors.estadoPago.message)}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label>Prioridad</Label>
            <Select {...form.register('prioridad')} aria-invalid={!!errors.prioridad}>
              {PRIORITIES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
            {errors.prioridad?.message ? (
              <p className="text-sm text-destructive">{String(errors.prioridad.message)}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label>Riesgo manual</Label>
            <Select {...form.register('nivelRiesgo')}>
              <option value="">Sin marcar</option>
              {RISK_LEVELS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
            <p className="text-xs text-muted-foreground">
              Opcional. Solo se muestra si el equipo lo carga manualmente.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Próximo seguimiento</Label>
            <Input type="date" {...form.register('fechaProximoSeguimiento')} />
          </div>
          <div className="space-y-2">
            <Label>Próxima acción</Label>
            <Input {...form.register('proximaAccion')} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Notas internas</Label>
            <Textarea {...form.register('notasInternas')} />
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

export type { ClientFormValues }
