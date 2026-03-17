import { Controller, Post, Body, Get, Param, UseGuards, Req } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './create-review.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { Request } from 'express';
import { AuthUser } from '../auth/auth.types';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Req() req: Request, @Body() data: CreateReviewDto) {
    const user = req.user as AuthUser;
    return this.reviewsService.create(user.id, data);
  }

  @Get('product/:productId')
  getByProductId(@Param('productId') productId: string) {
    return this.reviewsService.getByProductId(productId);
  }
}
