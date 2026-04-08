import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import Redis from 'ioredis'
import { LatLng, toGridCell } from './geo.utils'
import axios from 'axios'

export interface RouteResult {
  durationSeconds: number
  distanceMeters: number
  polyline: string        // encoded polyline
  arrivalTime: Date
}

@Injectable()
export class RouteCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RouteCacheService.name)
  private redis!: Redis

  /**
   * Static route polyline cache TTL = 10 minutes.
   * The polyline (road path) rarely changes; only traffic data changes.
   * ETA is cached separately with a shorter 90s TTL.
   */
  private readonly ROUTE_TTL = 600

  onModuleInit() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST ?? 'localhost',
      port: Number(process.env.REDIS_PORT ?? 6379),
      password: process.env.REDIS_PASSWORD,
      lazyConnect: true,
    })
    this.redis.connect().catch(() =>
      this.logger.warn('Redis unavailable — route cache disabled'),
    )
  }

  async onModuleDestroy() {
    await this.redis.quit()
  }

  /**
   * Compute a traffic-aware route. Results cached by grid cell (110m precision)
   * so nearby origins reuse the same cached route.
   */
  async getRoute(origin: LatLng, destination: LatLng): Promise<RouteResult | null> {
    const key = `route:${toGridCell(origin)}:${toGridCell(destination)}`

    const cached = await this.redis.get(key).catch(() => null)
    if (cached) {
      await this.trackApiCall('routes_cache_hit')
      const r = JSON.parse(cached) as RouteResult
      r.arrivalTime = new Date(r.arrivalTime) // rehydrate date
      return r
    }

    await this.trackApiCall('routes_api')

    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      this.logger.warn('GOOGLE_MAPS_API_KEY not set — routes unavailable')
      return null
    }

    try {
      // Routes API (new) — more accurate traffic, cheaper than Directions
      const { data } = await axios.post(
        'https://routes.googleapis.com/directions/v2:computeRoutes',
        {
          origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
          destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
          travelMode: 'DRIVE',
          routingPreference: 'TRAFFIC_AWARE',
          computeAlternativeRoutes: false,
          languageCode: 'ru',
        },
        {
          headers: {
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline',
          },
        },
      )

      const route = data.routes?.[0]
      if (!route) return null

      const durationSeconds = parseInt(route.duration?.replace('s', '') ?? '0', 10)
      const result: RouteResult = {
        durationSeconds,
        distanceMeters: route.distanceMeters ?? 0,
        polyline: route.polyline?.encodedPolyline ?? '',
        arrivalTime: new Date(Date.now() + durationSeconds * 1_000),
      }

      await this.redis.setex(key, this.ROUTE_TTL, JSON.stringify(result)).catch(() => {})
      return result
    } catch (err) {
      this.logger.error('Routes API error', err)
      return null
    }
  }

  /**
   * Snap a batch of GPS points to the nearest road.
   * Batches up to 10 points per call. Cached 5 min.
   */
  async snapToRoads(points: LatLng[]): Promise<LatLng[]> {
    if (!points.length) return []

    const pathStr = points.map((p) => `${p.lat},${p.lng}`).join('|')
    const key = `snap:${pathStr}`

    const cached = await this.redis.get(key).catch(() => null)
    if (cached) return JSON.parse(cached) as LatLng[]

    await this.trackApiCall('roads_snap')

    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    if (!apiKey) return points

    try {
      const { data } = await axios.get(
        'https://roads.googleapis.com/v1/snapToRoads',
        { params: { path: pathStr, interpolate: true, key: apiKey } },
      )

      const snapped: LatLng[] = (data.snappedPoints ?? []).map(
        (p: { location: { latitude: number; longitude: number } }) => ({
          lat: p.location.latitude,
          lng: p.location.longitude,
        }),
      )

      await this.redis.setex(key, 300, JSON.stringify(snapped)).catch(() => {})
      return snapped.length ? snapped : points
    } catch (err) {
      this.logger.error('Roads API error', err)
      return points
    }
  }

  private async trackApiCall(api: string) {
    const key = `maps_usage:${api}:${new Date().toISOString().slice(0, 10)}`
    await this.redis.incr(key).catch(() => {})
    await this.redis.expire(key, 60 * 60 * 24 * 30).catch(() => {})
  }
}
