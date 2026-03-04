/**
 * Migration script: Assigns SKU to existing products that don't have one.
 * Uses the "GEN" (General) category as default.
 * Run with: npx ts-node prisma/seed-sku.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // Ensure GEN category exists
    const genCategory = await prisma.category.upsert({
        where: { code: 'GEN' },
        update: {},
        create: { name: 'General', code: 'GEN', lastSkuNumber: 0 },
    })

    // Find all products without a SKU
    const productsWithoutSku = await prisma.product.findMany({
        where: { sku: null },
        orderBy: { createdAt: 'asc' },
    })

    console.log(`Found ${productsWithoutSku.length} products without SKU`)

    for (const product of productsWithoutSku) {
        await prisma.$transaction(async (tx) => {
            // Atomically increment counter
            const [updated] = await tx.$queryRawUnsafe<{ lastSkuNumber: number }[]>(
                `UPDATE "Category" SET "lastSkuNumber" = "lastSkuNumber" + 1 WHERE "id" = $1 RETURNING "lastSkuNumber"`,
                genCategory.id,
            )

            const paddedNumber = String(updated.lastSkuNumber).padStart(6, '0')
            const sku = `${genCategory.code}-${paddedNumber}`

            await tx.product.update({
                where: { id: product.id },
                data: { sku, categoryId: genCategory.id },
            })

            console.log(`  ${product.name} -> ${sku}`)
        })
    }

    console.log('Done!')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
