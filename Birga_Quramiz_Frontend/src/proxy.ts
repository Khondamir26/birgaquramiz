import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const PRIMARY_DOMAIN = 'birga-quramiz.uz'
const ACCESS_COOKIE = 'access_token'
const ADMIN_PATH = '/admin'
const ADMIN_LOGIN_PATH = '/admin/login'

function normalizeHost(host: string | null) {
  if (!host) return ''
  return host.split(':')[0].toLowerCase()
}

function isAdminPath(pathname: string) {
  return pathname === ADMIN_PATH || pathname.startsWith(`${ADMIN_PATH}/`)
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

  // Redirect authenticated users away from /login
  if (pathname === '/login' && role) {
    const dest = role === 'ADMIN' ? '/admin' : role === 'SELLER' ? '/seller/dashboard' : '/'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  // Admin route protection
  if (isAdminPath(pathname)) {
    const isAdmin = role === 'ADMIN'

    if (pathname === ADMIN_LOGIN_PATH && isAdmin) {
      return NextResponse.redirect(new URL(ADMIN_PATH, request.url))
    }

    if (pathname !== ADMIN_LOGIN_PATH && !isAdmin) {
      const loginUrl = new URL(ADMIN_LOGIN_PATH, request.url)
      loginUrl.searchParams.set('next', `${pathname}${search}`)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)',],
}
