import { BadRequestException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { AdminService } from './admin.service'
import { PrismaService } from '../prisma/prisma.service'

describe('AdminService', () => {
  let service: AdminService
  let prisma: any

  beforeEach(async () => {
    prisma = {
      user: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      order: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn(),
    }

    prisma.$transaction.mockResolvedValue([[], 0])

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile()

    service = module.get<AdminService>(AdminService)
  })

  it('throws on invalid order status filter', async () => {
    await expect(service.getOrders(1, 20, 'INVALID' as any)).rejects.toThrow(BadRequestException)
  })

  it('passes role and q filters to users query', async () => {
    await service.getUsers(1, 20, 'SELLER', 'ali')

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          role: 'SELLER',
          OR: expect.any(Array),
        }),
      }),
    )
  })
})
