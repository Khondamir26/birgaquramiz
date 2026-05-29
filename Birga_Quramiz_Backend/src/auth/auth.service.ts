import { Injectable, BadRequestException, UnauthorizedException, HttpException, HttpStatus, NotFoundException, OnModuleDestroy } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import * as bcrypt from 'bcrypt'
import { JwtService } from '@nestjs/jwt'
import { randomUUID, createHmac } from 'crypto'
import type { Prisma } from '@prisma/client'
import type { AuthUser, JwtPayload } from './auth.types'
import { SmsService } from '../tracking/services/sms.service'
import { TelegramService } from '../telegram/telegram.service'
import { normalizePhone } from './phone.util'
import Redis from 'ioredis'

const ACCESS_TOKEN_TTL = '15m'
const ACCESS_TOKEN_TTL_SEC = 15 * 60
const REFRESH_TOKEN_TTL = '7d'
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000
const MIN_BCRYPT_SALT_ROUNDS = 10
const MAX_BCRYPT_SALT_ROUNDS = 14

function requiredEnv(name: string) {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`${name} environment variable is required`)
  }
  return value
}

const jwtAccessSecret = requiredEnv('JWT_SECRET')
const jwtRefreshSecret = requiredEnv('JWT_REFRESH_SECRET')
const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN?.trim()

function getBcryptSaltRounds() {
  const rawValue = process.env.BCRYPT_SALT_ROUNDS?.trim()
  if (!rawValue) {
    return 12
  }

  const rounds = Number.parseInt(rawValue, 10)
  if (!Number.isFinite(rounds)) {
    throw new Error('BCRYPT_SALT_ROUNDS must be a valid integer')
  }

  if (rounds < MIN_BCRYPT_SALT_ROUNDS || rounds > MAX_BCRYPT_SALT_ROUNDS) {
    throw new Error(
      `BCRYPT_SALT_ROUNDS must be between ${MIN_BCRYPT_SALT_ROUNDS} and ${MAX_BCRYPT_SALT_ROUNDS}`,
    )
  }

  return rounds
}

const bcryptSaltRounds = getBcryptSaltRounds()

const OTP_TTL = 180            // 3 minutes
const OTP_MAX_ATTEMPTS = 5
const OTP_RATE_LIMIT_COUNT = 3 // per phone per 15 min
const OTP_RATE_LIMIT_WINDOW = 900
const OTP_IP_RATE_LIMIT = 10   // per IP per hour

type SessionMetadata = {
  userAgent?: string | null
  ipAddress?: string | null
}

@Injectable()
export class AuthService implements OnModuleDestroy {
  private readonly redis: Redis

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private sms: SmsService,
    private telegram: TelegramService,
  ) {
    this.redis = new Redis({
      host: process.env.REDIS_HOST ?? 'localhost',
      port: Number(process.env.REDIS_PORT ?? 6379),
      password: process.env.REDIS_PASSWORD,
    })
  }

  onModuleDestroy() {
    this.redis.disconnect()
  }

  private async toAuthUser(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    })

    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    return user
  }

  private async generateTokens(user: AuthUser, tokenId: string) {
    const payload: JwtPayload = { userId: user.id, role: user.role, tokenId }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: jwtAccessSecret,
        expiresIn: ACCESS_TOKEN_TTL,
      }),
      this.jwt.signAsync(payload, {
        secret: jwtRefreshSecret,
        expiresIn: REFRESH_TOKEN_TTL,
      }),
    ])

    return { accessToken, refreshToken }
  }

  private async createRefreshSession(
    userId: string,
    tokenId: string,
    refreshToken: string,
    metadata: SessionMetadata,
    tx: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    const refreshTokenHash = await bcrypt.hash(refreshToken, bcryptSaltRounds)

    return tx.authSession.create({
      data: {
        userId,
        tokenId,
        refreshTokenHash,
        userAgent: metadata.userAgent ?? null,
        ipAddress: metadata.ipAddress ?? null,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    })
  }

  private async activateSession(tokenId: string) {
    await this.redis.setex(`sess:active:${tokenId}`, ACCESS_TOKEN_TTL_SEC, '1')
  }

  private async revokeSession(userId: string, tokenId: string) {
    return this.prisma.authSession.updateMany({
      where: { userId, tokenId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
  }

  async revokeAllSessions(userId: string) {
    const sessions = await this.prisma.authSession.findMany({
      where: { userId, revokedAt: null },
      select: { tokenId: true },
    })

    await this.prisma.authSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    })

    if (sessions.length > 0) {
      await Promise.all(sessions.map(s => this.redis.del(`sess:active:${s.tokenId}`)))
    }
  }

  async getSessions(userId: string, currentTokenId: string) {
    const sessions = await this.prisma.authSession.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, tokenId: true, userAgent: true, ipAddress: true, createdAt: true, expiresAt: true },
    })
    return sessions.map(s => ({ ...s, isCurrent: s.tokenId === currentTokenId }))
  }

  async revokeSessionById(userId: string, targetTokenId: string) {
    const result = await this.prisma.authSession.updateMany({
      where: { userId, tokenId: targetTokenId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
    if (result.count === 0) throw new NotFoundException('Session not found')
    await this.redis.del(`sess:active:${targetTokenId}`)
  }

  private async verifyRefreshToken(refreshToken: string): Promise<JwtPayload> {
    try {
      return await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: jwtRefreshSecret,
      })
    } catch {
      throw new UnauthorizedException('Invalid refresh token')
    }
  }

  private verifyTelegramInitData(initData: string): Record<string, string> {
    if (!telegramBotToken) {
      throw new BadRequestException('Telegram integration is not configured')
    }

    const urlParams = new URLSearchParams(initData)
    const hash = urlParams.get('hash')
    if (!hash) throw new UnauthorizedException('Invalid initData: missing hash')

    urlParams.delete('hash')
    const params: string[] = []
    urlParams.forEach((value, key) => params.push(`${key}=${value}`))
    params.sort()

    const secretKey = createHmac('sha256', 'WebAppData').update(telegramBotToken).digest()
    const calculatedHash = createHmac('sha256', secretKey).update(params.join('\n')).digest('hex')
    if (calculatedHash !== hash) throw new UnauthorizedException('Invalid Telegram signature')

    const authDate = Number(urlParams.get('auth_date'))
    if (!authDate) throw new UnauthorizedException('Invalid initData: missing auth_date')
    if (Math.floor(Date.now() / 1000) - authDate > 86400) {
      throw new UnauthorizedException('Telegram initData is expired')
    }

    const result: Record<string, string> = {}
    urlParams.forEach((value, key) => { result[key] = value })
    return result
  }

  private async loginTelegramUser(
    telegramId: string,
    name: string,
    telegramUsername: string | null,
    telegramPhoto: string | null,
    languageCode: string | null,
    metadata: SessionMetadata,
  ) {
    const existing = await this.prisma.user.findUnique({ where: { telegramId } })

    // Case A: telegramId linked AND phone verified — auto-login
    if (existing?.phone) {
      await this.prisma.user.update({
        where: { telegramId },
        data: { telegramUsername, telegramPhoto, languageCode },
      })
      const safeUser: AuthUser = {
        id: existing.id,
        name: existing.name,
        phone: existing.phone,
        role: existing.role,
        createdAt: existing.createdAt,
      }
      const tokenId = randomUUID()
      const tokens = await this.generateTokens(safeUser, tokenId)
      await this.createRefreshSession(existing.id, tokenId, tokens.refreshToken, metadata)
      await this.activateSession(tokenId)
      return { requiresPhone: false as const, user: safeUser, tokens }
    }

    // Case B: telegramId not linked yet, or linked but no phone — require phone
    const pendingToken = randomUUID()
    await this.redis.setex(
      `tg:pending:${pendingToken}`,
      600,
      JSON.stringify({ telegramId, name, telegramUsername, telegramPhoto, languageCode }),
    )
    return { requiresPhone: true as const, pendingToken }
  }

  async telegramLogin(initData: string, metadata: SessionMetadata = {}) {
    const fields = this.verifyTelegramInitData(initData)

    const userStr = fields['user']
    if (!userStr) throw new UnauthorizedException('Invalid initData: missing user data')

    let tgUser: any
    try { tgUser = JSON.parse(userStr) } catch {
      throw new UnauthorizedException('Invalid initData: invalid user JSON')
    }

    return this.loginTelegramUser(
      String(tgUser.id),
      tgUser.first_name + (tgUser.last_name ? ` ${tgUser.last_name}` : ''),
      tgUser.username ?? null,
      tgUser.photo_url ?? null,
      tgUser.language_code ?? null,
      metadata,
    )
  }

  async verifyTelegramOtp(otp: string, metadata: SessionMetadata = {}) {
    const normalized = otp.trim()
    const raw = await this.redis.get(`tg:code:${normalized}`)
    if (!raw) throw new BadRequestException('OTP expired or not found')

    let stored: { telegramId: string; firstName: string; languageCode: string | null }
    try { stored = JSON.parse(raw) } catch {
      throw new BadRequestException('Invalid OTP state')
    }

    await this.redis.del(`tg:code:${normalized}`)

    return this.loginTelegramUser(
      stored.telegramId,
      stored.firstName,
      null,
      null,
      stored.languageCode,
      metadata,
    )
  }

  async sendOtp(rawPhone: string, ipAddress?: string | null) {
    const phone = normalizePhone(rawPhone)

    // Rate limit: 3 OTPs / 15 min per phone
    const phoneRateKey = `otp:rate:phone:${phone}`
    const phoneCount = await this.redis.incr(phoneRateKey)
    if (phoneCount === 1) await this.redis.expire(phoneRateKey, OTP_RATE_LIMIT_WINDOW)
    if (phoneCount > OTP_RATE_LIMIT_COUNT) {
      throw new HttpException('Too many OTP requests. Try again in 15 minutes.', HttpStatus.TOO_MANY_REQUESTS)
    }

    // Rate limit: 10 OTPs / hour per IP
    if (ipAddress) {
      const ipRateKey = `otp:rate:ip:${ipAddress}`
      const ipCount = await this.redis.incr(ipRateKey)
      if (ipCount === 1) await this.redis.expire(ipRateKey, 3600)
      if (ipCount > OTP_IP_RATE_LIMIT) {
        throw new HttpException('Too many requests from this IP.', HttpStatus.TOO_MANY_REQUESTS)
      }
    }

    const code = String(Math.floor(100000 + Math.random() * 900000))
    await this.redis.setex(`otp:auth:${phone}`, OTP_TTL, code)
    await this.redis.del(`otp:attempts:${phone}`)

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[OTP DEV] ${phone} → ${code}`)
    }

    const userRecord = await this.prisma.user.findUnique({
      where: { phone },
      select: { telegramId: true, languageCode: true },
    })

    if (userRecord?.telegramId) {
      const lang = userRecord.languageCode
      let text: string
      if (lang?.startsWith('ru')) {
        text = `Birga Quramiz: код подтверждения *${code}*. Действителен 3 минуты.`
      } else if (lang?.startsWith('en')) {
        text = `Birga Quramiz: verification code *${code}*. Valid for 3 minutes.`
      } else {
        text = `Birga Quramiz: tasdiqlash kodi *${code}*. Kod 3 daqiqa amal qiladi.`
      }
      const sent = await this.telegram.sendMessage(userRecord.telegramId, text)
      if (sent) return { message: 'OTP sent', method: 'telegram' as const }
      // Telegram failed — fall through to SMS
    }

    // No telegramId (new user) or Telegram delivery failed — send via SMS
    const smsSent = await this.sms.send(phone, `Birga Quramiz: tasdiqlash kodi ${code}. Kod 3 daqiqa amal qiladi.`)
    if (!smsSent) {
      if (process.env.NODE_ENV !== 'production') {
        // Dev: keep OTP in Redis so it can be verified from logs
        return { message: 'OTP sent (dev — check server logs)', method: 'sms' as const }
      }
      await this.redis.del(`otp:auth:${phone}`)
      throw new HttpException(
        'SMS delivery failed. Please try again later.',
        HttpStatus.SERVICE_UNAVAILABLE,
      )
    }
    return { message: 'OTP sent', method: 'sms' as const }
  }

  async verifyOtp(rawPhone: string, code: string, name: string | undefined, pendingTelegramToken: string | undefined, metadata: SessionMetadata = {}) {
    const phone = normalizePhone(rawPhone)

    const otpKey = `otp:auth:${phone}`
    const attemptsKey = `otp:attempts:${phone}`

    const DEV_BYPASS = process.env.NODE_ENV !== 'production' && code.trim() === '000000'

    const stored = await this.redis.get(otpKey)
    if (!stored && !DEV_BYPASS) {
      throw new BadRequestException('OTP expired or not sent')
    }

    const attempts = parseInt((await this.redis.get(attemptsKey)) ?? '0', 10)
    if (!DEV_BYPASS && attempts >= OTP_MAX_ATTEMPTS) {
      await this.redis.del(otpKey)
      throw new BadRequestException('Too many wrong attempts. Request a new OTP.')
    }

    if (!DEV_BYPASS && stored !== code.trim()) {
      await this.redis.incr(attemptsKey)
      await this.redis.expire(attemptsKey, OTP_TTL)
      throw new BadRequestException('Invalid OTP')
    }

    if (!DEV_BYPASS) await Promise.all([this.redis.del(otpKey), this.redis.del(attemptsKey)])

    let isNewUser = false
    let user = await this.prisma.user.findUnique({ where: { phone } })

    if (!user) {
      isNewUser = true
      user = await this.prisma.user.create({
        data: { phone, name: name?.trim() || '' },
      })
    }

    // Link pending Telegram account if provided
    if (pendingTelegramToken) {
      const raw = await this.redis.get(`tg:pending:${pendingTelegramToken}`)
      if (raw) {
        const tgData = JSON.parse(raw)
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            telegramId: tgData.telegramId,
            telegramUsername: tgData.telegramUsername,
            telegramPhoto: tgData.telegramPhoto,
            languageCode: tgData.languageCode,
          },
        })
        await this.redis.del(`tg:pending:${pendingTelegramToken}`)
      }
    }

    const safeUser: AuthUser = {
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
    }

    const tokenId = randomUUID()
    const tokens = await this.generateTokens(safeUser, tokenId)
    await this.createRefreshSession(user.id, tokenId, tokens.refreshToken, metadata)
    await this.activateSession(tokenId)

    return { user: safeUser, tokens, isNewUser }
  }

  async register(name: string, phone: string, password: string) {
    const existing = await this.prisma.user.findUnique({
      where: { phone },
    })

    if (existing) {
      throw new BadRequestException('User already exists')
    }

    const hashedPassword = await bcrypt.hash(password, bcryptSaltRounds)

    const user = await this.prisma.user.create({
      data: {
        name,
        phone,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    })

    return {
      message: 'User created',
      user,
    }
  }

  async registerSeller(name: string, phone: string, password: string, company: string) {
    const existing = await this.prisma.user.findUnique({
      where: { phone },
    })

    if (existing) {
      throw new BadRequestException('User already exists')
    }

    const hashedPassword = await bcrypt.hash(password, bcryptSaltRounds)

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          phone,
          password: hashedPassword,
          role: 'SELLER',
        },
        select: {
          id: true,
          name: true,
          phone: true,
          role: true,
          createdAt: true,
        },
      })

      const seller = await tx.seller.create({
        data: {
          userId: user.id,
          company,
        },
      })

      return {
        message: 'Seller registered',
        user,
        seller,
      }
    })
  }

  async login(phone: string, password: string, metadata: SessionMetadata = {}) {
    const user = await this.prisma.user.findUnique({
      where: { phone },
    })

    if (!user || !user.password) {
      throw new BadRequestException('Invalid credentials')
    }

    const valid = await bcrypt.compare(password, user.password)

    if (!valid) {
      throw new BadRequestException('Invalid credentials')
    }

    if (user.role === 'SELLER') {
      const seller = await this.prisma.seller.findUnique({
        where: { userId: user.id },
        select: { status: true },
      })
      if (seller?.status !== 'APPROVED') {
        throw new UnauthorizedException('Your seller account is pending admin verification')
      }
    }

    const safeUser: AuthUser = {
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
    }

    const tokenId = randomUUID()
    const tokens = await this.generateTokens(safeUser, tokenId)

    await this.createRefreshSession(user.id, tokenId, tokens.refreshToken, metadata)
    await this.activateSession(tokenId)

    return { user: safeUser, tokens }
  }

  async refresh(refreshToken: string, metadata: SessionMetadata = {}) {
    const payload = await this.verifyRefreshToken(refreshToken)
    if (!payload.tokenId) {
      throw new UnauthorizedException('Invalid refresh token payload')
    }

    const existingSession = await this.prisma.authSession.findUnique({
      where: { tokenId: payload.tokenId },
      select: {
        id: true,
        tokenId: true,
        userId: true,
        refreshTokenHash: true,
        revokedAt: true,
        expiresAt: true,
      },
    })

    if (!existingSession || existingSession.userId !== payload.userId) {
      throw new UnauthorizedException('Refresh token revoked')
    }

    if (existingSession.revokedAt) {
      // Token reuse detected — possible theft, revoke everything
      await this.revokeAllSessions(payload.userId)
      throw new UnauthorizedException('Refresh token revoked')
    }

    if (existingSession.expiresAt <= new Date()) {
      // Normal expiry — reject only this session, leave others intact
      throw new UnauthorizedException('Refresh token expired')
    }

    const isValid = await bcrypt.compare(refreshToken, existingSession.refreshTokenHash)
    if (!isValid) {
      await this.revokeAllSessions(payload.userId)
      throw new UnauthorizedException('Invalid refresh token')
    }

    const user = await this.toAuthUser(payload.userId)
    const safeUser: AuthUser = {
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
    }

    const nextTokenId = randomUUID()
    const tokens = await this.generateTokens(safeUser, nextTokenId)

    await this.prisma.$transaction(async (tx) => {
      const revokeResult = await tx.authSession.updateMany({
        where: {
          tokenId: existingSession.tokenId,
          userId: existingSession.userId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      })

      if (revokeResult.count === 0) {
        throw new UnauthorizedException('Refresh token already used')
      }

      await this.createRefreshSession(
        safeUser.id,
        nextTokenId,
        tokens.refreshToken,
        metadata,
        tx,
      )
    })

    // Deactivate old session, activate new one
    await Promise.all([
      this.redis.del(`sess:active:${existingSession.tokenId}`),
      this.activateSession(nextTokenId),
    ])

    return { user: safeUser, tokens }
  }

  async logoutCurrentSession(refreshToken?: string) {
    if (!refreshToken) return

    try {
      const payload = await this.verifyRefreshToken(refreshToken)
      if (!payload.tokenId) return
      await this.revokeSession(payload.userId, payload.tokenId)
      await this.redis.del(`sess:active:${payload.tokenId}`)
    } catch {
      // Logout should be idempotent; ignore invalid/expired token
    }
  }

  async logoutAll(userId: string) {
    await this.revokeAllSessions(userId)
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    })

    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    if (!user.password) {
      throw new BadRequestException('Password not set for this account. Please use Telegram to log in.')
    }

    const isValid = await bcrypt.compare(currentPassword, user.password)
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect')
    }

    if (currentPassword === newPassword) {
      throw new BadRequestException('New password must be different')
    }

    const hashedPassword = await bcrypt.hash(newPassword, bcryptSaltRounds)

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      })

      await tx.authSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      })
    })
  }

  async getProfile(userId: string) {
    return this.toAuthUser(userId)
  }

  async updateProfile(userId: string, name?: string) {
    if (!name?.trim()) return this.toAuthUser(userId)

    return this.prisma.user.update({
      where: { id: userId },
      data: { name: name.trim() },
      select: { id: true, name: true, phone: true, role: true, createdAt: true },
    })
  }

  async unlinkTelegram(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { telegramId: null, telegramUsername: null, telegramPhoto: null },
    })
    return { message: 'Telegram unlinked' }
  }
}
