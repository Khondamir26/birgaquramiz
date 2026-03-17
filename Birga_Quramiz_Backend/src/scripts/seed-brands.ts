import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  const brandsPath = path.join(__dirname, '../../brands.json');
  
  if (!fs.existsSync(brandsPath)) {
    console.error('Error: brands.json not found at', brandsPath);
    process.exit(1);
  }

  const brands = JSON.parse(fs.readFileSync(brandsPath, 'utf8'));
  console.log(`Found ${brands.length} brands to seed.`);

  for (let brandEntry of brands) {
    // Handle both simple string arrays and object arrays
    const brandData = typeof brandEntry === 'string' ? { name: brandEntry } : brandEntry;
    
    const name = brandData.name;
    const slug = brandData.slug || name.toLowerCase()
      .trim()
      .replace(/[\s_]+/g, '-')     // Replace spaces and underscores with -
      .replace(/[^\w-]+/g, '')     // Remove non-word characters except -
      .replace(/--+/g, '-');       // Replace multiple - with single -
    
    try {
      await prisma.brand.upsert({
        where: { slug: slug },
        update: {
          name: name,
          logoUrl: brandData.logoUrl || '',
          website: brandData.website || null,
          description: brandData.description || null,
          featured: brandData.featured || false,
        },
        create: {
          name: name,
          slug: slug,
          logoUrl: brandData.logoUrl || '',
          website: brandData.website || null,
          description: brandData.description || null,
          featured: brandData.featured || false,
        },
      });
      console.log(`✅ Seeded/Updated brand: ${name}`);
    } catch (error) {
      console.log(`❌ Failed to seed brand ${name}:`, error.message);
    }
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
