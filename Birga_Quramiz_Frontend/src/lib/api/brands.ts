import { apiFetch } from './client'
import type { Brand } from '@/types'

export function getBrands() {
  return apiFetch<Brand[]>('/brands')
}

export function getBrandBySlug(slug: string) {
  return apiFetch<Brand>(`/brands/${slug}`)
}

export type BrandInput = {
  name: string
  slug: string
  logoUrl?: string
  website?: string
  description?: string
  featured?: boolean
}

export function createBrand(data: BrandInput) {
  return apiFetch<Brand>('/admin/brands', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateBrand(id: string, data: Partial<BrandInput>) {
  return apiFetch<Brand>(`/admin/brands/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function deleteBrand(id: string) {
  return apiFetch<{ message: string }>(`/admin/brands/${id}`, {
    method: 'DELETE',
  })
}
