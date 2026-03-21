/**
 * Generate slugs for all existing products that don't have one.
 * Run AFTER the migration: npx ts-node prisma/seed-generate-slugs.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TRANSLIT: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'yo',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'kh',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
};

function generateProductSlug(name: string, sku: string): string {
  const base = name
    .toLowerCase()
    .split('')
    .map((c) => TRANSLIT[c] ?? c)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  let truncated = base;
  if (truncated.length > 50) {
    truncated = truncated.slice(0, 50);
    const lastDash = truncated.lastIndexOf('-');
    if (lastDash > 20) truncated = truncated.slice(0, lastDash);
  }

  const skuPart = sku.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return `${truncated}-${skuPart}`;
}

async function main() {
  console.log('🔧 Generating slugs for existing products...\n');

  const products = await prisma.product.findMany({
    where: { slug: null, sku: { not: null } },
    select: { id: true, name: true, sku: true },
  });

  console.log(`Found ${products.length} products without slugs.\n`);

  let updated = 0;
  let skipped = 0;

  for (const product of products) {
    if (!product.sku) {
      skipped++;
      continue;
    }

    const slug = generateProductSlug(product.name, product.sku);

    // Handle rare collision: append articleNumber suffix
    const existing = await prisma.product.findUnique({ where: { slug } });
    const finalSlug = existing ? `${slug}-${product.id.slice(0, 6)}` : slug;

    await prisma.product.update({
      where: { id: product.id },
      data: { slug: finalSlug },
    });

    console.log(`✅ ${product.sku} → "${finalSlug}"`);
    updated++;
  }

  console.log(
    `\n✨ Done! ${updated} slugs generated, ${skipped} skipped (no SKU).`,
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
