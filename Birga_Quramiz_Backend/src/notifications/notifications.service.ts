import { Injectable, Logger, forwardRef, Inject } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { PrismaService } from '../prisma/prisma.service'
import { TrackingGateway } from '../tracking/tracking.gateway'
import { NotificationType, Prisma } from '@prisma/client'
import { OrderCreatedEvent, OrderStatusChangedEvent } from './events/order.events'
import { ProductModerationEvent, SellerStatusChangedEvent } from './events/product.events'

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name)

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => TrackingGateway))
    private readonly gateway: TrackingGateway,
  ) {}

  async create(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ) {
    const notification = await this.prisma.notification.create({
      data: { userId, type, title, body, data: data !== undefined ? (data as Prisma.InputJsonValue) : Prisma.JsonNull },
    })
    this.gateway.pushNotification(userId, notification)
    return notification
  }

  async findAll(userId: string, page = 1, limit = 20) {
    const skip = (Math.max(1, page) - 1) * limit
    const [items, total, unread] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, readAt: null } }),
    ])
    return { data: items, meta: { total, page, limit, totalPages: Math.ceil(total / limit), unread } }
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({ where: { userId, readAt: null } })
    return { count }
  }

  async markRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { readAt: new Date() },
    })
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    })
  }

  // ─── Event handlers ──────────────────────────────────────────────────────────

  @OnEvent('order.created')
  async onOrderCreated(event: OrderCreatedEvent) {
    if (!event.sellerIds.length) return

    const sellers = await this.prisma.seller.findMany({
      where: { id: { in: event.sellerIds } },
      select: { userId: true },
    })

    await Promise.all(
      sellers.map((s) =>
        this.create(
          s.userId,
          NotificationType.ORDER_NEW,
          'New order received',
          `Order #${event.shortId} — ${event.customerName} — $${event.total.toLocaleString()}`,
          { orderId: event.orderId, shortId: event.shortId },
        ).catch((err) => this.logger.error(`notify seller ${s.userId}: ${String(err)}`)),
      ),
    )
  }

  @OnEvent('order.status_changed')
  async onOrderStatusChanged(event: OrderStatusChangedEvent) {
    if (!event.sellerUserIds.length) return

    const typeMap: Record<typeof event.status, NotificationType> = {
      CONFIRMED: NotificationType.ORDER_NEW, // reuse for now
      CANCELLED: NotificationType.ORDER_CANCELLED,
      SHIPPED:   NotificationType.ORDER_SHIPPED,
      DELIVERED: NotificationType.ORDER_DELIVERED,
    }

    const titleMap: Record<typeof event.status, string> = {
      CONFIRMED: 'Order confirmed',
      CANCELLED: 'Order cancelled',
      SHIPPED:   'Order shipped',
      DELIVERED: 'Order delivered',
    }

    const type = typeMap[event.status]
    const title = titleMap[event.status]

    await Promise.all(
      event.sellerUserIds.map((userId) =>
        this.create(
          userId,
          type,
          title,
          `Order #${event.shortId} is now ${event.status.toLowerCase()}`,
          { orderId: event.orderId, shortId: event.shortId },
        ).catch((err) => this.logger.error(`notify seller ${userId}: ${String(err)}`)),
      ),
    )
  }

  @OnEvent('product.moderated')
  async onProductModerated(event: ProductModerationEvent) {
    const type = event.status === 'APPROVED'
      ? NotificationType.PRODUCT_APPROVED
      : NotificationType.PRODUCT_REJECTED

    const title = event.status === 'APPROVED'
      ? 'Product approved'
      : 'Product rejected'

    const body = event.status === 'APPROVED'
      ? `"${event.productName}" has been approved and is now live`
      : `"${event.productName}" was rejected${event.reason ? `: ${event.reason}` : ''}`

    await this.create(event.sellerUserId, type, title, body, { productId: event.productId }).catch(
      (err) => this.logger.error(`notify product moderation: ${String(err)}`),
    )
  }

  @OnEvent('seller.status_changed')
  async onSellerStatusChanged(event: SellerStatusChangedEvent) {
    const type = event.status === 'APPROVED'
      ? NotificationType.SELLER_APPROVED
      : NotificationType.SELLER_REJECTED

    const title = event.status === 'APPROVED' ? 'Seller account approved' : 'Seller account rejected'
    const body = event.status === 'APPROVED'
      ? `Your store "${event.company}" is now live and accepting orders`
      : `Your store "${event.company}" application was not approved. Contact support for details.`

    await this.create(event.sellerUserId, type, title, body).catch(
      (err) => this.logger.error(`notify seller status: ${String(err)}`),
    )
  }
}
