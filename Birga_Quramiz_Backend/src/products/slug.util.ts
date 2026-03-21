const TRANSLIT: Record<string, string> = {
  а: 'a',  б: 'b',  в: 'v',  г: 'g',  д: 'd',  е: 'e',  ё: 'yo', ж: 'zh',
  з: 'z',  и: 'i',  й: 'y',  к: 'k',  л: 'l',  м: 'm',  н: 'n',  о: 'o',
  п: 'p',  р: 'r',  с: 's',  т: 't',  у: 'u',  ф: 'f',  х: 'kh', ц: 'ts',
  ч: 'ch', ш: 'sh', щ: 'sch',ъ: '',   ы: 'y',  ь: '',   э: 'e',  ю: 'yu',
  я: 'ya',
}

/**
 * Generates a SEO-friendly slug from product name + SKU.
 * Format: <transliterated-name-max-50-chars>-<sku-lowercase>
 * Example: "tsement-portland-500-mix-000001"
 */
export function generateProductSlug(name: string, sku: string): string {
  // 1. Transliterate and clean
  const base = name
    .toLowerCase()
    .split('')
    .map((c) => TRANSLIT[c] ?? c)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  // 2. Truncate at word boundary (max 50 chars)
  let truncated = base
  if (truncated.length > 50) {
    truncated = truncated.slice(0, 50)
    const lastDash = truncated.lastIndexOf('-')
    if (lastDash > 20) truncated = truncated.slice(0, lastDash)
  }

  // 3. Append SKU (always unique)
  const skuPart = sku.toLowerCase().replace(/[^a-z0-9]/g, '-')
  return `${truncated}-${skuPart}`
}
