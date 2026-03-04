import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

const DEFAULT_CATEGORIES = [
  { name: 'Cement', code: 'CEM' },
  { name: 'Brick', code: 'BRK' },
  { name: 'Tile', code: 'TIL' },
  { name: 'Paint', code: 'PNT' },
  { name: 'Wood', code: 'WOD' },
  { name: 'Metal', code: 'MTL' },
  { name: 'Pipe', code: 'PIP' },
  { name: 'Electric', code: 'ELC' },
  { name: 'Tool', code: 'TOL' },
  { name: 'General', code: 'GEN' },
]

@Injectable()
export class CategoriesService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedDefaults()
  }

  private async seedDefaults() {
    for (const cat of DEFAULT_CATEGORIES) {
      await this.prisma.category.upsert({
        where: { code: cat.code },
        update: {},
        create: cat,
      })
    }
  }

  async findAll() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        code: true,
        parentId: true,
        parent: { select: { id: true, name: true } },
      },
    })
  }

  async findById(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        code: true,
        parentId: true,
        parent: { select: { id: true, name: true } },
      },
    })

    if (!category) {
      throw new NotFoundException('Category not found')
    }

    return category
  }
}