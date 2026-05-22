import { IsString, IsNotEmpty, Length } from 'class-validator'

export class TelegramOtpVerifyDto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  otp: string
}
