import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common'
import type { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import type { UpdateProductDto } from './dto/update-product.dto'
import type { CreateProductDto } from './dto/create-product.dto'
import type { AuthUser } from '../auth/auth.types'

type CreateProductInput = CreateProductDto & { imageUrl: string }

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) { }

  private ensureSellerProfile(user: AuthUser) {
    if (user.role !== 'SELLER') {
      throw new BadRequestException('You are not a seller')
    }

    return this.prisma.seller.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        company: `${user.name} Store`,
      },
    })
  }

  async create(data: CreateProductInput, user: AuthUser) {
    const seller = await this.ensureSellerProfile(user)

    return this.prisma.$transaction(async (tx) => {
      const category = await tx.category.findUnique({
        where: { id: data.categoryId },
        select: { id: true, code: true, lastSkuNumber: true },
      })

      if (!category) {
        throw new BadRequestException('Invalid category')
      }

      const updatedCategory = await tx.category.update({
        where: { id: category.id },
        data: { lastSkuNumber: { increment: 1 } },
        select: { id: true, code: true, lastSkuNumber: true },
      })

      const padded = String(updatedCategory.lastSkuNumber).padStart(6, '0')
      const sku = `${updatedCategory.code}-${padded}`

      return tx.product.create({
        data: {
          name: data.name,
          description: data.description,
          imageUrl: data.imageUrl,
          price: data.price,
          stock: data.stock,
          sellerId: seller.id,
          categoryId: category.id,
          sku,
        },
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
        },
      })
    })
  }

  async getApproved(page = 1, limit = 10, q?: string, categoryId?: string, minPrice?: number, maxPrice?: number, sortBy?: string) {
    const safePage = page < 1 ? 1 : page
    const safeLimit = limit > 100 ? 100 : limit
    const skip = (safePage - 1) * safeLimit

    const whereCondition: Prisma.ProductWhereInput = {
      status: 'APPROVED',
    }

    if (categoryId?.trim()) {
      whereCondition.categoryId = categoryId.trim()
    }

    if (q?.trim()) {
      const terms = q.trim().split(/\s+/).filter(Boolean);
      const orConditions: Prisma.ProductWhereInput[] = [];

      terms.forEach(term => {
        orConditions.push(
          { name: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
          { sku: { contains: term, mode: 'insensitive' } }
        );

        const numeric = Number(term);
        if (Number.isInteger(numeric) && numeric > 0) {
          orConditions.push({ articleNumber: numeric });
        }
      });

      whereCondition.OR = orConditions;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      whereCondition.price = {}
      if (minPrice !== undefined) whereCondition.price.gte = minPrice
      if (maxPrice !== undefined) whereCondition.price.lte = maxPrice
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };

    if (sortBy === 'price_asc') {
      orderBy = { price: 'asc' };
    } else if (sortBy === 'price_desc') {
      orderBy = { price: 'desc' };
    } else if (sortBy === 'newest') {
      orderBy = { createdAt: 'desc' };
    }

    const [products, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where: whereCondition,
        include: {
          seller: true,
          category: {
            select: {
              id: true,
              name: true,
              code: true,
              parentId: true,
              parent: { select: { id: true, name: true } },
            },
          },
        },
        orderBy,
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

  async getMyProducts(user: AuthUser) {
    const seller = await this.ensureSellerProfile(user)

    return this.prisma.product.findMany({
      where: { sellerId: seller.id },
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
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async getMyProductById(id: string, user: AuthUser) {
    const seller = await this.ensureSellerProfile(user)

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
      },
    })
    if (!product) throw new NotFoundException('Product not found')
    if (product.sellerId !== seller.id) throw new ForbiddenException('Access denied')

    return {
      id: product.id,
      sku: product.sku,
      title: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      images: product.imageUrl ? [product.imageUrl] : [],
      status: product.status,
      rejectionReason: product.rejectionReason,
      createdAt: product.createdAt.toISOString(),
      category: product.category,
    }
  }

  async updateMyProduct(id: string, data: UpdateProductDto, user: AuthUser) {
    const seller = await this.ensureSellerProfile(user)

    const product = await this.prisma.product.findFirst({
      where: {
        id,
        sellerId: seller.id,
      },
    })

    if (!product) throw new NotFoundException('Product not found')

    const updateData = { ...data }

    const hasAnyField = ['name', 'description', 'imageUrl', 'price', 'stock'].some(
      (key) => updateData[key as keyof typeof updateData] !== undefined,
    )

    if (!hasAnyField) {
      throw new BadRequestException('No fields to update')
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        ...updateData,
        status: 'PENDING',
      },
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
      },
    })
  }

  async setMyProductVisibility(id: string, active: boolean, user: AuthUser) {
    const seller = await this.ensureSellerProfile(user)

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

  async deleteMyProduct(id: string, user: AuthUser) {
    const seller = await this.ensureSellerProfile(user)

    const product = await this.prisma.product.findFirst({
      where: {
        id,
        sellerId: seller.id,
      },
    })

    if (!product) throw new NotFoundException('Product not found')

    if (product.status === 'APPROVED') {
      throw new BadRequestException('Approved products cannot be deleted directly. Please request deletion from admin.')
    }

    await this.prisma.product.delete({ where: { id } })
    return { message: 'Product deleted' }
  }

  async requestProductDeletion(id: string, user: AuthUser, reason: string) {
    const seller = await this.ensureSellerProfile(user)

    const product = await this.prisma.product.findFirst({
      where: { id, sellerId: seller.id },
    })
    if (!product) throw new NotFoundException('Product not found')

    if (product.status !== 'APPROVED') {
      throw new BadRequestException('Only approved products require deletion requests. You can delete pending/rejected products directly.')
    }

    const existing = await this.prisma.deletionRequest.findFirst({
      where: { productId: id, status: 'PENDING' },
    })
    if (existing) {
      throw new BadRequestException('A deletion request is already pending for this product.')
    }

    const request = await this.prisma.deletionRequest.create({
      data: {
        productId: id,
        sellerId: seller.id,
        reason,
      },
    })

    return { message: 'Deletion request submitted. Admin will review it.', requestId: request.id }
  }

  async getById(id: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        status: 'APPROVED',
      },
      include: {
        seller: true,
        category: {
          select: {
            id: true,
            name: true,
            code: true,
            parentId: true,
            parent: { select: { id: true, name: true } },
          },
        },
      },
    })

    if (!product) throw new NotFoundException('Product not found')

    return product
  }

  async getPending() {
    return this.prisma.product.findMany({
      where: { status: 'PENDING' },
      include: {
        seller: true,
        category: {
          select: {
            id: true,
            name: true,
            code: true,
            parentId: true,
            parent: { select: { id: true, name: true } },
          },
        },
      },
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

  async getDeletionRequests() {
    return this.prisma.deletionRequest.findMany({
      where: { status: 'PENDING' },
      include: {
        product: true,
        seller: { include: { user: { select: { name: true, phone: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async approveDeletionRequest(requestId: string) {
    const request = await this.prisma.deletionRequest.findUnique({
      where: { id: requestId },
      include: { product: true },
    })
    if (!request) throw new NotFoundException('Deletion request not found')
    if (request.status !== 'PENDING') throw new BadRequestException('Request already processed')

    await this.prisma.product.delete({ where: { id: request.productId } })

    return { message: 'Product deleted and request approved' }
  }

  async rejectDeletionRequest(requestId: string) {
    const request = await this.prisma.deletionRequest.findUnique({ where: { id: requestId } })
    if (!request) throw new NotFoundException('Deletion request not found')
    if (request.status !== 'PENDING') throw new BadRequestException('Request already processed')

    await this.prisma.deletionRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED' },
    })

    return { message: 'Deletion request rejected' }
  }
}
