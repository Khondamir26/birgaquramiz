import { apiFetch } from './client'
import type { Seller, SellerAnalytics } from '@/types'

export type SellerProfile = {
  id: string
  articleNumber: number
  company: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  user: { name: string; phone: string; createdAt: string }
}

export function registerSeller(data: { company: string }) {
  return apiFetch<{ message: string; seller: Seller }>('/seller/register', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function getSellerAnalytics() {
  return apiFetch<SellerAnalytics>('/seller/analytics')
}

export function getSellerProfile() {
  return apiFetch<SellerProfile>('/seller/me')
}

export function updateSellerProfile(data: { company: string }) {
  return apiFetch<{ id: string; articleNumber: number; company: string; status: string }>('/seller/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}
