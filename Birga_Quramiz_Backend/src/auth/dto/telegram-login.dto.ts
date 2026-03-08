import { IsNotEmpty, IsString } from 'class-validator';

export class TelegramLoginDto {
    @IsNotEmpty()
    @IsString()
    initData: string;
}
