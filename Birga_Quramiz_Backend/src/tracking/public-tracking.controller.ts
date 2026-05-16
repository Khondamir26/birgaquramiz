import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common'
import { TrackingService } from './tracking.service'
import { GeocodingService } from '../maps/geocoding.service'
import { EtaService } from '../maps/eta.service'
import { OtpService } from './services/otp.service'
import { AssignmentStatus } from '@prisma/client'
import { SubmitRatingDto } from './dto/submit-rating.dto'

/**
 * Public tracking endpoints — no auth required.
 * Returns minimal safe data for customer-facing order tracking pages.
 */
@Controller('tracking/public')
export class PublicTrackingController {
  constructor(
    private readonly trackingService: TrackingService,
    private readonly geocodingService: GeocodingService,
    private readonly etaService: EtaService,
    private readonly otpService: OtpService,
  ) {}

  /**
   * GET /tracking/public/:orderId
   * Returns driver location, status, ETA, stage milestones, driver first name,
   * and POD photo URL for the customer-facing tracking page.
   */
  @Get(':orderId')
  async getPublicTracking(@Param('orderId') orderId: string) {
    const assignment = await this.trackingService.getAssignmentByOrder(orderId)

    if (!assignment || assignment.status === AssignmentStatus.CANCELLED) {
      throw new NotFoundException('Order tracking not available')
    }

    const deliveryAddress = (assignment.order as { deliveryAddress?: string }).deliveryAddress ?? ''

    // For PENDING assignments return minimal data — driver hasn't accepted yet
    if (assignment.status === AssignmentStatus.PENDING) {
      const nameParts = assignment.driver.name.split(' ')
      return {
        status: assignment.status,
        driverInitials: nameParts.slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? '').join(''),
        driverFirstName: nameParts[0] ?? assignment.driver.name,
        deliveryAddress,
        driverLocation: null,
        destinationCoords: null,
        eta: null,
        stageMilestones: {},
        podPhotoUrl: null,
        hasRating: false,
      }
    }

    const driverId = assignment.driverId

    const [driverLocation, destinationCoords, stageMilestones, podPhotoUrl, hasRating] = await Promise.all([
      this.trackingService.getDriverLocation(driverId),
      deliveryAddress ? this.geocodingService.geocode(deliveryAddress) : Promise.resolve(null),
      this.trackingService.getAssignmentMilestones(assignment.id),
      this.trackingService.getPodPhotoUrl(assignment.id),
      assignment.status === AssignmentStatus.DELIVERED
        ? this.trackingService.hasRating(orderId)
        : Promise.resolve(false),
    ])

    let eta: { etaMinutes: number; fallback: boolean } | null = null
    if (
      driverLocation &&
      destinationCoords &&
      assignment.status !== AssignmentStatus.DELIVERED
    ) {
      const etaResult = await this.etaService.getETA(
        { lat: driverLocation.lat, lng: driverLocation.lng },
        destinationCoords,
        orderId,
      )
      if (etaResult) {
        eta = { etaMinutes: etaResult.etaMinutes, fallback: etaResult.fallback }
      }
    }

    const nameParts      = assignment.driver.name.split(' ')
    const driverFirstName = nameParts[0] ?? assignment.driver.name

    return {
      status: assignment.status,
      driverInitials: nameParts
        .slice(0, 2)
        .map((w: string) => w[0]?.toUpperCase() ?? '')
        .join(''),
      driverFirstName,
      deliveryAddress,
      driverLocation: driverLocation
        ? { lat: driverLocation.lat, lng: driverLocation.lng, timestamp: driverLocation.timestamp }
        : null,
      destinationCoords,
      eta,
      stageMilestones,
      podPhotoUrl,
      hasRating,
    }
  }

  /**
   * GET /tracking/public/:orderId/driver-contact
   * Returns the driver's phone number during active delivery only.
   * The orderId UUID acts as the access token — only the customer who received
   * the order link can call this. Expires automatically when order is delivered.
   */
  @Get(':orderId/driver-contact')
  async getDriverContact(@Param('orderId') orderId: string) {
    const assignment = await this.trackingService.getAssignmentByOrder(orderId)

    if (
      !assignment ||
      assignment.status === AssignmentStatus.DELIVERED ||
      assignment.status === AssignmentStatus.CANCELLED ||
      assignment.status === AssignmentStatus.PENDING
    ) {
      throw new NotFoundException('Driver contact not available')
    }

    const driver = assignment.driver as { phone: string }
    return { phone: driver.phone }
  }

  /**
   * POST /tracking/public/:orderId/otp/resend
   * Customer requests OTP re-send if they didn't receive it.
   * Rate-limited: max 3 per order per hour, 60s cooldown between attempts.
   */
  @Post(':orderId/otp/resend')
  @HttpCode(HttpStatus.OK)
  async resendOtp(@Param('orderId') orderId: string) {
    // Verify order is in an active delivery state before sending
    const assignment = await this.trackingService.getAssignmentByOrder(orderId)
    if (
      !assignment ||
      assignment.status === AssignmentStatus.DELIVERED ||
      assignment.status === AssignmentStatus.CANCELLED
    ) {
      throw new NotFoundException('No active delivery for this order')
    }

    await this.otpService.resendForCustomer(orderId)
    return { sent: true }
  }

  /**
   * POST /tracking/public/:orderId/rating
   * Customer submits a 1–5 star rating with optional tags and comment.
   * Only allowed once per order, only after DELIVERED status.
   */
  @Post(':orderId/rating')
  @HttpCode(HttpStatus.CREATED)
  async submitRating(
    @Param('orderId') orderId: string,
    @Body() body: SubmitRatingDto,
  ) {
    return this.trackingService.submitRating(orderId, {
      rating:  body.rating,
      comment: body.comment,
      tags:    body.tags ?? [],
    })
  }
}
