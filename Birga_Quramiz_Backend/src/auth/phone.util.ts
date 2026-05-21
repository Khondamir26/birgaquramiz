import { BadRequestException } from '@nestjs/common'

/**
 * Normalizes any Uzbek phone number input to E.164 format (+998XXXXXXXXX).
 * Must be called before any DB lookup, Redis key, OTP send, or Telegram linking.
 */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')

  // 9 digits — local part only: 901234567
  if (digits.length === 9) {
    return `+998${digits}`
  }

  // 10 digits starting with 0: 0901234567
  if (digits.length === 10 && digits.startsWith('0')) {
    return `+998${digits.slice(1)}`
  }

  // 12 digits starting with 998: 998901234567
  if (digits.length === 12 && digits.startsWith('998')) {
    return `+${digits}`
  }

  throw new BadRequestException(`Invalid phone number format: ${raw}`)
}
