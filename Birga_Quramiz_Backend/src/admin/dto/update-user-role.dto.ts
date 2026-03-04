import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator'
import { Role } from '@prisma/client'

export class UpdateUserRoleDto {
  @IsEnum(Role)
  role!: Role

  @IsOptional()
  @IsString()
  @MaxLength(120)
  company?: string
}
