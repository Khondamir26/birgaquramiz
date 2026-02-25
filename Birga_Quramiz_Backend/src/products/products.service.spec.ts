import { BadRequestException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { ProductsService } from './products.service'
import { PrismaService } from '../prisma/prisma.service'

describe('ProductsService', () => {
  let service: ProductsService
  let prisma: any

  beforeEach(async () => {
    prisma = {
      seller: { findUnique: jest.fn() },
      product: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      orderItem: { count: jest.fn() },
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile()

    service = module.get<ProductsService>(ProductsService)
  })

  it('rejects delete when product has order history', async () => {
    prisma.seller.findUnique.mockResolvedValue({ id: 's1' })
    prisma.product.findFirst.mockResolvedValue({ id: 'p1', sellerId: 's1' })
    prisma.orderItem.count.mockResolvedValue(2)

    await expect(service.deleteMyProduct('p1', { id: 'u1' })).rejects.toThrow(BadRequestException)
  })

  it('reject method throws when product not found', async () => {
    prisma.product.findUnique.mockResolvedValue(null)
    await expect(service.reject('missing')).rejects.toThrow(NotFoundException)
  })
})
