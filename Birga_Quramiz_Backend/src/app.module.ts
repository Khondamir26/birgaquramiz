import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module'
import { AdminModule } from './admin/admin.module';
import { ProductsModule } from './products/products.module';
import { SellerModule } from './seller/seller.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [PrismaModule, AuthModule, AdminModule, ProductsModule, SellerModule, OrdersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
