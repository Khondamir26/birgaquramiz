import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { TrackingController } from './tracking.controller'
import { TrackingGateway } from './tracking.gateway'
import { TrackingService } from './tracking.service'
import { PrismaModule } from '../prisma/prisma.module'
import { WsJwtGuard } from './guards/ws-jwt.guard'

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
  ],
  controllers: [TrackingController],
  providers: [TrackingGateway, TrackingService, WsJwtGuard],
  exports: [TrackingService, TrackingGateway],
})
export class TrackingModule {}
