const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const brands = [
  "Milwaukee", "ELT", "TEKLED", "Uzkabel", "Polisan", "Soudal",
  "Ventum", "KAS", "TYTAN", "HAYAT", "Mexmash", "Vero",
  "Somafix", "Elcon", "Sistem Plastik", "DigiTOP", "IEK", "Silk Plaster",
  "KEAZ", "NEOLIT", "KEAZ Optima", "CHAZ", "Devolt", "Philips",
  "Lezard", "LEDVANCE", "Unknown A Brand", "MMK-METIZ", "MEZ", "Paton",
  "Pulse", "Forsage", "Knauf", "Eleron", "LIT", "IMEX",
  "Spets Electrode", "ForceKraft", "KingTul", "Partner", "RockForce", "Megamix",
  "WMC Tools", "Terminus", "Duravit", "AKVO", "Universal", "Huaxin",
  "TLS-PROFI", "BIYOTI", "Heidelberg Materials", "Akkermann", "Decor Polimer", "Eurasia Lux",
  "K-Flex", "Penoplex", "Rofix", "RTP", "Plastherm", "ROLF",
  "Ubay", "Penetron", "Creative"
];

function generateSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

async function main() {
  console.log(`Start seeding ${brands.length} brands...`)
  let created = 0;
  for (const b of brands) {
    const slug = generateSlug(b);
    try {
      await prisma.brand.upsert({
        where: { slug: slug },
        update: {},
        create: {
          name: b,
          slug: slug,
        },
      })
      created++;
    } catch(err) {
      console.error(`Failed to seed ${b}: `, err.message)
    }
  }
  console.log(`Seeding finished. Added ${created}/${brands.length} brands.`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
