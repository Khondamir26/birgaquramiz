import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

interface ExpoPushMessage {
  to: string
  title: string
  body: string
  data?: Record<string, unknown>
  sound?: 'default' | null
  channelId?: string
}

interface ExpoResponse {
  data: Array<{ status: 'ok' | 'error'; message?: string; details?: unknown }>
}

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name)
  private static readonly EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

  constructor(private readonly prisma: PrismaService) {}

  /** Store or clear a driver's Expo push token. Creates the profile if it doesn't exist yet. */
  async savePushToken(userId: string, token: string | null): Promise<void> {
    await this.prisma.driverProfile.upsert({
      where: { userId },
      create: { userId, pushToken: token },
      update: { pushToken: token },
    })
  }

  /** Send a push notification to a driver by their userId. Fire-and-forget. */
  async notifyDriver(driverId: string, title: string, body: string, data?: Record<string, unknown>): Promise<void> {
    const profile = await this.prisma.driverProfile.findUnique({
      where: { userId: driverId },
      select: { pushToken: true },
    })

    const token = profile?.pushToken
    if (!token || !token.startsWith('ExponentPushToken[')) return

    await this.sendToExpo([{ to: token, title, body, data, sound: 'default', channelId: 'assignments' }])
  }

  private async sendToExpo(messages: ExpoPushMessage[]): Promise<void> {
    try {
      const res = await fetch(PushNotificationService.EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      })

      if (!res.ok) {
        this.logger.warn(`[push] Expo API returned ${res.status}`)
        return
      }

      const json = (await res.json()) as ExpoResponse
      for (const ticket of json.data ?? []) {
        if (ticket.status === 'error') {
          this.logger.warn(`[push] Expo delivery error: ${ticket.message}`)
        }
      }
    } catch (err) {
      this.logger.warn('[push] Failed to send push notification', err)
    }
  }
}
