import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import Redis from 'ioredis'
import { LatLng, stableHash } from './geo.utils'
import axios from 'axios'

@Injectable()
export class GeocodingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(GeocodingService.name)
  private redis!: Redis

  onModuleInit() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST ?? 'localhost',
      port: Number(process.env.REDIS_PORT ?? 6379),
      password: process.env.REDIS_PASSWORD,
      lazyConnect: true,
    })
    this.redis.connect().catch(() =>
      this.logger.warn('Redis unavailable — geocoding cache disabled'),
    )
  }

  async onModuleDestroy() {
    await this.redis.quit()
  }

  /**
   * Convert address string → LatLng.
   * Cached indefinitely — addresses don't change.
   */
  async geocode(address: string): Promise<LatLng | null> {
    const key = `geocode:${stableHash(address.toLowerCase().trim())}`

    const cached = await this.redis.get(key).catch(() => null)
    if (cached) return JSON.parse(cached) as LatLng

    await this.trackApiCall('geocoding')

    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      this.logger.warn('GOOGLE_MAPS_API_KEY not set — geocoding unavailable')
      return null
    }

    try {
      const { data } = await axios.get(
        'https://maps.googleapis.com/maps/api/geocode/json',
        { params: { address, key: apiKey } },
      )

      const location = data.results?.[0]?.geometry?.location as
        | { lat: number; lng: number }
        | undefined

      if (!location) return null

      const result: LatLng = { lat: location.lat, lng: location.lng }
      // Cache indefinitely (no TTL)
      await this.redis.set(key, JSON.stringify(result)).catch(() => {})
      return result
    } catch (err) {
      this.logger.error('Geocoding API error', err)
      return null
    }
  }

  /**
   * Convert LatLng → human-readable address string.
   * Cached 24h.
   */
  async reverseGeocode(loc: LatLng): Promise<string | null> {
    const key = `rev_geocode:${loc.lat.toFixed(5)},${loc.lng.toFixed(5)}`

    const cached = await this.redis.get(key).catch(() => null)
    if (cached) return cached

    await this.trackApiCall('reverse_geocoding')

    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    if (!apiKey) return null

    try {
      const { data } = await axios.get(
        'https://maps.googleapis.com/maps/api/geocode/json',
        { params: { latlng: `${loc.lat},${loc.lng}`, key: apiKey } },
      )

      const address = data.results?.[0]?.formatted_address as string | undefined
      if (!address) return null

      await this.redis.setex(key, 86_400, address).catch(() => {}) // 24h
      return address
    } catch (err) {
      this.logger.error('Reverse geocoding API error', err)
      return null
    }
  }

  private async trackApiCall(api: string) {
    const key = `maps_usage:${api}:${new Date().toISOString().slice(0, 10)}`
    await this.redis.incr(key).catch(() => {})
    await this.redis.expire(key, 60 * 60 * 24 * 30).catch(() => {}) // 30 days
  }
}
