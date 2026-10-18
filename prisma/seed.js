import { PrismaClient } from '@prisma/client';
import { INITIAL_ITEMS } from '../src/data/sampleData.js';

const prisma = new PrismaClient();

export async function seed() {
  console.log('🌱 Seeding database with initial QueueMe items...');

  // Clear existing items to allow idempotent seeding
  await prisma.item.deleteMany({});

  for (const item of INITIAL_ITEMS) {
    await prisma.item.create({
      data: {
        id: item.id,
        title: item.title,
        type: item.type,
        creator: item.creator || '',
        platform: item.platform || '',
        duration: item.duration || '',
        progress: typeof item.progress === 'number' ? item.progress : 0,
        progressLabel:
          item.progressLabel ||
          (item.status === 'completed'
            ? 'Finished'
            : item.status === 'queued'
              ? 'Not started'
              : `In progress (${item.progress ?? 0}%)`),
        status: item.status || 'queued',
        priority: item.priority || 'medium',
        releaseYear: item.releaseYear || null,
        rating: item.rating ? String(item.rating) : null,
        tags: Array.isArray(item.tags) ? item.tags : [],
        coverImage: item.coverImage || null,
        url: item.url || null,
        sourceUrl: item.sourceUrl || null,
        notes: item.notes || null,
        addedDate: item.addedDate || new Date().toISOString().split('T')[0],
      },
    });
  }

  const count = await prisma.item.count();
  console.log(`✅ Database seeded successfully with ${count} items.`);
}

seed()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
