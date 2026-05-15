import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { PrismaService } from '../../prisma/prisma.service'
import Redis from 'ioredis'

interface BufferedLocation {
  driverId: string
  lat: number
  lng: number
  heading: number | null
  speed: number | null
  accuracy: number | null
  timestamp: number
}

/**
 * Buffers GPS points in Redis lists and flushes to PostgreSQL every 30 seconds.
 *
 * Instead of writing every GPS point directly to DB:
 *   1000 drivers × 12 writes/min = 12,000 writes/min  ← too heavy
 *
 * With buffering:
 *   Flush every 30s → batch insert → ~2,000 rows/flush max
 *   DB only gets hit twice per minute total.
 */
@Injectable()
export class LocationHistoryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(LocationHistoryService.name)
  private redis!: Redis

  /** Max points kept per driver in Redis buffer (prevents unbounded growth) */
  private readonly MAX_BUFFER_SIZE = 30

  /** Redis Set that tracks which drivers currently have buffered locations.
   *  Avoids KEYS 'loc_buf:*' which is O(N) over the entire keyspace. */
  private readonly DRIVER_SET_KEY = 'loc_buf_drivers'

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST ?? 'localhost',
      port: Number(process.env.REDIS_PORT ?? 6379),
      password: process.env.REDIS_PASSWORD,
      lazyConnect: true,
    })
    this.redis.connect().catch(() =>
      this.logger.warn('Redis unavailable — location history buffering disabled'),
    )
  }

  async onModuleDestroy() {
    // Flush remaining buffer before shutdown
    await this.flush().catch(() => {})
    await this.redis.quit()
  }

  /**
   * Add a GPS point to the driver's Redis buffer.
   * Does NOT write to DB — the cron job handles that.
   */
  async buffer(location: BufferedLocation): Promise<void> {
    const key = `loc_buf:${location.driverId}`
    const value = JSON.stringify(location)

    await this.redis
      .multi()
      .sadd(this.DRIVER_SET_KEY, location.driverId) // register driver in flush index
      .rpush(key, value)
      .ltrim(key, -this.MAX_BUFFER_SIZE, -1)         // keep only last N points
      .expire(key, 120)                               // auto-expire if driver goes offline
      .exec()
      .catch(() => {})
  }

  /**
   * Immediately persist a single important event to DB (no buffering).
   * Used for: pickup confirmed, delivered, fraud flagged.
   */
  async persistImmediate(location: BufferedLocation): Promise<void> {
    try {
      await this.prisma.locationHistory.create({
        data: {
          driverId: location.driverId,
          lat: location.lat,
          lng: location.lng,
          heading: location.heading,
          speed: location.speed,
          accuracy: location.accuracy,
          createdAt: new Date(location.timestamp),
        },
      })
    } catch (err) {
      this.logger.error('Failed to persist immediate location', err)
    }
  }

  /**
   * Cron: flush all buffered locations to DB every 30 seconds.
   * Uses bulk insert for efficiency.
   */
  @Cron('*/30 * * * * *')
  async flush(): Promise<void> {
    // O(1) lookup — no keyspace scan
    const driverIds = await this.redis.smembers(this.DRIVER_SET_KEY).catch(() => [] as string[])
    if (!driverIds.length) return

    const allRows: {
      driverId: string; lat: number; lng: number
      heading: number | null; speed: number | null; accuracy: number | null
      createdAt: Date
    }[] = []

    for (const driverId of driverIds) {
      const key = `loc_buf:${driverId}`
      const items = await this.redis.lrange(key, 0, -1).catch(() => [] as string[])
      if (!items.length) {
        await this.redis.srem(this.DRIVER_SET_KEY, driverId).catch(() => {})
        continue
      }

      for (const raw of items) {
        try {
          const loc = JSON.parse(raw) as BufferedLocation
          allRows.push({
            driverId: loc.driverId,
            lat: loc.lat,
            lng: loc.lng,
            heading: loc.heading ?? null,
            speed: loc.speed ?? null,
            accuracy: loc.accuracy ?? null,
            createdAt: new Date(loc.timestamp),
          })
        } catch {
          // Corrupted entry — skip
        }
      }

      // Clear buffer and remove from set atomically
      await this.redis.multi().del(key).srem(this.DRIVER_SET_KEY, driverId).exec().catch(() => {})
    }

    if (!allRows.length) return

    try {
      await this.prisma.locationHistory.createMany({
        data: allRows,
        skipDuplicates: true,
      })
      this.logger.debug(`[location-history] flushed ${allRows.length} rows to DB`)
    } catch (err) {
      this.logger.error(`[location-history] bulk insert failed`, err)
      // Re-buffer failed rows so they aren't lost
      for (const row of allRows) {
        await this.buffer({
          driverId: row.driverId as string,
          lat: row.lat as number,
          lng: row.lng as number,
          heading: row.heading as number | null,
          speed: row.speed as number | null,
          accuracy: row.accuracy as number | null,
          timestamp: (row.createdAt as Date).getTime(),
        }).catch(() => {})
      }
    }
  }

  /** Cron: delete location rows older than 30 days every day at 3 AM.
   *  Deletes in 2 000-row batches to avoid long-running table locks. */
  @Cron('0 3 * * *')
  async cleanup(): Promise<void> {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 30)
    const BATCH = 2_000
    let totalDeleted = 0

    try {
      let deleted: number
      do {
        // Find the oldest IDs in this batch, then delete them
        const ids = await this.prisma.locationHistory.findMany({
          where: { createdAt: { lt: cutoff } },
          select: { id: true },
          take: BATCH,
          orderBy: { createdAt: 'asc' },
        })
        if (!ids.length) break

        const result = await this.prisma.locationHistory.deleteMany({
          where: { id: { in: ids.map((r) => r.id) } },
        })
        deleted = result.count
        totalDeleted += deleted
      } while (deleted === BATCH)

      if (totalDeleted > 0) {
        this.logger.log(`[location-history] cleaned ${totalDeleted} rows older than 30 days`)
      }
    } catch (err) {
      this.logger.error('[location-history] cleanup failed', err)
    }
  }

  /** Max window for a single route-replay query — prevents full-table scans */
  private readonly MAX_HISTORY_WINDOW_MS = 24 * 60 * 60 * 1_000 // 24 hours

  /**
   * Get location history for route replay analytics.
   * Returns points ordered by time ascending, capped at a 24h window.
   */
  async getHistory(
    driverId: string,
    from: Date,
    to: Date,
  ): Promise<{ lat: number; lng: number; heading: number | null; speed: number | null; createdAt: Date }[]> {
    // Clamp the window to protect against unbounded scans
    const effectiveTo = to.getTime() - from.getTime() > this.MAX_HISTORY_WINDOW_MS
      ? new Date(from.getTime() + this.MAX_HISTORY_WINDOW_MS)
      : to

    return this.prisma.locationHistory.findMany({
      where: {
        driverId,
        createdAt: { gte: from, lte: effectiveTo },
      },
      select: { lat: true, lng: true, heading: true, speed: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    })
  }
}
