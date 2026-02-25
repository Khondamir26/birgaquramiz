import { BadRequestException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { ProductsController } from './products.controller'
import { ProductsService } from './products.service'

describe('ProductsController', () => {
  let controller: ProductsController
  let service: { create: jest.Mock }

  beforeEach(async () => {
    service = { create: jest.fn() }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [{ provide: ProductsService, useValue: service }],
    }).compile()

    controller = module.get<ProductsController>(ProductsController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('throws when image file is missing on create', () => {
    expect(() => controller.create({ name: 'Cement' } as any, { user: { id: 'u1' } } as any, undefined)).toThrow(
      BadRequestException,
    )
  })

  it('passes uploaded image path to service', async () => {
    service.create.mockResolvedValue({ id: 'p1' })

    await controller.create(
      { name: 'Cement' } as any,
      { user: { id: 'u1' } } as any,
      { filename: 'x.png' },
    )

    expect(service.create).toHaveBeenCalledWith(
      expect.objectContaining({ imageUrl: '/uploads/products/x.png' }),
      { id: 'u1' },
    )
  })
})
