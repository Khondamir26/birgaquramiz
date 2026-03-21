/**
 * Formats Uzbek phone numbers as the user types: +998 90 123 45 67
 */
export function formatPhone(raw: string): string {
  // Strip everything except digits and leading +
  let digits = raw.replace(/[^\d+]/g, '')

  // Ensure it starts with +998
  if (!digits.startsWith('+')) {
    digits = '+' + digits
  }
  if (digits === '+') return '+'
  if (!digits.startsWith('+998')) {
    // If user typed only digits without country code, prepend +998
    const onlyDigits = digits.replace('+', '')
    if (!onlyDigits.startsWith('998')) {
      digits = '+998' + onlyDigits
    } else {
      digits = '+' + onlyDigits
    }
  }

  // Extract the local part after +998
  const local = digits.slice(4).replace(/\D/g, '').slice(0, 9)

  // Format: +998 XX XXX XX XX
  let formatted = '+998'
  if (local.length > 0) formatted += ' ' + local.slice(0, 2)
  if (local.length > 2) formatted += ' ' + local.slice(2, 5)
  if (local.length > 5) formatted += ' ' + local.slice(5, 7)
  if (local.length > 7) formatted += ' ' + local.slice(7, 9)

  return formatted
}
