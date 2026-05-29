import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { normalizePhone } from '../auth/phone.util'
import Redis from 'ioredis'

const MINI_APP_URL = 'https://birga-quramiz.uz'

type Lang = 'uz' | 'ru' | 'en'

function getLang(code?: string | null): Lang {
  if (!code) return 'uz'
  if (code.startsWith('ru')) return 'ru'
  if (code.startsWith('en')) return 'en'
  return 'uz'
}

const OTP_DELIVERY = {
  uz: (code: string) => `🔐 Saytga kirish kodingiz: *${code}*\n\nBu kodni brauzerdagi sahifaga kiriting.\nKod 3 daqiqa amal qiladi.`,
  ru: (code: string) => `🔐 Ваш код для входа на сайт: *${code}*\n\nВведите этот код в браузере.\nКод действителен 3 минуты.`,
  en: (code: string) => `🔐 Your website login code: *${code}*\n\nEnter this code in your browser.\nValid for 3 minutes.`,
}

const MSG = {
  welcome: {
    uz: '👋 *Birga Quramiz*ga xush kelibsiz!\n\nIlovadan foydalanish uchun telefon raqamingizni ulang.\n\n👇 Quyidagi tugmani bosing.',
    ru: '👋 Добро пожаловать в *Birga Quramiz*!\n\nЧтобы использовать приложение, привяжите свой номер телефона.\n\n👇 Нажмите кнопку ниже.',
    en: '👋 Welcome to *Birga Quramiz*!\n\nTo use the app, please link your phone number.\n\n👇 Tap the button below.',
  },
  shareBtn: {
    uz: '📱 Telefon raqamni ulash',
    ru: '📱 Поделиться номером',
    en: '📱 Share phone number',
  },
  linked: {
    uz: '✅ *Telefon raqam muvaffaqiyatli ulandi!*\n\nEndi ilovadan to\'liq foydalanishingiz mumkin.',
    ru: '✅ *Номер телефона успешно привязан!*\n\nТеперь вы можете пользоваться приложением.',
    en: '✅ *Phone number successfully linked!*\n\nYou can now use the app.',
  },
  openApp: {
    uz: '🛒 Ilovani ochish:',
    ru: '🛒 Открыть приложение:',
    en: '🛒 Open the app:',
  },
  openBtn: {
    uz: '🛒 Ilovani ochish',
    ru: '🛒 Открыть приложение',
    en: '🛒 Open app',
  },
  invalidPhone: {
    uz: "❌ Telefon raqam noto'g'ri formatda. Qaytadan urinib ko'ring.",
    ru: '❌ Неверный формат номера телефона. Попробуйте ещё раз.',
    en: '❌ Invalid phone number format. Please try again.',
  },
  loginFirst: {
    uz: "⚠️ Bu raqam boshqa akkauntga bog'liq.\n\nTelegram akkauntingizni ulash uchun avval saytga shu raqam bilan kiring va OTP kodni so'rang — bot avtomatik yuboradi.",
    ru: '⚠️ Этот номер принадлежит другому аккаунту.\n\nЧтобы привязать Telegram, сначала войдите на сайт с этим номером и запросите OTP — бот отправит его автоматически.',
    en: "⚠️ This number belongs to another account.\n\nTo link Telegram, first log in on the website with this number and request an OTP — the bot will deliver it automatically.",
  },
}

@Injectable()
export class TelegramService implements OnApplicationBootstrap {
  private readonly logger = new Logger(TelegramService.name)
  private readonly botToken = process.env.TELEGRAM_BOT_TOKEN?.trim()
  private readonly webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim()
  private readonly backendPublicUrl =
    process.env.BACKEND_PUBLIC_URL?.trim() ?? 'https://api.birga-quramiz.uz'
  private readonly redis: Redis

  constructor(private readonly prisma: PrismaService) {
    this.redis = new Redis({
      host: process.env.REDIS_HOST ?? 'localhost',
      port: Number(process.env.REDIS_PORT ?? 6379),
      password: process.env.REDIS_PASSWORD,
    })
  }

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

  async handleStart(chatId: number, telegramId: string, languageCode?: string | null, firstName?: string, startParam?: string) {
    const lang = getLang(languageCode)

    if (startParam === 'code') {
      await this.handleLoginCode(chatId, telegramId, lang, firstName ?? 'User', languageCode ?? null)
      return
    }

    const existing = await this.prisma.user.findUnique({ where: { telegramId } })
    if (existing?.phone) {
      await this.sendLinkedSuccess(chatId, lang)
      return
    }
    await this.sendRaw(chatId, {
      text: MSG.welcome[lang],
      parse_mode: 'Markdown',
      reply_markup: {
        keyboard: [[{ text: MSG.shareBtn[lang], request_contact: true }]],
        resize_keyboard: true,
      },
    })
  }

  private async handleLoginCode(
    chatId: number,
    telegramId: string,
    lang: Lang,
    firstName: string,
    languageCode: string | null,
  ) {
    const otp = String(Math.floor(100000 + Math.random() * 900000))
    await this.redis.setex(
      `tg:code:${otp}`,
      300,
      JSON.stringify({ telegramId, firstName, languageCode }),
    )

    if (process.env.NODE_ENV !== 'production') {
      this.logger.log(`[TG LOGIN DEV] otp=${otp}`)
    }

    await this.sendRaw(chatId, {
      text: OTP_DELIVERY[lang](otp),
      parse_mode: 'Markdown',
    })
  }

  async linkPhoneFromBot(
    telegramId: string,
    rawPhone: string,
    chatId: number,
    firstName: string,
    languageCode?: string | null,
  ) {
    const lang = getLang(languageCode)

    let phone: string
    try {
      phone = normalizePhone(rawPhone)
    } catch {
      await this.sendRaw(chatId, {
        text: MSG.invalidPhone[lang],
        reply_markup: { remove_keyboard: true },
      })
      return
    }

    const userByTelegram = await this.prisma.user.findUnique({ where: { telegramId } })
    const userByPhone = await this.prisma.user.findUnique({ where: { phone } })

    if (userByTelegram?.phone) {
      // Case 5: already fully linked — just confirm
      await this.sendLinkedSuccess(chatId, lang)
      return
    }

    // Always check for a pending login OTP before doing any linking
    const pendingOtp = await this.redis.get(`otp:auth:${phone}`)

    if (userByTelegram && !userByTelegram.phone && userByPhone) {
      // Case 3: two separate accounts — only merge if there is an active login attempt
      // (guards against a wrong Telegram account accidentally hijacking the phone-based user)
      if (!pendingOtp) {
        await this.sendRaw(chatId, {
          text: MSG.loginFirst[lang],
          parse_mode: 'Markdown',
          reply_markup: { remove_keyboard: true },
        })
        return
      }
      await this.prisma.user.update({
        where: { id: userByTelegram.id },
        data: { telegramId: null },
      })
      await this.prisma.user.update({
        where: { id: userByPhone.id },
        data: { telegramId },
      })
    } else if (userByTelegram && !userByTelegram.phone) {
      // Case 2: this Telegram account exists but has no phone — add the shared phone
      await this.prisma.user.update({
        where: { id: userByTelegram.id },
        data: { phone },
      })
    } else if (!userByTelegram && userByPhone) {
      // Case 1: phone-based account exists but no Telegram linked yet.
      // Only link if the user is actively logging in (pending OTP) — prevents hijacking.
      if (!pendingOtp) {
        await this.sendRaw(chatId, {
          text: MSG.loginFirst[lang],
          parse_mode: 'Markdown',
          reply_markup: { remove_keyboard: true },
        })
        return
      }
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

    // Deliver pending OTP via Telegram now that accounts are linked
    if (pendingOtp) {
      await this.redis.del(`otp:auth:${phone}`)
      await this.sendRaw(chatId, {
        text: MSG.linked[lang],
        parse_mode: 'Markdown',
        reply_markup: { remove_keyboard: true },
      })
      await this.sendRaw(chatId, {
        text: OTP_DELIVERY[lang](pendingOtp),
        parse_mode: 'Markdown',
      })
      return
    }

    await this.sendLinkedSuccess(chatId, lang)
  }

  async sendLinkedSuccess(chatId: number, lang: Lang = 'uz') {
    // Remove the persistent reply keyboard
    await this.sendRaw(chatId, {
      text: MSG.linked[lang],
      parse_mode: 'Markdown',
      reply_markup: { remove_keyboard: true },
    })
    // Inline "Open App" button
    await this.sendRaw(chatId, {
      text: MSG.openApp[lang],
      reply_markup: {
        inline_keyboard: [[{ text: MSG.openBtn[lang], web_app: { url: MINI_APP_URL } }]],
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
