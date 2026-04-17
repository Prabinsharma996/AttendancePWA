import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  notificationsEnabled: boolean
  pushSubscription: PushSubscription | null
  theme: 'dark' | 'light'
  setNotifications: (enabled: boolean) => void
  setPushSubscription: (sub: PushSubscription | null) => void
  setTheme: (theme: 'dark' | 'light') => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      notificationsEnabled: false,
      pushSubscription: null,
      theme: 'dark',
      setNotifications: (enabled) => set({ notificationsEnabled: enabled }),
      setPushSubscription: (sub) => set({ pushSubscription: sub }),
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'settings-store' }
  )
)
