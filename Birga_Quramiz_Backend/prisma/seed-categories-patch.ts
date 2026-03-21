/**
 * Patch: adds missing categories, removes stale legacy entries.
 * Run with: npx ts-node prisma/seed-categories-patch.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const NEW_CATEGORIES = [
  {
    name: 'Огнезащитные материалы',
    code: 'FPR',
    children: [
      { name: 'Огнезащитные краски и составы', code: 'FPR-PNT' },
      { name: 'Огнезащитные пропитки', code: 'FPR-IMP' },
      { name: 'Противопожарные герметики', code: 'FPR-SEL' },
      { name: 'Огнезащитные плиты', code: 'FPR-BRD' },
    ],
  },
  {
    name: 'Водяные насосы',
    code: 'PMP',
    children: [
      { name: 'Погружные насосы', code: 'PMP-SUB' },
      { name: 'Поверхностные насосы', code: 'PMP-SRF' },
      { name: 'Циркуляционные насосы', code: 'PMP-CRC' },
      { name: 'Насосные станции', code: 'PMP-STA' },
      { name: 'Дренажные насосы', code: 'PMP-DRN' },
    ],
  },
  {
    name: 'Отделочные материалы',
    code: 'FIN',
    children: [
      { name: 'Плитка облицовочная', code: 'FIN-TLE' },
      { name: 'Панели ПВХ', code: 'FIN-PVC' },
      { name: 'Вагонка МДФ', code: 'FIN-MDF' },
      { name: 'Декоративная штукатурка', code: 'FIN-PLT' },
      { name: 'Обои', code: 'FIN-WLP' },
      { name: 'Натяжные потолки', code: 'FIN-CLG' },
    ],
  },
  {
    name: 'Станки и оборудование',
    code: 'MCH',
    children: [
      { name: 'Плиткорезы электрические', code: 'MCH-TLC' },
      { name: 'Точильные станки', code: 'MCH-GRD' },
      { name: 'Деревообрабатывающие станки', code: 'MCH-WOD' },
      { name: 'Металлообрабатывающие станки', code: 'MCH-MTL' },
      { name: 'Компрессоры', code: 'MCH-CMP' },
      { name: 'Бетономешалки', code: 'MCH-MXR' },
    ],
  },
  {
    name: 'Канализация и дренаж',
    code: 'DRN',
    children: [
      { name: 'Канализационные трубы', code: 'DRN-PIP' },
      { name: 'Фитинги и соединители', code: 'DRN-FIT' },
      { name: 'Ревизионные люки', code: 'DRN-ACC' },
      { name: 'Дренажные системы', code: 'DRN-SYS' },
      { name: 'Септики', code: 'DRN-SEP' },
    ],
  },
];

// Subcategories to add to EXISTING parents (by parent code)
const EXTRA_CHILDREN: Record<string, { name: string; code: string }[]> = {
  ELC: [
    { name: 'Коаксиальный кабель (ТВ)', code: 'ELC-COX' },
    { name: 'Прожекторы и уличный свет', code: 'ELC-OUT' },
  ],
  TOL: [
    { name: 'Компрессорное оборудование', code: 'TOL-CMP' },
    { name: 'Строительные леса и вышки', code: 'TOL-SCF' },
  ],
  PLM: [
    { name: 'Ванны и душевые кабины', code: 'PLM-BTH' },
    { name: 'Унитазы и раковины', code: 'PLM-SAN' },
  ],
  RPR: [{ name: 'Монтажная пена', code: 'RPR-FOM' }],
};

// Legacy codes to delete (if no products attached)
const STALE_CODES = ['BRK', 'GEN_OLD'];

async function main() {
  console.log('🔧 Patching categories...\n');

  // 1. Delete stale categories that have no products
  for (const code of STALE_CODES) {
    const deleted = await prisma.category.deleteMany({
      where: { code, products: { none: {} }, children: { none: {} } },
    });
    if (deleted.count > 0) console.log(`🗑  Removed stale: ${code}`);
  }

  // 2. Add new parent categories + children
  for (const parent of NEW_CATEGORIES) {
    const record = await prisma.category.upsert({
      where: { code: parent.code },
      update: { name: parent.name },
      create: { name: parent.name, code: parent.code, lastSkuNumber: 0 },
    });
    console.log(`✅ ${parent.name} (${parent.code})`);

    for (const child of parent.children) {
      await prisma.category.upsert({
        where: { code: child.code },
        update: { name: child.name, parentId: record.id },
        create: {
          name: child.name,
          code: child.code,
          lastSkuNumber: 0,
          parentId: record.id,
        },
      });
      console.log(`   └─ ${child.name} (${child.code})`);
    }
  }

  // 3. Add extra children to existing parents
  for (const [parentCode, children] of Object.entries(EXTRA_CHILDREN)) {
    const parent = await prisma.category.findUnique({
      where: { code: parentCode },
    });
    if (!parent) {
      console.warn(`⚠️  Parent ${parentCode} not found`);
      continue;
    }

    for (const child of children) {
      await prisma.category.upsert({
        where: { code: child.code },
        update: { name: child.name, parentId: parent.id },
        create: {
          name: child.name,
          code: child.code,
          lastSkuNumber: 0,
          parentId: parent.id,
        },
      });
      console.log(`   ➕ ${parentCode} ← ${child.name} (${child.code})`);
    }
  }

  // 4. Final count
  const total = await prisma.category.count();
  const parents = await prisma.category.count({ where: { parentId: null } });
  console.log(
    `\n✨ Done! ${parents} parent categories, ${total - parents} subcategories (${total} total)`,
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
