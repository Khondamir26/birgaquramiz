import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import type { OrderStatus, Prisma, Role } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getUsers(page = 1, limit = 20, role?: 'USER' | 'SELLER' | 'ADMIN', q?: string) {
    const safePage = page < 1 ? 1 : page
    const safeLimit = limit > 100 ? 100 : limit
    const skip = (safePage - 1) * safeLimit

    const where: Prisma.UserWhereInput = {}
    if (role) where.role = role

    if (q?.trim()) {
      const query = q.trim()
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query } },
      ]
    }

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          phone: true,
          role: true,
          createdAt: true,
          seller: { select: { id: true, company: true, verified: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
      }),
      this.prisma.user.count({ where }),
    ])

    return {
      data: users,
      meta: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    }
  }

  async updateUserRole(targetUserId: string, role: Role, actorId: string, company?: string) {
    const companyName = company?.trim()

    return this.prisma.$transaction(async (tx) => {
      const targetUser = await tx.user.findUnique({
        where: { id: targetUserId },
        select: {
          id: true,
          name: true,
          phone: true,
          role: true,
          createdAt: true,
        },
      })

      if (!targetUser) {
        throw new NotFoundException('User not found')
      }

      if (targetUser.id === actorId && role !== 'ADMIN') {
        throw new BadRequestException('You cannot remove your own admin role')
      }

      if (targetUser.role === 'ADMIN' && role !== 'ADMIN') {
        const adminsCount = await tx.user.count({ where: { role: 'ADMIN' } })
        if (adminsCount <= 1) {
          throw new BadRequestException('At least one admin must remain')
        }
      }

      let sellerProfile = await tx.seller.findUnique({
        where: { userId: targetUser.id },
        select: { id: true, userId: true, company: true, verified: true },
      })

      if (role === 'SELLER') {
        sellerProfile = await tx.seller.upsert({
          where: { userId: targetUser.id },
          update: companyName ? { company: companyName } : {},
          create: {
            userId: targetUser.id,
            company: companyName || `${targetUser.name} Store`,
          },
          select: { id: true, userId: true, company: true, verified: true },
        })
      } else if (sellerProfile) {
        const productsCount = await tx.product.count({
          where: { sellerId: sellerProfile.id },
        })

        if (productsCount > 0) {
          throw new BadRequestException('Cannot remove seller role while seller has products')
        }

        await tx.deletionRequest.deleteMany({
          where: { sellerId: sellerProfile.id },
        })

        await tx.seller.delete({
          where: { id: sellerProfile.id },
        })

        sellerProfile = null
      }

      const updatedUser = await tx.user.update({
        where: { id: targetUser.id },
        data: { role },
        select: {
          id: true,
          name: true,
          phone: true,
          role: true,
          createdAt: true,
        },
      })

      return {
        message: 'User role updated',
        user: updatedUser,
        seller: sellerProfile,
      }
    })
  }

  async getOrders(
    page = 1,
    limit = 20,
    status?: 'NEW' | 'PAID' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED',
    q?: string,
  ) {
    const safePage = page < 1 ? 1 : page
    const safeLimit = limit > 100 ? 100 : limit
    const skip = (safePage - 1) * safeLimit

    const where: Prisma.OrderWhereInput = {}

    if (status) {
      const allowed: OrderStatus[] = ['NEW', 'PAID', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']
      if (!allowed.includes(status)) {
        throw new BadRequestException('Invalid status filter')
      }
      where.status = status
    }

    if (q?.trim()) {
      const query = q.trim()
      where.OR = [
        { customerName: { contains: query, mode: 'insensitive' } },
        { customerPhone: { contains: query } },
        { id: { contains: query } },
        { user: { is: { name: { contains: query, mode: 'insensitive' } } } },
      ]
    }

    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: {
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
      this.prisma.order.count({ where }),
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

  async getProductById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            code: true,
            parentId: true,
            parent: { select: { id: true, name: true } },
          },
        },
        seller: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
                createdAt: true,
              },
            },
          },
        },
        moderationLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })

    if (!product) {
      throw new NotFoundException('Product not found')
    }

    const productsCount = await this.prisma.product.count({
      where: { sellerId: product.sellerId },
    })

    return {
      product: {
        id: product.id,
        sku: product.sku,
        title: product.name,
        description: product.description,
        price: product.price,
        images: product.images && product.images.length > 0 ? product.images : (product.imageUrl ? [product.imageUrl] : []),
        stock: product.stock,
        createdAt: product.createdAt.toISOString(),
        status: product.status,
        rejectionReason: product.rejectionReason,
        moderationLogs: product.moderationLogs,
        category: product.category,
      },
      seller: {
        id: product.seller.id,
        name: product.seller.user.name,
        companyName: product.seller.company,
        phone: product.seller.user.phone,
        createdAt: product.seller.user.createdAt.toISOString(),
        productsCount,
      },
    }
  }

  async getPendingSellers(page = 1, limit = 20, q?: string) {
    const safePage = page < 1 ? 1 : page
    const safeLimit = limit > 100 ? 100 : limit
    const skip = (safePage - 1) * safeLimit

    const where: Prisma.SellerWhereInput = { verified: false }

    if (q?.trim()) {
      const query = q.trim()
      where.OR = [
        { company: { contains: query, mode: 'insensitive' } },
        { user: { name: { contains: query, mode: 'insensitive' } } },
        { user: { phone: { contains: query } } },
      ]
    }

    const [sellers, total] = await this.prisma.$transaction([
      this.prisma.seller.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, phone: true, createdAt: true } },
          _count: { select: { products: true } },
        },
        orderBy: { user: { createdAt: 'desc' } },
        skip,
        take: safeLimit,
      }),
      this.prisma.seller.count({ where }),
    ])

    return {
      data: sellers,
      meta: { total, page: safePage, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) },
    }
  }

  async verifySeller(sellerId: string) {
    const seller = await this.prisma.seller.findUnique({ where: { id: sellerId } })
    if (!seller) throw new NotFoundException('Seller not found')

    // Verify seller and grant SELLER role atomically
    await this.prisma.$transaction([
      this.prisma.seller.update({ where: { id: sellerId }, data: { verified: true } }),
      this.prisma.user.update({ where: { id: seller.userId }, data: { role: 'SELLER' } }),
    ])

    return { message: 'Seller verified' }
  }

  async rejectSeller(sellerId: string) {
    const seller = await this.prisma.seller.findUnique({
      where: { id: sellerId },
      include: { _count: { select: { products: true } } },
    })
    if (!seller) throw new NotFoundException('Seller not found')

    if (seller._count.products > 0) {
      throw new BadRequestException('Cannot reject seller with existing products')
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.seller.delete({ where: { id: sellerId } })
      await tx.user.update({ where: { id: seller.userId }, data: { role: 'USER' } })
    })

    return { message: 'Seller rejected and role reverted to USER' }
  }

  async approveProduct(productId: string, adminId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } })
    if (!product) throw new NotFoundException('Product not found')

    await this.prisma.$transaction([
      this.prisma.product.update({
        where: { id: productId },
        data: {
          status: 'APPROVED',
          rejectionReason: null,
        },
      }),
      this.prisma.moderationLog.create({
        data: {
          adminId,
          productId,
          action: 'APPROVED',
        },
      }),
    ])

    return { message: 'Product approved' }
  }

  async rejectProduct(productId: string, adminId: string, reason: string) {
    if (!reason?.trim()) {
      throw new BadRequestException('Rejection reason is required')
    }

    const product = await this.prisma.product.findUnique({ where: { id: productId } })
    if (!product) throw new NotFoundException('Product not found')

    await this.prisma.$transaction([
      this.prisma.product.update({
        where: { id: productId },
        data: {
          status: 'REJECTED',
          rejectionReason: reason.trim(),
        },
      }),
      this.prisma.moderationLog.create({
        data: {
          adminId,
          productId,
          action: 'REJECTED',
          reason: reason.trim(),
        },
      }),
    ])

    return { message: 'Product rejected' }
  }
}
