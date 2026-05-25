import { BadRequestException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { ProductsController } from './products.controller'
import { ProductsService } from './products.service'
import { UploadService } from '../upload/upload.service'

describe('ProductsController', () => {
  let controller: ProductsController
  let service: { create: jest.Mock }
  let uploadService: { uploadProductImage: jest.Mock }

  beforeEach(async () => {
    service = { create: jest.fn() }
    uploadService = { uploadProductImage: jest.fn() }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        { provide: ProductsService, useValue: service },
        { provide: UploadService, useValue: uploadService },
      ],
    }).compile()

    controller = module.get<ProductsController>(ProductsController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('throws when image file is missing on create', async () => {
    const req = { user: { id: 'u1' } }
    await expect(controller.create({ name: 'Cement' } as any, req as any, undefined)).rejects.toThrow(
      BadRequestException,
    )
  })

  it('passes uploaded image path to service', async () => {
    service.create.mockResolvedValue({ id: 'p1' })
    uploadService.uploadProductImage.mockResolvedValue('/uploads/products/x.png')

    const req = { user: { id: 'u1' } }
    await controller.create(
      { name: 'Cement' } as any,
      req as any,
      [{ filename: 'x.png' }] as any,
    )

    expect(service.create).toHaveBeenCalledWith(
      expect.objectContaining({ imageUrls: ['/uploads/products/x.png'] }),
      { id: 'u1' },
    )
  })
})
