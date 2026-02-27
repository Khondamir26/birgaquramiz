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
import { memoryStorage } from 'multer'
import { SupabaseService } from '../supabase/supabase.service'
import { ProductsService } from './products.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RolesGuard } from '../auth/roles.guard'
import { Roles } from '../auth/roles.decorator'
import { CreateProductDto } from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'

const multerStorage = memoryStorage()

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
    private supabaseService: SupabaseService,
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
  async create(@Body() body: CreateProductDto, @Req() req: any, @UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Product image is required')
    }

    const imageUrl = await this.supabaseService.uploadProductImage(file)

    return this.productsService.create({ ...body, imageUrl }, req.user)
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
  async updateMyProduct(
    @Param('id') id: string,
    @Body() body: UpdateProductDto,
    @Req() req: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let imageUrl: string | undefined

    if (file) {
      imageUrl = await this.supabaseService.uploadProductImage(file)
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

