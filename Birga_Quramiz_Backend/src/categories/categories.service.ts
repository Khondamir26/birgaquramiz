import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

const categorySelect = {
  id: true,
  name: true,
  nameEn: true,
  nameUz: true,
  code: true,
  slug: true,
  parentId: true,
  parent: { select: { id: true, name: true, nameEn: true, nameUz: true, slug: true } },
} as const

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: categorySelect,
    })
  }

  async findParents() {
    return this.prisma.category.findMany({
      where: { parentId: null },
      orderBy: { name: 'asc' },
      select: categorySelect,
    })
  }

  async findChildren(parentId: string) {
    return this.prisma.category.findMany({
      where: { parentId },
      orderBy: { name: 'asc' },
      select: categorySelect,
    })
  }

  async findById(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      select: categorySelect,
    })

    if (!category) throw new NotFoundException('Category not found')
    return category
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      select: categorySelect,
    })

    if (!category) throw new NotFoundException('Category not found')
    return category
  }
}
