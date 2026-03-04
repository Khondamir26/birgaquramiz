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
import { SafeHttpExceptionFilter } from './common/filters/safe-http-exception.filter';

const GLOBAL_RATE_WINDOW_MS = 60_000;
const GLOBAL_RATE_MAX_REQUESTS = 180;
const AUTH_RATE_WINDOW_MS = 60_000;
const AUTH_RATE_MAX_REQUESTS = 30;
const MAX_BUCKET_ENTRIES = 10_000;

type RateBucket = { count: number; resetAt: number };
const globalIpBuckets = new Map<string, RateBucket>();
const authIpBuckets = new Map<string, RateBucket>();

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

function cleanupExpiredBuckets(store: Map<string, RateBucket>, now: number) {
  for (const [key, bucket] of store.entries()) {
    if (bucket.resetAt <= now) {
      store.delete(key);
    }
  }
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

function shouldApplyAuthRateLimit(path: string) {
  return AUTH_RATE_PATHS.has(path);
}

function applyRateLimit(
  store: Map<string, RateBucket>,
  key: string,
  now: number,
  maxRequests: number,
  windowMs: number,
) {
  const bucket = store.get(key);

  if (!bucket || bucket.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= maxRequests) {
    return false;
  }

  bucket.count += 1;
  return true;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger:
      process.env.NODE_ENV === 'production'
        ? ['error', 'warn', 'log']
        : ['error', 'warn', 'log', 'debug', 'verbose'],
  });
  const uploadsDir = join(process.cwd(), 'uploads');
  const productsUploadsDir = join(uploadsDir, 'products');

  if (!existsSync(productsUploadsDir)) {
    mkdirSync(productsUploadsDir, { recursive: true });
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

  app.use('/uploads', express.static(uploadsDir));

  app.use((req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const normalizedPath = req.path || req.url || '';

    if (globalIpBuckets.size > MAX_BUCKET_ENTRIES) {
      cleanupExpiredBuckets(globalIpBuckets, now);
    }
    if (authIpBuckets.size > MAX_BUCKET_ENTRIES) {
      cleanupExpiredBuckets(authIpBuckets, now);
    }

    const isAllowedGlobally = applyRateLimit(
      globalIpBuckets,
      ip,
      now,
      GLOBAL_RATE_MAX_REQUESTS,
      GLOBAL_RATE_WINDOW_MS,
    );
    if (!isAllowedGlobally) {
      res.status(429).json({ message: 'Too many requests' });
      return;
    }

    if (!shouldApplyAuthRateLimit(normalizedPath)) {
      next();
      return;
    }

    const isAllowedForAuth = applyRateLimit(
      authIpBuckets,
      `${ip}:${normalizedPath}`,
      now,
      AUTH_RATE_MAX_REQUESTS,
      AUTH_RATE_WINDOW_MS,
    );
    if (!isAllowedForAuth) {
      res.status(429).json({ message: 'Too many requests' });
      return;
    }

    next();
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new SafeHttpExceptionFilter());

  await app.listen(process.env.PORT || 5000, '0.0.0.0');
}
void bootstrap();
