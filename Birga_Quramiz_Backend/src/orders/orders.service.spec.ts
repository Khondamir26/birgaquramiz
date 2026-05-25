import { BadRequestException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { OrdersService } from './orders.service'
import { PrismaService } from '../prisma/prisma.service'
import { TelegramService } from '../telegram/telegram.service'
import { SmsService } from '../tracking/services/sms.service'

describe('OrdersService', () => {
  let service: OrdersService
  let prisma: any

  beforeEach(async () => {
    prisma = {
      seller: { findUnique: jest.fn() },
      product: { findMany: jest.fn(), updateMany: jest.fn() },
      order: { create: jest.fn() },
      orderItem: { createMany: jest.fn() },
      $transaction: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prisma },
        { provide: TelegramService, useValue: { sendMessage: jest.fn() } },
        { provide: SmsService, useValue: { send: jest.fn() } },
      ],
    }).compile()

    service = module.get<OrdersService>(OrdersService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('rejects order creation for non-USER roles', async () => {
    await expect(
      service.create({ id: 'u1', role: 'ADMIN', name: 'Test', phone: null, createdAt: new Date() }, { items: [] } as any),
    ).rejects.toThrow(BadRequestException)
  })

  it('creates guest order', async () => {
    const payload: any = {
      items: [{ productId: 'p1', quantity: 2 }],
      customerName: 'Guest User',
      customerPhone: '+998901112233',
      deliveryType: 'PICKUP',
      paymentMethod: 'CASH',
    }

    const product = {
      id: 'p1',
      price: 100,
      stock: 5,
      status: 'APPROVED',
      sellerId: 's1',
      seller: { id: 's1' },
    }

    const createdOrder = { id: 'o1', total: 200 }

    prisma.$transaction.mockImplementation(async (cb: any) =>
      cb({
        seller: { findUnique: jest.fn().mockResolvedValue(null) },
        product: {
          findMany: jest.fn().mockResolvedValue([product]),
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
        order: { create: jest.fn().mockResolvedValue(createdOrder) },
        orderItem: { createMany: jest.fn().mockResolvedValue({ count: 1 }) },
      }),
    )

    const result = await service.createGuest(payload)
    expect(result).toEqual(createdOrder)
  })
})
