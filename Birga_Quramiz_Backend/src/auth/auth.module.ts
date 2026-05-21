import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ScheduleModule } from '@nestjs/schedule'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { PrismaModule } from '../prisma/prisma.module'
import { JwtStrategy } from './jwt.strategy'
import { RolesGuard } from './roles.guard'
import { SmsService } from '../tracking/services/sms.service'
import { TelegramModule } from '../telegram/telegram.module'
import { SessionCleanupService } from './session-cleanup.service'

function requiredEnv(name: string) {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`${name} environment variable is required`)
  }
  return value
}

const jwtSecret = requiredEnv('JWT_SECRET')

@Module({
  imports: [
    PrismaModule,
    TelegramModule,
    ScheduleModule.forRoot(),
    JwtModule.register({
      secret: jwtSecret,
      signOptions: { expiresIn: '15m' },
    }),
  ],
  providers: [AuthService, JwtStrategy, RolesGuard, SmsService, SessionCleanupService],
  controllers: [AuthController],
})
export class AuthModule { }
