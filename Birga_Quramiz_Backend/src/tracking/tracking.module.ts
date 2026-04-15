import { Module, OnModuleInit } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ScheduleModule } from '@nestjs/schedule'
import { TrackingController } from './tracking.controller'
import { TrackingGateway } from './tracking.gateway'
import { TrackingService } from './tracking.service'
import { FraudService } from './services/fraud.service'
import { AlertService } from './services/alert.service'
import { DriverRecommendationService } from './services/driver-recommendation.service'
import { OtpService } from './services/otp.service'
import { LocationHistoryService } from './services/location-history.service'
import { PodPhotoService } from './services/pod-photo.service'
import { MapsModule } from '../maps/maps.module'
import { PrismaModule } from '../prisma/prisma.module'
import { UploadModule } from '../upload/upload.module'
import { WsJwtGuard } from './guards/ws-jwt.guard'

@Module({
  imports: [
    PrismaModule,
    UploadModule,
    MapsModule,
    ScheduleModule.forRoot(),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
  ],
  controllers: [TrackingController],
  providers: [
    TrackingGateway,
    TrackingService,
    FraudService,
    AlertService,
    DriverRecommendationService,
    OtpService,
    LocationHistoryService,
    PodPhotoService,
    WsJwtGuard,
  ],
  exports: [TrackingService, TrackingGateway, FraudService],
})
export class TrackingModule implements OnModuleInit {
  constructor(
    private readonly gateway: TrackingGateway,
    private readonly alertService: AlertService,
  ) {}

  /** Wire gateway into AlertService after both are initialized */
  onModuleInit() {
    this.alertService.setGateway(this.gateway)
  }
}
