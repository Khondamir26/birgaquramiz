import { Controller, Post, Body, Headers, HttpCode } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Post('payme')
    @HttpCode(200)
    async paymeWebhook(@Body() body: any, @Headers('authorization') authHeader: string) {
        return this.paymentsService.handlePayme(body, authHeader);
    }

    @Post('click')
    @HttpCode(200)
    async clickWebhook(@Body() body: any) {
        return this.paymentsService.handleClick(body);
    }
}
