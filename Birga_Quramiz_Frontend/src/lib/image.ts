import { getApiBaseUrl } from '@/lib/api/client'

export function resolveImageUrl(imageUrl?: string | null): string {
  if (!imageUrl) return ''
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('data:')) {
    return imageUrl
  }

  const normalizedPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`
  return `${getApiBaseUrl()}${normalizedPath}`
}
