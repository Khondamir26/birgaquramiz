import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { EtaService } from '../../maps/eta.service'
import { GeocodingService } from '../../maps/geocoding.service'
import { LatLng, haversineMeters } from '../../maps/geo.utils'
import { TrackingService } from '../tracking.service'
import { AssignmentStatus, DriverStatus } from '@prisma/client'

export interface DriverScore {
  driverId: string
  name: string
  phone: string
  distanceKm: number
  etaMinutes: number
  currentLoad: number   // active assignments count
  score: number         // higher = better
}

@Injectable()
export class DriverRecommendationService {
  private readonly logger = new Logger(DriverRecommendationService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly trackingService: TrackingService,
    private readonly etaService: EtaService,
    private readonly geocodingService: GeocodingService,
  ) {}

  /**
   * Rank available drivers for a given order.
   * Scoring formula: 40% proximity + 30% ETA + 30% workload.
   * Returns top `limit` results sorted best-first.
   */
  async recommend(orderId: string, limit = 5): Promise<DriverScore[]> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { deliveryAddress: true },
    })
    if (!order?.deliveryAddress) return []

    // Geocode destination once (cached indefinitely)
    const destination = await this.geocodingService.geocode(order.deliveryAddress)
    if (!destination) return []

    // Get all ONLINE drivers with no active delivery
    const availableDrivers = await this.prisma.user.findMany({
      where: {
        role: 'DRIVER',
        driverProfile: { status: DriverStatus.ONLINE },
        assignments: {
          none: {
            status: { in: [AssignmentStatus.ACCEPTED, AssignmentStatus.PICKED_UP] },
          },
        },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        driverProfile: { select: { lastLat: true, lastLng: true } },
        _count: {
          select: {
            assignments: {
              where: { status: AssignmentStatus.PENDING },
            },
          },
        },
      },
    })

    if (!availableDrivers.length) return []

    const scored = await Promise.all(
      availableDrivers.map(async (driver) => {
        // Prefer live Redis location, fall back to DB last known
        const liveLoc = await this.trackingService.getDriverLocation(driver.id)
        const driverLoc: LatLng | null = liveLoc
          ? { lat: liveLoc.lat, lng: liveLoc.lng }
          : driver.driverProfile?.lastLat != null
            ? { lat: driver.driverProfile.lastLat, lng: driver.driverProfile.lastLng! }
            : null

        if (!driverLoc) return null

        const distanceMeters = haversineMeters(driverLoc, destination)
        const distanceKm = distanceMeters / 1_000
        const eta = await this.etaService.getETA(driverLoc, destination, `rec:${orderId}:${driver.id}`)
        const etaMinutes = eta?.etaMinutes ?? Math.ceil(distanceKm * 3)  // fallback ~3 min/km
        const currentLoad = driver._count.assignments

        // Score: higher is better
        // Weights: 40% proximity, 30% ETA, 30% low workload
        const proximityScore  = 1 / (distanceKm + 0.1)
        const etaScore        = 1 / (etaMinutes + 1)
        const workloadScore   = 1 / (currentLoad + 1)
        const score = proximityScore * 40 + etaScore * 30 + workloadScore * 30

        return {
          driverId: driver.id,
          name: driver.name,
          phone: driver.phone,
          distanceKm: Math.round(distanceKm * 10) / 10,
          etaMinutes,
          currentLoad,
          score,
        } satisfies DriverScore
      }),
    )

    return scored
      .filter((s): s is DriverScore => s !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }
}
