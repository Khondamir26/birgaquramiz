import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './create-review.dto';
import { AuthUser } from '../auth/auth.types';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: CreateReviewDto) {
    const { productId, rating, pros, cons, comment, images } = data;

    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    // Verify the user has purchased and received this product
    const purchased = await this.prisma.orderItem.findFirst({
      where: {
        productId,
        order: { userId, status: 'DELIVERED' },
      },
    });
    if (!purchased) throw new ForbiddenException('You can only review products you have purchased');

    // Prevent duplicate reviews (DB unique constraint is the final guard)
    const existing = await this.prisma.review.findUnique({
      where: { productId_userId: { productId, userId } },
    });
    if (existing) throw new ConflictException('You have already reviewed this product');

    return this.prisma.$transaction(async (tx) => {
      const review = await tx.review.create({
        data: { productId, userId, rating, pros, cons, comment, images: images || [] },
      });

      // Use DB aggregate instead of fetching all reviews
      const agg = await tx.review.aggregate({
        where: { productId },
        _avg: { rating: true },
        _count: { id: true },
      });

      await tx.product.update({
        where: { id: productId },
        data: {
          rating: agg._avg.rating ?? rating,
          reviewsCount: agg._count.id,
        },
      });

      return review;
    });
  }

  async getByProductId(productId: string) {
    return this.prisma.review.findMany({
      where: { productId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
