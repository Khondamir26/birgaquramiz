import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './create-review.dto';
import { AuthUser } from '../auth/auth.types';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: CreateReviewDto) {
    const { productId, rating, pros, cons, comment, images } = data;

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.$transaction(async (tx) => {
      // Create the review
      const review = await tx.review.create({
        data: {
          productId,
          userId,
          rating,
          pros,
          cons,
          comment,
          images: images || [],
        },
      });

      // Fetch all reviews for this product to recalculate rating
      const allReviews = await tx.review.findMany({
        where: { productId },
        select: { rating: true },
      });

      const reviewsCount = allReviews.length;
      const averageRating = allReviews.reduce((acc, curr) => acc + curr.rating, 0) / reviewsCount;

      // Update product with new aggregates
      await tx.product.update({
        where: { id: productId },
        data: {
          rating: averageRating,
          reviewsCount,
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
