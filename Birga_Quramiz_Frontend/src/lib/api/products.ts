import { apiFetch } from './client'
import type { Product, PaginatedResponse } from '@/types'

export function getProducts(page = 1, limit = 12, q?: string) {
  const query = new URLSearchParams()
  query.set('page', String(page))
  query.set('limit', String(limit))
  if (q?.trim()) query.set('q', q.trim())

  return apiFetch<PaginatedResponse<Product>>(`/products?${query.toString()}`)
}

export function getProductById(id: string) {
  return apiFetch<Product>(`/products/${id}`)
}

type ProductInput = {
  name: string
  description: string
  price: number
  stock: number
  image?: File
}

function toFormData(data: ProductInput) {
  const formData = new FormData()
  formData.append('name', data.name)
  formData.append('description', data.description)
  formData.append('price', String(data.price))
  formData.append('stock', String(data.stock))
  if (data.image) {
    formData.append('image', data.image)
  }
  return formData
}

export function createProduct(data: ProductInput) {
  return apiFetch<Product>('/products', {
    method: 'POST',
    body: toFormData(data),
  })
}

export function getMySellerProducts() {
  return apiFetch<Product[]>('/products/seller/my')
}

export function updateMySellerProduct(
  id: string,
  data: Partial<{
    name: string
    description: string
    price: number
    stock: number
    image: File
  }>,
) {
  const formData = new FormData()

  if (data.name !== undefined) formData.append('name', data.name)
  if (data.description !== undefined) formData.append('description', data.description)
  if (data.price !== undefined) formData.append('price', String(data.price))
  if (data.stock !== undefined) formData.append('stock', String(data.stock))
  if (data.image) formData.append('image', data.image)

  return apiFetch<Product>(`/products/seller/my/${id}`, {
    method: 'PATCH',
    body: formData,
  })
}

export function setMySellerProductVisibility(id: string, active: boolean) {
  return apiFetch<Product>(`/products/seller/my/${id}/visibility`, {
    method: 'PATCH',
    body: JSON.stringify({ active }),
  })
}

export function deleteMySellerProduct(id: string) {
  return apiFetch<{ message: string }>(`/products/seller/my/${id}`, {
    method: 'DELETE',
  })
}

export function getPendingProducts() {
  return apiFetch<Product[]>('/products/admin/pending')
}

export function approveProduct(id: string) {
  return apiFetch<Product>(`/products/admin/approve/${id}`, {
    method: 'POST',
  })
}

export function rejectProduct(id: string) {
  return apiFetch<Product>(`/products/admin/reject/${id}`, {
    method: 'POST',
  })
}
