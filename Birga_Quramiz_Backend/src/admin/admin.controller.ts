import { Controller, Get, Patch, Param, Body, Query, Req, UseGuards } from '@nestjs/common'
import type { Request } from 'express'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RolesGuard } from '../auth/roles.guard'
import { Roles } from '../auth/roles.decorator'
import { AdminService } from './admin.service'
import type { AuthUser } from '../auth/auth.types'
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

  @Get('users')
  getUsers(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('role') role?: 'USER' | 'SELLER' | 'ADMIN',
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

  @Patch('users/:id/role')
  updateUserRole(
    @Param('id') id: string,
    @Body() body: UpdateUserRoleDto,
    @Req() req: AuthedRequest,
  ) {
    return this.adminService.updateUserRole(id, body.role, req.user.id, body.company)
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
