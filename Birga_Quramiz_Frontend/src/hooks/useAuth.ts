'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { restoreSession, telegramLogin } from '@/lib/api/auth'
import { markSessionHint } from '@/lib/auth/sessionHint'
import { toast } from 'sonner'
import type { User } from '@/types'

let authInitPromise: Promise<void> | null = null

function initializeAuth() {
  if (authInitPromise) return authInitPromise

  authInitPromise = (async () => {
    const { setUser, setInitialized, setTelegramRequiresPhone } = useAuthStore.getState()

    try {
      let user: User | null = null

      if (typeof window !== 'undefined') {
        const isTelegramContext = window.location.hash.includes('tgWebAppData')

        if (isTelegramContext) {
          let attempts = 0
          // @ts-expect-error window.Telegram might not be defined
          while (!window.Telegram?.WebApp && attempts < 10) {
            await new Promise(resolve => setTimeout(resolve, 50))
            attempts++
          }
        }

        // @ts-expect-error window.Telegram might not be defined
        const tg = window.Telegram?.WebApp

        if (tg?.initData) {
          tg.ready()
          tg.expand()
          try {
            const result = await telegramLogin(tg.initData)
            if (!result.requiresPhone) {
              user = result.user
              markSessionHint()
            } else {
              // Phone not linked yet — user must link via the bot (/start → share contact)
              setTelegramRequiresPhone(true)
            }
          } catch (err) {
            console.error('Telegram login failed', err)
            toast.error('Failed to authenticate with Telegram')
          }
        }
      }

      if (!user) {
        user = await restoreSession()
      }

      setUser(user)
    } finally {
      setInitialized(true)
      authInitPromise = null
    }
  })()

  return authInitPromise
}

export function useAuth() {
  const { user, isAuthenticated, isInitialized, telegramRequiresPhone } = useAuthStore()

  const router = useRouter()

  useEffect(() => {
    if (isInitialized) {
      if (typeof window !== 'undefined') {
        // @ts-expect-error window.Telegram might not be defined
        const tg = window.Telegram?.WebApp
        const startParam = tg?.initDataUnsafe?.start_param
        if (startParam && startParam.startsWith('product_')) {
          const productId = startParam.replace('product_', '')
          router.push(`/product/${productId}`)
        }
      }
      return
    }

    void initializeAuth()
  }, [isInitialized, router])

  return { user, isAuthenticated, isInitialized, telegramRequiresPhone }
}
