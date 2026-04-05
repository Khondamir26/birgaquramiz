import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import type { Socket } from 'socket.io'
import { PrismaService } from '../../prisma/prisma.service'
import type { JwtPayload } from '../../auth/auth.types'

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient()
    const token = this.extractToken(client)

    if (!token) throw new UnauthorizedException('No token')

    let payload: JwtPayload
    try {
      payload = this.jwtService.verify<JwtPayload>(token, {
        secret: process.env.JWT_SECRET,
      })
    } catch {
      throw new UnauthorizedException('Invalid token')
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, phone: true, role: true, createdAt: true },
    })

    if (!user) throw new UnauthorizedException('User not found')

    // Attach user to socket data so gateway handlers can read it
    client.data.user = user
    return true
  }

  private extractToken(client: Socket): string | null {
    // 1. Authorization header
    const authHeader = client.handshake.headers?.authorization
    if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7)

    // 2. Handshake auth object (mobile app)
    const authToken = client.handshake.auth?.token as string | undefined
    if (authToken) return authToken

    // 3. Cookie (dispatcher web — httpOnly cookie sent via withCredentials)
    const cookieHeader = client.handshake.headers?.cookie as string | undefined
    if (cookieHeader) {
      const match = cookieHeader.match(/(?:^|;\s*)access_token=([^;]+)/)
      if (match) return decodeURIComponent(match[1])
    }

    return null
  }
}
