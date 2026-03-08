import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class TelegramService {
    private readonly logger = new Logger(TelegramService.name);
    private readonly botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();

    async sendMessage(telegramId: string, text: string): Promise<boolean> {
        if (!this.botToken) {
            this.logger.warn('TELEGRAM_BOT_TOKEN is not configured. Cannot send message.');
            return false;
        }

        try {
            const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: telegramId,
                    text: text,
                    parse_mode: 'Markdown',
                }),
            });

            const data = await response.json();

            if (!data.ok) {
                this.logger.error(`Failed to send Telegram message to ${telegramId}: ${data.description}`);
                return false;
            }

            return true;
        } catch (error) {
            this.logger.error(`Error sending Telegram message to ${telegramId}`, error);
            return false;
        }
    }
}
