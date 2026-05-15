import Redis from 'ioredis'

/**
 * Atomic Lua script: INCR key, set PEXPIRE on first hit, return 1 if allowed / 0 if limited.
 * Runs as a single round-trip — no race conditions.
 */
const RATE_LIMIT_SCRIPT = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[2])
end
if count > tonumber(ARGV[1]) then
  return 0
end
return 1
`

type MemBucket = { count: number; resetAt: number }

export class RedisRateLimiter {
  private readonly redis: Redis
  private ready = false
  /** In-memory fallback when Redis is unavailable */
  private readonly fallback = new Map<string, MemBucket>()
  private readonly maxFallbackEntries = 10_000

  constructor() {
    this.redis = new Redis({
      host:               process.env.REDIS_HOST     ?? 'localhost',
      port:               Number(process.env.REDIS_PORT ?? 6379),
      password:           process.env.REDIS_PASSWORD,
      lazyConnect:        true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
    })
    this.redis.connect()
      .then(() => { this.ready = true })
      .catch(() => { /* runs in in-memory fallback mode */ })

    this.redis.on('ready', () => { this.ready = true })
    this.redis.on('error', () => { this.ready = false })
  }

  /**
   * Returns true if the request is allowed, false if rate-limited.
   * key:        e.g. `rl:global:{ip}` or `rl:auth:{ip}:{path}`
   * maxReq:     maximum requests in the window
   * windowMs:   window duration in milliseconds
   */
  async allow(key: string, maxReq: number, windowMs: number): Promise<boolean> {
    if (this.ready) {
      try {
        const result = await this.redis.eval(
          RATE_LIMIT_SCRIPT,
          1,
          `rl:${key}`,
          String(maxReq),
          String(windowMs),
        ) as number
        return result === 1
      } catch {
        // Redis error mid-request — fall through to in-memory
      }
    }

    // In-memory fallback
    const now = Date.now()
    const bucket = this.fallback.get(key)
    if (!bucket || bucket.resetAt <= now) {
      if (this.fallback.size >= this.maxFallbackEntries) {
        // Evict expired entries to cap memory use
        for (const [k, v] of this.fallback.entries()) {
          if (v.resetAt <= now) this.fallback.delete(k)
        }
      }
      this.fallback.set(key, { count: 1, resetAt: now + windowMs })
      return true
    }
    if (bucket.count >= maxReq) return false
    bucket.count++
    return true
  }

  async quit() {
    await this.redis.quit().catch(() => {})
  }
}
