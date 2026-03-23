import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common'
import type { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import type { UpdateProductDto } from './dto/update-product.dto'
import type { CreateProductDto } from './dto/create-product.dto'
import type { AuthUser } from '../auth/auth.types'
import { generateProductSlug } from './slug.util'

type CreateProductInput = CreateProductDto & { imageUrls: string[] }

function parseSpecifications(value: unknown): object | undefined {
  if (!value) return undefined
  if (typeof value === 'object') return value as object
  try {
    return JSON.parse(value as string)
  } catch {
    throw new BadRequestException('Invalid specifications: must be valid JSON')
  }
}

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
      const slug = generateProductSlug(data.name, sku)

      return tx.product.create({
        data: {
          name: data.name,
          description: data.description,
          imageUrl: data.imageUrls[0] ?? '',
          images: data.imageUrls,
          price: data.price,
          stock: data.stock,
          sellerId: seller.id,
          categoryId: category.id,
          brandId: data.brandId,
          sku,
          slug,
          specifications: parseSpecifications(data.specifications),
        },
        include: {
          brand: true,
          category: {
            select: {
              id: true,
              name: true,
              nameEn: true,
              nameUz: true,
              code: true,
              slug: true,
              parentId: true,
              parent: { select: { id: true, name: true, nameEn: true, nameUz: true, slug: true } },
            },
          },
        },
      })
    })
  }

  async getApproved(page = 1, limit = 10, q?: string, categoryId?: string, minPrice?: number, maxPrice?: number, sortBy?: string, brand?: string, parentCategoryId?: string) {
    const safePage = page < 1 ? 1 : page
    const safeLimit = limit > 100 ? 100 : limit
    const skip = (safePage - 1) * safeLimit

    const whereCondition: Prisma.ProductWhereInput = {
      status: 'APPROVED',
    }

    if (parentCategoryId?.trim()) {
      whereCondition.category = { parentId: parentCategoryId.trim() }
    } else if (categoryId?.trim()) {
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

    if (brand?.trim()) {
      whereCondition.brand = { slug: brand.trim() }
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
          brand: true,
          category: {
            select: {
              id: true,
              name: true,
              nameEn: true,
              nameUz: true,
              code: true,
              slug: true,
              parentId: true,
              parent: { select: { id: true, name: true, nameEn: true, nameUz: true, slug: true } },
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
        brand: true,
        category: {
          select: {
            id: true,
            name: true,
            nameEn: true,
            nameUz: true,
            code: true,
            slug: true,
            parentId: true,
            parent: { select: { id: true, name: true, nameEn: true, nameUz: true, slug: true } },
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
        brand: true,
        category: {
          select: {
            id: true,
            name: true,
            nameEn: true,
            nameUz: true,
            code: true,
            slug: true,
            parentId: true,
            parent: { select: { id: true, name: true, nameEn: true, nameUz: true, slug: true } },
          },
        },
      },
    })
    if (!product) throw new NotFoundException('Product not found')
    if (product.sellerId !== seller.id) throw new ForbiddenException('Access denied')

    const images = product.images && product.images.length > 0
      ? product.images
      : product.imageUrl ? [product.imageUrl] : []

    return {
      id: product.id,
      sku: product.sku,
      title: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      images,
      status: product.status,
      rejectionReason: product.rejectionReason,
      createdAt: product.createdAt.toISOString(),
      category: product.category,
      brand: product.brand,
    }
  }

  async updateMyProduct(id: string, data: UpdateProductDto, user: AuthUser, newImageUrls?: string[]) {
    const seller = await this.ensureSellerProfile(user)

    const product = await this.prisma.product.findFirst({
      where: {
        id,
        sellerId: seller.id,
      },
    })

    if (!product) throw new NotFoundException('Product not found')

    const { keepImages: keepImagesRaw, ...updateData } = data

    // Resolve final image list
    const keepImages: string[] = keepImagesRaw ? JSON.parse(keepImagesRaw) : (product.images.length > 0 ? product.images : (product.imageUrl ? [product.imageUrl] : []))
    const finalImages = [...keepImages, ...(newImageUrls ?? [])].slice(0, 5)
    if (finalImages.length === 0) throw new BadRequestException('At least one product image is required')

    const imageFields = {
      imageUrl: finalImages[0],
      images: finalImages,
    }

    const hasAnyField = ['name', 'description', 'price', 'stock', 'specifications', 'brandId', 'categoryId'].some(
      (key) => updateData[key as keyof typeof updateData] !== undefined,
    ) || newImageUrls !== undefined || keepImagesRaw !== undefined

    if (!hasAnyField) {
      throw new BadRequestException('No fields to update')
    }

    const categoryChanging = updateData.categoryId !== undefined && updateData.categoryId !== product.categoryId

    if (categoryChanging) {
      return this.prisma.$transaction(async (tx) => {
        const newCategory = await tx.category.findUnique({
          where: { id: updateData.categoryId },
          select: { id: true, code: true, lastSkuNumber: true },
        })

        if (!newCategory) throw new BadRequestException('Invalid category')

        const updatedCategory = await tx.category.update({
          where: { id: newCategory.id },
          data: { lastSkuNumber: { increment: 1 } },
          select: { id: true, code: true, lastSkuNumber: true },
        })

        const padded = String(updatedCategory.lastSkuNumber).padStart(6, '0')
        const newSku = `${updatedCategory.code}-${padded}`
        const newName = updateData.name ?? product.name
        const newSlug = generateProductSlug(newName, newSku)

        const { categoryId, ...rest } = updateData

        return tx.product.update({
          where: { id },
          data: {
            ...rest,
            ...imageFields,
            categoryId,
            sku: newSku,
            slug: newSlug,
            specifications: parseSpecifications(rest.specifications),
            status: 'PENDING',
          },
          include: {
            brand: true,
            category: {
              select: {
                id: true,
                name: true,
                nameEn: true,
                nameUz: true,
                code: true,
                slug: true,
                parentId: true,
                parent: { select: { id: true, name: true, nameEn: true, nameUz: true, slug: true } },
              },
            },
          },
        })
      })
    }

    const nameForSlug = updateData.name ?? product.name
    const skuForSlug = product.sku ?? ''
    const updatedSlug = skuForSlug ? generateProductSlug(nameForSlug, skuForSlug) : undefined

    return this.prisma.product.update({
      where: { id },
      data: {
        ...updateData,
        ...imageFields,
        ...(updatedSlug ? { slug: updatedSlug } : {}),
        specifications: parseSpecifications(updateData.specifications),
        status: 'PENDING',
      },
      include: {
        brand: true,
        category: {
          select: {
            id: true,
            name: true,
            nameEn: true,
            nameUz: true,
            code: true,
            slug: true,
            parentId: true,
            parent: { select: { id: true, name: true, nameEn: true, nameUz: true, slug: true } },
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

  async getBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, status: 'APPROVED' },
      include: {
        seller: true,
        brand: true,
        category: {
          select: {
            id: true,
            name: true,
            nameEn: true,
            nameUz: true,
            code: true,
            slug: true,
            parentId: true,
            parent: { select: { id: true, name: true, nameEn: true, nameUz: true, slug: true } },
          },
        },
        reviews: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    })
    if (!product) throw new NotFoundException('Product not found')
    return product
  }

  async getById(id: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        status: 'APPROVED',
      },
      include: {
        seller: true,
        brand: true,
        category: {
          select: {
            id: true,
            name: true,
            nameEn: true,
            nameUz: true,
            code: true,
            slug: true,
            parentId: true,
            parent: { select: { id: true, name: true, nameEn: true, nameUz: true, slug: true } },
          },
        },
        reviews: {
          include: {
            user: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    })

    if (!product) throw new NotFoundException('Product not found')

    return product
  }

  async getPending(page = 1, limit = 50) {
    const safePage = page < 1 ? 1 : page
    const safeLimit = limit > 100 ? 100 : limit
    const skip = (safePage - 1) * safeLimit

    const [products, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where: { status: 'PENDING' },
        include: {
          seller: true,
          brand: true,
          category: {
            select: {
              id: true,
              name: true,
              nameEn: true,
              nameUz: true,
              code: true,
              slug: true,
              parentId: true,
              parent: { select: { id: true, name: true, nameEn: true, nameUz: true, slug: true } },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: safeLimit,
      }),
      this.prisma.product.count({ where: { status: 'PENDING' } }),
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
