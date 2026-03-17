import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.brand.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(slug: string) {
    const brand = await this.prisma.brand.findUnique({
      where: { slug },
    });
    if (!brand) throw new NotFoundException('Brand not found');
    return brand;
  }

  async create(data: { name: string; slug: string; logoUrl?: string; website?: string; description?: string; featured?: boolean }) {
    const existing = await this.prisma.brand.findUnique({ where: { slug: data.slug } });
    if (existing) {
      throw new BadRequestException('Brand with this slug already exists');
    }
    return this.prisma.brand.create({
      data,
    });
  }

  async update(id: string, data: any) {
    const brand = await this.prisma.brand.findUnique({ where: { id } });
    if (!brand) throw new NotFoundException('Brand not found');

    if (data.slug && data.slug !== brand.slug) {
      const existing = await this.prisma.brand.findUnique({ where: { slug: data.slug } });
      if (existing) {
        throw new BadRequestException('Brand with this slug already exists');
      }
    }

    return this.prisma.brand.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    const brand = await this.prisma.brand.findUnique({ where: { id } });
    if (!brand) throw new NotFoundException('Brand not found');

    return this.prisma.brand.delete({
      where: { id },
    });
  }
}
