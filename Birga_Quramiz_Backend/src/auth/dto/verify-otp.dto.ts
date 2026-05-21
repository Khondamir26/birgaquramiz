import { IsString, IsNotEmpty, Length, IsOptional, MinLength } from 'class-validator'

export class VerifyOtpDto {
  @IsString()
  @IsNotEmpty()
  phone: string

  @IsString()
  @Length(6, 6)
  code: string

  // Only required on first login — frontend shows name prompt when isNewUser: true
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string
}
