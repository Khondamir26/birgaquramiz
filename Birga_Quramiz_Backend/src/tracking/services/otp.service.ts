import { Injectable, Logger, BadRequestException, HttpException, HttpStatus } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { SmsService } from './sms.service'
import Redis from 'ioredis'

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name)
  private readonly redis: Redis

  /** OTP valid for 10 minutes */
  private readonly OTP_TTL = 600

  constructor(
    private readonly prisma: PrismaService,
    private readonly sms: SmsService,
  ) {
    this.redis = new Redis({
      host: process.env.REDIS_HOST ?? 'localhost',
      port: Number(process.env.REDIS_PORT ?? 6379),
      password: process.env.REDIS_PASSWORD,
    })
  }

  /** Generate a 6-digit OTP, cache it, and SMS it to the customer */
  async generateOTP(orderId: string): Promise<string> {
    const code = String(Math.floor(100000 + Math.random() * 900000))
    const key = `otp:${orderId}`
    await this.redis.setex(key, this.OTP_TTL, code)
    this.logger.log(`[otp] generated for order=${orderId}`)

    // Fetch customer phone from the order
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: { user: { select: { phone: true, name: true } } },
      })

      const phone = order?.user?.phone
      if (phone) {
        const name = order?.user?.name ?? 'Mijoz'
        await this.sms.send(
          phone,
          `Birga Quramiz: ${name}, yetkazib berish kodi: ${code}. Uni haydovchiga bering. Kod 10 daqiqa amal qiladi.`,
        )
      } else {
        this.logger.warn(`[otp] order=${orderId} has no customer phone — OTP not SMSed`)
      }
    } catch (err) {
      this.logger.error(`[otp] failed to fetch order/send SMS for order=${orderId}: ${err}`)
    }

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

  /**
   * Public resend — called from the customer tracking page.
   * Rate-limited: max 3 resends per order per hour, 60s cooldown between attempts.
   */
  async resendForCustomer(orderId: string): Promise<void> {
    const countKey    = `otp_resend:count:${orderId}`
    const cooldownKey = `otp_resend:cooldown:${orderId}`

    const [cooldownExists, countStr] = await Promise.all([
      this.redis.exists(cooldownKey),
      this.redis.get(countKey),
    ])

    if (cooldownExists) {
      throw new HttpException('Подождите 60 секунд перед повторной отправкой', HttpStatus.TOO_MANY_REQUESTS)
    }

    const count = parseInt(countStr ?? '0', 10)
    if (count >= 3) {
      throw new HttpException('Превышено максимальное количество отправок кода', HttpStatus.TOO_MANY_REQUESTS)
    }

    await this.generateOTP(orderId)

    // Cooldown: 60s; total count: expires after 1h
    const pipeline = this.redis.multi().setex(cooldownKey, 60, '1').incr(countKey)
    if (count === 0) pipeline.expire(countKey, 3_600)
    await pipeline.exec()
  }
}
