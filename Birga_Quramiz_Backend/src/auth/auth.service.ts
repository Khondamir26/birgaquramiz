import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import * as bcrypt from 'bcrypt'
import { JwtService } from '@nestjs/jwt'
import { randomUUID, createHmac } from 'crypto'
import type { Prisma } from '@prisma/client'
import type { AuthUser, JwtPayload } from './auth.types'

const ACCESS_TOKEN_TTL = '15m'
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

type SessionMetadata = {
  userAgent?: string | null
  ipAddress?: string | null
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) { }

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

  private async revokeSession(userId: string, tokenId: string) {
    return this.prisma.authSession.updateMany({
      where: {
        userId,
        tokenId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    })
  }

  async revokeAllSessions(userId: string) {
    await this.prisma.authSession.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    })
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

  async telegramLogin(initData: string, metadata: SessionMetadata = {}) {
    if (!telegramBotToken) {
      throw new BadRequestException('Telegram integration is not configured')
    }

    const urlParams = new URLSearchParams(initData)
    const hash = urlParams.get('hash')

    if (!hash) {
      throw new UnauthorizedException('Invalid initData: missing hash')
    }

    urlParams.delete('hash')

    const params: string[] = []

    urlParams.forEach((value, key) => {
      params.push(`${key}=${value}`)
    })

    params.sort()

    const dataCheckString = params.join('\n')

    const secretKey = createHmac('sha256', 'WebAppData')
      .update(telegramBotToken)
      .digest()

    const calculatedHash = createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex')

    if (calculatedHash !== hash) {
      throw new UnauthorizedException('Invalid Telegram signature')
    }

    const authDate = Number(urlParams.get('auth_date'))

    if (!authDate) {
      throw new UnauthorizedException('Invalid initData: missing auth_date')
    }

    const now = Math.floor(Date.now() / 1000)

    if (now - authDate > 86400) {
      throw new UnauthorizedException('Telegram initData is expired')
    }

    const userStr = urlParams.get('user')

    if (!userStr) {
      throw new UnauthorizedException('Invalid initData: missing user data')
    }

    let tgUser: any

    try {
      tgUser = JSON.parse(userStr)
    } catch {
      throw new UnauthorizedException('Invalid initData: invalid user JSON')
    }

    const telegramId = String(tgUser.id)
    const telegramUsername = tgUser.username ?? null
    const telegramPhoto = tgUser.photo_url ?? null
    const languageCode = tgUser.language_code ?? null

    const name =
      tgUser.first_name +
      (tgUser.last_name ? ` ${tgUser.last_name}` : '')

    // Use upsert to avoid race conditions
    const user = await this.prisma.user.upsert({
      where: { telegramId },
      create: {
        telegramId,
        name,
        telegramUsername,
        telegramPhoto,
        languageCode,
      },
      update: {
        telegramUsername,
        telegramPhoto,
        languageCode,
      },
    })

    const safeUser: AuthUser = {
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
    }

    const tokenId = randomUUID()

    const tokens = await this.generateTokens(safeUser, tokenId)

    await this.createRefreshSession(
      user.id,
      tokenId,
      tokens.refreshToken,
      metadata,
    )

    return { user: safeUser, tokens }
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

    if (existingSession.revokedAt || existingSession.expiresAt <= new Date()) {
      await this.revokeAllSessions(payload.userId)
      throw new UnauthorizedException('Refresh token revoked')
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

    return { user: safeUser, tokens }
  }

  async logoutCurrentSession(refreshToken?: string) {
    if (!refreshToken) return

    try {
      const payload = await this.verifyRefreshToken(refreshToken)
      if (!payload.tokenId) return
      await this.revokeSession(payload.userId, payload.tokenId)
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
}
