import { getApiBaseUrl } from '@/lib/api/client'

export function resolveImageUrl(imageUrl?: string | null): string {
  if (!imageUrl) return ''
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('data:')) {
    return imageUrl
  }

  const normalizedPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`
  const baseUrl = getApiBaseUrl()

  if (normalizedPath.startsWith(baseUrl)) {
    return normalizedPath
  }

  return `${baseUrl}${normalizedPath}`
}
