import type { Interaction, Task } from '@/types/domain'

const DAY_MS = 24 * 60 * 60 * 1000

export function ymd(s: string | null | undefined): string | null {
  if (!s) return null
  return s.slice(0, 10)
}

export function daysFromTodayTo(targetYmd: string, todayYmd: string): number | null {
  const a = new Date(`${todayYmd}T12:00:00`)
  const b = new Date(`${targetYmd}T12:00:00`)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null
  return Math.round((b.getTime() - a.getTime()) / DAY_MS)
}

export function seguimientoToneClass(fecha: string | null | undefined, todayYmd: string): string {
  const d = ymd(fecha)
  if (!d) return 'text-muted-foreground'
  const diff = daysFromTodayTo(d, todayYmd)
  if (diff === null) return 'text-muted-foreground'
  if (diff < 0) return 'font-medium text-red-600'
  if (diff <= 1) return 'font-medium text-orange-600'
  if (diff <= 7) return 'font-medium text-emerald-600'
  return 'text-muted-foreground'
}

export function localDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function localDateKeyFromISO(iso: string): string {
  return localDateKey(new Date(iso))
}

export function interactionVisibleOnCalendar(i: Interaction): boolean {
  return Boolean(
    i.visibleEnCalendario &&
      i.fechaEvento &&
      i.pendientes.length > 0 &&
      i.pendientes.some((p) => !p.completado),
  )
}

export function countMeetingInteractionsWithOpenTodosOnDate(interactions: Interaction[], dateKey: string): number {
  return interactions.filter(
    (i) => interactionVisibleOnCalendar(i) && i.fechaEvento && localDateKeyFromISO(i.fechaEvento) === dateKey,
  ).length
}

export function countTasksForUserToday(
  tasks: Task[],
  userId: string,
  dateKey: string,
): number {
  return tasks.filter(
    (t) =>
      (t.estado === 'pendiente' || t.estado === 'en_progreso') &&
      t.asignadoA === userId &&
      t.fecha === dateKey,
  ).length
}
