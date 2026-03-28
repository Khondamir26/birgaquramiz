import { apiFetch } from './client'
import type { Category } from '@/types'

export function getCategories() {
  return apiFetch<Category[]>('/categories')
}

export function getParentCategories() {
  return apiFetch<Category[]>('/categories/parents')
}

export type CategoryInput = {
  name: string
  nameEn?: string
  nameUz?: string
  code: string
  slug?: string
  parentId?: string | null
}

export function createCategory(data: CategoryInput) {
  return apiFetch<Category>('/admin/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateCategory(id: string, data: Partial<CategoryInput>) {
  return apiFetch<Category>(`/admin/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function deleteCategory(id: string) {
  return apiFetch<{ message: string }>(`/admin/categories/${id}`, {
    method: 'DELETE',
  })
}
