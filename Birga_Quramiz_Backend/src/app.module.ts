import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AnalyticsController } from './analytics/analytics.controller';
import { UploadModule } from './upload/upload.module';
import { AiModule } from './ai/ai.module';
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
    ThrottlerModule.forRoot([
      { name: 'global', ttl: 60000, limit: 60 },
      { name: 'ai', ttl: 60000, limit: 10 },
    ]),
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
    AiModule,
  ],
  controllers: [AppController, AnalyticsController],
  providers: [AppService],
})
export class AppModule {}
