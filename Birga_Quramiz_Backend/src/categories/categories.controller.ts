import { Controller, Get, Param } from '@nestjs/common'
import { CategoriesService } from './categories.service'

@Controller('categories')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Get()
  findAll() {
    return this.categoriesService.findAll()
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.categoriesService.findById(id)
  }
}