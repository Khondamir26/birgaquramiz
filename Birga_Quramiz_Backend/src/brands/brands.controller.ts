import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { BrandsService } from './brands.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller()
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Get('brands')
  findAll() {
    return this.brandsService.findAll();
  }

  @Get('brands/:slug')
  findOne(@Param('slug') slug: string) {
    return this.brandsService.findOne(slug);
  }

  @Post('admin/brands')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  create(@Body() createBrandDto: any) {
    return this.brandsService.create({
      name: createBrandDto.name,
      slug: createBrandDto.slug,
      logoUrl: createBrandDto.logoUrl,
      website: createBrandDto.website,
      description: createBrandDto.description,
      featured: createBrandDto.featured,
    });
  }

  @Patch('admin/brands/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() updateBrandDto: any) {
    return this.brandsService.update(id, updateBrandDto);
  }

  @Delete('admin/brands/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.brandsService.remove(id);
  }
}
