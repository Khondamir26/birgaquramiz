import { apiFetch } from './client'
import type { Product, PaginatedResponse, Category } from '@/types'

export function getProducts(
  page = 1,
  limit = 12,
  q?: string,
  categoryId?: string,
  minPrice?: number,
  maxPrice?: number,
  sortBy?: string,
  brand?: string,
  parentCategoryId?: string,
) {
  const query = new URLSearchParams()
  query.set('page', String(page))
  query.set('limit', String(limit))
  if (q?.trim()) query.set('q', q.trim())
  if (categoryId?.trim()) query.set('categoryId', categoryId.trim())
  if (minPrice !== undefined) query.set('minPrice', String(minPrice))
  if (maxPrice !== undefined) query.set('maxPrice', String(maxPrice))
  if (sortBy?.trim()) query.set('sortBy', sortBy.trim())
  if (brand?.trim()) query.set('brand', brand.trim())
  if (parentCategoryId?.trim()) query.set('parentCategoryId', parentCategoryId.trim())

  return apiFetch<PaginatedResponse<Product>>(`/products?${query.toString()}`)
}

export function getProductById(id: string) {
  return apiFetch<Product>(`/products/${id}`)
}

export function getProductBySlug(slug: string) {
  return apiFetch<Product>(`/products/slug/${slug}`)
}

export type ProductInput = {
  name: string
  description: string
  price: number
  stock: number;
  categoryId: string;
  brandId?: string;
  images?: File[];
  specifications?: Record<string, string>;
}

function toFormData(data: ProductInput) {
  const formData = new FormData()
  formData.append('name', data.name)
  formData.append('description', data.description)
  formData.append('price', String(data.price))
  formData.append('stock', String(data.stock))
  formData.append('categoryId', String(data.categoryId))
  if (data.brandId) {
    formData.append('brandId', data.brandId)
  }
  if (data.images && data.images.length > 0) {
    data.images.forEach((img) => formData.append('images', img))
  }
  if (data.specifications) {
    formData.append('specifications', JSON.stringify(data.specifications))
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

export function getMySellerProduct(id: string) {
  return apiFetch<{
    id: string
    sku?: string | null
    title: string
    description: string
    price: number
    stock: number
    images: string[]
    status: string
    rejectionReason?: string | null
    createdAt: string
    category?: Category | null
    specifications?: Record<string, string> | null
  }>(`/products/seller/my/${id}`)
}

export function updateMySellerProduct(
  id: string,
  data: Partial<ProductInput> & { newImages?: File[]; keepImages?: string[] },
) {
  const formData = new FormData()

  if (data.name !== undefined) formData.append('name', data.name)
  if (data.description !== undefined) formData.append('description', data.description)
  if (data.price !== undefined) formData.append('price', String(data.price))
  if (data.stock !== undefined) formData.append('stock', String(data.stock))
  if (data.categoryId !== undefined) formData.append('categoryId', data.categoryId)
  if (data.brandId !== undefined) formData.append('brandId', data.brandId)
  if (data.specifications) formData.append('specifications', JSON.stringify(data.specifications))
  if (data.keepImages !== undefined) formData.append('keepImages', JSON.stringify(data.keepImages))
  if (data.newImages && data.newImages.length > 0) {
    data.newImages.forEach((img) => formData.append('images', img))
  }

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

export function requestProductDeletion(id: string, reason: string) {
  return apiFetch<{ message: string; requestId: string }>(`/products/seller/my/${id}/request-deletion`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
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

export function getCategories() {
  return apiFetch<Category[]>('/categories')
}

export function getParentCategories() {
  return apiFetch<Category[]>('/categories/parents')
}

export function getCategoryChildren(parentId: string) {
  return apiFetch<Category[]>(`/categories/${parentId}/children`)
}

export function getCategoryById(id: string) {
  return apiFetch<Category>(`/categories/${id}`)
}

export function getCategoryBySlug(slug: string) {
  return apiFetch<Category>(`/categories/slug/${slug}`)
}

export function getSellerPublicProfile(sellerId: string) {
  return apiFetch<import('@/types').SellerPublicProfile>(`/seller/public/${sellerId}`)
}