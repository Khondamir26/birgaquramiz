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
import { ProductsService } from './products.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RolesGuard } from '../auth/roles.guard'
import { Roles } from '../auth/roles.decorator'
import { CreateProductDto } from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'

const toImagePath = (file?: { filename?: string } | null) => {
  if (!file?.filename) return undefined
  return `/uploads/products/${file.filename}`
}

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
  constructor(private productsService: ProductsService) {}

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
  create(@Body() body: CreateProductDto, @Req() req: any, @UploadedFile() file?: { filename?: string }) {
    const imagePath = toImagePath(file)
    if (!imagePath) {
      throw new BadRequestException('Product image is required')
    }

    return this.productsService.create({ ...body, imageUrl: imagePath }, req.user)
  }

  @Get()
  getApproved(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('q') q?: string,
  ) {
    return this.productsService.getApproved(Number(page), Number(limit), q)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @Get('seller/my')
  getMyProducts(@Req() req: any) {
    return this.productsService.getMyProducts(req.user)
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
  updateMyProduct(
    @Param('id') id: string,
    @Body() body: UpdateProductDto,
    @Req() req: any,
    @UploadedFile() file?: { filename?: string },
  ) {
    const imagePath = toImagePath(file)
    const payload = imagePath ? { ...body, imageUrl: imagePath } : body
    return this.productsService.updateMyProduct(id, payload, req.user)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @Patch('seller/my/:id/visibility')
  updateMyProductVisibility(
    @Param('id') id: string,
    @Body('active') active: boolean,
    @Req() req: any,
  ) {
    return this.productsService.setMyProductVisibility(id, Boolean(active), req.user)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @Delete('seller/my/:id')
  deleteMyProduct(@Param('id') id: string, @Req() req: any) {
    return this.productsService.deleteMyProduct(id, req.user)
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

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.productsService.getById(id)
  }
}

