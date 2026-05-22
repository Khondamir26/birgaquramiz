import type { Role } from '@prisma/client'

export type JwtPayload = {
  userId: string
  role: Role
  tokenId: string
}

export type AuthUser = {
  id: string
  name: string
  phone: string | null
  role: Role
  createdAt: Date
  tokenId?: string  // set by JwtStrategy; undefined in non-JWT contexts
}
