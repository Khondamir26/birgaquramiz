import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const PRIMARY_DOMAIN = 'birga-quramiz.uz'
const ACCESS_COOKIE = 'access_token'

const ADMIN_PATH       = '/admin'
const ADMIN_LOGIN_PATH = '/admin/login'
const SELLER_PATH      = '/seller'
const DISPATCHER_PATH  = '/dispatcher'

function normalizeHost(host: string | null) {
  return host ? host.split(':')[0].toLowerCase() : ''
}

function isUnder(pathname: string, base: string) {
  return pathname === base || pathname.startsWith(`${base}/`)
}

async function getRole(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get(ACCESS_COOKIE)?.value
  const jwtSecret = process.env.JWT_SECRET
  if (!token || !jwtSecret) return null
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(jwtSecret))
    return (payload.role as string) ?? null
  } catch {
    return null
  }
}

export async function proxy(request: NextRequest) {
  const host = normalizeHost(request.headers.get('host'))
  const { pathname, search } = request.nextUrl

  // Canonical redirect for wrong domains
  if (host === 'birgaquramiz.uz' || host === 'www.birgaquramiz.uz') {
    return NextResponse.redirect(`https://${PRIMARY_DOMAIN}${pathname}${search}`, 301)
  }

  const role = await getRole(request)

  // Redirect authenticated users away from /login to their dashboard
  if (pathname === '/login' && role) {
    const dest =
      role === 'ADMIN'      ? '/admin' :
      role === 'SELLER'     ? '/seller/dashboard' :
      role === 'DISPATCHER' ? '/dispatcher' :
      '/'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  // Admin protection
  if (isUnder(pathname, ADMIN_PATH)) {
    if (pathname === ADMIN_LOGIN_PATH && role === 'ADMIN') {
      return NextResponse.redirect(new URL(ADMIN_PATH, request.url))
    }
    if (pathname !== ADMIN_LOGIN_PATH && role !== 'ADMIN') {
      const url = new URL(ADMIN_LOGIN_PATH, request.url)
      url.searchParams.set('next', `${pathname}${search}`)
      return NextResponse.redirect(url)
    }
  }

  // Seller protection
  if (isUnder(pathname, SELLER_PATH)) {
    if (role !== 'SELLER' && role !== 'ADMIN') {
      const url = new URL('/login', request.url)
      url.searchParams.set('from', `${pathname}${search}`)
      return NextResponse.redirect(url)
    }
  }

  // Dispatcher protection
  if (isUnder(pathname, DISPATCHER_PATH)) {
    if (role !== 'DISPATCHER' && role !== 'ADMIN') {
      const url = new URL('/login', request.url)
      url.searchParams.set('from', `${pathname}${search}`)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)',],
}
