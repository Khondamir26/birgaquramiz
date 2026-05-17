import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import type { Request } from 'express'
import type { Multer } from 'multer'
import { TrackingService } from './tracking.service'
import { TrackingGateway } from './tracking.gateway'
import { CreateAssignmentDto } from './dto/create-assignment.dto'
import { UpdateAssignmentStatusDto } from './dto/update-assignment-status.dto'
import { DriverRecommendationService } from './services/driver-recommendation.service'
import { OtpService } from './services/otp.service'
import { LocationHistoryService } from './services/location-history.service'
import { PodPhotoService } from './services/pod-photo.service'
import { PushNotificationService } from './services/push-notification.service'
import { EtaService } from '../maps/eta.service'
import { GeocodingService } from '../maps/geocoding.service'
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
    private readonly recommendationService: DriverRecommendationService,
    private readonly otpService: OtpService,
    private readonly podPhotoService: PodPhotoService,
    private readonly pushNotificationService: PushNotificationService,
    private readonly etaService: EtaService,
    private readonly geocodingService: GeocodingService,
    private readonly locationHistoryService: LocationHistoryService,
  ) {}

  // ─── Dispatcher endpoints ───────────────────────────────────────────────────

  /** GET /tracking/drivers */
  @Get('drivers')
  @Roles('DISPATCHER', 'ADMIN')
  getDrivers() {
    return this.trackingService.getDrivers()
  }

  /** GET /tracking/drivers/:driverId/detail */
  @Get('drivers/:driverId/detail')
  @Roles('DISPATCHER', 'ADMIN')
  getDriverDetail(@Param('driverId') driverId: string) {
    return this.trackingService.getDriverDetail(driverId)
  }

  /** GET /tracking/drivers/:driverId/stats — 30-day performance analytics */
  @Get('drivers/:driverId/stats')
  @Roles('DISPATCHER', 'ADMIN')
  getDriverStats(@Param('driverId') driverId: string) {
    return this.trackingService.getDriverStats(driverId)
  }

  /** GET /tracking/drivers/:driverId/rating-summary — customer rating aggregate */
  @Get('drivers/:driverId/rating-summary')
  @Roles('DISPATCHER', 'ADMIN')
  getDriverRatingSummary(@Param('driverId') driverId: string) {
    return this.trackingService.getDriverRatingSummary(driverId)
  }

  /** GET /tracking/fraud-events */
  @Get('fraud-events')
  @Roles('DISPATCHER', 'ADMIN')
  getFraudEvents() {
    return this.trackingService.getRecentFraudEvents()
  }

  /** DELETE /tracking/fraud-events — clear all events from the last 24h */
  @Delete('fraud-events')
  @Roles('DISPATCHER', 'ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  clearFraudEvents() {
    return this.trackingService.clearFraudEvents()
  }

  /** DELETE /tracking/fraud-events/:id — dismiss one event */
  @Delete('fraud-events/:id')
  @Roles('DISPATCHER', 'ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteFraudEvent(@Param('id') id: string) {
    return this.trackingService.deleteFraudEvent(id)
  }

  /** GET /tracking/orders/assignable */
  @Get('orders/assignable')
  @Roles('DISPATCHER', 'ADMIN')
  getAssignableOrders() {
    return this.trackingService.getAssignableOrders()
  }

  /** GET /tracking/orders/:orderId/detail — full order detail for dispatcher */
  @Get('orders/:orderId/detail')
  @Roles('DISPATCHER', 'ADMIN')
  getOrderDetail(@Param('orderId') orderId: string) {
    return this.trackingService.getOrderDetailForDispatcher(orderId)
  }

  /** GET /tracking/orders/:orderId/recommend-drivers — ranked driver list */
  @Get('orders/:orderId/recommend-drivers')
  @Roles('DISPATCHER', 'ADMIN')
  recommendDrivers(@Param('orderId') orderId: string) {
    return this.recommendationService.recommend(orderId)
  }

  /** POST /tracking/assignments */
  @Post('assignments')
  @Roles('DISPATCHER', 'ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async createAssignment(
    @Body() dto: CreateAssignmentDto,
    @Req() req: AuthedRequest,
  ) {
    const assignment = await this.trackingService.createAssignment(dto, req.user)

    const payload = {
      assignmentId: assignment.id,
      note: assignment.note,
      ...assignment.order,
      itemCount: assignment.order._count.items,
    }
    this.trackingGateway.pushNewAssignment(dto.driverId, payload)

    // Fire-and-forget push notification (driver may be offline)
    void this.pushNotificationService.notifyDriver(
      dto.driverId,
      'Yangi buyurtma 📦',
      `Manzil: ${(assignment.order as any).deliveryAddress ?? 'Nomaʼlum'}`,
      { assignmentId: assignment.id },
    )

    return assignment
  }

  /** PATCH /tracking/push-token — driver registers their Expo push token */
  @Patch('push-token')
  @Roles('DRIVER')
  @HttpCode(HttpStatus.NO_CONTENT)
  async savePushToken(
    @Body() body: { token: string | null },
    @Req() req: AuthedRequest,
  ) {
    await this.pushNotificationService.savePushToken(req.user.id, body.token ?? null)
  }

  // ─── Driver endpoints ───────────────────────────────────────────────────────

  /** GET /tracking/my-assignments */
  @Get('my-assignments')
  @Roles('DRIVER')
  getMyAssignments(@Req() req: AuthedRequest) {
    return this.trackingService.getMyAssignments(req.user.id)
  }

  /** PATCH /tracking/assignments/status */
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

  // ─── OTP endpoints ──────────────────────────────────────────────────────────

  /** POST /tracking/orders/:orderId/otp/request — generate + send OTP to customer */
  @Post('orders/:orderId/otp/request')
  @Roles('DRIVER', 'DISPATCHER', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  async requestOTP(@Param('orderId') orderId: string) {
    const code = await this.otpService.generateOTP(orderId)
    // In production: send SMS here via Eskiz/Playmobile
    // For dev: return code in response (remove in production)
    return { message: 'OTP sent to customer', ...(process.env.NODE_ENV !== 'production' && { code }) }
  }

  /** POST /tracking/orders/:orderId/otp/verify — driver submits code customer told them */
  @Post('orders/:orderId/otp/verify')
  @Roles('DRIVER')
  @HttpCode(HttpStatus.OK)
  async verifyOTP(
    @Param('orderId') orderId: string,
    @Body() body: { code: string },
  ) {
    if (!body.code) throw new BadRequestException('OTP code required')
    const valid = await this.otpService.verifyOTP(orderId, body.code)
    if (!valid) throw new BadRequestException('Invalid OTP code')
    const assignment = await this.trackingService.getAssignmentByOrder(orderId)
    if (assignment) this.trackingService.logAssignmentEvent(assignment.id, 'OTP_VERIFIED')
    return { valid: true }
  }

  // ─── ETA endpoint ───────────────────────────────────────────────────────────

  /** GET /tracking/orders/:orderId/eta — get current ETA for active delivery */
  @Get('orders/:orderId/eta')
  @Roles('USER', 'DISPATCHER', 'ADMIN', 'DRIVER')
  async getOrderETA(@Param('orderId') orderId: string) {
    const assignment = await this.trackingService.getAssignmentByOrder(orderId)
    if (!assignment) throw new NotFoundException('No active assignment for this order')

    const driverLoc = await this.trackingService.getDriverLocation(assignment.driverId)
    if (!driverLoc) return { eta: null, reason: 'driver_location_unknown' }

    const order = assignment.order as unknown as { deliveryAddress?: string }
    const destination = order.deliveryAddress
      ? await this.geocodingService.geocode(order.deliveryAddress)
      : null

    if (!destination) return { eta: null, reason: 'destination_unknown' }

    const eta = await this.etaService.getETA(
      { lat: driverLoc.lat, lng: driverLoc.lng },
      destination,
      orderId,
    )

    return { eta }
  }

  // ─── Customer endpoint ──────────────────────────────────────────────────────

  /** GET /tracking/orders/:orderId */
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

  // ─── Proof-of-delivery photo upload ────────────────────────────────────────

  /**
   * POST /tracking/assignments/:id/pod-photo
   * Accepts: multipart/form-data, field name "photo"
   * Allowed types: image/jpeg, image/png, image/webp
   * Max raw size: 10 MB (Sharp compresses output to << 1 MB)
   */
  @Post('assignments/:id/pod-photo')
  @Roles('DRIVER', 'DISPATCHER', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: memoryStorage(), // keep in RAM for Sharp processing — never touch disk raw
      limits: { fileSize: PodPhotoService.maxFileSizeBytes },
      fileFilter: (_req, file, cb) => {
        if (PodPhotoService.validateMime(file.mimetype)) {
          cb(null, true)
        } else {
          cb(
            new BadRequestException(
              `Unsupported file type "${file.mimetype}". Allowed: image/jpeg, image/png, image/webp`,
            ),
            false,
          )
        }
      },
    }),
  )
  async uploadPodPhoto(
    @Param('id') assignmentId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('lat') latStr: string | undefined,
    @Body('lng') lngStr: string | undefined,
    @Req() req: AuthedRequest,
  ) {
    if (!file) throw new BadRequestException('No photo uploaded — send multipart field "photo"')

    // GPS fields are optional — driver app sends them when available
    const lat = latStr !== undefined ? parseFloat(latStr) : undefined
    const lng = lngStr !== undefined ? parseFloat(lngStr) : undefined
    const gps =
      lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)
        ? { lat, lng }
        : undefined

    const url = await this.podPhotoService.savePodPhoto(
      assignmentId,
      file.buffer,
      file.mimetype,
      req.user,
      gps,
    )

    this.trackingService.logAssignmentEvent(assignmentId, 'POD_UPLOADED', url)
    return { podPhotoUrl: url }
  }

  // ─── Assignment timeline + driver history ──────────────────────────────────

  /** GET /tracking/assignments/:id/events */
  @Get('assignments/:id/events')
  @Roles('DISPATCHER', 'ADMIN')
  getAssignmentEvents(@Param('id') assignmentId: string) {
    return this.trackingService.getAssignmentEvents(assignmentId)
  }

  /** GET /tracking/drivers/:driverId/assignments?limit=10&cursor=<id> */
  @Get('drivers/:driverId/assignments')
  @Roles('DISPATCHER', 'ADMIN')
  getDriverAssignmentHistory(
    @Param('driverId') driverId: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.trackingService.getDriverAssignmentHistory(
      driverId,
      limit ? Math.min(parseInt(limit, 10), 50) : 10,
      cursor,
    )
  }

  // ─── Route replay analytics ──────────────────────────────────────────────────

  /** GET /tracking/drivers/:driverId/history?from=ISO&to=ISO — route replay data */
  @Get('drivers/:driverId/history')
  @Roles('DISPATCHER', 'ADMIN')
  getLocationHistory(
    @Param('driverId') driverId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    const fromDate = from ? new Date(from) : new Date(Date.now() - 8 * 60 * 60 * 1_000) // last 8h
    const toDate = to ? new Date(to) : new Date()
    return this.locationHistoryService.getHistory(driverId, fromDate, toDate)
  }

  // ─── Admin: Maps API usage stats ────────────────────────────────────────────

  /** GET /tracking/admin/maps-usage */
  @Get('admin/maps-usage')
  @Roles('ADMIN')
  getMapsUsage() {
    return this.etaService.getUsageStats()
  }
}
