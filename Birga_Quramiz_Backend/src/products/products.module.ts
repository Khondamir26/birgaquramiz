import { Module } from '@nestjs/common'
import { SupabaseModule } from '../supabase/supabase.module'
import { ProductsService } from './products.service'
import { ProductsController } from './products.controller'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule, SupabaseModule],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule { }