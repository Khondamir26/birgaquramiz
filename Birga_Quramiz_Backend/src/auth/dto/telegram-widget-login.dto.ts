import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator'

export class TelegramWidgetLoginDto {
  @IsNumber()
  id: number

  @IsString()
  @IsNotEmpty()
  first_name: string

  @IsOptional()
  @IsString()
  last_name?: string

  @IsOptional()
  @IsString()
  username?: string

  @IsOptional()
  @IsString()
  photo_url?: string

  @IsNumber()
  auth_date: number

  @IsString()
  @IsNotEmpty()
  hash: string
}
