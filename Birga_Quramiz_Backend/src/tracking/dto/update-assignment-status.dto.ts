import { IsEnum, IsUUID } from 'class-validator'
import { AssignmentStatus } from '@prisma/client'

const ALLOWED = [
  AssignmentStatus.ACCEPTED,
  AssignmentStatus.PICKED_UP,
  AssignmentStatus.DELIVERED,
  AssignmentStatus.CANCELLED,
] as const

export class UpdateAssignmentStatusDto {
  @IsUUID()
  assignmentId: string

  @IsEnum(ALLOWED)
  status: (typeof ALLOWED)[number]
}
