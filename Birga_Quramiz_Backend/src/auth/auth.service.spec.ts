import { Test, TestingModule } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import { AuthService } from './auth.service'
import { PrismaService } from '../prisma/prisma.service'
import { SmsService } from '../tracking/services/sms.service'
import { TelegramService } from '../telegram/telegram.service'

describe('AuthService', () => {
  let service: AuthService
  let module: TestingModule

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: {} },
        { provide: JwtService, useValue: { sign: jest.fn() } },
        { provide: SmsService, useValue: { send: jest.fn() } },
        { provide: TelegramService, useValue: { sendMessage: jest.fn() } },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
  })

  afterEach(async () => {
    await module.close()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
