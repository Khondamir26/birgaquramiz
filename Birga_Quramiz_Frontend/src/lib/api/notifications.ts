import { apiFetch } from './client'

export type NotificationType =
  | 'ORDER_NEW' | 'ORDER_PAID' | 'ORDER_CANCELLED' | 'ORDER_SHIPPED' | 'ORDER_DELIVERED'
  | 'PRODUCT_APPROVED' | 'PRODUCT_REJECTED'
  | 'SELLER_APPROVED' | 'SELLER_REJECTED'
  | 'ASSIGNMENT_CREATED' | 'DRIVER_OFFLINE' | 'ORDER_DELAYED' | 'FRAUD_ALERT' | 'SELLER_APPLICATION'
  | 'ASSIGNMENT_NEW' | 'ASSIGNMENT_CANCELLED_DRV'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  body: string
  data: Record<string, unknown> | null
  readAt: string | null
  createdAt: string
}

export interface NotificationsPage {
  data: Notification[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
    unread: number
  }
}

export function getNotifications(page = 1, limit = 20): Promise<NotificationsPage> {
  return apiFetch<NotificationsPage>(`/notifications?page=${page}&limit=${limit}`)
}

export function getUnreadCount(): Promise<{ count: number }> {
  return apiFetch<{ count: number }>('/notifications/unread-count')
}

export function markNotificationRead(id: string): Promise<unknown> {
  return apiFetch(`/notifications/${id}/read`, { method: 'PATCH' })
}

export function markAllNotificationsRead(): Promise<unknown> {
  return apiFetch('/notifications/read-all', { method: 'PATCH' })
}
