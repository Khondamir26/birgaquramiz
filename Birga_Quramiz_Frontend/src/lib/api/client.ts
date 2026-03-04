import { clearSessionHint, markSessionHint } from '@/lib/auth/sessionHint'
const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://api.birga-quramiz.uz'
    : 'http://localhost:5000')

export function getApiBaseUrl() {
  return BASE_URL
}

async function refreshSession() {
  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (res.ok) {
    markSessionHint()
  } else if (res.status === 401) {
    clearSessionHint()
  }

  return res.ok
}

export async function apiFetch<T = unknown>(
  url: string,
  options: RequestInit = {},
  allowRefresh = true,
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
    credentials: 'include',
  })

  if (res.status === 401 && allowRefresh) {
    const refreshed = await refreshSession()
    if (refreshed) {
      return apiFetch<T>(url, options, false)
    }
  }

  if (!res.ok) {
    let message = 'API error'
    try {
      const err = await res.json()
      message = err.message || message
    } catch {}
    throw new Error(message)
  }

  return res.json() as Promise<T>
}
