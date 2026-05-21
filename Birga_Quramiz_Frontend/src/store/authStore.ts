import { create } from 'zustand'
import type { User } from '@/types'

type AuthState = {
  user: User | null
  isAuthenticated: boolean
  isInitialized: boolean
  telegramRequiresPhone: boolean
  setUser: (user: User | null) => void
  setInitialized: (value: boolean) => void
  setTelegramRequiresPhone: (value: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isInitialized: false,
  telegramRequiresPhone: false,

  setUser: (user) => set({ user, isAuthenticated: Boolean(user) }),

  setInitialized: (value) => set({ isInitialized: value }),

  setTelegramRequiresPhone: (value) => set({ telegramRequiresPhone: value }),

  logout: () => set({ user: null, isAuthenticated: false, isInitialized: true }),
}))
