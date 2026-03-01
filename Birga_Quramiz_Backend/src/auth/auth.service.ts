import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import * as bcrypt from 'bcrypt'
import { JwtService } from '@nestjs/jwt'

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(name: string, phone: string, password: string) {
    const existing = await this.prisma.user.findUnique({
      where: { phone },
    })

    if (existing) {
      throw new BadRequestException('User already exists')
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await this.prisma.user.create({
      data: {
        name,
        phone,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    })

    return {
      message: 'User created',
      user,
    }
  }

  async login(phone: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { phone },
    })

    if (!user) {
      throw new BadRequestException('Invalid credentials')
    }

    const valid = await bcrypt.compare(password, user.password)

    if (!valid) {
      throw new BadRequestException('Invalid credentials')
    }

    const token = this.jwt.sign({
      userId: user.id,
      role: user.role,
    })

    return { token }
  }
}