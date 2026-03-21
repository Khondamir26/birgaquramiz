/**
 * Patch: shorten parent category names for better UX in the burger menu.
 * Run with: npx ts-node prisma/seed-categories-rename.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const RENAMES: { code: string; name: string }[] = [
  { code: 'BLK', name: 'Блоки и кирпич' },
  { code: 'DRW', name: 'ГКЛ и профили' },
  { code: 'WOD', name: 'Древесина' },
  { code: 'DRN', name: 'Канализация' },
  { code: 'ROF', name: 'Кровля' },
  { code: 'PNT', name: 'Краски и лаки' },
  { code: 'RPR', name: 'Для ремонта' },
  { code: 'FPR', name: 'Огнезащита' },
  { code: 'FIN', name: 'Отделка' },
  { code: 'MSH', name: 'Сетки' },
  { code: 'MCH', name: 'Станки' },
  { code: 'INS', name: 'Утеплители' },
];

async function main() {
  console.log('✏️  Renaming categories...\n');

  for (const { code, name } of RENAMES) {
    const updated = await prisma.category.updateMany({
      where: { code, parentId: null },
      data: { name },
    });
    if (updated.count > 0) {
      console.log(`✅ ${code} → "${name}"`);
    } else {
      console.warn(`⚠️  ${code} not found or already updated`);
    }
  }

  console.log('\n✨ Done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
