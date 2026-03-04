import type { Role } from '@prisma/client'

export type JwtPayload = {
  userId: string
  role: Role
  tokenId: string
}

export type AuthUser = {
  id: string
  name: string
  phone: string
  role: Role
  createdAt: Date
}
