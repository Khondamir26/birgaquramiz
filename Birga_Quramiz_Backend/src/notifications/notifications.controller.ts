import { Controller, Get, Patch, Param, Query, Req, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { NotificationsService } from './notifications.service'
import type { AuthedRequest } from '../auth/auth.types'

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  findAll(
    @Req() req: AuthedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAll(req.user.id, Number(page ?? 1), Number(limit ?? 20))
  }

  @Get('unread-count')
  unreadCount(@Req() req: AuthedRequest) {
    return this.service.getUnreadCount(req.user.id)
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.service.markRead(id, req.user.id)
  }

  @Patch('read-all')
  markAllRead(@Req() req: AuthedRequest) {
    return this.service.markAllRead(req.user.id)
  }
}
