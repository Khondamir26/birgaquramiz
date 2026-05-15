// ⚠ instrument.ts MUST be the first import — Sentry requires this
import './instrument';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import express, {
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { SentryGlobalFilter } from '@sentry/nestjs/setup';
import { SafeHttpExceptionFilter } from './common/filters/safe-http-exception.filter';
import { Logger } from 'nestjs-pino';
import { RedisRateLimiter } from './common/middleware/redis-rate-limiter';

const GLOBAL_RATE_WINDOW_MS = 60_000;
const GLOBAL_RATE_MAX_REQUESTS = 180;
const AUTH_RATE_WINDOW_MS = 60_000;
const AUTH_RATE_MAX_REQUESTS = 30;

const AUTH_RATE_PATHS = new Set([
  '/auth/login',
  '/auth/register',
  '/auth/register-seller',
  '/auth/refresh',
  '/auth/refresh/logout',
  '/auth/logout',
  '/auth/logout-all',
  '/auth/change-password',
]);

// Single Redis-backed limiter instance (falls back to in-memory when Redis unavailable)
const rateLimiter = new RedisRateLimiter();

function shouldApplyAuthRateLimit(path: string) {
  return AUTH_RATE_PATHS.has(path);
}

function getAllowedOrigins() {
  const raw = process.env.CORS_ORIGINS?.trim();
  if (!raw) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'CORS_ORIGINS environment variable is required in production',
      );
    }
    return ['http://localhost:3000'];
  }
  return [
    ...new Set(
      raw
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  // Replace NestJS default logger with Pino (structured JSON in prod, pretty in dev)
  app.useLogger(app.get(Logger));
  // Required for BeforeApplicationShutdown / OnApplicationShutdown lifecycle hooks
  app.enableShutdownHooks();
  const uploadsDir = join(process.cwd(), 'uploads');
  const productsUploadsDir = join(uploadsDir, 'products');
  const podUploadsDir = join(uploadsDir, 'pod');

  if (!existsSync(productsUploadsDir)) {
    mkdirSync(productsUploadsDir, { recursive: true });
  }
  if (!existsSync(podUploadsDir)) {
    mkdirSync(podUploadsDir, { recursive: true });
  }

  const expressApp = app.getHttpAdapter().getInstance() as express.Express;
  expressApp.disable('x-powered-by');
  expressApp.set('trust proxy', 1);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.use(cookieParser());

  const allowedOrigins = new Set(getAllowedOrigins());
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('CORS origin denied'), false);
    },
    credentials: true,
  });

  app.use((req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const normalizedPath = req.path || req.url || '';

    rateLimiter
      .allow(`global:${ip}`, GLOBAL_RATE_MAX_REQUESTS, GLOBAL_RATE_WINDOW_MS)
      .then((allowed) => {
        if (!allowed) {
          res.status(429).json({ message: 'Too many requests' });
          return;
        }
        if (!shouldApplyAuthRateLimit(normalizedPath)) {
          next();
          return;
        }

        return rateLimiter
          .allow(
            `auth:${ip}:${normalizedPath}`,
            AUTH_RATE_MAX_REQUESTS,
            AUTH_RATE_WINDOW_MS,
          )
          .then((authAllowed) => {
            if (!authAllowed) {
              res.status(429).json({ message: 'Too many requests' });
              return;
            }
            next();
          });
      })
      .catch(() => next()); // fail open — never block legitimate traffic on Redis errors
  });

  app.use('/uploads', express.static(uploadsDir));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  // SentryGlobalFilter catches + reports, then re-throws so SafeHttpExceptionFilter formats the response
  app.useGlobalFilters(new SentryGlobalFilter(), new SafeHttpExceptionFilter());

  await app.listen(process.env.PORT || 5000, '0.0.0.0');

  for (const signal of ['SIGTERM', 'SIGINT'] as const) {
    process.on(signal, () => {
      void Promise.all([app.close(), rateLimiter.quit()]).then(() =>
        process.exit(0),
      );
    });
  }
}
void bootstrap();
