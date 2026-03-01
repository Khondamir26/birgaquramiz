import { Module } from '@nestjs/common'
import { UploadModule } from '../upload/upload.module'
import { ProductsService } from './products.service'
import { ProductsController } from './products.controller'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule, UploadModule],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule { }