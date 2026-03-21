import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Param,
  BadRequestException,
} from '@nestjs/common'
import type { Request } from 'express'
import { SellerService } from './seller.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import type { AuthUser } from '../auth/auth.types'

type AuthedRequest = Request & { user: AuthUser }

@Controller('seller')
export class SellerController {
  constructor(private sellerService: SellerService) {}

  @Post('register')
  @UseGuards(JwtAuthGuard)
  becomeSeller(
    @Body('company') company: string,
    @Req() req: AuthedRequest,
  ) {
    return this.sellerService.becomeSeller(company, req.user)
  }

  @UseGuards(JwtAuthGuard)
  @Get('analytics')
  analytics(@Req() req: AuthedRequest) {
    return this.sellerService.getAnalytics(req.user)
  }

  @Get('public/:id')
  getPublicProfile(@Param('id') id: string) {
    const articleNumber = parseInt(id, 10)
    if (isNaN(articleNumber)) throw new BadRequestException('Invalid seller ID')
    return this.sellerService.getPublicProfile(articleNumber)
  }
}
