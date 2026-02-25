import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class SellerService {
  constructor(private prisma: PrismaService) { }

  async becomeSeller(company: string, user: any) {
    if (user.role !== 'USER') {
      throw new BadRequestException('Already seller or admin')
    }

    // создаём запись в Seller
    const seller = await this.prisma.seller.create({
      data: {
        userId: user.id,
        company,
      },
    })

    // обновляем роль
    await this.prisma.user.update({
      where: { id: user.id },
      data: { role: 'SELLER' },
    })

    return {
      message: 'Now you are SELLER 🚀',
      seller,
    }
  }
  async getAnalytics(user: any) {
    const seller = await this.prisma.seller.findUnique({
      where: { userId: user.id },
    })

    if (!seller) {
      throw new BadRequestException('Seller not found')
    }

    // Получаем все заказы где есть товары этого продавца
    const orders = await this.prisma.order.findMany({
      where: {
        items: {
          some: {
            product: {
              sellerId: seller.id,
            },
          },
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    let totalRevenue = 0
    let totalDelivered = 0
    let totalCancelled = 0
    let totalNew = 0
    let totalConfirmed = 0
    let totalShipped = 0

    for (const order of orders) {
      if (order.status === 'DELIVERED') {
        totalDelivered++

        // Count only this seller's delivered line items.
        for (const item of order.items) {
          if (item.product.sellerId === seller.id) {
            totalRevenue += item.price * item.quantity
          }
        }
      }

      if (order.status === 'CANCELLED') totalCancelled++
      if (order.status === 'NEW') totalNew++
      if (order.status === 'CONFIRMED') totalConfirmed++
      if (order.status === 'SHIPPED') totalShipped++
    }

    return {
      totalOrders: orders.length,
      totalRevenue,
      breakdown: {
        NEW: totalNew,
        CONFIRMED: totalConfirmed,
        SHIPPED: totalShipped,
        DELIVERED: totalDelivered,
        CANCELLED: totalCancelled,
      },
    }
  }
}