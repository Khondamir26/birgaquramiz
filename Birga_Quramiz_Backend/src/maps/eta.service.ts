import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import Redis from 'ioredis'
import { LatLng, haversineMeters } from './geo.utils'
import { RouteCacheService, RouteResult } from './route-cache.service'

export interface ETAResult {
  durationSeconds: number
  distanceMeters: number
  etaMinutes: number
  arrivalTime: Date
  /** The driver location at time of calculation — used to skip recalc if not moved */
  calculatedAtLat: number
  calculatedAtLng: number
}

@Injectable()
export class EtaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EtaService.name)
  private redis!: Redis

  /** Only recalculate ETA if driver moved more than this distance */
  private readonly RECALC_THRESHOLD_METERS = 200

  /**
   * ETA cache TTL = 90s for active deliveries.
   * Short enough that moving drivers get fresh ETAs,
   * long enough to avoid hammering the Routes API.
   */
  private readonly ETA_TTL = 90

  constructor(private readonly routeCache: RouteCacheService) {}

  onModuleInit() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST ?? 'localhost',
      port: Number(process.env.REDIS_PORT ?? 6379),
      password: process.env.REDIS_PASSWORD,
      lazyConnect: true,
    })
    this.redis.connect().catch(() =>
      this.logger.warn('Redis unavailable — ETA cache disabled'),
    )
  }

  async onModuleDestroy() {
    await this.redis.quit()
  }

  /**
   * Get ETA from driver's current location to destination.
   * Skips recalculation if driver hasn't moved > 200m since last calc.
   */
  async getETA(
    driverLocation: LatLng,
    destination: LatLng,
    cacheKey: string,       // e.g. orderId
  ): Promise<ETAResult | null> {
    const key = `eta:${cacheKey}`

    const cached = await this.redis.get(key).catch(() => null)
    if (cached) {
      const cachedEta = JSON.parse(cached) as ETAResult
      cachedEta.arrivalTime = new Date(cachedEta.arrivalTime)

      const distanceMoved = haversineMeters(
        { lat: cachedEta.calculatedAtLat, lng: cachedEta.calculatedAtLng },
        driverLocation,
      )

      if (distanceMoved < this.RECALC_THRESHOLD_METERS) {
        return cachedEta
      }
    }

    const route = await this.routeCache.getRoute(driverLocation, destination)
    if (!route) return null

    const result: ETAResult = {
      durationSeconds: route.durationSeconds,
      distanceMeters: route.distanceMeters,
      etaMinutes: Math.ceil(route.durationSeconds / 60),
      arrivalTime: route.arrivalTime,
      calculatedAtLat: driverLocation.lat,
      calculatedAtLng: driverLocation.lng,
    }

    await this.redis.setex(key, this.ETA_TTL, JSON.stringify(result)).catch(() => {})
    return result
  }

  async clearETA(cacheKey: string) {
    await this.redis.del(`eta:${cacheKey}`).catch(() => {})
  }

  /** Get API usage stats for monitoring */
  async getUsageStats(): Promise<Record<string, number>> {
    const today = new Date().toISOString().slice(0, 10)
    const keys = await this.redis.keys(`maps_usage:*:${today}`).catch(() => [] as string[])

    const stats: Record<string, number> = {}
    for (const key of keys) {
      const val = await this.redis.get(key).catch(() => '0')
      const apiName = key.split(':')[1]
      stats[apiName] = parseInt(val ?? '0', 10)
    }
    return stats
  }
}
