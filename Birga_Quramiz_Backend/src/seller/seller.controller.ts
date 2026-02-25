import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
} from '@nestjs/common'
import { SellerService } from './seller.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import type { Request } from 'express'

@Controller('seller')
export class SellerController {
  constructor(private sellerService: SellerService) {}

  // 🟢 USER → становится SELLER
  @Post('register')
  @UseGuards(JwtAuthGuard)
  becomeSeller(
    @Body('company') company: string,
    @Req() req: Request,
  ) {
    return this.sellerService.becomeSeller(company, req['user'])
  }

  // 🔵 SELLER — Analytics
  @UseGuards(JwtAuthGuard)
  @Get('analytics')
  analytics(@Req() req: any) {
    return this.sellerService.getAnalytics(req.user)
  }
}