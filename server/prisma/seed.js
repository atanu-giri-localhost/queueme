import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seed() {
  console.log('🌱 Checking database...');
  const count = await prisma.item.count();
  console.log(`✅ Database ready. Current items count: ${count}.`);
}

seed()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
