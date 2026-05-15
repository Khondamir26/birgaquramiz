import { Module } from '@nestjs/common'
import { AdminController } from './admin.controller'
import { AdminService } from './admin.service'
import { PrismaModule } from '../prisma/prisma.module'
import { TelegramModule } from '../telegram/telegram.module'
import { SmsService } from '../tracking/services/sms.service'

@Module({
  imports: [PrismaModule, TelegramModule],
  controllers: [AdminController],
  providers: [AdminService, SmsService],
})
export class AdminModule {}