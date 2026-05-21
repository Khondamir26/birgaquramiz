import { Injectable, Logger } from '@nestjs/common'

const ESKIZ_BASE = 'https://notify.eskiz.uz/api'

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name)
  private token: string | null = null
  private tokenExpiresAt = 0

  private get credentials() {
    return {
      email: process.env.ESKIZ_EMAIL ?? '',
      password: process.env.ESKIZ_PASSWORD ?? '',
    }
  }

  private get enabled(): boolean {
    return Boolean(this.credentials.email && this.credentials.password)
  }

  private async getToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiresAt) return this.token

    const res = await fetch(`${ESKIZ_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.credentials),
    })

    if (!res.ok) {
      throw new Error(`Eskiz auth failed: ${res.status}`)
    }

    const body = (await res.json()) as { data?: { token?: string } }
    const token = body?.data?.token
    if (!token) throw new Error('Eskiz: no token in response')

    this.token = token
    // Eskiz tokens are valid for 30 days — refresh every 29 days
    this.tokenExpiresAt = Date.now() + 29 * 24 * 60 * 60 * 1000
    return token
  }

  async send(phone: string, message: string): Promise<boolean> {
    if (!this.enabled) {
      this.logger.warn(`[sms] ESKIZ_EMAIL/PASSWORD not set — skipping SMS to ${phone}`)
      return false
    }

    // Normalize: ensure 998XXXXXXXXX format (no leading +)
    const normalized = phone.startsWith('+') ? phone.slice(1) : phone

    try {
      const token = await this.getToken()

      const res = await fetch(`${ESKIZ_BASE}/message/sms/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mobile_phone: normalized,
          message,
          from: '4546',
        }),
      })

      if (res.status === 401) {
        // Token may have expired — invalidate and retry once
        this.token = null
        this.tokenExpiresAt = 0
        const freshToken = await this.getToken()

        const retry = await fetch(`${ESKIZ_BASE}/message/sms/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${freshToken}`,
          },
          body: JSON.stringify({
            mobile_phone: normalized,
            message,
            from: '4546',
          }),
        })

        if (!retry.ok) {
          this.logger.error(`[sms] retry failed: ${retry.status} ${await retry.text()}`)
          return false
        }
        this.logger.log(`[sms] sent to ${phone} (after token refresh)`)
        return true
      }

      if (!res.ok) {
        this.logger.error(`[sms] failed: ${res.status} ${await res.text()}`)
        return false
      }
      this.logger.log(`[sms] sent to ${phone}`)
      return true
    } catch (err) {
      this.logger.error(`[sms] failed to send to ${phone}: ${err}`)
      return false
    }
  }
}
