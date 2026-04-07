import { create } from 'zustand'

import { crmRepository } from '@/data/repositories'
import { useCrmStore } from '@/store/crm-store'

const SESSION_USER_KEY = 'crm-session-user'

interface AuthStore {
  initialized: boolean
  sessionUserId: string | null
  initializeSession: () => void
  login: (userId: string, password: string) => { ok: boolean; message?: string }
  logout: () => void
}

function syncActiveUser(userId: string | null) {
  useCrmStore.getState().setActiveUser(userId ?? '')
}

export const useAuthStore = create<AuthStore>((set) => ({
  initialized: false,
  sessionUserId: null,
  initializeSession: () => {
    const storedUserId = localStorage.getItem(SESSION_USER_KEY)
    const users = crmRepository.getSnapshot().users
    const validUser = users.find((user) => user.id === storedUserId && user.activo)
    const sessionUserId = validUser?.id ?? null

    if (sessionUserId) localStorage.setItem(SESSION_USER_KEY, sessionUserId)
    else localStorage.removeItem(SESSION_USER_KEY)

    syncActiveUser(sessionUserId)
    set({ initialized: true, sessionUserId })
  },
  login: (userId, password) => {
    const user = crmRepository
      .getSnapshot()
      .users.find((entry) => entry.id === userId && entry.activo)

    if (!user) {
      return { ok: false, message: 'Usuario no encontrado o inactivo.' }
    }
    if (user.password !== password) {
      return { ok: false, message: 'La contraseña es incorrecta.' }
    }

    localStorage.setItem(SESSION_USER_KEY, user.id)
    syncActiveUser(user.id)
    set({ initialized: true, sessionUserId: user.id })
    return { ok: true }
  },
  logout: () => {
    localStorage.removeItem(SESSION_USER_KEY)
    syncActiveUser(null)
    set({ sessionUserId: null, initialized: true })
  },
}))
