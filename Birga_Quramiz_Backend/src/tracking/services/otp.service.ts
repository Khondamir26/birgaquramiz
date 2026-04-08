import { Injectable, Logger, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import Redis from 'ioredis'

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name)
  private readonly redis: Redis

  /** OTP valid for 10 minutes */
  private readonly OTP_TTL = 600

  constructor(private readonly prisma: PrismaService) {
    this.redis = new Redis({
      host: process.env.REDIS_HOST ?? 'localhost',
      port: Number(process.env.REDIS_PORT ?? 6379),
      password: process.env.REDIS_PASSWORD,
    })
  }

  /** Generate a 6-digit OTP for delivery confirmation and cache it */
  async generateOTP(orderId: string): Promise<string> {
    const code = String(Math.floor(100000 + Math.random() * 900000))
    const key = `otp:${orderId}`
    await this.redis.setex(key, this.OTP_TTL, code)
    this.logger.log(`[otp] generated for order=${orderId}`)

    // In production: send SMS to customer via Eskiz/Playmobile (Uzbekistan SMS providers)
    // await this.smsService.send(customerPhone, `Birga yetkazib berish kodi: ${code}`)
    // For now we return the code so the backend can send it via whatever SMS provider

    return code
  }

  /** Verify OTP submitted by driver. One-time use — deletes on success. */
  async verifyOTP(orderId: string, code: string): Promise<boolean> {
    const key = `otp:${orderId}`
    const stored = await this.redis.get(key)

    if (!stored) {
      throw new BadRequestException('OTP expired or not generated')
    }

    if (stored !== code.trim()) {
      return false
    }

    // Delete after successful use — one-time only
    await this.redis.del(key)
    this.logger.log(`[otp] verified for order=${orderId}`)
    return true
  }

  async revokeOTP(orderId: string): Promise<void> {
    await this.redis.del(`otp:${orderId}`)
  }
}
