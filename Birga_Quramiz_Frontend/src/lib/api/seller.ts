import { apiFetch } from './client'
import type { Seller, SellerAnalytics } from '@/types'

export function registerSeller(data: { company: string }) {
  return apiFetch<{ message: string; seller: Seller }>('/seller/register', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function getSellerAnalytics() {
  return apiFetch<SellerAnalytics>('/seller/analytics')
}
