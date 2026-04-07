import type {
  Client,
  CrmSnapshot,
  Interaction,
  ManualAsset,
  MeetingTodo,
  Task,
  User,
} from '@/types/domain'
import type { CrmRepository } from '@/data/repositories/crm-repository'

import { seedCalendarEvents } from '@/data/seeds/calendar-events'
import { seedClients } from '@/data/seeds/clients'
import { seedContacts } from '@/data/seeds/contacts'
import { seedInteractions } from '@/data/seeds/interactions'
import { seedManuals } from '@/data/seeds/manuals'
import { seedPayments } from '@/data/seeds/payments'
import { seedTasks } from '@/data/seeds/tasks'
import { seedUsers } from '@/data/seeds/users'

const STORAGE_KEY = 'crm-saas-v1'
const SEED_VERSION_KEY = 'crm-saas-v1-seed-version'
const SEED_VERSION = 5

const createSeedSnapshot = (): CrmSnapshot => ({
  users: seedUsers,
  clients: seedClients,
  contacts: seedContacts,
  interactions: seedInteractions,
  payments: seedPayments,
  tasks: seedTasks,
  calendarEvents: seedCalendarEvents,
  manuals: seedManuals,
})

function normalizeMeetingTodo(raw: unknown, index: number): MeetingTodo {
  const r = raw as Partial<MeetingTodo>
  return {
    id: String(r.id ?? `todo-${index}`),
    texto: String(r.texto ?? ''),
    completado: Boolean(r.completado),
    completadoAt: r.completadoAt != null ? String(r.completadoAt) : null,
  }
}

function normalizeClient(client: Client): Client {
  const archivos = client.archivos ?? []
  return {
    ...client,
    credenciales: (client.credenciales ?? []).map((c) => ({
      id: c.id,
      plataforma: c.plataforma,
      usuario: c.usuario,
      contrasena: c.contrasena,
      notas: c.notas ?? null,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })),
    archivos: archivos.map((a) => ({
      id: a.id,
      fileName: a.fileName,
      mimeType: a.mimeType,
      size: a.size,
      dataUrl: a.dataUrl,
      linkUrl: a.linkUrl,
      createdAt: a.createdAt,
    })),
  }
}

function normalizeUser(user: User): User {
  return {
    ...user,
    password: user.password ?? 'Hariaz2026!!',
  }
}

function normalizeManual(manual: ManualAsset): ManualAsset {
  return {
    ...manual,
    descripcion: manual.descripcion ?? null,
    tipo: manual.tipo ?? 'archivo',
    categoria: manual.categoria ?? 'interno',
    destacado: manual.destacado ?? false,
    mimeType: manual.mimeType ?? 'application/octet-stream',
    size: manual.size ?? 0,
    createdBy: manual.createdBy ?? 'ponce',
    updatedAt: manual.updatedAt ?? manual.createdAt,
  }
}

function normalizeInteraction(interaction: Interaction): Interaction {
  const pendientesRaw = interaction.pendientes ?? []
  return {
    ...interaction,
    pendientes: pendientesRaw.map((p, idx) => normalizeMeetingTodo(p, idx)),
    visibleEnCalendario: interaction.visibleEnCalendario ?? false,
    fechaEvento: interaction.fechaEvento ?? null,
  }
}

export function normalizeSnapshot(raw: unknown): CrmSnapshot {
  const s = raw as CrmSnapshot
  if (!s || typeof s !== 'object') return createSeedSnapshot()
  return {
    users: Array.isArray(s.users) ? s.users.map((u) => normalizeUser(u as User)) : [],
    clients: Array.isArray(s.clients) ? s.clients.map((c) => normalizeClient(c as Client)) : [],
    contacts: Array.isArray(s.contacts) ? s.contacts : [],
    interactions: Array.isArray(s.interactions)
      ? s.interactions.map((i) => normalizeInteraction(i as Interaction))
      : [],
    payments: Array.isArray(s.payments) ? s.payments : [],
    tasks: Array.isArray(s.tasks) ? s.tasks : [],
    calendarEvents: Array.isArray(s.calendarEvents) ? s.calendarEvents : [],
    manuals: Array.isArray(s.manuals) ? s.manuals.map((m) => normalizeManual(m as ManualAsset)) : [],
  }
}

function updateCollection<T extends { id: string }>(collection: T[], item: T) {
  const index = collection.findIndex((entry) => entry.id === item.id)
  if (index === -1) return [item, ...collection]
  return collection.map((entry) => (entry.id === item.id ? item : entry))
}

function persistSnapshot(snapshot: CrmSnapshot) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
  return snapshot
}

export class MockCrmRepository implements CrmRepository {
  getSnapshot() {
    const raw = localStorage.getItem(STORAGE_KEY)
    const storedVersion = localStorage.getItem(SEED_VERSION_KEY)
    if (!raw || storedVersion !== String(SEED_VERSION)) {
      localStorage.setItem(SEED_VERSION_KEY, String(SEED_VERSION))
      return persistSnapshot(createSeedSnapshot())
    }
    try {
      return normalizeSnapshot(JSON.parse(raw))
    } catch {
      localStorage.setItem(SEED_VERSION_KEY, String(SEED_VERSION))
      return persistSnapshot(createSeedSnapshot())
    }
  }

  upsertClient(client: Client) {
    const snapshot = this.getSnapshot()
    return persistSnapshot({
      ...snapshot,
      clients: updateCollection(snapshot.clients, normalizeClient(client)),
    })
  }

  deleteClient(clientId: string) {
    const snapshot = this.getSnapshot()
    return persistSnapshot({
      ...snapshot,
      clients: snapshot.clients.filter((client) => client.id !== clientId),
      contacts: snapshot.contacts.filter((contact) => contact.clienteId !== clientId),
      payments: snapshot.payments.filter((payment) => payment.clienteId !== clientId),
      tasks: snapshot.tasks.filter((task) => task.clienteId !== clientId),
      interactions: snapshot.interactions.filter((interaction) => interaction.clienteId !== clientId),
      calendarEvents: snapshot.calendarEvents.filter((event) => event.clienteId !== clientId),
    })
  }

  upsertTask(task: Task) {
    const snapshot = this.getSnapshot()
    return persistSnapshot({
      ...snapshot,
      tasks: updateCollection(snapshot.tasks, task),
    })
  }

  deleteTask(taskId: string) {
    const snapshot = this.getSnapshot()
    return persistSnapshot({
      ...snapshot,
      tasks: snapshot.tasks.filter((task) => task.id !== taskId),
      calendarEvents: snapshot.calendarEvents.filter((event) => event.tareaId !== taskId),
    })
  }

  upsertInteraction(interaction: Interaction) {
    const snapshot = this.getSnapshot()
    return persistSnapshot({
      ...snapshot,
      interactions: updateCollection(snapshot.interactions, normalizeInteraction(interaction)),
    })
  }

  deleteInteraction(interactionId: string) {
    const snapshot = this.getSnapshot()
    return persistSnapshot({
      ...snapshot,
      interactions: snapshot.interactions.filter((interaction) => interaction.id !== interactionId),
    })
  }

  upsertManual(manual: ManualAsset) {
    const snapshot = this.getSnapshot()
    return persistSnapshot({
      ...snapshot,
      manuals: updateCollection(snapshot.manuals, normalizeManual(manual)),
    })
  }

  deleteManual(manualId: string) {
    const snapshot = this.getSnapshot()
    return persistSnapshot({
      ...snapshot,
      manuals: snapshot.manuals.filter((manual) => manual.id !== manualId),
    })
  }
}

export const crmRepository = new MockCrmRepository()
