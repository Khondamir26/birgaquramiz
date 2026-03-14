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

async function hasAdminRole(request: NextRequest) {
  const token = request.cookies.get(ACCESS_COOKIE)?.value
  const jwtSecret = process.env.JWT_SECRET

  if (!token || !jwtSecret) return false

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(jwtSecret)
    )

    return payload.role === 'ADMIN'
  } catch {
    return false
  }
}

export async function proxy(request: NextRequest) {
  const host = normalizeHost(request.headers.get('host'))
  const { pathname, search } = request.nextUrl

  // ⭐ canonical redirect ONLY for wrong production domains
  if (
    host === 'birgaquramiz.uz' ||
    host === 'www.birgaquramiz.uz'
  ) {
    return NextResponse.redirect(
      `https://${PRIMARY_DOMAIN}${pathname}${search}`,
      301
    )
  }

  // ⭐ skip non-admin pages
  if (!isAdminPath(pathname)) {
    return NextResponse.next()
  }

  const isAdmin = await hasAdminRole(request)

  // ⭐ logged admin → don't allow login page
  if (pathname === ADMIN_LOGIN_PATH && isAdmin) {
    return NextResponse.redirect(new URL(ADMIN_PATH, request.url))
  }

  // ⭐ not admin → go to admin login
  if (pathname !== ADMIN_LOGIN_PATH && !isAdmin) {
    const loginUrl = new URL(ADMIN_LOGIN_PATH, request.url)
    loginUrl.searchParams.set('next', `${pathname}${search}`)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next|.*\\..*).*)'
  ]
}