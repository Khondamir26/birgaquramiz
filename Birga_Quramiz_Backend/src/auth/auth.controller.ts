import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common'
import { AuthService } from './auth.service'
import { JwtAuthGuard } from './jwt-auth.guard'
import type { Request, Response } from 'express'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { RegisterSellerDto } from './dto/register-seller.dto'
import { ChangePasswordDto } from './dto/change-password.dto'
import type { AuthUser } from './auth.types'

const ACCESS_COOKIE = 'access_token'
const REFRESH_COOKIE = 'refresh_token'
const ACCESS_COOKIE_MAX_AGE_MS = 15 * 60 * 1000
const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000
const REFRESH_COOKIE_PATH = '/auth/refresh'
const isProd = process.env.NODE_ENV === 'production'
const cookieDomain = process.env.COOKIE_DOMAIN?.trim()

if (isProd && !cookieDomain) {
  throw new Error('COOKIE_DOMAIN environment variable is required in production')
}

type AuthedRequest = Request & { user: AuthUser }

function getCookieOptions() {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict' as const,
    ...(cookieDomain ? { domain: cookieDomain } : {}),
  }
}

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  const cookieOptions = getCookieOptions()
  res.cookie(ACCESS_COOKIE, accessToken, {
    ...cookieOptions,
    maxAge: ACCESS_COOKIE_MAX_AGE_MS,
    path: '/',
  })

  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...cookieOptions,
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
    path: REFRESH_COOKIE_PATH,
  })
}

function clearAuthCookies(res: Response) {
  const cookieOptions = getCookieOptions()
  res.clearCookie(ACCESS_COOKIE, { ...cookieOptions, path: '/' })
  res.clearCookie(REFRESH_COOKIE, { ...cookieOptions, path: REFRESH_COOKIE_PATH })
}

function getClientIp(req: Request) {
  const forwarded = req.headers['x-forwarded-for']
  if (Array.isArray(forwarded)) {
    return forwarded[0] ?? null
  }
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0]?.trim() ?? null
  }
  return req.ip || req.socket.remoteAddress || null
}

function getUserAgent(req: Request) {
  const value = req.headers['user-agent']
  return Array.isArray(value) ? value[0] ?? null : value ?? null
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() body: RegisterDto) {
    return this.authService.register(body.name, body.phone, body.password)
  }

  @Post('register-seller')
  registerSeller(@Body() body: RegisterSellerDto) {
    return this.authService.registerSeller(
      body.name,
      body.phone,
      body.password,
      body.company,
    )
  }

  @Post('login')
  async login(@Body() body: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { user, tokens } = await this.authService.login(body.phone, body.password, {
      userAgent: getUserAgent(req),
      ipAddress: getClientIp(req),
    })

    setAuthCookies(res, tokens.accessToken, tokens.refreshToken)

    return { user }
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE]

    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token')
    }

    const { user, tokens } = await this.authService.refresh(refreshToken, {
      userAgent: getUserAgent(req),
      ipAddress: getClientIp(req),
    })
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken)

    return { user }
  }

  @Post('refresh/logout')
  async logoutCurrentSession(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE]
    await this.authService.logoutCurrentSession(refreshToken)
    clearAuthCookies(res)

    return { message: 'Logged out' }
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: AuthedRequest, @Res({ passthrough: true }) res: Response) {
    await this.authService.logoutAll(req.user.id)
    clearAuthCookies(res)

    return { message: 'Logged out from all sessions' }
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  async logoutAll(@Req() req: AuthedRequest, @Res({ passthrough: true }) res: Response) {
    await this.authService.logoutAll(req.user.id)
    clearAuthCookies(res)

    return { message: 'Logged out from all sessions' }
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Req() req: AuthedRequest,
    @Body() body: ChangePasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.changePassword(req.user.id, body.currentPassword, body.newPassword)
    clearAuthCookies(res)
    return { message: 'Password updated. Please sign in again.' }
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req: AuthedRequest) {
    return req.user
  }
}
