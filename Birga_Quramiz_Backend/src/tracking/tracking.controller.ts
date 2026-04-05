import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import type { Request } from 'express'
import { TrackingService } from './tracking.service'
import { TrackingGateway } from './tracking.gateway'
import { CreateAssignmentDto } from './dto/create-assignment.dto'
import { UpdateAssignmentStatusDto } from './dto/update-assignment-status.dto'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import type { AuthUser } from '../auth/auth.types'

type AuthedRequest = Request & { user: AuthUser }

@Controller('tracking')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class TrackingController {
  constructor(
    private readonly trackingService: TrackingService,
    private readonly trackingGateway: TrackingGateway,
  ) {}

  // ─── Dispatcher endpoints ───────────────────────────────────────────────────

  /** GET /tracking/drivers — list all drivers with live status */
  @Get('drivers')
  @Roles('DISPATCHER', 'ADMIN')
  getDrivers() {
    return this.trackingService.getDrivers()
  }

  /** GET /tracking/orders/assignable — orders ready to be assigned */
  @Get('orders/assignable')
  @Roles('DISPATCHER', 'ADMIN')
  getAssignableOrders() {
    return this.trackingService.getAssignableOrders()
  }

  /** POST /tracking/assignments — create new delivery assignment */
  @Post('assignments')
  @Roles('DISPATCHER', 'ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async createAssignment(
    @Body() dto: CreateAssignmentDto,
    @Req() req: AuthedRequest,
  ) {
    const assignment = await this.trackingService.createAssignment(dto, req.user)

    // Push real-time notification to driver via WebSocket
    const payload = {
      assignmentId: assignment.id,
      note: assignment.note,
      ...assignment.order,
      itemCount: assignment.order._count.items,
    }
    this.trackingGateway.pushNewAssignment(dto.driverId, payload)

    return assignment
  }

  // ─── Driver endpoints ───────────────────────────────────────────────────────

  /** GET /tracking/my-assignments — active assignments for logged-in driver */
  @Get('my-assignments')
  @Roles('DRIVER')
  getMyAssignments(@Req() req: AuthedRequest) {
    return this.trackingService.getMyAssignments(req.user.id)
  }

  /** PATCH /tracking/assignments/status — driver/dispatcher updates assignment */
  @Patch('assignments/status')
  @Roles('DRIVER', 'DISPATCHER', 'ADMIN')
  updateAssignmentStatus(
    @Body() dto: UpdateAssignmentStatusDto,
    @Req() req: AuthedRequest,
  ) {
    return this.trackingService.updateAssignmentStatus(
      dto.assignmentId,
      dto.status,
      req.user,
    )
  }

  // ─── Customer endpoint ──────────────────────────────────────────────────────

  /** GET /tracking/orders/:orderId — get driver info + last known location */
  @Get('orders/:orderId')
  @Roles('USER', 'DISPATCHER', 'ADMIN', 'DRIVER')
  async getOrderTracking(
    @Param('orderId') orderId: string,
    @Req() req: AuthedRequest,
  ) {
    const assignment = await this.trackingService.getAssignmentByOrder(orderId)
    if (!assignment) return null

    const location = await this.trackingService.getDriverLocation(assignment.driverId)

    return {
      assignment: {
        id: assignment.id,
        status: assignment.status,
        driver: assignment.driver,
      },
      location,
    }
  }
}
