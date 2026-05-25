import { BadRequestException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { AdminService } from './admin.service'
import { PrismaService } from '../prisma/prisma.service'
import { TelegramService } from '../telegram/telegram.service'
import { SmsService } from '../tracking/services/sms.service'

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
        findUnique: jest.fn(),
        count: jest.fn(),
      },
      category: {
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    }

    prisma.$transaction.mockResolvedValue([[], 0])

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: prisma },
        { provide: TelegramService, useValue: { sendMessage: jest.fn() } },
        { provide: SmsService, useValue: { send: jest.fn() } },
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

  it('creates a normalized category for admin editing flows', async () => {
    prisma.category.create.mockResolvedValue({ id: 'c1' })

    await service.createCategory({ name: ' Cement ', code: ' CEMENT ', slug: ' cement ' })

    expect(prisma.category.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ name: 'Cement', code: 'CEMENT', slug: 'cement' }),
    })
  })

  it('refuses to delete fulfilled orders that carry business history', async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: 'o1',
      status: 'DELIVERED',
      assignment: null,
      rating: null,
    })

    await expect(service.deleteOrder('o1')).rejects.toThrow('Only untouched new orders can be deleted')
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })
})
