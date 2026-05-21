import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import type { CreateOrderDto } from './dto/create-order.dto'
import type { AuthUser } from '../auth/auth.types'
import type { OrderStatus, Prisma, ProductStatus } from '@prisma/client'
import { TelegramService } from '../telegram/telegram.service'
import { SmsService } from '../tracking/services/sms.service'

interface OrderItemInput {
  productId: string
  quantity: number
}

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private telegramService: TelegramService,
    private smsService: SmsService,
  ) { }

  private getOrderLang(code?: string | null): 'uz' | 'ru' | 'en' {
    if (!code) return 'uz'
    if (code.startsWith('ru')) return 'ru'
    if (code.startsWith('en')) return 'en'
    return 'uz'
  }

  private orderMsg(
    status: 'NEW' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED',
    shortId: string,
    lang: 'uz' | 'ru' | 'en',
  ): { tg: string; sms: string } {
    const msgs = {
      NEW: {
        uz: { tg: `📦 *Birga Quramiz*\n\nZakaz #${shortId} qabul qilindi. Tayyorlanmoqda.`, sms: `Birga Quramiz: Zakaz #${shortId} qabul qilindi!` },
        ru: { tg: `📦 *Birga Quramiz*\n\nЗаказ #${shortId} принят. Готовится к отправке.`, sms: `Birga Quramiz: Zaказ #${shortId} принят!` },
        en: { tg: `📦 *Birga Quramiz*\n\nOrder #${shortId} received. We are preparing it.`, sms: `Birga Quramiz: Order #${shortId} received!` },
      },
      CONFIRMED: {
        uz: { tg: `✅ *Birga Quramiz*\n\nZakaz #${shortId} tasdiqlandi. Yaqinda jo'natiladi.`, sms: `Birga Quramiz: Zakaz #${shortId} tasdiqlandi!` },
        ru: { tg: `✅ *Birga Quramiz*\n\nЗаказ #${shortId} подтверждён. Скоро будет отправлен.`, sms: `Birga Quramiz: Заказ #${shortId} подтверждён!` },
        en: { tg: `✅ *Birga Quramiz*\n\nOrder #${shortId} confirmed. Will be shipped soon.`, sms: `Birga Quramiz: Order #${shortId} confirmed!` },
      },
      SHIPPED: {
        uz: { tg: `🚚 *Birga Quramiz*\n\nZakaz #${shortId} yo'lga chiqdi. Tez orada yetkaziladi!`, sms: `Birga Quramiz: Zakaz #${shortId} jo'natildi!` },
        ru: { tg: `🚚 *Birga Quramiz*\n\nЗаказ #${shortId} отправлен. Скоро доставим!`, sms: `Birga Quramiz: Заказ #${shortId} отправлен!` },
        en: { tg: `🚚 *Birga Quramiz*\n\nOrder #${shortId} shipped. On its way to you!`, sms: `Birga Quramiz: Order #${shortId} shipped!` },
      },
      DELIVERED: {
        uz: { tg: `📦 *Birga Quramiz*\n\nZakaz #${shortId} yetkazildi. Xarid qilganingiz uchun rahmat!`, sms: `Birga Quramiz: Zakaz #${shortId} yetkazildi! Rahmat.` },
        ru: { tg: `📦 *Birga Quramiz*\n\nЗаказ #${shortId} доставлен. Спасибо за покупку!`, sms: `Birga Quramiz: Заказ #${shortId} доставлен! Спасибо.` },
        en: { tg: `📦 *Birga Quramiz*\n\nOrder #${shortId} delivered. Thank you for your purchase!`, sms: `Birga Quramiz: Order #${shortId} delivered! Thank you.` },
      },
      CANCELLED: {
        uz: { tg: `❌ *Birga Quramiz*\n\nZakaz #${shortId} bekor qilindi.`, sms: `Birga Quramiz: Zakaz #${shortId} bekor qilindi.` },
        ru: { tg: `❌ *Birga Quramiz*\n\nЗаказ #${shortId} отменён.`, sms: `Birga Quramiz: Заказ #${shortId} отменён.` },
        en: { tg: `❌ *Birga Quramiz*\n\nOrder #${shortId} cancelled.`, sms: `Birga Quramiz: Order #${shortId} cancelled.` },
      },
    }
    return msgs[status][lang]
  }

  private async notifyOrderUser(
    telegramId: string | null | undefined,
    phone: string | null | undefined,
    telegramText: string,
    smsText: string,
  ): Promise<void> {
    try {
      if (telegramId) {
        await this.telegramService.sendMessage(telegramId, telegramText)
      } else if (phone) {
        await this.smsService.send(phone, smsText)
      }
    } catch {}
  }

  private async getSellerProfile(
    user: AuthUser,
    prismaClient: PrismaService | Prisma.TransactionClient = this.prisma,
  ) {
    const seller = await prismaClient.seller.findUnique({ where: { userId: user.id } })
    if (!seller) throw new NotFoundException('Seller profile not found')
    return seller
  }

  async create(user: AuthUser, payload: CreateOrderDto) {
    if (user.role !== 'USER') {
      throw new BadRequestException('Only users can place orders')
    }

    return this.createOrderInternal(payload.items, payload, user.id, true)
  }

  async createGuest(payload: CreateOrderDto) {
    return this.createOrderInternal(payload.items, payload, null, false)
  }

  private async createOrderInternal(
    items: OrderItemInput[],
    payload: CreateOrderDto,
    userId: string | null,
    enforceOwnProductRule: boolean,
  ) {
    if (!items || items.length === 0) {
      throw new BadRequestException('Order is empty')
    }

    if (payload.deliveryType === 'DELIVERY' && !payload.deliveryAddress?.trim()) {
      throw new BadRequestException('Delivery address is required for delivery orders')
    }

    const createdOrder = await this.prisma.$transaction(async (tx) => {
      let total = 0
      const productsMap = new Map<string, { id: string; sellerId: string; price: number; stock: number; status: ProductStatus }>()

      let sellerId: string | null = null
      if (enforceOwnProductRule && userId) {
        const seller = await tx.seller.findUnique({ where: { userId } })
        sellerId = seller?.id ?? null
      }

      const productIds = [...new Set(items.map((item) => item.productId))]
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, sellerId: true, price: true, stock: true, status: true },
      })

      for (const product of products) {
        productsMap.set(product.id, product)
      }

      for (const item of items) {
        const product = productsMap.get(item.productId)

        if (!product) {
          throw new BadRequestException('Product not found')
        }

        if (product.status !== 'APPROVED') {
          throw new BadRequestException('Product not approved')
        }

        if (product.stock < item.quantity) {
          throw new BadRequestException('Not enough stock')
        }

        if (sellerId && product.sellerId === sellerId) {
          throw new BadRequestException('You cannot order your own product')
        }

        total += product.price * item.quantity
      }

      const order = await tx.order.create({
        data: {
          userId: userId ?? undefined,
          customerName: payload.customerName,
          customerPhone: payload.customerPhone,
          deliveryType: payload.deliveryType,
          deliveryAddress: payload.deliveryAddress,
          paymentMethod: payload.paymentMethod,
          comment: payload.comment,
          total,
        },
        include: {
          user: {
            select: { telegramId: true, languageCode: true }
          }
        }
      })

      // Batch insert all order items in one query
      await tx.orderItem.createMany({
        data: items.map((item) => {
          const product = productsMap.get(item.productId)!
          return { orderId: order.id, productId: product.id, quantity: item.quantity, price: product.price }
        }),
      })

      // Decrement stock in parallel (each product has a different amount)
      const stockUpdates = await Promise.all(
        items.map((item) =>
          tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          }),
        ),
      )

      if (stockUpdates.some((r) => r.count === 0)) {
        throw new BadRequestException('Not enough stock (concurrent update)')
      }

      return order
    })

    if (createdOrder.user?.telegramId) {
      const lang = this.getOrderLang(createdOrder.user.languageCode)
      const msg = this.orderMsg('NEW', createdOrder.id.slice(0, 8), lang)
      this.telegramService.sendMessage(createdOrder.user.telegramId, msg.tg).catch(e => console.error(e))
    }

    return createdOrder
  }

  async payOrder(orderId: string, user: AuthUser) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    })

    if (!order) {
      throw new BadRequestException('Order not found')
    }

    if (order.userId !== user.id) {
      throw new BadRequestException('Not your order')
    }

    if (order.status !== 'NEW') {
      throw new BadRequestException('Order cannot be paid')
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'PAID' },
    })
  }

  async myOrders(user: AuthUser, status?: string, page = 1, limit = 10) {
    const safePage = page < 1 ? 1 : page
    const safeLimit = limit > 100 ? 100 : limit
    const skip = (safePage - 1) * safeLimit

    const whereCondition: Prisma.OrderWhereInput = {
      userId: user.id,
    }

    if (status) {
      const allowedStatuses: OrderStatus[] = ['NEW', 'PAID', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']
      const normalizedStatus = status as OrderStatus

      if (!allowedStatuses.includes(normalizedStatus)) {
        throw new BadRequestException('Invalid status filter')
      }

      whereCondition.status = normalizedStatus
    }

    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where: whereCondition,
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: safeLimit,
      }),
      this.prisma.order.count({ where: whereCondition }),
    ])

    return {
      data: orders,
      meta: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    }
  }

  async updateStatus(orderId: string, status: 'CONFIRMED' | 'SHIPPED' | 'DELIVERED', user: AuthUser) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: { product: true },
        },
        user: {
          select: { telegramId: true, phone: true, languageCode: true }
        }
      },
    })

    if (!order) {
      throw new BadRequestException('Order not found')
    }

    if (user.role === 'SELLER') {
      const seller = await this.getSellerProfile(user)

      const ownsProduct = order.items.some((item) => item.product.sellerId === seller.id)
      if (!ownsProduct) throw new BadRequestException('Not your order')

      if (status === 'CONFIRMED' && order.status === 'PAID') {
        const updated = await this.prisma.order.update({ where: { id: orderId }, data: { status: 'CONFIRMED' } })
        const lang = this.getOrderLang(order.user?.languageCode)
        const msg = this.orderMsg('CONFIRMED', order.id.slice(0, 8), lang)
        void this.notifyOrderUser(order.user?.telegramId, order.user?.phone, msg.tg, msg.sms)
        return updated
      }

      if (status === 'SHIPPED' && order.status === 'CONFIRMED') {
        const updated = await this.prisma.order.update({ where: { id: orderId }, data: { status: 'SHIPPED' } })
        const lang = this.getOrderLang(order.user?.languageCode)
        const msg = this.orderMsg('SHIPPED', order.id.slice(0, 8), lang)
        void this.notifyOrderUser(order.user?.telegramId, order.user?.phone, msg.tg, msg.sms)
        return updated
      }
    }

    if (user.role === 'USER') {
      if (order.userId !== user.id) throw new BadRequestException('Not your order')

      if (status === 'DELIVERED' && order.status === 'SHIPPED') {
        const updated = await this.prisma.order.update({ where: { id: orderId }, data: { status: 'DELIVERED' } })
        const lang = this.getOrderLang(order.user?.languageCode)
        const msg = this.orderMsg('DELIVERED', order.id.slice(0, 8), lang)
        void this.notifyOrderUser(order.user?.telegramId, order.user?.phone, msg.tg, msg.sms)
        return updated
      }
    }

    throw new BadRequestException('Invalid status transition')
  }

  async sellerOrders(user: AuthUser, status?: string, page = 1, limit = 10) {
    const seller = await this.getSellerProfile(user)

    const safePage = page < 1 ? 1 : page
    const safeLimit = limit > 100 ? 100 : limit
    const skip = (safePage - 1) * safeLimit

    const whereCondition: Prisma.OrderWhereInput = {
      items: {
        some: {
          product: {
            sellerId: seller.id,
          },
        },
      },
    }

    if (status) {
      const allowedStatuses: OrderStatus[] = ['NEW', 'PAID', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']
      const normalizedStatus = status as OrderStatus
      if (!allowedStatuses.includes(normalizedStatus)) throw new BadRequestException('Invalid status filter')
      whereCondition.status = normalizedStatus
    }

    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where: whereCondition,
        include: {
          items: {
            include: {
              product: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              role: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
      }),
      this.prisma.order.count({ where: whereCondition }),
    ])

    return {
      data: orders,
      meta: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    }
  }

  async findOne(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: { product: true },
        },
      },
    })
    if (!order || order.userId !== userId) throw new NotFoundException('Order not found')
    return order
  }

  async cancelOrder(orderId: string, user: AuthUser) {
    if (user.role !== 'USER' && user.role !== 'SELLER') {
      throw new BadRequestException('Only users and sellers can cancel orders')
    }

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
          user: { select: { telegramId: true, phone: true } },
        },
      })

      if (!order) throw new BadRequestException('Order not found')

      if (order.status === 'SHIPPED' || order.status === 'DELIVERED' || order.status === 'CANCELLED') {
        throw new BadRequestException('Order cannot be cancelled at this stage')
      }

      if (user.role === 'USER') {
        if (order.userId !== user.id) throw new BadRequestException('Not your order')
        if (order.status !== 'NEW' && order.status !== 'CONFIRMED') {
          throw new BadRequestException('You cannot cancel this order at this stage')
        }
      }

      if (user.role === 'SELLER') {
        const seller = await this.getSellerProfile(user, tx)

        const ownsProduct = await tx.orderItem.findFirst({
          where: {
            orderId,
            product: {
              sellerId: seller.id,
            },
          },
        })

        if (!ownsProduct) throw new BadRequestException('Not your order')

        if (order.status !== 'NEW' && order.status !== 'CONFIRMED') {
          throw new BadRequestException('Seller cannot cancel this order at this stage')
        }
      }

      const updated = await tx.order.updateMany({
        where: {
          id: orderId,
          status: {
            in: ['NEW', 'CONFIRMED'],
          },
        },
        data: {
          status: 'CANCELLED',
        },
      })

      if (updated.count === 0) throw new BadRequestException('Order cannot be cancelled')

      // Restore stock in parallel
      await Promise.all(
        order.items.map((item) =>
          tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          }),
        ),
      )

      // Notify customer when seller cancels their order
      if (user.role === 'SELLER') {
        void this.notifyOrderUser(
          order.user?.telegramId, order.user?.phone ?? order.customerPhone,
          `❌ *Birga Quramiz*\n\nAfsuski, zakaz #${order.id.slice(0, 8)} sotuvchi tomonidan bekor qilindi. Boshqa mahsulot tanlashingiz mumkin.`,
          `Birga Quramiz: Zakaz #${order.id.slice(0, 8)} bekor qilindi.`,
        )
      }

      return { message: 'Order cancelled successfully' }
    })
  }
}
