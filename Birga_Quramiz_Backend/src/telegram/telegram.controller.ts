import { Controller, Post, Headers, Req, Res } from '@nestjs/common'
import { TelegramService } from './telegram.service'
import type { Request, Response } from 'express'

interface TelegramUpdate {
  update_id: number
  message?: {
    message_id: number
    from?: { id: number; first_name: string; username?: string }
    chat: { id: number }
    text?: string
    contact?: {
      phone_number: string
      first_name: string
      user_id?: number
    }
  }
}

@Controller('telegram')
export class TelegramController {
  private readonly webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim()

  constructor(private readonly telegram: TelegramService) {}

  @Post('webhook')
  handleWebhook(
    @Headers('x-telegram-bot-api-secret-token') token: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (!this.webhookSecret || token !== this.webhookSecret) {
      res.status(403).json({ message: 'Forbidden' })
      return
    }

    // Respond immediately — Telegram requires a fast 200 reply
    res.status(200).json({})

    void this.processUpdate(req.body as TelegramUpdate)
  }

  private async processUpdate(update: TelegramUpdate) {
    const message = update.message
    if (!message) return

    const chatId = message.chat.id
    const from = message.from

    if (message.text === '/start') {
      const telegramId = String(from?.id ?? '')
      if (!telegramId) return
      await this.telegram.handleStart(chatId, telegramId)
      return
    }

    if (message.contact && from) {
      // Security: verify the shared contact belongs to the sender, not someone else
      if (message.contact.user_id && message.contact.user_id !== from.id) return

      await this.telegram.linkPhoneFromBot(
        String(from.id),
        message.contact.phone_number,
        chatId,
        message.contact.first_name ?? from.first_name ?? 'User',
      )
    }
  }
}
