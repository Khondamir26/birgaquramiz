import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req, UseGuards, BadRequestException } from '@nestjs/common'
import type { OrderStatus } from '@prisma/client'
import type { Request } from 'express'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RolesGuard } from '../auth/roles.guard'
import { Roles } from '../auth/roles.decorator'
import { AdminService } from './admin.service'
import type { AuthUser } from '../auth/auth.types'
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto'
import { UpdateUserRoleDto } from './dto/update-user-role.dto'

type AuthedRequest = Request & { user: AuthUser }

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  getAdminDashboard() {
    return { message: 'Welcome Admin' }
  }

  @Get('stats')
  getDashboardStats() {
    return this.adminService.getDashboardStats()
  }

  @Post('users')
  createUser(
    @Body('name') name: string,
    @Body('phone') phone: string,
    @Body('role') role?: string,
  ) {
    const allowed = ['USER', 'SELLER', 'ADMIN', 'DRIVER', 'DISPATCHER']
    if (role && !allowed.includes(role)) throw new BadRequestException('Invalid role')
    return this.adminService.createUser({ name, phone, role: role as any })
  }

  @Get('users')
  getUsers(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('role') role?: 'USER' | 'SELLER' | 'ADMIN' | 'DRIVER' | 'DISPATCHER',
    @Query('q') q?: string,
  ) {
    return this.adminService.getUsers(Number(page), Number(limit), role, q)
  }

  @Get('orders')
  getOrders(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: 'NEW' | 'PAID' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED',
    @Query('q') q?: string,
  ) {
    return this.adminService.getOrders(Number(page), Number(limit), status, q)
  }

  @Get('orders/:id')
  getOrderDetail(@Param('id') id: string) {
    return this.adminService.getOrderDetail(id)
  }

  @Delete('orders/:id')
  deleteOrder(@Param('id') id: string) {
    return this.adminService.deleteOrder(id)
  }

  @Patch('orders/:id/status')
  updateOrderStatus(
    @Param('id') id: string,
    @Body('status') status: OrderStatus,
  ) {
    const allowed: OrderStatus[] = ['NEW', 'PAID', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']
    if (!status || !allowed.includes(status)) {
      throw new BadRequestException('Invalid status')
    }
    return this.adminService.updateOrderStatus(id, status)
  }

  @Get('users/:id')
  getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id)
  }

  @Patch('users/:id/role')
  updateUserRole(
    @Param('id') id: string,
    @Body() body: UpdateUserRoleDto,
    @Req() req: AuthedRequest,
  ) {
    return this.adminService.updateUserRole(id, body.role, req.user.id, body.company)
  }

  @Get('dispatchers')
  getDispatchers(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('q') q?: string,
  ) {
    return this.adminService.getDispatchers(Number(page), Number(limit), q)
  }

  @Get('dispatchers/:id')
  getDispatcherDetail(@Param('id') id: string) {
    return this.adminService.getDispatcherDetail(id)
  }

  @Get('sellers/pending')
  getPendingSellers(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('q') q?: string,
  ) {
    return this.adminService.getPendingSellers(Number(page), Number(limit), q)
  }

  @Patch('sellers/:id/verify')
  verifySeller(@Param('id') id: string) {
    return this.adminService.verifySeller(id)
  }

  @Patch('sellers/:id/reject')
  rejectSeller(@Param('id') id: string) {
    return this.adminService.rejectSeller(id)
  }

  @Get('sellers/:id')
  getSellerDetail(@Param('id') id: string) {
    return this.adminService.getSellerDetail(id)
  }

  @Post('categories')
  createCategory(@Body() body: CreateCategoryDto) {
    return this.adminService.createCategory(body)
  }

  @Patch('categories/:id')
  updateCategory(@Param('id') id: string, @Body() body: UpdateCategoryDto) {
    return this.adminService.updateCategory(id, body)
  }

  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string) {
    return this.adminService.deleteCategory(id)
  }

  @Get('products/:id')
  getProductById(@Param('id') id: string) {
    return this.adminService.getProductById(id)
  }

  @Patch('products/:id/approve')
  approveProduct(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.adminService.approveProduct(id, req.user.id)
  }

  @Patch('products/:id/reject')
  rejectProduct(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Req() req: AuthedRequest,
  ) {
    return this.adminService.rejectProduct(id, req.user.id, reason)
  }
}
