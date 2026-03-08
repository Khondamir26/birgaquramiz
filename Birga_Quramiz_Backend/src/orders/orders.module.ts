import { Module } from '@nestjs/common'
import { OrdersService } from './orders.service'
import { OrdersController } from './orders.controller'
import { PrismaModule } from '../prisma/prisma.module'
import { TelegramModule } from '../telegram/telegram.module'

@Module({
  imports: [PrismaModule, TelegramModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule { }