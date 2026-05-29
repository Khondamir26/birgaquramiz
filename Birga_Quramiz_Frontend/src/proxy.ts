import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const PRIMARY_DOMAIN = 'birga-quramiz.uz'
const ACCESS_COOKIE = 'access_token'

const SUBDOMAIN_MAP: Record<string, string> = {
  admin:      '/admin',
  seller:     '/seller',
  dispatcher: '/dispatcher',
}

const ADMIN_PATH      = '/admin'
const SELLER_PATH     = '/seller'
const DISPATCHER_PATH = '/dispatcher'

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

  // Subdomain routing — detect subdomain and compute effective path
  // Public paths are never rewritten so /login stays /login on all subdomains
  const PUBLIC_PATHS = ['/login', '/signup', '/api']
  const isPublicPath = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))

  const subdomain = host.split('.')[0]
  const subdomainBase = SUBDOMAIN_MAP[subdomain]
  const needsRewrite = !!subdomainBase && !pathname.startsWith(subdomainBase) && !isPublicPath
  const effectivePath = needsRewrite
    ? subdomainBase + (pathname === '/' ? '' : pathname)
    : pathname

  const role = await getRole(request)

  // Redirect authenticated users away from /login to their dashboard
  if (effectivePath === '/login' && role) {
    const dest =
      role === 'ADMIN'      ? '/admin' :
      role === 'SELLER'     ? '/seller/dashboard' :
      role === 'DISPATCHER' ? '/dispatcher' :
      '/'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  // Admin protection
  if (isUnder(effectivePath, ADMIN_PATH)) {
    if (role !== 'ADMIN') {
      const url = new URL('/login', request.url)
      url.searchParams.set('next', `${effectivePath}${search}`)
      return NextResponse.redirect(url)
    }
  }

  // Seller protection
  if (isUnder(effectivePath, SELLER_PATH)) {
    if (role !== 'SELLER' && role !== 'ADMIN') {
      const url = new URL('/login', request.url)
      url.searchParams.set('from', `${effectivePath}${search}`)
      return NextResponse.redirect(url)
    }
  }

  // Dispatcher protection
  if (isUnder(effectivePath, DISPATCHER_PATH)) {
    if (role !== 'DISPATCHER' && role !== 'ADMIN') {
      const url = new URL('/login', request.url)
      url.searchParams.set('from', `${effectivePath}${search}`)
      return NextResponse.redirect(url)
    }
  }

  // Apply subdomain rewrite after all auth checks pass
  if (needsRewrite) {
    const url = request.nextUrl.clone()
    url.pathname = effectivePath
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)',],
}
