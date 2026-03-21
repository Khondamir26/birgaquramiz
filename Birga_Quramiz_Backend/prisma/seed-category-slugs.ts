/**
 * Generate slugs for all categories that don't have one.
 * Run: npx ts-node prisma/seed-category-slugs.ts
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

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .split('')
    .map((c) => TRANSLIT[c] ?? c)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function generateCategorySlug(name: string): string {
  return toSlug(name);
}

async function main() {
  console.log('🔧 Generating slugs for categories...\n');

  const categories = await prisma.category.findMany({
    where: { slug: null },
    select: { id: true, name: true, code: true },
  });

  console.log(`Found ${categories.length} categories without slugs.\n`);

  let updated = 0;

  for (const cat of categories) {
    let slug = generateCategorySlug(cat.name);

    // Handle collision: append code suffix
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${cat.code.toLowerCase()}`;

    await prisma.category.update({
      where: { id: cat.id },
      data: { slug },
    });

    console.log(`✅ "${cat.name}" → "${slug}"`);
    updated++;
  }

  console.log(`\n✨ Done! ${updated} category slugs generated.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
