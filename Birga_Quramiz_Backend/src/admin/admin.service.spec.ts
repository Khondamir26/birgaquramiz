import { BadRequestException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { AdminService } from './admin.service'
import { PrismaService } from '../prisma/prisma.service'
import { TelegramService } from '../telegram/telegram.service'
import { SmsService } from '../tracking/services/sms.service'

describe('AdminService', () => {
  let service: AdminService
  let prisma: any
  let emitter: jest.Mocked<Pick<EventEmitter2, 'emit'>>

  beforeEach(async () => {
    prisma = {
      user: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue({}),
      },
      order: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
      },
      seller: {
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
        delete: jest.fn().mockResolvedValue({}),
      },
      product: {
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
      moderationLog: {
        create: jest.fn().mockResolvedValue({}),
      },
      category: {
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    }

    prisma.$transaction.mockImplementation(async (arg: any) => {
      if (typeof arg === 'function') return arg(prisma)
      return Promise.all(arg)
    })
    emitter = { emit: jest.fn() }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: prisma },
        { provide: TelegramService, useValue: { sendMessage: jest.fn() } },
        { provide: SmsService, useValue: { send: jest.fn() } },
        { provide: EventEmitter2, useValue: emitter },
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

  describe('product moderation notifications', () => {
    const product = {
      id: 'p1',
      name: 'Cement M500',
      seller: { user: { id: 'u-seller' } },
    }

    beforeEach(() => {
      prisma.product.findUnique.mockResolvedValue(product)
      prisma.$transaction.mockResolvedValue([{}, {}])
    })

    it('emits product.moderated APPROVED after approveProduct', async () => {
      await service.approveProduct('p1', 'admin1')

      expect(emitter.emit).toHaveBeenCalledWith(
        'product.moderated',
        expect.objectContaining({
          productId: 'p1',
          productName: 'Cement M500',
          sellerUserId: 'u-seller',
          status: 'APPROVED',
          reason: undefined,
        }),
      )
    })

    it('emits product.moderated REJECTED with reason after rejectProduct', async () => {
      await service.rejectProduct('p1', 'admin1', 'Low quality photos')

      expect(emitter.emit).toHaveBeenCalledWith(
        'product.moderated',
        expect.objectContaining({
          productId: 'p1',
          productName: 'Cement M500',
          sellerUserId: 'u-seller',
          status: 'REJECTED',
          reason: 'Low quality photos',
        }),
      )
    })
  })

  describe('seller status notifications', () => {
    const seller = {
      id: 's1',
      userId: 'u-seller',
      company: 'Best Build LLC',
      _count: { products: 0 },
      user: { id: 'u-seller', name: 'Alisher' },
    }

    beforeEach(() => {
      prisma.seller.findUnique.mockResolvedValue(seller)
      prisma.$transaction.mockResolvedValue([{}, {}])
    })

    it('emits seller.status_changed APPROVED after verifySeller', async () => {
      await service.verifySeller('s1')

      expect(emitter.emit).toHaveBeenCalledWith(
        'seller.status_changed',
        expect.objectContaining({
          sellerUserId: 'u-seller',
          company: 'Best Build LLC',
          status: 'APPROVED',
        }),
      )
    })

    it('emits seller.status_changed REJECTED after rejectSeller', async () => {
      await service.rejectSeller('s1')

      expect(emitter.emit).toHaveBeenCalledWith(
        'seller.status_changed',
        expect.objectContaining({
          sellerUserId: 'u-seller',
          company: 'Best Build LLC',
          status: 'REJECTED',
        }),
      )
    })
  })
})
