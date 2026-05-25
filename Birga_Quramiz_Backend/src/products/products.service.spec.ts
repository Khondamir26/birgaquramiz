import { BadRequestException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { ProductsService } from './products.service'
import { PrismaService } from '../prisma/prisma.service'
import { UploadService } from '../upload/upload.service'

describe('ProductsService', () => {
  let service: ProductsService
  let prisma: any

  beforeEach(async () => {
    prisma = {
      seller: { upsert: jest.fn() },
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
        { provide: UploadService, useValue: { deleteProductImage: jest.fn() } },
      ],
    }).compile()

    service = module.get<ProductsService>(ProductsService)
  })

  it('rejects direct delete for approved products', async () => {
    prisma.seller.upsert.mockResolvedValue({ id: 's1' })
    prisma.product.findFirst.mockResolvedValue({
      id: 'p1',
      sellerId: 's1',
      status: 'APPROVED',
      images: [],
      imageUrl: null,
    })

    await expect(service.deleteMyProduct('p1', { id: 'u1', role: 'SELLER', name: 'Test', phone: null, createdAt: new Date() })).rejects.toThrow(BadRequestException)
  })

  it('reject method throws when product not found', async () => {
    prisma.product.findUnique.mockResolvedValue(null)
    await expect(service.reject('missing')).rejects.toThrow(NotFoundException)
  })
})
