import { Module } from '@nestjs/common';
import { SentryModule } from '@sentry/nestjs/setup';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import Redis from 'ioredis';
import { LoggerModule } from 'nestjs-pino';
import { pinoConfig } from './common/logger/logger.config';
import { AnalyticsController } from './analytics/analytics.controller';
import { UploadModule } from './upload/upload.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { AdminModule } from './admin/admin.module';
import { ProductsModule } from './products/products.module';
import { SellerModule } from './seller/seller.module';
import { OrdersModule } from './orders/orders.module';
import { CategoriesModule } from './categories/categories.module';
import { PaymentsModule } from './payments/payments.module';
import { ReviewsModule } from './reviews/reviews.module';
import { BrandsModule } from './brands/brands.module';
import { TrackingModule } from './tracking/tracking.module';
import { MapsModule } from './maps/maps.module';

@Module({
  imports: [
    SentryModule.forRoot(),
    LoggerModule.forRoot(pinoConfig),
    ThrottlerModule.forRootAsync({
      useFactory: () => ({
        throttlers: [
          { name: 'global', ttl: 60_000, limit: 60 },
          { name: 'ai', ttl: 60_000, limit: 10 },
        ],
        // Redis-backed storage — survives backend restarts and works across instances
        // Falls back gracefully: ThrottlerModule reverts to in-memory if Redis is unavailable
        storage: new ThrottlerStorageRedisService(
          new Redis({
            host: process.env.REDIS_HOST ?? 'localhost',
            port: Number(process.env.REDIS_PORT ?? 6379),
            password: process.env.REDIS_PASSWORD,
            lazyConnect: true,
            enableOfflineQueue: false, // drop commands rather than queue when Redis is down
          }),
        ),
      }),
    }),
    PrismaModule,
    MapsModule,
    AuthModule,
    AdminModule,
    ProductsModule,
    SellerModule,
    OrdersModule,
    UploadModule,
    CategoriesModule,
    PaymentsModule,
    ReviewsModule,
    BrandsModule,
    TrackingModule,
  ],
  controllers: [AppController, AnalyticsController],
  providers: [AppService],
})
export class AppModule {}
