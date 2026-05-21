import { IsString, IsNotEmpty } from 'class-validator'

export class TelegramLinkContactDto {
  @IsString()
  @IsNotEmpty()
  pendingToken: string

  @IsString()
  @IsNotEmpty()
  phone: string
}
