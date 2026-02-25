import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import type { UpdateProductDto } from './dto/update-product.dto'

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(data: any, user: any) {
    const seller = await this.prisma.seller.findUnique({
      where: { userId: user.id },
    })

    if (!seller) {
      throw new BadRequestException('You are not a seller')
    }

    return this.prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        imageUrl: data.imageUrl,
        price: data.price,
        stock: data.stock,
        sellerId: seller.id,
      },
    })
  }

  async getApproved(page = 1, limit = 10, q?: string) {
    const safePage = page < 1 ? 1 : page
    const safeLimit = limit > 100 ? 100 : limit
    const skip = (safePage - 1) * safeLimit

    const whereCondition: any = {
      status: 'APPROVED',
    }

    if (q?.trim()) {
      whereCondition.OR = [
        { name: { contains: q.trim(), mode: 'insensitive' } },
        { description: { contains: q.trim(), mode: 'insensitive' } },
      ]
    }

    const [products, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where: whereCondition,
        include: {
          seller: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: safeLimit,
      }),
      this.prisma.product.count({ where: whereCondition }),
    ])

    return {
      data: products,
      meta: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    }
  }

  async getMyProducts(user: any) {
    const seller = await this.prisma.seller.findUnique({ where: { userId: user.id } })
    if (!seller) throw new BadRequestException('Seller not found')

    return this.prisma.product.findMany({
      where: { sellerId: seller.id },
      orderBy: { createdAt: 'desc' },
    })
  }

  async updateMyProduct(id: string, data: UpdateProductDto, user: any) {
    const seller = await this.prisma.seller.findUnique({ where: { userId: user.id } })
    if (!seller) throw new BadRequestException('Seller not found')

    const product = await this.prisma.product.findFirst({
      where: {
        id,
        sellerId: seller.id,
      },
    })

    if (!product) throw new NotFoundException('Product not found')

    const hasAnyField = ['name', 'description', 'imageUrl', 'price', 'stock'].some(
      (key) => (data as any)[key] !== undefined,
    )

    if (!hasAnyField) {
      throw new BadRequestException('No fields to update')
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        ...data,
        status: 'PENDING',
      },
    })
  }

  async setMyProductVisibility(id: string, active: boolean, user: any) {
    const seller = await this.prisma.seller.findUnique({ where: { userId: user.id } })
    if (!seller) throw new BadRequestException('Seller not found')

    const product = await this.prisma.product.findFirst({
      where: {
        id,
        sellerId: seller.id,
      },
    })

    if (!product) throw new NotFoundException('Product not found')

    if (active) {
      if (product.status === 'APPROVED') return product
      return this.prisma.product.update({
        where: { id },
        data: { status: 'PENDING' },
      })
    }

    if (product.status === 'REJECTED') return product

    return this.prisma.product.update({
      where: { id },
      data: { status: 'REJECTED' },
    })
  }

  async deleteMyProduct(id: string, user: any) {
    const seller = await this.prisma.seller.findUnique({ where: { userId: user.id } })
    if (!seller) throw new BadRequestException('Seller not found')

    const product = await this.prisma.product.findFirst({
      where: {
        id,
        sellerId: seller.id,
      },
    })

    if (!product) throw new NotFoundException('Product not found')

    const linkedItems = await this.prisma.orderItem.count({ where: { productId: id } })
    if (linkedItems > 0) {
      throw new BadRequestException('Cannot delete product with existing order history')
    }

    await this.prisma.product.delete({ where: { id } })
    return { message: 'Product deleted' }
  }

  async getById(id: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        status: 'APPROVED',
      },
      include: {
        seller: true,
      },
    })

    if (!product) throw new NotFoundException('Product not found')

    return product
  }

  async getPending() {
    return this.prisma.product.findMany({
      where: { status: 'PENDING' },
      include: { seller: true },
    })
  }

  async approve(productId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } })
    if (!product) throw new NotFoundException('Product not found')

    return this.prisma.product.update({
      where: { id: productId },
      data: { status: 'APPROVED' },
    })
  }
  async reject(productId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } })
    if (!product) throw new NotFoundException('Product not found')

    return this.prisma.product.update({
      where: { id: productId },
      data: { status: 'REJECTED' },
    })
  }
}

