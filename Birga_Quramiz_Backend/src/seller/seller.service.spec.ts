import { Test, TestingModule } from '@nestjs/testing'
import { SellerService } from './seller.service'
import { PrismaService } from '../prisma/prisma.service'

describe('SellerService', () => {
  let service: SellerService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SellerService,
        { provide: PrismaService, useValue: {} },
      ],
    }).compile()

    service = module.get<SellerService>(SellerService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})