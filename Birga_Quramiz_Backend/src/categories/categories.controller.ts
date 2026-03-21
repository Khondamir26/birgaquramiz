import { Controller, Get, Param } from '@nestjs/common'
import { CategoriesService } from './categories.service'

@Controller('categories')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Get()
  findAll() {
    return this.categoriesService.findAll()
  }

  @Get('parents')
  findParents() {
    return this.categoriesService.findParents()
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug)
  }

  @Get(':id/children')
  findChildren(@Param('id') id: string) {
    return this.categoriesService.findChildren(id)
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.categoriesService.findById(id)
  }
}
