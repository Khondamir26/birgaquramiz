import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

export interface LocationData {
  driverId: string
  lat: number
  lng: number
  accuracy?: number
  speed?: number
  timestamp: number
}

export interface CachedLocation {
  lat: number
  lng: number
  speed?: number
  accuracy?: number
  timestamp: number
}

export interface FraudResult {
  valid: boolean
  reason?: string
  severity?: 'LOW' | 'MEDIUM' | 'HIGH'
}

/** Haversine distance in metres between two lat/lng points */
function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6_371_000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)
  const aVal =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng
  return R * 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal))
}

@Injectable()
export class FraudService {
  private readonly logger = new Logger(FraudService.name)

  /** Max plausible delivery speed: 150 km/h = 41.7 m/s */
  private readonly MAX_SPEED_MS = 41.7

  /** Max plausible jump in a single interval (500m in < 10s) */
  private readonly MAX_JUMP_METERS = 500
  private readonly MAX_JUMP_SECONDS = 10

  /** Mock GPS apps often report accuracy of exactly 0 or 1 */
  private readonly SUSPICIOUS_ACCURACY_EXACT = 0

  /** Real GPS rarely exceeds 150m accuracy; beyond that discard */
  private readonly MAX_ACCURACY_METERS = 100

  constructor(private readonly prisma: PrismaService) {}

  validateLocation(
    newLoc: LocationData,
    prevLoc: CachedLocation | null,
  ): FraudResult {
    // 1. Discard readings with terrible accuracy
    if (newLoc.accuracy !== undefined && newLoc.accuracy > this.MAX_ACCURACY_METERS) {
      return { valid: false, reason: 'LOW_ACCURACY', severity: 'LOW' }
    }

    // 2. Suspicious "perfect" accuracy — common in mock GPS apps
    if (newLoc.accuracy === this.SUSPICIOUS_ACCURACY_EXACT) {
      return { valid: false, reason: 'SUSPICIOUS_ACCURACY', severity: 'MEDIUM' }
    }

    if (!prevLoc) return { valid: true }

    const distanceMeters = haversineMeters(prevLoc, newLoc)
    const timeDeltaSeconds = Math.max(
      (newLoc.timestamp - prevLoc.timestamp) / 1_000,
      0.001,
    )

    // 3. Impossible speed between two consecutive points
    const impliedSpeedMs = distanceMeters / timeDeltaSeconds
    if (impliedSpeedMs > this.MAX_SPEED_MS) {
      this.logger.warn(
        `[fraud] driver=${newLoc.driverId} impossible_speed=${(impliedSpeedMs * 3.6).toFixed(1)}km/h`,
      )
      return {
        valid: false,
        reason: `IMPOSSIBLE_SPEED:${Math.round(impliedSpeedMs * 3.6)}kmh`,
        severity: 'HIGH',
      }
    }

    // 4. Teleportation jump — large distance in very short time
    if (
      distanceMeters > this.MAX_JUMP_METERS &&
      timeDeltaSeconds < this.MAX_JUMP_SECONDS
    ) {
      this.logger.warn(
        `[fraud] driver=${newLoc.driverId} location_jump=${Math.round(distanceMeters)}m in ${timeDeltaSeconds.toFixed(1)}s`,
      )
      return {
        valid: false,
        reason: `LOCATION_JUMP:${Math.round(distanceMeters)}m`,
        severity: 'HIGH',
      }
    }

    // 5. Frozen coordinates — same exact lat/lng for > 30s while speed > 0
    if (
      prevLoc.lat === newLoc.lat &&
      prevLoc.lng === newLoc.lng &&
      timeDeltaSeconds > 30 &&
      newLoc.speed !== undefined &&
      newLoc.speed > 0.5
    ) {
      return {
        valid: false,
        reason: 'FROZEN_COORDINATES',
        severity: 'MEDIUM',
      }
    }

    return { valid: true }
  }

  async flagDriver(driverId: string, reason: string): Promise<void> {
    try {
      // Throttle: skip if same driver triggered the same reason type within the last 10 minutes
      const reasonType = reason.split(':')[0]
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1_000)
      const recent = await this.prisma.fraudEvent.findFirst({
        where: {
          driverId,
          reason: { startsWith: reasonType },
          createdAt: { gte: tenMinutesAgo },
        },
        select: { id: true },
      })
      if (recent) return

      await this.prisma.fraudEvent.create({
        data: { driverId, reason },
      })
      this.logger.warn(`[fraud] flagged driver=${driverId} reason=${reason}`)
    } catch {
      this.logger.warn(`[fraud] flagged driver=${driverId} reason=${reason} (DB write failed)`)
    }
  }
}
