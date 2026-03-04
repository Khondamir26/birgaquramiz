import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator'

export class RegisterSellerDto {
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

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  readonly company: string
}
