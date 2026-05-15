import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
    private readonly logger = new Logger(PaymentsService.name);

    // You should store these in your .env file
    private readonly PAYME_MERCHANT_KEY = process.env.PAYME_MERCHANT_KEY ?? 'mock-payme-secret-key';
    private readonly CLICK_SECRET_KEY = process.env.CLICK_SECRET_KEY ?? 'mock-click-secret-key';
    private readonly CLICK_SERVICE_ID = process.env.CLICK_SERVICE_ID ?? 'mock-service-id';

    constructor(
        private prisma: PrismaService,
        private telegramService: TelegramService,
    ) { }

    // -------------------------------------------------------------
    // CLICK WEBHOOK IMPLEMENTATION
    // -------------------------------------------------------------
    async handleClick(body: any) {
        const {
            click_trans_id,
            service_id,
            merchant_trans_id,
            merchant_prepare_id,
            amount,
            action,
            error,
            error_note,
            sign_time,
            sign_string,
        } = body;

        // 1. Validate Click Signature
        const myString = `${click_trans_id}${service_id}${this.CLICK_SECRET_KEY}${merchant_trans_id}${merchant_prepare_id || ''}${amount}${action}${sign_time}`;
        const myHash = crypto.createHash('md5').update(myString).digest('hex');

        const hashBuf = Buffer.from(myHash);
        const signBuf = Buffer.from((sign_string ?? '').padEnd(hashBuf.length, '\0').slice(0, hashBuf.length));
        const signOk  = hashBuf.length === signBuf.length && crypto.timingSafeEqual(hashBuf, signBuf);
        if (!signOk) {
            return { error: -1, error_note: 'Sign check error' };
        }

        // Prepare Request (Action 0)
        if (action === '0') {
            const order = await this.prisma.order.findUnique({ where: { id: merchant_trans_id } });
            if (!order) return { error: -5, error_note: 'Order not found' };
            if (order.status !== 'NEW') return { error: -4, error_note: 'Already paid or cancelled' };
            if (Math.abs(order.total - parseFloat(amount)) > 0.1) return { error: -2, error_note: 'Incorrect amount' };

            return {
                click_trans_id,
                merchant_trans_id,
                merchant_prepare_id: order.id,
                error: 0,
                error_note: 'Success',
            };
        }

        // Complete Request (Action 1)
        if (action === '1') {
            const order = await this.prisma.order.findUnique({
                where: { id: merchant_trans_id },
                include: { user: true }
            });
            if (!order) return { error: -5, error_note: 'Order not found' };

            if (order.status === 'NEW') {
                // Success! Mark as PAID
                await this.prisma.order.update({
                    where: { id: order.id },
                    data: { status: 'PAID' }
                });

                if (order.user?.telegramId) {
                    const text = `✅ *Payment Received*\n\nOrder #${order.id.slice(0, 8)} has been successfully paid via Click.\n\nWe will begin processing it shortly!`;
                    this.telegramService.sendMessage(order.user.telegramId, text).catch(e => this.logger.error(e));
                }
            }

            return {
                click_trans_id,
                merchant_trans_id,
                merchant_confirm_id: order.id,
                error: 0,
                error_note: 'Success',
            };
        }

        return { error: -3, error_note: 'Action not found' };
    }

    // -------------------------------------------------------------
    // PAYME WEBHOOK IMPLEMENTATION (Simplified JSON-RPC)
    // -------------------------------------------------------------
    async handlePayme(body: any, authHeader: string) {
        if (!authHeader || !authHeader.startsWith('Basic ')) {
            return this.paymeError(body.id, -32504, 'Auth failed');
        }

        const token = authHeader.split(' ')[1];
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const [login, password] = decoded.split(':');

        const keyBuf = Buffer.from(this.PAYME_MERCHANT_KEY);
        const pwBuf  = Buffer.from(password.padEnd(keyBuf.length, '\0').slice(0, keyBuf.length));
        const authOk = login === 'Paycom' &&
          keyBuf.length === pwBuf.length &&
          crypto.timingSafeEqual(keyBuf, pwBuf);
        if (!authOk) {
            return this.paymeError(body.id, -32504, 'Auth failed');
        }

        const { method, params, id } = body;

        switch (method) {
            case 'CheckPerformTransaction':
                return this.paymeCheckPerformTransaction(params, id);
            case 'CreateTransaction':
            case 'PerformTransaction':
                return this.paymePerformTransaction(params, id);
            case 'CancelTransaction':
                return this.paymeCancelTransaction(params, id);
            case 'CheckTransaction':
                return this.paymeCheckTransaction(params, id);
            case 'GetStatement':
                return { result: { transactions: [] } };
            default:
                return this.paymeError(id, -32601, 'Method not found');
        }
    }

    private async paymeCheckPerformTransaction(params: any, id: number) {
        const orderId = params.account?.order_id;
        if (!orderId) return this.paymeError(id, -31050, 'Account not found');

        const order = await this.prisma.order.findUnique({ where: { id: orderId } });
        if (!order) return this.paymeError(id, -31050, 'Order not found');
        if (order.status !== 'NEW') return this.paymeError(id, -31008, 'Order already paid or cancelled');

        // Payme sends amount in tiyins (cents). UZS 10,000 = 1,000,000 params.amount
        const UZSamount = params.amount / 100;
        if (Math.abs(order.total - UZSamount) > 0.1) return this.paymeError(id, -31001, 'Incorrect amount');

        return {
            result: {
                allow: true
            }
        };
    }

    private async paymePerformTransaction(params: any, id: number) {
        // In a real robust implementation, CreateTransaction would create an intermediate "Transaction" row
        // PerformTransaction would then finalize it. Here we simplify to directly approving it.
        const orderId = params.account?.order_id;
        const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { user: true } });

        if (!order) return this.paymeError(id, -31050, 'Order not found');

        if (order.status === 'NEW') {
            await this.prisma.order.update({
                where: { id: order.id },
                data: { status: 'PAID' }
            });

            if (order.user?.telegramId) {
                const text = `✅ *Payment Received*\n\nOrder #${order.id.slice(0, 8)} has been successfully paid via Payme.\n\nWe will begin processing it shortly!`;
                this.telegramService.sendMessage(order.user.telegramId, text).catch(e => this.logger.error(e));
            }
        }

        return {
            result: {
                transaction: "payme_trx_" + order.id,
                perform_time: new Date().getTime(),
                state: 2 // State 2 = Done
            }
        }
    }

    private async paymeCancelTransaction(params: any, id: number) {
        const orderId = params.account?.order_id;
        const order = await this.prisma.order.findUnique({ where: { id: orderId } });

        if (!order) return this.paymeError(id, -31050, 'Order not found');

        const cancelTime = Date.now();

        if (order.status === 'PAID') {
            // Already paid — cannot cancel without a refund flow
            return this.paymeError(id, -31008, 'Order already completed, cannot cancel');
        }

        if (order.status === 'CANCELLED') {
            // Already cancelled — idempotent success
            return { result: { transaction: `payme_trx_${order.id}`, cancel_time: cancelTime, state: -1 } };
        }

        // Cancel the pending order
        await this.prisma.order.update({ where: { id: order.id }, data: { status: 'CANCELLED' } });

        return { result: { transaction: `payme_trx_${order.id}`, cancel_time: cancelTime, state: -1 } };
    }

    private async paymeCheckTransaction(params: any, id: number) {
        const orderId = params.account?.order_id;
        const order = await this.prisma.order.findUnique({ where: { id: orderId } });

        if (!order) return this.paymeError(id, -31050, 'Order not found');

        const stateMap: Record<string, number> = {
            NEW:       1,  // pending
            PAID:      2,  // completed
            CANCELLED: -1, // cancelled before completion
        };
        const state = stateMap[order.status] ?? -1;

        return {
            result: {
                transaction:  `payme_trx_${order.id}`,
                create_time:  order.createdAt.getTime(),
                perform_time: order.status === 'PAID' ? order.updatedAt.getTime() : 0,
                cancel_time:  order.status === 'CANCELLED' ? order.updatedAt.getTime() : 0,
                state,
                reason:       null,
            },
        };
    }

    private paymeError(id: number, code: number, message: string) {
        return {
            error: {
                code,
                message: {
                    ru: message,
                    en: message,
                    uz: message
                }
            },
            id
        }
    }
}
