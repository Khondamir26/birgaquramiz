import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RolesGuard } from '../auth/roles.guard'
import { Roles } from '../auth/roles.decorator'
import { AdminService } from './admin.service'

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
}
