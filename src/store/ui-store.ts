import { create } from 'zustand'

interface UiStore {
  sidebarOpen: boolean
  setSidebarOpen: (value: boolean) => void
}

export const useUiStore = create<UiStore>((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (value) => set({ sidebarOpen: value }),
}))
