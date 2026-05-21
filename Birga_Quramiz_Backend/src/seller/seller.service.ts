import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import type { AuthUser } from '../auth/auth.types'

@Injectable()
export class SellerService {
  constructor(private prisma: PrismaService) {}

  private async getSellerProfile(user: AuthUser) {
    const seller = await this.prisma.seller.findUnique({ where: { userId: user.id } })
    if (!seller) throw new NotFoundException('Seller profile not found')
    return seller
  }

  async becomeSeller(company: string, user: AuthUser) {
    if (user.role === 'ADMIN') {
      throw new BadRequestException('Admins cannot become sellers')
    }

    // Create or return existing seller profile — do NOT grant SELLER role yet.
    // Role is only upgraded once an admin calls verifySeller().
    const seller = await this.prisma.seller.upsert({
      where: { userId: user.id },
      update: company?.trim() ? { company: company.trim() } : {},
      create: {
        userId: user.id,
        company: company?.trim() || `${user.name} Store`,
      },
    })

    return {
      message: 'Your seller application has been submitted and is pending admin approval.',
      seller,
    }
  }

  async getAnalytics(user: AuthUser) {
    const seller = await this.getSellerProfile(user)

    // Count orders per status using DB aggregation — no full record fetch
    const [statusCounts, revenueResult, totalOrdersResult] = await Promise.all([
      this.prisma.order.groupBy({
        by: ['status'],
        where: { items: { some: { product: { sellerId: seller.id } } } },
        _count: { id: true },
      }),
      this.prisma.orderItem.aggregate({
        where: { product: { sellerId: seller.id }, order: { status: 'DELIVERED' } },
        _sum: { price: true, quantity: true },
      }),
      this.prisma.order.count({
        where: { items: { some: { product: { sellerId: seller.id } } } },
      }),
    ])

    const breakdown: Record<string, number> = {
      NEW: 0, CONFIRMED: 0, SHIPPED: 0, DELIVERED: 0, CANCELLED: 0,
    }
    for (const row of statusCounts) {
      breakdown[row.status] = row._count.id
    }

    // Revenue = sum(price * quantity) for delivered items
    // Since Prisma aggregate can't do price*qty, we compute from raw sum of price field
    // (price in OrderItem stores the unit price; quantity is separate)
    const deliveredItems = await this.prisma.orderItem.findMany({
      where: { product: { sellerId: seller.id }, order: { status: 'DELIVERED' } },
      select: { price: true, quantity: true },
    })
    const totalRevenue = deliveredItems.reduce((sum, i) => sum + i.price * i.quantity, 0)

    return {
      totalOrders: totalOrdersResult,
      totalRevenue,
      breakdown,
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
      status: seller.status,
      memberSince: seller.user.createdAt,
      totalProducts,
      totalSold: soldResult._sum.quantity ?? 0,
      products: seller.products,
    }
  }
}
