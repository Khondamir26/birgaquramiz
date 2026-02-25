import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const phone = process.env.ADMIN_PHONE
  const password = process.env.ADMIN_PASSWORD
  const name = process.env.ADMIN_NAME || 'Platform Admin'

  if (!phone || !password) {
    throw new Error('Set ADMIN_PHONE and ADMIN_PASSWORD environment variables')
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const admin = await prisma.user.upsert({
    where: { phone },
    update: {
      name,
      password: hashedPassword,
      role: 'ADMIN',
    },
    create: {
      name,
      phone,
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  console.log(`Admin ready: ${admin.phone} (${admin.id})`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
