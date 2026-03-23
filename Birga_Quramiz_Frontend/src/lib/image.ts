// Always use the public API URL for images — they are rendered by the browser,
// so the internal Docker hostname (backend:5000) must never appear in image URLs.
const PUBLIC_API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production' ? 'https://api.birga-quramiz.uz' : 'http://localhost:5000')
).replace(/\/$/, '')

const INTERNAL_API_URL = process.env.API_INTERNAL_URL

export function resolveImageUrl(imageUrl?: string | null): string {
  if (!imageUrl) return ''
  if (imageUrl.startsWith('data:')) return imageUrl

  // Replace internal Docker hostname with public URL if present
  if (INTERNAL_API_URL && imageUrl.startsWith(INTERNAL_API_URL)) {
    return PUBLIC_API_URL + imageUrl.slice(INTERNAL_API_URL.length)
  }

  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }

  const normalizedPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`
  return `${PUBLIC_API_URL}${normalizedPath}`
}
