import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import express from 'express'

const RATE_WINDOW_MS = 60_000
const RATE_MAX_REQUESTS = 120

type RateBucket = { count: number; resetAt: number }
const ipBuckets = new Map<string, RateBucket>()

function getAllowedOrigins() {
  const raw = process.env.CORS_ORIGINS?.trim()
  if (!raw) return ['http://localhost:3000']
  return raw.split(',').map((item) => item.trim()).filter(Boolean)
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const uploadsDir = join(process.cwd(), 'uploads')
  const productsUploadsDir = join(uploadsDir, 'products')

  if (!existsSync(productsUploadsDir)) {
    mkdirSync(productsUploadsDir, { recursive: true })
  }
  const expressApp = app.getHttpAdapter().getInstance() as express.Express
  expressApp.disable('x-powered-by')

  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('Referrer-Policy', 'no-referrer')
    res.setHeader('X-XSS-Protection', '0')
    next()
  })

  app.use((req, res, next) => {
    const now = Date.now()
    const ip = req.ip || req.socket.remoteAddress || 'unknown'
    const bucket = ipBuckets.get(ip)

    if (!bucket || bucket.resetAt <= now) {
      ipBuckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
      return next()
    }

    if (bucket.count >= RATE_MAX_REQUESTS) {
      res.status(429).json({ message: 'Too many requests' })
      return
    }

    bucket.count += 1
    next()
  })

  app.use('/uploads', express.static(uploadsDir))

  app.enableCors({
    origin: getAllowedOrigins(),
    credentials: true,
  })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )

  await app.listen(process.env.PORT ?? 5000)
}
bootstrap()

