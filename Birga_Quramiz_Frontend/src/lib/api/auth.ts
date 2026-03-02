import { apiFetch } from './client'
import type { User } from '@/types'

export function register(data: { name: string; phone: string; password: string }) {
  return apiFetch<{ message: string; user: User }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function registerSeller(data: { name: string; phone: string; password: string; company: string }) {
  return apiFetch<{ message: string; user: User; seller: any }>('/auth/register-seller', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function login(data: { phone: string; password: string }) {
  return apiFetch<{ token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function getProfile() {
  return apiFetch<User>('/auth/profile')
}
