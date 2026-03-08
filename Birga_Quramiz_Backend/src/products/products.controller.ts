import {
  Controller,
  Post,
  Body,
  Get,
  Req,
  UseGuards,
  Param,
  Query,
  Patch,
  Delete,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { extname, join } from 'path'
import type { Request } from 'express'
import { UploadService } from '../upload/upload.service'
import { ProductsService } from './products.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RolesGuard } from '../auth/roles.guard'
import { Roles } from '../auth/roles.decorator'
import { CreateProductDto } from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'
import type { AuthUser } from '../auth/auth.types'

type AuthedRequest = Request & { user: AuthUser }

const multerStorage = diskStorage({
  destination: join(process.cwd(), 'uploads', 'products'),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `${uniqueSuffix}${extname(file.originalname)}`)
  },
})

const imageFileFilter = (_req: unknown, file: { mimetype: string }, cb: (error: Error | null, acceptFile: boolean) => void) => {
  if (!file.mimetype.startsWith('image/')) {
    cb(new Error('Only image files are allowed'), false)
    return
  }
  cb(null, true)
}

@Controller('products')
export class ProductsController {
  constructor(
    private productsService: ProductsService,
    private uploadService: UploadService,
  ) { }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: multerStorage,
      fileFilter: imageFileFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async create(@Body() body: CreateProductDto, @Req() req: AuthedRequest, @UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Product image is required')
    }

    const imageUrl = this.uploadService.uploadProductImage(file)

    return this.productsService.create({ ...body, imageUrl }, req.user)
  }

  @Get()
  getApproved(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('q') q?: string,
    @Query('categoryId') categoryId?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('sortBy') sortBy?: string,
  ) {
    return this.productsService.getApproved(
      Number(page),
      Number(limit),
      q,
      categoryId,
      minPrice ? Number(minPrice) : undefined,
      maxPrice ? Number(maxPrice) : undefined,
      sortBy
    )
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @Get('seller/my')
  getMyProducts(@Req() req: AuthedRequest) {
    return this.productsService.getMyProducts(req.user)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @Get('seller/my/:id')
  getMyProductById(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.productsService.getMyProductById(id, req.user)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @Patch('seller/my/:id')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: multerStorage,
      fileFilter: imageFileFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async updateMyProduct(
    @Param('id') id: string,
    @Body() body: UpdateProductDto,
    @Req() req: AuthedRequest,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let imageUrl: string | undefined

    if (file) {
      imageUrl = this.uploadService.uploadProductImage(file)
    }

    const payload = imageUrl ? { ...body, imageUrl } : body
    return this.productsService.updateMyProduct(id, payload, req.user)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @Patch('seller/my/:id/visibility')
  updateMyProductVisibility(
    @Param('id') id: string,
    @Body('active') active: boolean,
    @Req() req: AuthedRequest,
  ) {
    return this.productsService.setMyProductVisibility(id, Boolean(active), req.user)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @Delete('seller/my/:id')
  deleteMyProduct(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.productsService.deleteMyProduct(id, req.user)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @Post('seller/my/:id/request-deletion')
  requestDeletion(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Req() req: AuthedRequest,
  ) {
    if (!reason?.trim()) {
      throw new BadRequestException('Deletion reason is required')
    }
    return this.productsService.requestProductDeletion(id, req.user, reason.trim())
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin/pending')
  getPending() {
    return this.productsService.getPending()
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('admin/approve/:id')
  approve(@Param('id') id: string) {
    return this.productsService.approve(id)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('admin/reject/:id')
  reject(@Param('id') id: string) {
    return this.productsService.reject(id)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin/deletion-requests')
  getDeletionRequests() {
    return this.productsService.getDeletionRequests()
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('admin/deletion-requests/:id/approve')
  approveDeletionRequest(@Param('id') id: string) {
    return this.productsService.approveDeletionRequest(id)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('admin/deletion-requests/:id/reject')
  rejectDeletionRequest(@Param('id') id: string) {
    return this.productsService.rejectDeletionRequest(id)
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.productsService.getById(id)
  }
}