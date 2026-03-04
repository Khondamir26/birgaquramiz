import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator'

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  readonly currentPassword: string

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(128)
  readonly newPassword: string
}
