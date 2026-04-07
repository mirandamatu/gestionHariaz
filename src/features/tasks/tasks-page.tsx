import type { ColumnDef } from '@tanstack/react-table'
import { CheckCircle2, Edit3, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { DataTable } from '@/components/data-table'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import {
  formatDate,
  priorityTone,
  taskStatusLabel,
  taskStatusTone,
  taskTypeLabel,
} from '@/lib/formatters'
import { localDateKey } from '@/lib/briefing'
import { useCrmStore } from '@/store/crm-store'
import type { Task } from '@/types/domain'
import { TaskFormDialog, type TaskFormValues } from '@/features/tasks/task-form-dialog'

const now = new Date().toISOString()
const VIEW_OPTIONS = ['mine', 'all', 'overdue', 'today', 'blocked', 'completed'] as const
type TaskView = (typeof VIEW_OPTIONS)[number]

function normalizeView(value: string | null): TaskView {
  return VIEW_OPTIONS.includes((value ?? '') as TaskView) ? (value as TaskView) : 'mine'
}

function isOpenTask(task: Task) {
  return task.estado === 'pendiente' || task.estado === 'en_progreso'
}

function taskViewLabel(view: TaskView) {
  return {
    mine: 'tu trabajo abierto',
    all: 'toda la bandeja del equipo',
    overdue: 'las tareas vencidas',
    today: 'las tareas para hoy',
    blocked: 'las tareas bloqueadas',
    completed: 'las tareas completadas',
  }[view]
}

export function TasksPage() {
  const tasks = useCrmStore((state) => state.tasks)
  const clients = useCrmStore((state) => state.clients)
  const users = useCrmStore((state) => state.users)
  const activeUserId = useCrmStore((state) => state.activeUserId)
  const upsertTask = useCrmStore((state) => state.upsertTask)
  const deleteTask = useCrmStore((state) => state.deleteTask)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Task | undefined>()
  const [selectedAssignee, setSelectedAssignee] = useState<string>('me')
  const [searchParams, setSearchParams] = useSearchParams()

  const todayKey = useMemo(() => localDateKey(new Date()), [])
  const selectedView = normalizeView(searchParams.get('view'))

  useEffect(() => {
    const requestedAssignee = searchParams.get('assigned')
    setSelectedAssignee(requestedAssignee && users.some((user) => user.id === requestedAssignee) ? requestedAssignee : 'me')
  }, [searchParams, users])

  const assigneeFilterId =
    selectedAssignee === 'me' ? activeUserId : selectedAssignee === 'all' ? null : selectedAssignee

  const filteredTasks = useMemo(() => {
    let list = assigneeFilterId ? tasks.filter((task) => task.asignadoA === assigneeFilterId) : tasks
    list = list.filter((task) => {
      switch (selectedView) {
        case 'mine':
          return isOpenTask(task)
        case 'all':
          return true
        case 'overdue':
          return isOpenTask(task) && task.fecha < todayKey
        case 'today':
          return isOpenTask(task) && task.fecha === todayKey
        case 'blocked':
          return task.estado === 'bloqueada'
        case 'completed':
          return task.estado === 'completada'
        default:
          return true
      }
    })
    return [...list].sort((a, b) => a.fecha.localeCompare(b.fecha))
  }, [assigneeFilterId, selectedView, tasks, todayKey])

  const summary = useMemo(
    () => ({
      open: tasks.filter((task) => task.asignadoA === activeUserId && isOpenTask(task)).length,
      overdue: tasks.filter((task) => task.asignadoA === activeUserId && isOpenTask(task) && task.fecha < todayKey).length,
      today: tasks.filter((task) => task.asignadoA === activeUserId && isOpenTask(task) && task.fecha === todayKey).length,
      blocked: tasks.filter((task) => task.asignadoA === activeUserId && task.estado === 'bloqueada').length,
    }),
    [activeUserId, tasks, todayKey],
  )

  function setView(view: TaskView) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('view', view)
      return next
    })
  }

  function setAssignee(value: string) {
    setSelectedAssignee(value)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value === 'me') next.delete('assigned')
      else next.set('assigned', value)
      if (!next.get('view')) next.set('view', 'mine')
      return next
    })
  }

  function updateStatus(task: Task, estado: Task['estado']) {
    upsertTask({
      ...task,
      estado,
      updatedAt: new Date().toISOString(),
    })
    toast.success(`Tarea marcada como ${taskStatusLabel(estado).toLowerCase()}`)
  }

  const columns = useMemo<ColumnDef<Task>[]>(
    () => [
      {
        accessorKey: 'titulo',
        header: 'Tarea',
        cell: ({ row }) => {
          const client = clients.find((clientEntry) => clientEntry.id === row.original.clienteId)
          return (
            <div className="space-y-1">
              <p className="font-medium">{row.original.titulo}</p>
              <p className="text-sm text-muted-foreground">
                {client ? client.nombreCliente : 'Interna'} · {taskTypeLabel(row.original.tipo)}
              </p>
              {row.original.descripcion ? (
                <p className="line-clamp-2 text-xs text-muted-foreground">{row.original.descripcion}</p>
              ) : null}
            </div>
          )
        },
      },
      {
        accessorKey: 'fecha',
        header: 'Fecha',
        cell: ({ row }) => {
          const isOverdue = isOpenTask(row.original) && row.original.fecha < todayKey
          const isToday = isOpenTask(row.original) && row.original.fecha === todayKey
          return (
            <div className="space-y-1">
              <p className={isOverdue ? 'font-medium text-red-600' : isToday ? 'font-medium text-orange-600' : ''}>
                {formatDate(row.original.fecha)}
              </p>
              <p className="text-xs text-muted-foreground">{row.original.hora ?? 'Sin hora'}</p>
            </div>
          )
        },
      },
      {
        accessorKey: 'prioridad',
        header: 'Prioridad',
        cell: ({ row }) => <Badge className={priorityTone(row.original.prioridad)}>{row.original.prioridad}</Badge>,
      },
      {
        accessorKey: 'estado',
        header: 'Estado',
        cell: ({ row }) => <Badge className={taskStatusTone(row.original.estado)}>{taskStatusLabel(row.original.estado)}</Badge>,
      },
      {
        accessorKey: 'asignadoA',
        header: 'Responsable',
        cell: ({ row }) => users.find((user) => user.id === row.original.asignadoA)?.nombre ?? 'Sin asignar',
      },
      {
        id: 'quick',
        header: 'Acción rápida',
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2" onClick={(event) => event.stopPropagation()}>
            {row.original.estado !== 'completada' ? (
              <Button size="sm" variant="secondary" onClick={() => updateStatus(row.original, 'completada')}>
                <CheckCircle2 className="mr-2 size-4" />
                Completar
              </Button>
            ) : null}
            {row.original.estado === 'pendiente' ? (
              <Button size="sm" variant="outline" onClick={() => updateStatus(row.original, 'en_progreso')}>
                En curso
              </Button>
            ) : null}
            {row.original.estado === 'bloqueada' ? (
              <Button size="sm" variant="outline" onClick={() => updateStatus(row.original, 'pendiente')}>
                Retomar
              </Button>
            ) : null}
            {row.original.clienteId ? (
              <Button size="sm" variant="ghost" asChild>
                <Link to={`/clientes/${row.original.clienteId}`}>Cliente</Link>
              </Button>
            ) : null}
          </div>
        ),
      },
      {
        id: 'actions',
        header: 'Editar',
        cell: ({ row }) => (
          <div className="flex gap-2" onClick={(event) => event.stopPropagation()}>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setEditing(row.original)
                setDialogOpen(true)
              }}
            >
              <Edit3 className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                deleteTask(row.original.id)
                toast.success('Tarea eliminada')
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ),
      },
    ],
    [clients, deleteTask, todayKey, users],
  )

  function handleSubmit(values: TaskFormValues) {
    upsertTask({
      ...(editing ?? {
        id: crypto.randomUUID(),
        visibleEnCalendario: true,
        createdAt: now,
        updatedAt: now,
      }),
      ...values,
      clienteId: values.clienteId || null,
      descripcion: values.descripcion || null,
      hora: values.hora || null,
      visibleEnCalendario: true,
      updatedAt: now,
    })
    toast.success(editing ? 'Tarea actualizada' : 'Tarea creada')
    setDialogOpen(false)
    setEditing(undefined)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tareas"
        title="Tareas del equipo"
        description={`Viendo ${taskViewLabel(selectedView)}. Podés cambiar de responsable, avanzar estados y resolver el día desde esta vista.`}
        actions={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select value={selectedAssignee} onChange={(event) => setAssignee(event.target.value)}>
              <option value="me">Mis tareas</option>
              <option value="all">Todo el equipo</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.nombre}
                </option>
              ))}
            </Select>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="size-4" />
              Nueva tarea
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Abiertas" value={summary.open} active={selectedView === 'mine'} onClick={() => setView('mine')} />
        <SummaryCard title="Vencidas" value={summary.overdue} active={selectedView === 'overdue'} onClick={() => setView('overdue')} />
        <SummaryCard title="Para hoy" value={summary.today} active={selectedView === 'today'} onClick={() => setView('today')} />
        <SummaryCard title="Bloqueadas" value={summary.blocked} active={selectedView === 'blocked'} onClick={() => setView('blocked')} />
      </div>

      <Card>
        <CardContent className="flex flex-wrap gap-2 p-4">
          <FilterButton active={selectedView === 'mine'} onClick={() => setView('mine')}>
            Mis abiertas
          </FilterButton>
          <FilterButton active={selectedView === 'all'} onClick={() => setView('all')}>
            Todas
          </FilterButton>
          <FilterButton active={selectedView === 'overdue'} onClick={() => setView('overdue')}>
            Vencidas
          </FilterButton>
          <FilterButton active={selectedView === 'today'} onClick={() => setView('today')}>
            Hoy
          </FilterButton>
          <FilterButton active={selectedView === 'blocked'} onClick={() => setView('blocked')}>
            Bloqueadas
          </FilterButton>
          <FilterButton active={selectedView === 'completed'} onClick={() => setView('completed')}>
            Completadas
          </FilterButton>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={filteredTasks}
        getRowClassName={(task) => (isOpenTask(task) && task.fecha < todayKey ? 'bg-red-50/50' : undefined)}
      />

      <TaskFormDialog
        open={dialogOpen}
        onOpenChange={(value) => {
          setDialogOpen(value)
          if (!value) setEditing(undefined)
        }}
        task={editing}
        users={users}
        clients={clients}
        defaultAssignedUserId={activeUserId}
        onSubmit={handleSubmit}
      />
    </div>
  )
}

function SummaryCard({
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

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Button type="button" variant={active ? 'secondary' : 'outline'} onClick={onClick}>
      {children}
    </Button>
  )
}
