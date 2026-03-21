/**
 * Force-delete legacy English-named categories.
 * Handles: child categories, attached products (moved to GEN).
 * Run with: npx ts-node prisma/delete-legacy-categories.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const LEGACY_NAMES = ['Brick', 'Cement', 'Pipe', 'Tile'];

async function main() {
  console.log('🗑  Force-deleting legacy categories...\n');

  // Ensure GEN exists as fallback
  const gen = await prisma.category.upsert({
    where: { code: 'GEN' },
    update: {},
    create: { name: 'Общее', code: 'GEN', lastSkuNumber: 0 },
  });

  for (const name of LEGACY_NAMES) {
    const cat = await prisma.category.findFirst({ where: { name } });
    if (!cat) {
      console.log(`"${name}" not found — skipping`);
      continue;
    }

    // 1. Reassign any child categories to null parent
    const children = await prisma.category.findMany({
      where: { parentId: cat.id },
    });
    if (children.length > 0) {
      await prisma.category.updateMany({
        where: { parentId: cat.id },
        data: { parentId: null },
      });
      console.log(
        `   ↪ Detached ${children.length} child category(ies) from "${name}"`,
      );
    }

    // 2. Reassign any products to GEN
    const moved = await prisma.product.updateMany({
      where: { categoryId: cat.id },
      data: { categoryId: gen.id },
    });
    if (moved.count > 0) {
      console.log(`   ↪ Moved ${moved.count} product(s) from "${name}" → GEN`);
    }

    // 3. Delete the category
    await prisma.category.delete({ where: { id: cat.id } });
    console.log(`✅ Deleted "${name}"`);
  }

  const total = await prisma.category.count();
  console.log(`\n✨ Done! ${total} categories remaining.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
