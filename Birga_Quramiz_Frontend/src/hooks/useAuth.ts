'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { getProfile } from '@/lib/api/auth'

export function useAuth() {
  const {
    user,
    token,
    isAuthenticated,
    isInitialized,
    setUser,
    logout,
    initFromStorage,
  } = useAuthStore()

  useEffect(() => {
    initFromStorage()
  }, [initFromStorage])

  useEffect(() => {
    if (isInitialized && token && !user) {
      getProfile()
        .then(setUser)
        .catch(() => logout())
    }
  }, [isInitialized, token, user, setUser, logout])

  return { user, token, isAuthenticated, isInitialized }
}