'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { restoreSession } from '@/lib/api/auth'

let authInitPromise: Promise<void> | null = null

function initializeAuth() {
  if (authInitPromise) return authInitPromise

  authInitPromise = (async () => {
    const { setUser, setInitialized } = useAuthStore.getState()

    try {
      const user = await restoreSession()
      setUser(user)
    } finally {
      setInitialized(true)
      authInitPromise = null
    }
  })()

  return authInitPromise
}

export function useAuth() {
  const { user, isAuthenticated, isInitialized } = useAuthStore()

  useEffect(() => {
    if (isInitialized) return

    void initializeAuth()
  }, [isInitialized])

  return { user, isAuthenticated, isInitialized }
}
