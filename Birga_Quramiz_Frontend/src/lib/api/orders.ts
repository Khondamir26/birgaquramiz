import { apiFetch } from './client'
import type { Order, PaginatedResponse, OrderStatus, DeliveryType, PaymentMethod } from '@/types'

export type CheckoutPayload = {
  items: { productId: string; quantity: number }[]
  customerName: string
  customerPhone: string
  deliveryType: DeliveryType
  deliveryAddress?: string
  paymentMethod: PaymentMethod
  comment?: string
}

export function createOrder(data: CheckoutPayload) {
  return apiFetch<Order>('/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function createGuestOrder(data: CheckoutPayload) {
  return apiFetch<Order>('/orders/guest', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function payOrder(id: string) {
  return apiFetch<Order>(`/orders/${id}/pay`, { method: 'POST' })
}

export function getMyOrders(params?: { status?: OrderStatus; page?: number; limit?: number }) {
  const query = new URLSearchParams()
  if (params?.status) query.set('status', params.status)
  if (params?.page) query.set('page', String(params.page))
  if (params?.limit) query.set('limit', String(params.limit))
  const qs = query.toString()
  return apiFetch<PaginatedResponse<Order>>(`/orders/my${qs ? `?${qs}` : ''}`)
}

export function deliverOrder(id: string) {
  return apiFetch<Order>(`/orders/${id}/deliver`, { method: 'POST' })
}

export function getSellerOrders(params?: { status?: OrderStatus; page?: number; limit?: number }) {
  const query = new URLSearchParams()
  if (params?.status) query.set('status', params.status)
  if (params?.page) query.set('page', String(params.page))
  if (params?.limit) query.set('limit', String(params.limit))
  const qs = query.toString()
  return apiFetch<PaginatedResponse<Order>>(`/orders/seller${qs ? `?${qs}` : ''}`)
}

export function confirmOrder(id: string) {
  return apiFetch<Order>(`/orders/${id}/confirm`, { method: 'POST' })
}

export function shipOrder(id: string) {
  return apiFetch<Order>(`/orders/${id}/ship`, { method: 'POST' })
}

export function cancelOrder(id: string) {
  return apiFetch<{ message: string }>(`/orders/${id}/cancel`, { method: 'POST' })
}
