import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PrismaModule } from '../prisma/prisma.module';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
    imports: [PrismaModule, TelegramModule],
    controllers: [PaymentsController],
    providers: [PaymentsService],
})
export class PaymentsModule { }
