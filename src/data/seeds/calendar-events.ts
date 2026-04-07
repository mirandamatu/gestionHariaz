import type { CalendarEvent } from '@/types/domain'

import { seedTasks } from '@/data/seeds/tasks'

const now = '2026-03-15T10:00:00.000Z'

export const seedCalendarEvents: CalendarEvent[] = seedTasks
  .filter((task) => task.visibleEnCalendario)
  .map((task) => ({
    id: `event-${task.id}`,
    clienteId: task.clienteId,
    tareaId: task.id,
    titulo: task.titulo,
    tipoEvento: task.tipo,
    fechaInicio: `${task.fecha}T${task.hora ?? '09:00'}:00`,
    fechaFin: `${task.fecha}T${task.hora ?? '10:00'}:00`,
    descripcion: task.descripcion,
    responsable: task.asignadoA,
    createdAt: now,
    updatedAt: now,
  }))
