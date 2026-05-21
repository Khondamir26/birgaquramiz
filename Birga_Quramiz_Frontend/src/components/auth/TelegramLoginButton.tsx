'use client'

import { useEffect, useRef } from 'react'
import type { TelegramWidgetUser } from '@/lib/api/auth'

interface Props {
  botName: string
  onAuth: (user: TelegramWidgetUser) => void
}

export function TelegramLoginButton({ botName, onAuth }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onAuthRef = useRef(onAuth)

  useEffect(() => { onAuthRef.current = onAuth }, [onAuth])

  useEffect(() => {
    if (!containerRef.current) return

    // Stable global callback — avoids stale closure issues
    ;(window as Record<string, unknown>).__tgWidgetCb = (user: TelegramWidgetUser) => onAuthRef.current(user)

    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.setAttribute('data-telegram-login', botName)
    script.setAttribute('data-size', 'large')
    script.setAttribute('data-radius', '12')
    script.setAttribute('data-onauth', '__tgWidgetCb(user)')
    script.setAttribute('data-request-access', 'write')
    script.async = true

    containerRef.current.innerHTML = ''
    containerRef.current.appendChild(script)

    return () => {
      delete (window as Record<string, unknown>).__tgWidgetCb
    }
  }, [botName])

  return <div ref={containerRef} className="flex justify-center" />
}
