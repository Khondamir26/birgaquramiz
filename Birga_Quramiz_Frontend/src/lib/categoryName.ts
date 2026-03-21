import type { Category } from '@/types'

export function getCategoryName(
  category: Pick<Category, 'name' | 'nameEn' | 'nameUz'>,
  locale: string,
): string {
  if (locale === 'en' && category.nameEn) return category.nameEn
  if (locale === 'uz' && category.nameUz) return category.nameUz
  return category.name // Russian fallback
}
