import {
  Controller,
  Post,
  Body,
  Get,
  Req,
  UseGuards,
  Param,
  Query,
} from '@nestjs/common'
import { OrdersService } from './orders.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { CreateOrderDto } from './dto/create-order.dto'

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('USER')
  @Post()
  create(@Req() req: any, @Body() body: CreateOrderDto) {
    return this.ordersService.create(req.user, body)
  }

  @Post('guest')
  createGuest(@Body() body: CreateOrderDto) {
    return this.ordersService.createGuest(body)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('USER')
  @Post(':id/pay')
  pay(@Param('id') id: string, @Req() req: any) {
    return this.ordersService.payOrder(id, req.user)
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  myOrders(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return this.ordersService.myOrders(req.user, status, Number(page), Number(limit))
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('USER')
  @Post(':id/deliver')
  deliver(@Param('id') id: string, @Req() req: any) {
    return this.ordersService.updateStatus(id, 'DELIVERED', req.user)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @Get('seller')
  sellerOrders(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return this.ordersService.sellerOrders(req.user, status, Number(page), Number(limit))
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @Post(':id/confirm')
  confirm(@Param('id') id: string, @Req() req: any) {
    return this.ordersService.updateStatus(id, 'CONFIRMED', req.user)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @Post(':id/ship')
  ship(@Param('id') id: string, @Req() req: any) {
    return this.ordersService.updateStatus(id, 'SHIPPED', req.user)
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/cancel')
  cancel(@Param('id') id: string, @Req() req: any) {
    return this.ordersService.cancelOrder(id, req.user)
  }
}
