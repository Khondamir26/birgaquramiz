'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { restoreSession, telegramLogin } from '@/lib/api/auth'
import { markSessionHint } from '@/lib/auth/sessionHint'
import { toast } from 'sonner'
import type { User } from '@/types'

type SupportedLocale = 'uz' | 'ru' | 'en'

function getLocaleFromCode(code?: string): SupportedLocale {
  if (!code) return 'ru'
  if (code.startsWith('uz')) return 'uz'
  if (code.startsWith('en')) return 'en'
  if (code.startsWith('ru')) return 'ru'
  return 'ru'
}

function hasLocaleCookie(): boolean {
  return document.cookie.split(';').some((c) => c.trim().startsWith('NEXT_LOCALE='))
}

async function setLocale(locale: SupportedLocale): Promise<void> {
  await fetch('/api/locale', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ locale }),
  })
}

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

        // Auto-detect language on first visit — Telegram language takes priority,
        // falls back to browser language. After first visit the cookie is set for 1 year.
        if (!hasLocaleCookie()) {
          const langCode = (tg?.initDataUnsafe?.user?.language_code as string | undefined)
            ?? navigator.language
          await setLocale(getLocaleFromCode(langCode))
          window.location.reload()
          return
        }

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
