import { apiFetch } from './client'
import type { User } from '@/types'
import {
  clearSessionHint,
  hasSessionHint,
  markSessionHint,
} from '@/lib/auth/sessionHint'

export function register(data: { name: string; phone: string; password: string }) {
  return apiFetch<{ message: string; user: User }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function registerSeller(data: { name: string; phone: string; password: string; company: string }) {
  return apiFetch<{ message: string; user: User; seller: { id: string; userId: string; company: string } }>('/auth/register-seller', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function login(data: { phone: string; password: string }) {
  return apiFetch<{ user: User }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  }).then((result) => {
    markSessionHint()
    return result
  })
}

export type TelegramLoginResult =
  | { requiresPhone: false; user: User }
  | { requiresPhone: true; pendingToken: string }

export type TelegramWidgetUser = {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

export function telegramLogin(initData: string) {
  return apiFetch<TelegramLoginResult>('/auth/telegram', {
    method: 'POST',
    body: JSON.stringify({ initData }),
  }).then((result) => {
    if (!result.requiresPhone) markSessionHint()
    return result
  })
}

export function telegramWidgetLogin(data: TelegramWidgetUser) {
  return apiFetch<TelegramLoginResult>('/auth/telegram/widget', {
    method: 'POST',
    body: JSON.stringify(data),
  }).then((result) => {
    if (!result.requiresPhone) markSessionHint()
    return result
  })
}

export function linkTelegramContact(data: { pendingToken: string; phone: string }) {
  return apiFetch<{ user: User }>('/auth/telegram/link-contact', {
    method: 'POST',
    body: JSON.stringify(data),
  }).then((result) => {
    markSessionHint()
    return result
  })
}

export function logout() {
  return apiFetch<{ message: string }>('/auth/refresh/logout', {
    method: 'POST',
  }).finally(() => {
    clearSessionHint()
  })
}

export function logoutAllSessions() {
  return apiFetch<{ message: string }>('/auth/logout-all', {
    method: 'POST',
  }).finally(() => {
    clearSessionHint()
  })
}

export function getProfile() {
  return apiFetch<User>('/auth/profile')
}

export function changePassword(data: { currentPassword: string; newPassword: string }) {
  return apiFetch<{ message: string }>('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(data),
  }).then((result) => {
    clearSessionHint()
    return result
  })
}

export function sendOtp(phone: string) {
  return apiFetch<{ message: string }>('/auth/otp/send', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  })
}

export function verifyOtp(data: { phone: string; code: string; name?: string; pendingTelegramToken?: string }) {
  return apiFetch<{ user: User; accessToken: string; refreshToken: string; isNewUser: boolean }>('/auth/otp/verify', {
    method: 'POST',
    body: JSON.stringify(data),
  }).then((result) => {
    markSessionHint()
    return result
  })
}

export function updateProfile(data: { name?: string }) {
  return apiFetch<User>('/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function restoreSession(): Promise<User | null> {
  if (!hasSessionHint()) {
    return null
  }

  try {
    const { user } = await apiFetch<{ user: User }>(
      '/auth/refresh',
      {
        method: 'POST',
      },
      false,
    )
    markSessionHint()
    return user
  } catch {
    clearSessionHint()
    return null
  }
}
