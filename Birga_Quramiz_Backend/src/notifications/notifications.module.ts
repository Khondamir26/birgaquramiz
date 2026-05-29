import { Module, forwardRef } from '@nestjs/common'
import { NotificationsService } from './notifications.service'
import { NotificationsController } from './notifications.controller'
import { PrismaModule } from '../prisma/prisma.module'
import { TrackingModule } from '../tracking/tracking.module'

@Module({
  imports: [PrismaModule, forwardRef(() => TrackingModule)],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
