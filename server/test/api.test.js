import 'dotenv/config';
import request from 'supertest';
import assert from 'node:assert/strict';
import { app } from '../src/app.js';
import prisma from '../src/prisma.js';

async function runTests() {
  console.log('🧪 Starting QueueMe API automated tests...\n');
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}`);
      console.error(`    Error: ${err.message}`);
      failed++;
    }
  }

  let createdItemId = null;

  try {
    // 1. Health check
    await test('GET /api/health returns 200 and ok status', async () => {
      const res = await request(app).get('/api/health');
      assert.equal(res.status, 200);
      assert.equal(res.body.status, 'ok');
      assert.equal(res.body.service, 'queueme-api');
    });

    // 2. Create item with validated schema
    await test('POST /api/items creates new Audio item with validated schema', async () => {
      const payload = {
        title: 'Huberman Lab – Optimal Sleep Protocol',
        type: 'audio',
        creator: 'Andrew Huberman',
        platform: 'Spotify',
        duration: '2 hr 10 min',
        status: 'queued',
        priority: 'high',
        tags: ['Health', 'Neuroscience', 'Sleep'],
        sourceUrl: 'https://open.spotify.com/episode/huberman-sleep',
        url: 'https://hubermanlab.com/episode',
      };
      const res = await request(app).post('/api/items').send(payload);
      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.title, payload.title);
      assert.equal(res.body.data.type, 'audio');
      assert.equal(res.body.data.sourceUrl, payload.sourceUrl);
      assert.equal(res.body.data.progress, 0);
      assert.equal(res.body.data.progressLabel, 'Not started');
      createdItemId = res.body.data.id;
      assert.ok(createdItemId);
    });

    // 3. Validation errors on invalid inputs
    await test('POST /api/items rejects missing title with 400', async () => {
      const res = await request(app).post('/api/items').send({
        type: 'movie',
      });
      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error, 'Validation failed');
    });

    await test('POST /api/items rejects invalid type with 400', async () => {
      const res = await request(app).post('/api/items').send({
        title: 'Invalid Media Test',
        type: 'game', // not in valid enum
      });
      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
    });

    // 4. Retrieve item by ID
    await test('GET /api/items/:id returns created item with metadata', async () => {
      const res = await request(app).get(`/api/items/${createdItemId}`);
      assert.equal(res.status, 200);
      assert.equal(res.body.data.id, createdItemId);
      assert.equal(res.body.data.type, 'audio');
      assert.equal(res.body.data.sourceUrl, 'https://open.spotify.com/episode/huberman-sleep');
    });

    await test('GET /api/items/non-existent returns 404', async () => {
      const res = await request(app).get('/api/items/non-existent');
      assert.equal(res.status, 404);
      assert.equal(res.body.success, false);
    });

    // 5. List items
    await test('GET /api/items returns list containing created item', async () => {
      const res = await request(app).get('/api/items');
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));
      assert.ok(res.body.data.some((i) => i.id === createdItemId));
    });

    // 6. Category and search filtering
    await test('GET /api/items?type=audio filters accurately', async () => {
      const res = await request(app).get('/api/items?type=audio');
      assert.equal(res.status, 200);
      const allAudio = res.body.data.every((i) => i.type === 'audio');
      assert.ok(allAudio);
    });

    await test('GET /api/items?search=Huberman matches search query', async () => {
      const res = await request(app).get('/api/items?search=Huberman');
      assert.equal(res.status, 200);
      assert.ok(res.body.data.some((i) => i.id === createdItemId));
    });

    await test('GET /api/items?search=%23Sleep matches #Sleep tagged items', async () => {
      const res = await request(app).get('/api/items?search=%23Sleep');
      assert.equal(res.status, 200);
      assert.ok(res.body.data.some((i) => i.id === createdItemId));
    });

    // 7. Update item (PATCH)
    await test('PATCH /api/items/:id updates status and auto-syncs progress to 100 on completion', async () => {
      const res = await request(app)
        .patch(`/api/items/${createdItemId}`)
        .send({
          status: 'completed',
          rating: '4.9',
        });
      assert.equal(res.status, 200);
      assert.equal(res.body.data.status, 'completed');
      assert.equal(res.body.data.progress, 100);
      assert.equal(res.body.data.progressLabel, 'Finished');
      assert.equal(res.body.data.rating, '4.9');
    });

    // 8. Delete item
    await test('DELETE /api/items/:id deletes created item', async () => {
      const res = await request(app).delete(`/api/items/${createdItemId}`);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);

      // Verify it's gone
      const verifyRes = await request(app).get(`/api/items/${createdItemId}`);
      assert.equal(verifyRes.status, 404);
      createdItemId = null;
    });
  } finally {
    // If test failed before deleting created item, clean it up
    if (createdItemId) {
      try {
        await prisma.item.delete({ where: { id: createdItemId } });
      } catch (cleanupErr) {
        console.warn('Cleanup error:', cleanupErr.message);
      }
    }
    await prisma.$disconnect();
  }

  console.log(`\n🏁 Test Results: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test runner error:', err);
  process.exit(1);
});
