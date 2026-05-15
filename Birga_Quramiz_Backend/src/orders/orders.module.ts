import { Module } from '@nestjs/common'
import { OrdersService } from './orders.service'
import { OrdersController } from './orders.controller'
import { PrismaModule } from '../prisma/prisma.module'
import { TelegramModule } from '../telegram/telegram.module'
import { SmsService } from '../tracking/services/sms.service'

@Module({
  imports: [PrismaModule, TelegramModule],
  controllers: [OrdersController],
  providers: [OrdersService, SmsService],
})
export class OrdersModule { }