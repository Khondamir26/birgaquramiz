import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { normalizePhone } from '../auth/phone.util'

const MINI_APP_URL = 'https://birga-quramiz.uz'

@Injectable()
export class TelegramService implements OnApplicationBootstrap {
  private readonly logger = new Logger(TelegramService.name)
  private readonly botToken = process.env.TELEGRAM_BOT_TOKEN?.trim()
  private readonly webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim()
  private readonly backendPublicUrl =
    process.env.BACKEND_PUBLIC_URL?.trim() ?? 'https://api.birga-quramiz.uz'

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap() {
    if (process.env.NODE_ENV !== 'production') return
    await this.registerWebhook()
  }

  async registerWebhook() {
    if (!this.botToken) {
      this.logger.warn('TELEGRAM_BOT_TOKEN not set — webhook registration skipped')
      return
    }
    if (!this.webhookSecret) {
      this.logger.warn('TELEGRAM_WEBHOOK_SECRET not set — webhook registration skipped')
      return
    }
    const webhookUrl = `${this.backendPublicUrl}/telegram/webhook`
    try {
      const res = await fetch(`https://api.telegram.org/bot${this.botToken}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webhookUrl,
          secret_token: this.webhookSecret,
          allowed_updates: ['message'],
        }),
      })
      const data = (await res.json()) as { ok: boolean; description?: string }
      if (data.ok) {
        this.logger.log(`Telegram webhook registered: ${webhookUrl}`)
      } else {
        this.logger.error(`Failed to register Telegram webhook: ${data.description}`)
      }
    } catch (err) {
      this.logger.error('Error registering Telegram webhook', err)
    }
  }

  async handleStart(chatId: number, telegramId: string) {
    const existing = await this.prisma.user.findUnique({ where: { telegramId } })
    if (existing?.phone) {
      await this.sendLinkedSuccess(chatId)
      return
    }
    await this.sendRaw(chatId, {
      text: '👋 *Birga Quramiz*ga xush kelibsiz!\n\nIlovadan foydalanish uchun telefon raqamingizni ulang.',
      parse_mode: 'Markdown',
      reply_markup: {
        keyboard: [[{ text: '📱 Telefon raqamni ulash', request_contact: true }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    })
  }

  async linkPhoneFromBot(
    telegramId: string,
    rawPhone: string,
    chatId: number,
    firstName: string,
  ) {
    let phone: string
    try {
      phone = normalizePhone(rawPhone)
    } catch {
      await this.sendRaw(chatId, {
        text: "❌ Telefon raqam noto'g'ri formatda. Qaytadan urinib ko'ring.",
        reply_markup: { remove_keyboard: true },
      })
      return
    }

    const userByTelegram = await this.prisma.user.findUnique({ where: { telegramId } })
    const userByPhone = await this.prisma.user.findUnique({ where: { phone } })

    if (userByTelegram?.phone) {
      // Case 5: already fully linked — just confirm
      await this.sendLinkedSuccess(chatId)
      return
    }

    if (userByTelegram && !userByTelegram.phone && userByPhone) {
      // Case 3: two separate accounts — phone-based account wins
      // Remove telegramId from old account, add to phone-based account
      await this.prisma.user.update({
        where: { id: userByTelegram.id },
        data: { telegramId: null },
      })
      await this.prisma.user.update({
        where: { id: userByPhone.id },
        data: { telegramId },
      })
    } else if (userByTelegram && !userByTelegram.phone) {
      // Case 2: telegramId exists but no phone (legacy account) — add phone
      await this.prisma.user.update({
        where: { id: userByTelegram.id },
        data: { phone },
      })
    } else if (!userByTelegram && userByPhone) {
      // Case 1: phone-based account exists, no telegramId — link telegramId
      await this.prisma.user.update({
        where: { id: userByPhone.id },
        data: { telegramId },
      })
    } else {
      // Case 4: neither exists — create new user
      await this.prisma.user.create({
        data: { phone, name: firstName, telegramId },
      })
    }

    await this.sendLinkedSuccess(chatId)
  }

  async sendLinkedSuccess(chatId: number) {
    await this.sendRaw(chatId, {
      text: '✅ *Telefon raqam muvaffaqiyatli ulandi!*\n\nEndi ilovadan to\'liq foydalanishingiz mumkin.',
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: '🛒 Ilovani ochish', web_app: { url: MINI_APP_URL } }]],
      },
    })
  }

  async sendMessage(telegramId: string, text: string): Promise<boolean> {
    if (!this.botToken) {
      this.logger.warn('TELEGRAM_BOT_TOKEN is not configured. Cannot send message.')
      return false
    }
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${this.botToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: telegramId, text, parse_mode: 'Markdown' }),
        },
      )
      const data = (await response.json()) as { ok: boolean; description?: string }
      if (!data.ok) {
        this.logger.error(`Failed to send Telegram message to ${telegramId}: ${data.description}`)
        return false
      }
      return true
    } catch (error) {
      this.logger.error(`Error sending Telegram message to ${telegramId}`, error)
      return false
    }
  }

  private async sendRaw(chatId: number, payload: Record<string, unknown>) {
    if (!this.botToken) return
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${this.botToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, ...payload }),
        },
      )
      const data = (await response.json()) as { ok: boolean; description?: string }
      if (!data.ok) {
        this.logger.error(`sendRaw to ${chatId} failed: ${data.description}`)
      }
    } catch (err) {
      this.logger.error(`sendRaw to ${chatId} threw`, err)
    }
  }
}
