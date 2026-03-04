import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator'

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  readonly name: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  readonly phone: string

  @IsString()
  @MinLength(6)
  @MaxLength(128)
  readonly password: string
}
