import { IsString, IsOptional, IsUUID } from 'class-validator'

export class CreateAssignmentDto {
  @IsUUID()
  orderId: string

  @IsUUID()
  driverId: string

  @IsOptional()
  @IsString()
  note?: string
}
