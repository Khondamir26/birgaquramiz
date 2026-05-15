import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import Redis from 'ioredis'
import { PrismaService } from '../../prisma/prisma.service'
import { TelegramService } from '../../telegram/telegram.service'
import { SmsService } from './sms.service'
import { GeocodingService } from '../../maps/geocoding.service'

export type CustomerNotifType =
  | 'ASSIGNMENT_CREATED'
  | 'PICKED_UP'
  | 'DRIVER_APPROACHING'
  | 'DELIVERED'
  | 'ISSUE_REPORTED'

/** Meters from destination that triggers the "almost there" notification */
const APPROACHING_THRESHOLD_M = 800

/** Redis TTL per notification type (seconds). Prevents re-sending the same message. */
const NOTIF_TTL: Record<CustomerNotifType, number> = {
  ASSIGNMENT_CREATED: 86_400,
  PICKED_UP:          86_400,
  DRIVER_APPROACHING: 21_600, // 6h — short so it re-fires on a new delivery day
  DELIVERED:          86_400,
  ISSUE_REPORTED:      1_800, // 30 min — driver may report multiple issues
}

interface CustomerContact {
  telegramId: string | null
  phone:      string | null
}

@Injectable()
export class CustomerNotificationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CustomerNotificationService.name)
  private redis!: Redis

  constructor(
    private readonly prisma:    PrismaService,
    private readonly telegram:  TelegramService,
    private readonly sms:       SmsService,
    private readonly geocoding: GeocodingService,
  ) {}

  onModuleInit() {
    this.redis = new Redis({
      host:        process.env.REDIS_HOST     ?? 'localhost',
      port:        Number(process.env.REDIS_PORT ?? 6379),
      password:    process.env.REDIS_PASSWORD,
      lazyConnect: true,
    })
    this.redis.connect().catch(() =>
      this.logger.warn('[customer-notif] Redis unavailable — dedup disabled'),
    )
  }

  async onModuleDestroy() {
    await this.redis.quit()
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  /**
   * Send a customer notification for an order.
   * Fire-and-forget safe — never throws.
   */
  async notify(orderId: string, type: CustomerNotifType): Promise<void> {
    try {
      if (await this.isDuplicate(orderId, type)) return

      const contact = await this.getContact(orderId)
      if (!contact?.telegramId && !contact?.phone) return

      const shortId = orderId.slice(0, 8)
      const { tg, sms } = this.buildMessages(type, shortId)

      await this.dispatch(contact, tg, sms)
      this.logger.log(`[customer-notif] ${type} sent for order=${shortId}`)
    } catch (err) {
      this.logger.warn(`[customer-notif] ${type} failed for order=${orderId}: ${err}`)
    }
  }

  /**
   * Look up orderId from assignmentId then notify.
   * Fire-and-forget safe — never throws.
   */
  async notifyByAssignment(assignmentId: string, type: CustomerNotifType): Promise<void> {
    try {
      const assignment = await this.prisma.deliveryAssignment.findUnique({
        where:  { id: assignmentId },
        select: { orderId: true },
      })
      if (assignment) await this.notify(assignment.orderId, type)
    } catch {
      // Never throw
    }
  }

  /**
   * Called on every driver location update.
   * Redis EXISTS check is O(1) — exits immediately if notification already sent.
   */
  /**
   * Returns true the first time the driver crosses the 800m threshold so the
   * gateway can also emit a realtime socket event to the order room.
   */
  async checkApproaching(
    lat:     number,
    lng:     number,
    orderId: string,
  ): Promise<boolean> {
    try {
      // Fast path: already notified
      const key    = this.dedupKey(orderId, 'DRIVER_APPROACHING')
      const exists = await this.redis.exists(key).catch(() => 1)
      if (exists) return false

      // Get delivery address (one DB read, cached by geocoding service after)
      const assignment = await this.prisma.deliveryAssignment.findUnique({
        where:   { orderId },
        include: { order: { select: { deliveryAddress: true } } },
      })
      const address = (assignment?.order as { deliveryAddress?: string })?.deliveryAddress
      if (!address) return false

      const dest = await this.geocoding.geocode(address)
      if (!dest) return false

      if (this.haversineM(lat, lng, dest.lat, dest.lng) > APPROACHING_THRESHOLD_M) return false

      await this.notify(orderId, 'DRIVER_APPROACHING')
      return true
    } catch {
      return false
    }
  }

  // ─── Internals ─────────────────────────────────────────────────────────────

  private dedupKey(orderId: string, type: CustomerNotifType): string {
    return `notif:${orderId}:${type}`
  }

  /** Returns true if notification was already sent. Sets the key atomically if not. */
  private async isDuplicate(orderId: string, type: CustomerNotifType): Promise<boolean> {
    const key    = this.dedupKey(orderId, type)
    const ttl    = NOTIF_TTL[type]
    // SET NX EX: returns 'OK' if key was set (first time), null if already exists
    const result = await this.redis.set(key, '1', 'EX', ttl, 'NX').catch(() => null)
    return result === null
  }

  private async getContact(orderId: string): Promise<CustomerContact | null> {
    const order = await this.prisma.order.findUnique({
      where:  { id: orderId },
      select: {
        customerPhone: true,
        user: { select: { telegramId: true, phone: true } },
      },
    })
    if (!order) return null
    return {
      telegramId: order.user?.telegramId  ?? null,
      phone:      order.user?.phone       ?? order.customerPhone ?? null,
    }
  }

  private buildMessages(
    type:    CustomerNotifType,
    shortId: string,
  ): { tg: string; sms: string } {
    switch (type) {
      case 'ASSIGNMENT_CREATED':
        return {
          tg:  `🚚 *Birga Quramiz*\n\nZakaz #${shortId} uchun kuryer biriktirildi!\nYetkazishni kuzatib boring.`,
          sms: `Birga Quramiz: Zakaz #${shortId} uchun kuryer yo'lda!`,
        }
      case 'PICKED_UP':
        return {
          tg:  `📦 *Birga Quramiz*\n\nKuryer zakaz #${shortId}ni oldi va sizga yo'l oldi!\nYetkazishni kuzatib boring.`,
          sms: `Birga Quramiz: Kuryer zakaz #${shortId}ni oldi, yo'lda!`,
        }
      case 'DRIVER_APPROACHING':
        return {
          tg:  `📍 *Birga Quramiz*\n\nKuryer sizga yaqinlashib kelmoqda!\nBiroz kuting — tez yetib boradi.`,
          sms: `Birga Quramiz: Kuryer yaqin qoldi! Biroz kuting.`,
        }
      case 'DELIVERED':
        return {
          tg:  `✅ *Birga Quramiz*\n\nZakaz #${shortId} muvaffaqiyatli yetkazildi!\nXarid qilganingiz uchun rahmat 🙏`,
          sms: `Birga Quramiz: Zakaz #${shortId} yetkazildi! Rahmat.`,
        }
      case 'ISSUE_REPORTED':
        return {
          tg:  `⚠️ *Birga Quramiz*\n\nKuryer zakaz #${shortId} bo'yicha qiyinchilikka duch keldi.\nBiz tez hal qilamiz.`,
          sms: `Birga Quramiz: Kuryer muammoga duch keldi. Tez orada hal qilinadi.`,
        }
    }
  }

  /** Sends via Telegram if available, falls back to SMS. */
  private async dispatch(
    contact: CustomerContact,
    tgText:  string,
    smsText: string,
  ): Promise<void> {
    if (contact.telegramId) {
      await this.telegram.sendMessage(contact.telegramId, tgText)
    } else if (contact.phone) {
      await this.sms.send(contact.phone, smsText)
    }
  }

  private haversineM(
    lat1: number, lng1: number,
    lat2: number, lng2: number,
  ): number {
    const R    = 6_371_000
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }
}
