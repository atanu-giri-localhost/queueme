import 'dotenv/config';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { apiService, ApiError } from '../../client/src/services/apiService.js';
import { prisma } from '../src/prisma.js';

const PORT = 5002;
process.env.VITE_API_URL = `http://localhost:${PORT}/api`;

function startServer() {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', ['server/src/index.js'], {
      env: { ...process.env, PORT: String(PORT) },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let started = false;

    proc.stdout.on('data', (data) => {
      if (data.toString().includes('QueueMe API server running') && !started) {
        started = true;
        resolve(proc);
      }
    });

    proc.on('exit', (code) => {
      if (!started) reject(new Error(`Server exited with code ${code}`));
    });

    setTimeout(() => {
      if (!started) reject(new Error('Server start timed out'));
    }, 5000);
  });
}

async function stopServer(proc) {
  if (!proc || proc.killed) return;
  return new Promise((resolve) => {
    proc.on('exit', () => resolve());
    proc.kill('SIGTERM');
    setTimeout(() => {
      try {
        proc.kill('SIGKILL');
      } catch {
        // ignore
      }
      resolve();
    }, 2000);
  });
}

async function runPhase2Tests() {
  console.log('🧪 ====================================================');
  console.log('🧪  QueueMe Phase 2: Frontend apiService & Persistence');
  console.log('🧪 ====================================================\n');

  let serverProc = null;
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

  try {
    serverProc = await startServer();

    // 1. Health check
    await test('apiService.checkHealth() connects to Express API', async () => {
      const health = await apiService.checkHealth();
      assert.equal(health.status, 'ok');
      assert.equal(health.service, 'queueme-api');
    });

    // 2. Reset items
    await test('apiService.resetItems() seeds PostgreSQL database', async () => {
      const items = await apiService.resetItems();
      assert.equal(items.length, 15);
    });

    // 3. Fetch items
    await test('apiService.fetchItems() retrieves all 15 items', async () => {
      const items = await apiService.fetchItems();
      assert.equal(items.length, 15);
      assert.ok(Array.isArray(items));
    });

    // 4. Audio filter & sourceUrl
    await test('apiService.fetchItems({ type: "audio" }) retrieves 3 audio items with sourceUrl', async () => {
      const audioItems = await apiService.fetchItems({ type: 'audio' });
      assert.equal(audioItems.length, 3);
      assert.ok(audioItems.every((i) => i.type === 'audio'));
      const lex = audioItems.find((i) => i.id === 'qm-13');
      assert.ok(lex);
      assert.equal(lex.sourceUrl, 'https://open.spotify.com/episode/lex-fridman-419');
    });

    // 5. Status filter
    await test('apiService.fetchItems({ status: "in_progress" }) filters properly', async () => {
      const inProgress = await apiService.fetchItems({ status: 'in_progress' });
      assert.ok(inProgress.length > 0);
      assert.ok(inProgress.every((i) => i.status === 'in_progress'));
    });

    // 6. Search filter (text and #tag)
    await test('apiService.fetchItems({ search: "Fridman" }) text search works', async () => {
      const results = await apiService.fetchItems({ search: 'Fridman' });
      assert.ok(results.length >= 1);
      assert.ok(results.some((i) => i.title.includes('Lex Fridman')));
    });

    await test('apiService.fetchItems({ search: "#AI" }) tag search works', async () => {
      const results = await apiService.fetchItems({ search: '#AI' });
      assert.ok(results.length >= 1);
      assert.ok(results.every((i) => i.tags.includes('AI')));
    });

    // 7. Create item
    let createdItem;
    await test('apiService.createItem() creates new Audio item with validated progress & tags', async () => {
      const payload = {
        title: 'Phase 2 Audio Podcast Test',
        type: 'audio',
        creator: 'Tim Ferriss',
        platform: 'Apple Podcasts',
        duration: '1 hr 30 min',
        status: 'queued',
        priority: 'high',
        tags: ['Productivity', 'Interviews'],
        sourceUrl: 'https://podcasts.apple.com/episode/phase-2-test',
        notes: 'Testing centralized apiService persistence to PostgreSQL.',
      };
      createdItem = await apiService.createItem(payload);
      assert.ok(createdItem.id);
      assert.equal(createdItem.title, payload.title);
      assert.equal(createdItem.type, 'audio');
      assert.equal(createdItem.sourceUrl, payload.sourceUrl);
      assert.equal(createdItem.progress, 0);
      assert.equal(createdItem.progressLabel, 'Not started');
    });

    // 8. Fetch by ID
    await test('apiService.fetchItemById() retrieves created item from PostgreSQL', async () => {
      const fetched = await apiService.fetchItemById(createdItem.id);
      assert.equal(fetched.id, createdItem.id);
      assert.equal(fetched.title, createdItem.title);
      assert.equal(fetched.sourceUrl, createdItem.sourceUrl);
    });

    // 9. Update item & progress synchronization
    await test('apiService.updateItem() updates status to completed and syncs progress to 100', async () => {
      const updated = await apiService.updateItem(createdItem.id, {
        status: 'completed',
        rating: '4.8',
        notes: 'Updated via apiService test',
      });
      assert.equal(updated.status, 'completed');
      assert.equal(updated.progress, 100);
      assert.equal(updated.progressLabel, 'Finished');
      assert.equal(updated.rating, '4.8');
    });

    // 10. Delete item
    await test('apiService.deleteItem() removes item from PostgreSQL', async () => {
      const res = await apiService.deleteItem(createdItem.id);
      assert.equal(res.success, true);
    });

    // 11. Error handling
    await test('apiService throws ApiError (404) for deleted/non-existent item', async () => {
      try {
        await apiService.fetchItemById(createdItem.id);
        assert.fail('Should have thrown ApiError');
      } catch (err) {
        assert.ok(err instanceof ApiError);
        assert.equal(err.status, 404);
      }
    });

    await test('apiService throws ApiError (400) for invalid item type validation', async () => {
      try {
        await apiService.createItem({
          title: 'Invalid Media Test',
          type: 'invalid_type',
        });
        assert.fail('Should have thrown ApiError');
      } catch (err) {
        assert.ok(err instanceof ApiError);
        assert.equal(err.status, 400);
        assert.ok(Array.isArray(err.details));
      }
    });

    // 12. Reset to clean initial data
    await test('apiService.resetItems() cleans up test data', async () => {
      const items = await apiService.resetItems();
      assert.equal(items.length, 15);
    });

  } finally {
    if (serverProc) {
      await stopServer(serverProc);
    }
    await prisma.$disconnect();
  }

  console.log(`\n🏁 Phase 2 Test Results: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) process.exit(1);
}

runPhase2Tests().catch((err) => {
  console.error('\n❌ Phase 2 test runner error:', err);
  process.exit(1);
});
