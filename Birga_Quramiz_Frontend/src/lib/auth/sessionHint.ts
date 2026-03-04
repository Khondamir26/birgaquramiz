const AUTH_SESSION_HINT_KEY = 'bq_has_session'

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function hasSessionHint() {
  if (!canUseStorage()) return false

  try {
    return window.localStorage.getItem(AUTH_SESSION_HINT_KEY) === '1'
  } catch {
    return false
  }
}

export function markSessionHint() {
  if (!canUseStorage()) return

  try {
    window.localStorage.setItem(AUTH_SESSION_HINT_KEY, '1')
  } catch {
    // Ignore storage failures (private mode, blocked storage, etc.)
  }
}

export function clearSessionHint() {
  if (!canUseStorage()) return

  try {
    window.localStorage.removeItem(AUTH_SESSION_HINT_KEY)
  } catch {
    // Ignore storage failures (private mode, blocked storage, etc.)
  }
}
