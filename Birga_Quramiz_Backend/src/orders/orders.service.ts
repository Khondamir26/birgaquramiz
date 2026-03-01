import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import type { CreateOrderDto } from './dto/create-order.dto'

interface OrderItemInput {
  productId: string
  quantity: number
}

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) { }

  async create(user: any, payload: CreateOrderDto) {
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

    return this.prisma.$transaction(async (tx) => {
      let total = 0
      const productsMap: Record<string, any> = {}

      let sellerId: string | null = null
      if (enforceOwnProductRule && userId) {
        const seller = await tx.seller.findUnique({ where: { userId } })
        sellerId = seller?.id ?? null
      }

      const productIds = items.map((item) => item.productId)
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        include: { seller: true },
      })
      const productDict = new Map(products.map((p) => [p.id, p]))

      for (const item of items) {
        const product = productDict.get(item.productId)

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

        productsMap[item.productId] = product
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
      })

      for (const item of items) {
        const product = productsMap[item.productId]

        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: product.id,
            quantity: item.quantity,
            price: product.price,
          },
        })

        const updatedProduct = await tx.product.updateMany({
          where: {
            id: product.id,
            stock: {
              gte: item.quantity,
            },
          },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        })

        if (updatedProduct.count === 0) {
          throw new BadRequestException('Not enough stock (concurrent update)')
        }
      }

      return order
    })
  }

  async payOrder(orderId: string, user: any) {
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

  async myOrders(user: any, status?: string, page = 1, limit = 10) {
    const safePage = page < 1 ? 1 : page
    const safeLimit = limit > 100 ? 100 : limit
    const skip = (safePage - 1) * safeLimit

    const whereCondition: any = {
      userId: user.id,
    }

    if (status) {
      const allowedStatuses = ['NEW', 'PAID', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']

      if (!allowedStatuses.includes(status)) {
        throw new BadRequestException('Invalid status filter')
      }

      whereCondition.status = status
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

  async updateStatus(orderId: string, status: 'CONFIRMED' | 'SHIPPED' | 'DELIVERED', user: any) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: { product: true },
        },
      },
    })

    if (!order) {
      throw new BadRequestException('Order not found')
    }

    if (user.role === 'SELLER') {
      const seller = await this.prisma.seller.findUnique({ where: { userId: user.id } })
      if (!seller) throw new BadRequestException('Seller not found')

      const ownsProduct = order.items.some((item) => item.product.sellerId === seller.id)
      if (!ownsProduct) throw new BadRequestException('Not your order')

      if (status === 'CONFIRMED' && order.status === 'PAID') {
        return this.prisma.order.update({ where: { id: orderId }, data: { status: 'CONFIRMED' } })
      }

      if (status === 'SHIPPED' && order.status === 'CONFIRMED') {
        return this.prisma.order.update({ where: { id: orderId }, data: { status: 'SHIPPED' } })
      }
    }

    if (user.role === 'USER') {
      if (order.userId !== user.id) throw new BadRequestException('Not your order')

      if (status === 'DELIVERED' && order.status === 'SHIPPED') {
        return this.prisma.order.update({ where: { id: orderId }, data: { status: 'DELIVERED' } })
      }
    }

    throw new BadRequestException('Invalid status transition')
  }

  async sellerOrders(user: any, status?: string, page = 1, limit = 10) {
    const seller = await this.prisma.seller.findUnique({ where: { userId: user.id } })
    if (!seller) throw new BadRequestException('Seller not found')

    const safePage = page < 1 ? 1 : page
    const safeLimit = limit > 100 ? 100 : limit
    const skip = (safePage - 1) * safeLimit

    const whereCondition: any = {
      items: {
        some: {
          product: {
            sellerId: seller.id,
          },
        },
      },
    }

    if (status) {
      const allowedStatuses = ['NEW', 'PAID', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']
      if (!allowedStatuses.includes(status)) throw new BadRequestException('Invalid status filter')
      whereCondition.status = status
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

  async cancelOrder(orderId: string, user: any) {
    if (user.role !== 'USER' && user.role !== 'SELLER') {
      throw new BadRequestException('Only users and sellers can cancel orders')
    }

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
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
        const seller = await tx.seller.findUnique({ where: { userId: user.id } })
        if (!seller) throw new BadRequestException('Seller not found')

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

      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        })
      }

      return { message: 'Order cancelled successfully' }
    })
  }
}