/**
 * Seed script: Populate categories and subcategories for Birga Quramiz.
 * Based on 24stroy.uz category structure (construction materials marketplace).
 * Run with: npx ts-node prisma/seed-categories.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Format: { name, code, children: [{ name, code }] }
const CATEGORY_TREE = [
  {
    name: 'Строительные смеси',
    nameUz: 'Qurilish aralashmalari',
    code: 'MIX',
    children: [
      { name: 'Цемент, алебастр, гипс', code: 'MIX-CEM' },
      { name: 'Штукатурки', code: 'MIX-PLT' },
      { name: 'Шпаклёвки', code: 'MIX-SPK' },
      { name: 'Клеевые смеси', code: 'MIX-ADH' },
      { name: 'Смеси для пола', code: 'MIX-FLR' },
      { name: 'Фуга для швов', code: 'MIX-GRT' },
      { name: 'Добавки для смесей', code: 'MIX-ADD' },
    ],
  },
  {
    name: 'Кровля и гидроизоляция',
    nameUz: 'Tom va gidroizolyatsiya',
    code: 'ROF',
    children: [
      { name: 'Рулонная кровля', code: 'ROF-ROL' },
      { name: 'Битум, мастика, праймер', code: 'ROF-BIT' },
      { name: 'Гидроизоляционные мембраны', code: 'ROF-MEM' },
      { name: 'Шифер', code: 'ROF-SHF' },
      { name: 'Ондулин', code: 'ROF-ONL' },
      { name: 'Кровельные аксессуары', code: 'ROF-ACC' },
    ],
  },
  {
    name: 'Утеплители и шумоизоляция',
    nameUz: 'Isitkich va shovqin izolyatsiyasi',
    code: 'INS',
    children: [
      { name: 'Минеральная вата', code: 'INS-MIN' },
      { name: 'Стекловата', code: 'INS-GLS' },
      { name: 'Пеноплекс / Пенопласт', code: 'INS-FOM' },
      { name: 'Фасадный утеплитель', code: 'INS-FAC' },
      { name: 'Утеплитель для труб', code: 'INS-PIP' },
    ],
  },
  {
    name: 'Гипсокартон и профили',
    nameUz: 'Gipsokarton va profillar',
    code: 'DRW',
    children: [
      { name: 'Гипсокартон', code: 'DRW-SHT' },
      { name: 'Профили для гипсокартона', code: 'DRW-PRF' },
      { name: 'Подвесы и соединители', code: 'DRW-CON' },
      { name: 'Серпянки и ленты', code: 'DRW-TPE' },
      { name: 'Уголки малярные', code: 'DRW-CRN' },
      { name: 'Маяки штукатурные', code: 'DRW-BCN' },
    ],
  },
  {
    name: 'Лакокрасочные материалы',
    nameUz: "Lak-bo'yoq materiallari",
    code: 'PNT',
    children: [
      { name: 'Краски', code: 'PNT-PNT' },
      { name: 'Лаки', code: 'PNT-LAK' },
      { name: 'Эмали', code: 'PNT-EML' },
      { name: 'Растворители', code: 'PNT-THN' },
      { name: 'Грунтовки', code: 'PNT-PRM' },
    ],
  },
  {
    name: 'Металлопродукция',
    nameUz: 'Metall mahsulotlari',
    code: 'MTL',
    children: [
      { name: 'Арматура', code: 'MTL-ARR' },
      { name: 'Уголок металлический', code: 'MTL-ANG' },
      { name: 'Трубы стальные', code: 'MTL-PIP' },
      { name: 'Проволока и катанка', code: 'MTL-WIR' },
      { name: 'Сетки металлические', code: 'MTL-MSH' },
    ],
  },
  {
    name: 'Метизы и крепёж',
    nameUz: 'Mahkamlagichlar',
    code: 'FAS',
    children: [
      { name: 'Саморезы и шурупы', code: 'FAS-SCR' },
      { name: 'Дюбели', code: 'FAS-DYB' },
      { name: 'Гвозди', code: 'FAS-NAL' },
      { name: 'Анкера', code: 'FAS-ANK' },
      { name: 'Болты, гайки, шпильки', code: 'FAS-BLT' },
      { name: 'Перфорированный крепёж', code: 'FAS-PRF' },
      { name: 'Хомуты и стяжки', code: 'FAS-CLM' },
    ],
  },
  {
    name: 'Инструменты',
    nameUz: 'Asboblar',
    code: 'TOL',
    children: [
      { name: 'Электроинструмент', code: 'TOL-ELC' },
      { name: 'Ручной инструмент', code: 'TOL-HND' },
      { name: 'Малярный инструмент', code: 'TOL-PNT' },
      { name: 'Штукатурный инструмент', code: 'TOL-PLT' },
      { name: 'Режущий и пилящий', code: 'TOL-CUT' },
      { name: 'Измерение и разметка', code: 'TOL-MSR' },
      { name: 'Шуруповёрты', code: 'TOL-DRL' },
      { name: 'Шлифование и полировка', code: 'TOL-GRD' },
      { name: 'Сварочные электроды', code: 'TOL-WLD' },
      { name: 'Строительное оборудование', code: 'TOL-EQP' },
    ],
  },
  {
    name: 'Сантехника',
    nameUz: 'Santexnika',
    code: 'PLM',
    children: [
      { name: 'Смесители и аксессуары', code: 'PLM-FAU' },
      { name: 'Трубы ПВХ канализационные', code: 'PLM-PVC' },
      { name: 'Водоснабжение и отопление', code: 'PLM-WSH' },
      { name: 'Радиаторы', code: 'PLM-RAD' },
      { name: 'Водонагреватели', code: 'PLM-HTR' },
      { name: 'Теплоизоляция труб', code: 'PLM-INS' },
      { name: 'Теплый пол', code: 'PLM-UFH' },
      { name: 'Системы фильтрации воды', code: 'PLM-FLT' },
    ],
  },
  {
    name: 'Электрика и свет',
    nameUz: 'Elektr va yoritish',
    code: 'ELC',
    children: [
      { name: 'Кабели и провода', code: 'ELC-CAB' },
      { name: 'Розетки и выключатели', code: 'ELC-SWT' },
      { name: 'Лампы и светильники', code: 'ELC-LMP' },
      { name: 'Автоматы и щитки', code: 'ELC-BRK' },
      { name: 'Гофротрубы и кабель-каналы', code: 'ELC-CDT' },
      { name: 'Монтажные коробки', code: 'ELC-BOX' },
      { name: 'Стабилизаторы напряжения', code: 'ELC-STB' },
    ],
  },
  {
    name: 'Блоки, кирпич, цемент',
    nameUz: "Bloklar, g'isht, sement",
    code: 'BLK',
    children: [
      { name: 'Строительные блоки', code: 'BLK-BLK' },
      { name: 'Кирпич', code: 'BLK-BRK' },
      { name: 'Цемент', code: 'BLK-CEM' },
      { name: 'Песок и щебень', code: 'BLK-SND' },
    ],
  },
  {
    name: 'Напольные покрытия',
    nameUz: 'Pol qoplamalari',
    code: 'FLR',
    children: [
      { name: 'Ламинат', code: 'FLR-LAM' },
      { name: 'Линолеум', code: 'FLR-LNL' },
      { name: 'Плитка напольная', code: 'FLR-TLE' },
      { name: 'Подложка', code: 'FLR-UND' },
    ],
  },
  {
    name: 'Древесные материалы',
    nameUz: "Yog'och materiallar",
    code: 'WOD',
    children: [
      { name: 'Фанера', code: 'WOD-PLY' },
      { name: 'OSB плиты', code: 'WOD-OSB' },
      { name: 'Брус и рейка', code: 'WOD-TMB' },
      { name: 'Вагонка', code: 'WOD-CLG' },
    ],
  },
  {
    name: 'Вентиляция',
    nameUz: 'Ventilyatsiya',
    code: 'VNT',
    children: [
      { name: 'Вентиляторы', code: 'VNT-FAN' },
      { name: 'Воздуховоды и каналы', code: 'VNT-DCT' },
      { name: 'Решётки и люки', code: 'VNT-GRL' },
      { name: 'Комплектующие', code: 'VNT-ACC' },
    ],
  },
  {
    name: 'Двери и окна',
    nameUz: 'Eshiklar va derazalar',
    code: 'DOR',
    children: [
      { name: 'Межкомнатные двери', code: 'DOR-INT' },
      { name: 'Входные двери', code: 'DOR-EXT' },
      { name: 'Дверные ручки и замки', code: 'DOR-HRD' },
      { name: 'Оконные профили', code: 'DOR-WIN' },
    ],
  },
  {
    name: 'Мелочи для ремонта',
    nameUz: "Ta'mirlash uchun mayda-chuyda",
    code: 'RPR',
    children: [
      { name: 'Клеи, герметики, пена', code: 'RPR-ADH' },
      { name: 'Ленты и скотч', code: 'RPR-TPE' },
      { name: 'Для укладки плитки', code: 'RPR-TLE' },
      { name: 'Средства защиты (СИЗ)', code: 'RPR-PPE' },
      { name: 'Укрывочные материалы', code: 'RPR-COV' },
    ],
  },
  {
    name: 'Сетки и стеклохолст',
    nameUz: "To'rlar va shisha mato",
    code: 'MSH',
    children: [
      { name: 'Сетка кладочная', code: 'MSH-LAY' },
      { name: 'Сетка для штукатурки', code: 'MSH-PLT' },
      { name: 'Стеклосетка', code: 'MSH-GLS' },
      { name: 'Сетка базальтовая', code: 'MSH-BSL' },
      { name: 'Сетка дорожная', code: 'MSH-ROD' },
    ],
  },
  {
    name: 'Отопление',
    nameUz: 'Isitish',
    code: 'HTG',
    children: [
      { name: 'Котлы отопительные', code: 'HTG-BLR' },
      { name: 'Радиаторы отопления', code: 'HTG-RAD' },
      { name: 'Трубы отопления', code: 'HTG-PIP' },
    ],
  },
];

async function main() {
  console.log('🌱 Seeding categories...\n');

  // Remove old single-word categories that conflict (Tile, Paint, Pipe, Wood, Tool, Electrical, Metal, Cement)
  const oldCodes = [
    'TIL',
    'PNT_OLD',
    'PIP',
    'WOD_OLD',
    'TOL_OLD',
    'ELC_OLD',
    'MTL_OLD',
    'CEM',
  ];
  for (const code of oldCodes) {
    await prisma.category.deleteMany({
      where: { code, products: { none: {} } },
    });
  }

  let parentCount = 0;
  let childCount = 0;

  for (const parent of CATEGORY_TREE) {
    // Upsert parent
    const parentRecord = await prisma.category.upsert({
      where: { code: parent.code },
      update: { name: parent.name },
      create: { name: parent.name, code: parent.code, lastSkuNumber: 0 },
    });
    parentCount++;
    console.log(`✅ ${parent.name} (${parent.code})`);

    // Upsert children
    for (const child of parent.children) {
      await prisma.category.upsert({
        where: { code: child.code },
        update: { name: child.name, parentId: parentRecord.id },
        create: {
          name: child.name,
          code: child.code,
          lastSkuNumber: 0,
          parentId: parentRecord.id,
        },
      });
      childCount++;
      console.log(`   └─ ${child.name} (${child.code})`);
    }
  }

  // Keep GEN as fallback for existing products
  await prisma.category.upsert({
    where: { code: 'GEN' },
    update: { name: 'Общее' },
    create: { name: 'Общее', code: 'GEN', lastSkuNumber: 0 },
  });

  console.log(
    `\n✨ Done! ${parentCount} parent categories, ${childCount} subcategories seeded.`,
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
