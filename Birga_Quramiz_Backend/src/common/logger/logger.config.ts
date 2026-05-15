import type { Params } from 'nestjs-pino'

const isProd = process.env.NODE_ENV === 'production'

/** Paths that generate high-frequency noise — sampled at 1% in production */
const HIGH_FREQ_PATHS = new Set([
  '/health',
  '/tracking/public',
])

export const pinoConfig: Params = {
  pinoHttp: {
    level: isProd ? 'info' : 'debug',

    // Pretty-print in development, JSON in production
    ...(isProd
      ? {}
      : {
          transport: {
            target: 'pino-pretty',
            options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
          },
        }),

    // Attach request ID to every log line in the request context
    genReqId: (req, res) => {
      const existing = req.headers['x-request-id'] as string | undefined
      if (existing) {
        res.setHeader('x-request-id', existing)
        return existing
      }
      const id = crypto.randomUUID()
      res.setHeader('x-request-id', id)
      return id
    },

    // Scrub sensitive headers from access logs
    redact: {
      paths: ['req.headers.authorization', 'req.headers.cookie', 'req.body.password', 'req.body.token'],
      censor: '[Filtered]',
    },

    // Suppress high-frequency health/tracking endpoints at 99% in production
    customSuccessMessage(req, res) {
      return `${req.method} ${req.url} ${res.statusCode}`
    },
    autoLogging: {
      ignore: (req) => {
        if (!isProd) return false
        const path = (req.url ?? '').split('?')[0]
        // Skip 99% of high-frequency path logs in production
        return HIGH_FREQ_PATHS.has(path) && Math.random() > 0.01
      },
    },

    // Serialize only safe request fields
    serializers: {
      req(req) {
        return {
          id:     req.id,
          method: req.method,
          url:    req.url,
          ip:     req.remoteAddress,
        }
      },
      res(res) {
        return { statusCode: res.statusCode }
      },
    },
  },
}
