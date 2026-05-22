import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import type { Request } from 'express'
import { PrismaService } from '../prisma/prisma.service'
import type { AuthUser, JwtPayload } from './auth.types'
import Redis from 'ioredis'

function requiredEnv(name: string) {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`${name} environment variable is required`)
  }
  return value
}

const jwtSecret = requiredEnv('JWT_SECRET')

const cookieExtractor = (req: Request): string | null => {
  if (!req?.cookies) return null
  return req.cookies['access_token'] ?? null
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly redis: Redis

  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: jwtSecret,
    })
    this.redis = new Redis({
      host: process.env.REDIS_HOST ?? 'localhost',
      port: Number(process.env.REDIS_PORT ?? 6379),
      password: process.env.REDIS_PASSWORD,
    })
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    // Verify session is still active (immediate logout support)
    const isActive = await this.redis.exists(`sess:active:${payload.tokenId}`)
    if (!isActive) {
      throw new UnauthorizedException('Session expired or logged out')
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
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

    return { ...user, tokenId: payload.tokenId }
  }
}
