import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import type { AuthUser } from '../auth/auth.types'

@Injectable()
export class SellerService {
  constructor(private prisma: PrismaService) {}

  private ensureSellerProfile(user: AuthUser, company?: string) {
    return this.prisma.seller.upsert({
      where: { userId: user.id },
      update: company?.trim() ? { company: company.trim() } : {},
      create: {
        userId: user.id,
        company: company?.trim() || `${user.name} Store`,
      },
    })
  }

  async becomeSeller(company: string, user: AuthUser) {
    if (user.role === 'ADMIN') {
      throw new BadRequestException('Admins cannot become sellers')
    }

    const seller = await this.ensureSellerProfile(user, company)

    if (user.role === 'USER') {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { role: 'SELLER' },
      })
    }

    return {
      message: 'Now you are SELLER',
      seller,
    }
  }

  async getAnalytics(user: AuthUser) {
    const seller = await this.ensureSellerProfile(user)

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

  async getPublicProfile(articleNumber: number) {
    const seller = await this.prisma.seller.findUnique({
      where: { articleNumber },
      include: {
        user: { select: { id: true, createdAt: true } },
        products: {
          where: { status: 'APPROVED' },
          select: {
            id: true, name: true, slug: true, price: true, imageUrl: true, images: true,
            stock: true, sku: true, status: true, createdAt: true, rating: true, reviewsCount: true,
            category: {
              select: { id: true, name: true, nameEn: true, nameUz: true, code: true, slug: true, parentId: true,
                parent: { select: { id: true, name: true, nameEn: true, nameUz: true, slug: true } }
              }
            },
            brand: { select: { id: true, name: true, slug: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 48,
        },
      },
    })

    if (!seller) throw new NotFoundException('Seller not found')

    // Count total sold (order items delivered)
    const soldResult = await this.prisma.orderItem.aggregate({
      _sum: { quantity: true },
      where: {
        product: { sellerId: seller.id },
        order: { status: 'DELIVERED' },
      },
    })

    const totalProducts = seller.products.length

    return {
      id: seller.id,
      articleNumber: seller.articleNumber,
      company: seller.company,
      verified: seller.verified,
      memberSince: seller.user.createdAt,
      totalProducts,
      totalSold: soldResult._sum.quantity ?? 0,
      products: seller.products,
    }
  }
}
