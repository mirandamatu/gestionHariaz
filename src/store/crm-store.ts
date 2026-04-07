import { create } from 'zustand'

import { crmRepository } from '@/data/repositories'
import type {
  Client,
  ClientCredential,
  CrmSnapshot,
  Interaction,
  ManualAsset,
  Task,
} from '@/types/domain'

const ACTIVE_USER_KEY = 'crm-active-user'

interface CrmStore extends CrmSnapshot {
  initialized: boolean
  activeUserId: string
  initialize: () => void
  setActiveUser: (userId: string) => void
  upsertClient: (client: Client) => void
  deleteClient: (clientId: string) => void
  upsertTask: (task: Task) => void
  deleteTask: (taskId: string) => void
  upsertInteraction: (interaction: Interaction) => void
  deleteInteraction: (interactionId: string) => void
  updateMeetingTodo: (interactionId: string, todoId: string, completado: boolean) => void
  addMeetingTodoToInteraction: (interactionId: string, texto: string) => void
  upsertCredential: (clientId: string, credential: ClientCredential) => void
  deleteCredential: (clientId: string, credentialId: string) => void
  upsertManual: (manual: ManualAsset) => void
  deleteManual: (manualId: string) => void
}

function emptySnapshot(): CrmSnapshot {
  return {
    users: [],
    clients: [],
    contacts: [],
    interactions: [],
    payments: [],
    tasks: [],
    calendarEvents: [],
    manuals: [],
  }
}

function withSelectedUser(snapshot: CrmSnapshot, currentUser: string) {
  return {
    ...snapshot,
    activeUserId: currentUser || snapshot.users[0]?.id || '',
  }
}

export const useCrmStore = create<CrmStore>((set) => ({
  ...emptySnapshot(),
  initialized: false,
  activeUserId: '',
  initialize: () => {
    const snapshot = crmRepository.getSnapshot()
    const activeUserId = localStorage.getItem(ACTIVE_USER_KEY) ?? snapshot.users[0]?.id ?? ''
    set({
      ...withSelectedUser(snapshot, activeUserId),
      initialized: true,
    })
  },
  setActiveUser: (userId) => {
    localStorage.setItem(ACTIVE_USER_KEY, userId)
    set({ activeUserId: userId })
  },
  upsertClient: (client) => {
    const snapshot = crmRepository.upsertClient(client)
    set((state) => withSelectedUser(snapshot, state.activeUserId))
  },
  deleteClient: (clientId) => {
    const snapshot = crmRepository.deleteClient(clientId)
    set((state) => withSelectedUser(snapshot, state.activeUserId))
  },
  upsertTask: (task) => {
    const snapshot = crmRepository.upsertTask(task)
    set((state) => withSelectedUser(snapshot, state.activeUserId))
  },
  deleteTask: (taskId) => {
    const snapshot = crmRepository.deleteTask(taskId)
    set((state) => withSelectedUser(snapshot, state.activeUserId))
  },
  upsertInteraction: (interaction) => {
    const snapshot = crmRepository.upsertInteraction(interaction)
    set((state) => withSelectedUser(snapshot, state.activeUserId))
  },
  deleteInteraction: (interactionId) => {
    const snapshot = crmRepository.deleteInteraction(interactionId)
    set((state) => withSelectedUser(snapshot, state.activeUserId))
  },
  updateMeetingTodo: (interactionId, todoId, completado) => {
    const snapshot = crmRepository.getSnapshot()
    const interaction = snapshot.interactions.find((i) => i.id === interactionId)
    if (!interaction) return
    const ts = new Date().toISOString()
    const pendientes = interaction.pendientes.map((t) =>
      t.id === todoId
        ? { ...t, completado, completadoAt: completado ? ts : null }
        : t,
    )
    const next = { ...interaction, pendientes, updatedAt: ts }
    const out = crmRepository.upsertInteraction(next)
    set((state) => withSelectedUser(out, state.activeUserId))
  },
  addMeetingTodoToInteraction: (interactionId, texto) => {
    const trimmed = texto.trim()
    if (!trimmed) return
    const snapshot = crmRepository.getSnapshot()
    const interaction = snapshot.interactions.find((i) => i.id === interactionId)
    if (!interaction) return
    const ts = new Date().toISOString()
    const pendientes = [
      ...interaction.pendientes,
      {
        id: crypto.randomUUID(),
        texto: trimmed,
        completado: false,
        completadoAt: null,
      },
    ]
    const next = { ...interaction, pendientes, updatedAt: ts }
    const out = crmRepository.upsertInteraction(next)
    set((state) => withSelectedUser(out, state.activeUserId))
  },
  upsertCredential: (clientId, credential) => {
    const snapshot = crmRepository.getSnapshot()
    const client = snapshot.clients.find((c) => c.id === clientId)
    if (!client) return
    const ts = new Date().toISOString()
    const list = client.credenciales ?? []
    const exists = list.some((c) => c.id === credential.id)
    const credenciales = exists
      ? list.map((c) => (c.id === credential.id ? { ...credential, updatedAt: ts } : c))
      : [...list, { ...credential, createdAt: credential.createdAt || ts, updatedAt: ts }]
    const out = crmRepository.upsertClient({ ...client, credenciales, updatedAt: ts })
    set((state) => withSelectedUser(out, state.activeUserId))
  },
  deleteCredential: (clientId, credentialId) => {
    const snapshot = crmRepository.getSnapshot()
    const client = snapshot.clients.find((c) => c.id === clientId)
    if (!client) return
    const ts = new Date().toISOString()
    const credenciales = (client.credenciales ?? []).filter((c) => c.id !== credentialId)
    const out = crmRepository.upsertClient({ ...client, credenciales, updatedAt: ts })
    set((state) => withSelectedUser(out, state.activeUserId))
  },
  upsertManual: (manual) => {
    const snapshot = crmRepository.upsertManual(manual)
    set((state) => withSelectedUser(snapshot, state.activeUserId))
  },
  deleteManual: (manualId) => {
    const snapshot = crmRepository.deleteManual(manualId)
    set((state) => withSelectedUser(snapshot, state.activeUserId))
  },
}))
