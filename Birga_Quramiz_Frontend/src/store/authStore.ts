import { create } from 'zustand'
import type { User } from '@/types'

type AuthState = {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isInitialized: boolean
  setAuth: (token: string, user: User) => void
  setUser: (user: User) => void
  logout: () => void
  initFromStorage: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isInitialized: false,

  setAuth: (token, user) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token)
    }
    set({ token, user, isAuthenticated: true, isInitialized: true })
  },

  setUser: (user) => set({ user }),

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
    }
    set({ token: null, user: null, isAuthenticated: false, isInitialized: true })
  },

  initFromStorage: () => {
    if (typeof window === 'undefined') return

    const token = localStorage.getItem('token')

    if (token) {
      set({ token, isAuthenticated: true, isInitialized: true })
      return
    }

    set({ isInitialized: true })
  },
}))