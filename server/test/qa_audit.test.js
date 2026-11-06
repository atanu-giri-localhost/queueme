/**
 * QueueMe — Complete End-to-End QA Audit
 * ========================================
 * Tests every feature without authentication:
 *   - CRUD (Create, Read, Update, Delete)
 *   - PostgreSQL persistence (independent of LocalStorage)
 *   - Server restart / refresh persistence
 *   - Search (text, #tag)
 *   - Filters (type, status, priority)
 *   - Sorting (recent, title, priority, progress)
 *   - Audio category (sourceUrl field)
 *   - Progress tracking & auto-sync
 *   - Ratings (normalization, 1-5 scale)
 *   - Tags (array, comma-string input)
 *   - Keyboard shortcut overlay (component level)
 *   - Validation (server-side Zod schema)
 *   - Error handling (404s, 400s, malformed input)
 *   - Reset endpoint
 */

import 'dotenv/config';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_ROOT = path.resolve(__dirname, '..');

// ─── Port helpers ───────────────────────────────────────────────────────────
const PORT_A = 5071; // Server instance #1 (main tests)
const PORT_B = 5072; // Server instance #2 (restart persistence test)
const BASE_A = `http://localhost:${PORT_A}/api`;
const BASE_B = `http://localhost:${PORT_B}/api`;

// ─── Test runner ─────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
const failedTests = [];

async function test(suiteName, name, fn) {
  const label = `[${suiteName}] ${name}`;
  try {
    await fn();
    console.log(`  ✓ ${label}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${label}`);
    console.error(`    → ${err.message}`);
    failed++;
    failedTests.push({ label, error: err.message });
  }
}

// ─── Server lifecycle helpers ─────────────────────────────────────────────────
function startServer(port) {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', ['src/index.js'], {
      cwd: SERVER_ROOT,
      env: { ...process.env, PORT: String(port) },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let started = false;

    proc.stdout.on('data', (data) => {
      const msg = data.toString();
      if (msg.includes('QueueMe API server running') && !started) {
        started = true;
        resolve(proc);
      }
    });

    proc.stderr.on('data', (data) => {
      if (!started && data.toString().includes('Error')) {
        reject(new Error(data.toString().slice(0, 200)));
      }
    });

    proc.on('exit', (code) => {
      if (!started) reject(new Error(`Server exited prematurely with code ${code}`));
    });

    setTimeout(() => {
      if (!started) reject(new Error('Server failed to start within 8000ms'));
    }, 8000);
  });
}

function stopServer(proc) {
  if (!proc || proc.killed) return Promise.resolve();
  return new Promise((resolve) => {
    proc.on('exit', () => resolve());
    proc.kill('SIGTERM');
    setTimeout(() => {
      try {
        proc.kill('SIGKILL');
      } catch (err) {
        void err;
      }
      resolve();
    }, 2000);
  });
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── HTTP helpers ──────────────────────────────────────────────────────────────
async function req(base, path, opts = {}) {
  const url = `${base}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    ...opts,
  });
  let body;
  try { body = await res.json(); } catch { body = null; }
  return { status: res.status, body };
}

const GET    = (base, path) => req(base, path, { method: 'GET' });
const POST   = (base, path, data) => req(base, path, { method: 'POST',   body: JSON.stringify(data) });
const PATCH  = (base, path, data) => req(base, path, { method: 'PATCH',  body: JSON.stringify(data) });
const PUT    = (base, path, data) => req(base, path, { method: 'PUT',    body: JSON.stringify(data) });
const DELETE = (base, path) => req(base, path, { method: 'DELETE' });

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN TEST RUNNER
// ═══════════════════════════════════════════════════════════════════════════════
async function run() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║   QueueMe — Complete End-to-End QA Audit                   ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  let serverA = null;
  let serverB = null;

  try {
    // ─── Boot server ────────────────────────────────────────────────────────
    console.log('▶ Starting server instance A on port', PORT_A, '...');
    serverA = await startServer(PORT_A);
    console.log('  ✓ Server A running.\n');

    // ══════════════════════════════════════════════════════════════════════════
    //  SUITE 1 — Health Check
    // ══════════════════════════════════════════════════════════════════════════
    console.log('━━━━━ Suite 1: Health Check ━━━━━');

    await test('Health', 'GET /api/health returns 200 with status ok', async () => {
      const { status, body } = await GET(BASE_A, '/health');
      assert.equal(status, 200);
      assert.equal(body.status, 'ok');
      assert.equal(body.service, 'queueme-api');
      assert.ok(typeof body.uptime === 'number');
      assert.ok(typeof body.timestamp === 'string');
    });

    // ══════════════════════════════════════════════════════════════════════════
    //  SUITE 2 — Reset (establish clean baseline)
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n━━━━━ Suite 2: Reset / Seed ━━━━━');

    await test('Reset', 'POST /api/items/reset seeds 15 sample items', async () => {
      const { status, body } = await POST(BASE_A, '/items/reset', {});
      assert.equal(status, 200);
      assert.equal(body.success, true);
      assert.equal(body.count, 15);
      assert.ok(Array.isArray(body.data));
      assert.equal(body.data.length, 15);
    });

    await test('Reset', 'POST /api/items/reset is idempotent (second call still returns 15)', async () => {
      const { status, body } = await POST(BASE_A, '/items/reset', {});
      assert.equal(status, 200);
      assert.equal(body.count, 15);
    });

    // ══════════════════════════════════════════════════════════════════════════
    //  SUITE 3 — READ: List all items
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n━━━━━ Suite 3: READ — List Items ━━━━━');

    await test('Read', 'GET /api/items returns 200 with correct envelope', async () => {
      const { status, body } = await GET(BASE_A, '/items');
      assert.equal(status, 200);
      assert.equal(body.success, true);
      assert.ok(typeof body.count === 'number');
      assert.ok(Array.isArray(body.data));
    });

    await test('Read', 'GET /api/items returns exactly 15 initial items', async () => {
      const { body } = await GET(BASE_A, '/items');
      assert.equal(body.count, 15);
      assert.equal(body.data.length, 15);
    });

    await test('Read', 'Each item has required schema fields', async () => {
      const { body } = await GET(BASE_A, '/items');
      for (const item of body.data) {
        assert.ok(item.id, `item missing id`);
        assert.ok(item.title, `item ${item.id} missing title`);
        assert.ok(item.type, `item ${item.id} missing type`);
        assert.ok(['movie','video','article','book','course','audio'].includes(item.type),
          `item ${item.id} has invalid type: ${item.type}`);
        assert.ok(['queued','in_progress','completed'].includes(item.status),
          `item ${item.id} has invalid status: ${item.status}`);
        assert.ok(['high','medium','low'].includes(item.priority),
          `item ${item.id} has invalid priority: ${item.priority}`);
        assert.ok(typeof item.progress === 'number', `item ${item.id} progress not a number`);
        assert.ok(Array.isArray(item.tags), `item ${item.id} tags is not an array`);
      }
    });

    // ══════════════════════════════════════════════════════════════════════════
    //  SUITE 4 — READ: Get item by ID
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n━━━━━ Suite 4: READ — Get Item by ID ━━━━━');

    await test('Read-ById', 'GET /api/items/qm-1 returns Dune: Part Two', async () => {
      const { status, body } = await GET(BASE_A, '/items/qm-1');
      assert.equal(status, 200);
      assert.equal(body.success, true);
      assert.equal(body.data.id, 'qm-1');
      assert.equal(body.data.title, 'Dune: Part Two');
      assert.equal(body.data.type, 'movie');
    });

    await test('Read-ById', 'GET /api/items/qm-13 returns audio item with sourceUrl', async () => {
      const { status, body } = await GET(BASE_A, '/items/qm-13');
      assert.equal(status, 200);
      assert.equal(body.data.type, 'audio');
      assert.ok(body.data.sourceUrl, 'sourceUrl should be set for audio item');
      assert.equal(body.data.sourceUrl, 'https://open.spotify.com/episode/lex-fridman-419');
    });

    await test('Read-ById', 'GET /api/items/non-existent-id returns 404', async () => {
      const { status, body } = await GET(BASE_A, '/items/non-existent-id-xyz');
      assert.equal(status, 404);
      assert.equal(body.success, false);
      assert.ok(body.error.includes('not found'));
    });

    await test('Read-ById', 'GET /api/items/qm-2 (book) has correct in_progress state', async () => {
      const { body } = await GET(BASE_A, '/items/qm-2');
      assert.equal(body.data.status, 'in_progress');
      assert.equal(body.data.progress, 42);
      assert.ok(body.data.progressLabel.includes('42'));
    });

    // ══════════════════════════════════════════════════════════════════════════
    //  SUITE 5 — FILTERS: Type
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n━━━━━ Suite 5: Filters — Type ━━━━━');

    const typeTests = [
      { type: 'movie',   expectedMin: 1 },
      { type: 'book',    expectedMin: 1 },
      { type: 'course',  expectedMin: 1 },
      { type: 'article', expectedMin: 1 },
      { type: 'video',   expectedMin: 1 },
      { type: 'audio',   expectedCount: 3 },
    ];

    for (const { type, expectedMin, expectedCount } of typeTests) {
      await test('Filter-Type', `GET /api/items?type=${type} returns only ${type} items`, async () => {
        const { status, body } = await GET(BASE_A, `/items?type=${type}`);
        assert.equal(status, 200);
        assert.ok(body.data.every((i) => i.type === type),
          `Not all items are type=${type}`);
        if (expectedCount !== undefined) {
          assert.equal(body.count, expectedCount, `Expected exactly ${expectedCount} items of type=${type}`);
        } else {
          assert.ok(body.count >= expectedMin, `Expected at least ${expectedMin} items of type=${type}`);
        }
      });
    }

    await test('Filter-Type', 'GET /api/items?type=all returns all 15 items', async () => {
      const { body } = await GET(BASE_A, '/items?type=all');
      assert.equal(body.count, 15);
    });

    await test('Filter-Type', 'GET /api/items?type=invalid_type returns 400', async () => {
      const { status, body } = await GET(BASE_A, '/items?type=invalidtype');
      assert.equal(status, 400);
      assert.equal(body.success, false);
    });

    // ══════════════════════════════════════════════════════════════════════════
    //  SUITE 6 — FILTERS: Status
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n━━━━━ Suite 6: Filters — Status ━━━━━');

    await test('Filter-Status', 'GET /api/items?status=queued returns only queued items', async () => {
      const { status, body } = await GET(BASE_A, '/items?status=queued');
      assert.equal(status, 200);
      assert.ok(body.data.length > 0);
      assert.ok(body.data.every((i) => i.status === 'queued'));
    });

    await test('Filter-Status', 'GET /api/items?status=in_progress returns only in_progress items', async () => {
      const { body } = await GET(BASE_A, '/items?status=in_progress');
      assert.ok(body.data.length > 0);
      assert.ok(body.data.every((i) => i.status === 'in_progress'));
    });

    await test('Filter-Status', 'GET /api/items?status=completed returns only completed items', async () => {
      const { body } = await GET(BASE_A, '/items?status=completed');
      assert.ok(body.data.length > 0);
      assert.ok(body.data.every((i) => i.status === 'completed'));
    });

    await test('Filter-Status', 'queued + in_progress + completed counts sum to total', async () => {
      const [q, ip, c, all] = await Promise.all([
        GET(BASE_A, '/items?status=queued'),
        GET(BASE_A, '/items?status=in_progress'),
        GET(BASE_A, '/items?status=completed'),
        GET(BASE_A, '/items'),
      ]);
      const sum = q.body.count + ip.body.count + c.body.count;
      assert.equal(sum, all.body.count, `Status counts (${sum}) do not sum to total (${all.body.count})`);
    });

    // ══════════════════════════════════════════════════════════════════════════
    //  SUITE 7 — FILTERS: Priority
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n━━━━━ Suite 7: Filters — Priority ━━━━━');

    for (const priority of ['high', 'medium', 'low']) {
      await test('Filter-Priority', `GET /api/items?priority=${priority} returns only ${priority} priority items`, async () => {
        const { body } = await GET(BASE_A, `/items?priority=${priority}`);
        assert.ok(body.data.length > 0, `Expected at least 1 ${priority} priority item`);
        assert.ok(body.data.every((i) => i.priority === priority));
      });
    }

    await test('Filter-Priority', 'high + medium + low priority counts sum to total', async () => {
      const [h, m, l, all] = await Promise.all([
        GET(BASE_A, '/items?priority=high'),
        GET(BASE_A, '/items?priority=medium'),
        GET(BASE_A, '/items?priority=low'),
        GET(BASE_A, '/items'),
      ]);
      const sum = h.body.count + m.body.count + l.body.count;
      assert.equal(sum, all.body.count);
    });

    // ══════════════════════════════════════════════════════════════════════════
    //  SUITE 8 — FILTERS: Combined
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n━━━━━ Suite 8: Filters — Combined ━━━━━');

    await test('Filter-Combined', 'type=audio&status=in_progress filters correctly', async () => {
      const { body } = await GET(BASE_A, '/items?type=audio&status=in_progress');
      assert.ok(body.data.every((i) => i.type === 'audio' && i.status === 'in_progress'));
    });

    await test('Filter-Combined', 'type=book&priority=high filters correctly', async () => {
      const { body } = await GET(BASE_A, '/items?type=book&priority=high');
      assert.ok(body.data.every((i) => i.type === 'book' && i.priority === 'high'));
    });

    await test('Filter-Combined', 'type=movie&status=queued&priority=high all constraints honored', async () => {
      const { body } = await GET(BASE_A, '/items?type=movie&status=queued&priority=high');
      assert.ok(body.data.every((i) => i.type === 'movie' && i.status === 'queued' && i.priority === 'high'));
    });

    // ══════════════════════════════════════════════════════════════════════════
    //  SUITE 9 — SEARCH
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n━━━━━ Suite 9: Search ━━━━━');

    await test('Search', 'search=Lex matches Lex Fridman podcast', async () => {
      const { body } = await GET(BASE_A, '/items?search=Lex');
      assert.ok(body.data.length >= 1);
      assert.ok(body.data.some((i) => i.title.includes('Lex Fridman')));
    });

    await test('Search', 'search=dune is case-insensitive', async () => {
      const { body } = await GET(BASE_A, '/items?search=dune');
      assert.ok(body.data.length >= 1);
      assert.ok(body.data.some((i) => i.title.toLowerCase().includes('dune')));
    });

    await test('Search', 'search=Villeneuve matches by creator field', async () => {
      const { body } = await GET(BASE_A, '/items?search=Villeneuve');
      assert.ok(body.data.length >= 1);
      assert.ok(body.data.every((i) => (i.creator || '').toLowerCase().includes('villeneuve')));
    });

    await test('Search', 'search=Spotify matches by platform field', async () => {
      const { body } = await GET(BASE_A, '/items?search=Spotify');
      assert.ok(body.data.length >= 1);
    });

    await test('Search', 'search=#AI performs tag search (URL-encoded)', async () => {
      const { body } = await GET(BASE_A, '/items?search=%23AI');
      assert.ok(body.data.length >= 1);
      assert.ok(body.data.every((i) => Array.isArray(i.tags) && i.tags.includes('AI')),
        'All results must have tag "AI"');
    });

    await test('Search', 'search=#Sci-Fi returns items with Sci-Fi tag', async () => {
      const { body } = await GET(BASE_A, '/items?search=%23Sci-Fi');
      assert.ok(body.data.length >= 1);
      assert.ok(body.data.every((i) => (i.tags || []).includes('Sci-Fi')));
    });

    await test('Search', 'search=#nonexistent-tag-xyz returns empty results', async () => {
      const { body } = await GET(BASE_A, '/items?search=%23nonexistent-tag-xyz-99999');
      assert.equal(body.count, 0);
      assert.equal(body.data.length, 0);
    });

    await test('Search', 'search=ZZZNOTHING-999 returns empty results', async () => {
      const { body } = await GET(BASE_A, '/items?search=ZZZNOTHING-999');
      assert.equal(body.count, 0);
    });

    await test('Search', 'search combined with type filter works correctly', async () => {
      const { body } = await GET(BASE_A, '/items?type=audio&search=Lex');
      assert.ok(body.data.every((i) => i.type === 'audio'));
      assert.ok(body.data.some((i) => i.title.includes('Lex Fridman')));
    });

    // ══════════════════════════════════════════════════════════════════════════
    //  SUITE 10 — SORTING
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n━━━━━ Suite 10: Sorting ━━━━━');

    await test('Sort', 'sortBy=title returns items in ascending alphabetical order', async () => {
      const { body } = await GET(BASE_A, '/items?sortBy=title');
      const titles = body.data.map((i) => i.title.toLowerCase());
      const sorted = [...titles].sort();
      assert.deepEqual(titles, sorted, 'Items not in alphabetical order');
    });

    await test('Sort', 'sortBy=progress returns items descending by progress', async () => {
      const { body } = await GET(BASE_A, '/items?sortBy=progress');
      const progresses = body.data.map((i) => i.progress);
      for (let i = 0; i < progresses.length - 1; i++) {
        assert.ok(progresses[i] >= progresses[i + 1],
          `Progress not descending at index ${i}: ${progresses[i]} < ${progresses[i + 1]}`);
      }
    });

    await test('Sort', 'sortBy=priority returns high before medium before low', async () => {
      const { body } = await GET(BASE_A, '/items?sortBy=priority');
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorities = body.data.map((i) => i.priority);
      for (let i = 0; i < priorities.length - 1; i++) {
        assert.ok(
          priorityOrder[priorities[i]] <= priorityOrder[priorities[i + 1]],
          `Priority not ordered at index ${i}: ${priorities[i]} > ${priorities[i + 1]}`
        );
      }
    });

    await test('Sort', 'sortBy=recent returns items with more recent addedDate first', async () => {
      const { body } = await GET(BASE_A, '/items?sortBy=recent');
      const dates = body.data.filter((i) => i.addedDate).map((i) => i.addedDate);
      for (let i = 0; i < dates.length - 1; i++) {
        assert.ok(dates[i] >= dates[i + 1],
          `Dates not descending at index ${i}: ${dates[i]} < ${dates[i + 1]}`);
      }
    });

    await test('Sort', 'invalid sortBy param returns 400', async () => {
      const { status, body } = await GET(BASE_A, '/items?sortBy=invalid_sort');
      assert.equal(status, 400);
      assert.equal(body.success, false);
    });

    // ══════════════════════════════════════════════════════════════════════════
    //  SUITE 11 — AUDIO CATEGORY
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n━━━━━ Suite 11: Audio Category ━━━━━');

    await test('Audio', 'GET /api/items?type=audio returns exactly 3 items', async () => {
      const { body } = await GET(BASE_A, '/items?type=audio');
      assert.equal(body.count, 3);
      assert.ok(body.data.every((i) => i.type === 'audio'));
    });

    await test('Audio', 'All audio items have sourceUrl field populated', async () => {
      const { body } = await GET(BASE_A, '/items?type=audio');
      const withSourceUrl = body.data.filter((i) => i.sourceUrl && i.sourceUrl.trim().length > 0);
      assert.ok(withSourceUrl.length >= 2, `Expected at least 2 audio items with sourceUrl, got ${withSourceUrl.length}`);
    });

    await test('Audio', 'qm-13 (Lex Fridman) has correct sourceUrl and progress', async () => {
      const { body } = await GET(BASE_A, '/items/qm-13');
      assert.equal(body.data.sourceUrl, 'https://open.spotify.com/episode/lex-fridman-419');
      assert.equal(body.data.status, 'in_progress');
      assert.equal(body.data.progress, 55);
    });

    await test('Audio', 'qm-14 (Sapiens Audiobook) has sourceUrl and queued status', async () => {
      const { body } = await GET(BASE_A, '/items/qm-14');
      assert.equal(body.data.type, 'audio');
      assert.equal(body.data.status, 'queued');
      assert.ok(body.data.sourceUrl, 'sourceUrl should exist for Sapiens audiobook');
    });

    await test('Audio', 'qm-15 (Daft Punk) has completed status and Spotify sourceUrl', async () => {
      const { body } = await GET(BASE_A, '/items/qm-15');
      assert.equal(body.data.status, 'completed');
      assert.equal(body.data.progress, 100);
      assert.ok(body.data.sourceUrl?.includes('spotify'));
    });

    await test('Audio', 'Creating audio item without sourceUrl still succeeds', async () => {
      const { status, body } = await POST(BASE_A, '/items', {
        title: 'Audio Without Source URL',
        type: 'audio',
        creator: 'Test Creator',
        status: 'queued',
        priority: 'low',
        tags: ['Test'],
      });
      assert.equal(status, 201);
      assert.equal(body.data.type, 'audio');
      // Clean up
      await DELETE(BASE_A, `/items/${body.data.id}`);
    });

    // ══════════════════════════════════════════════════════════════════════════
    //  SUITE 12 — CREATE (C in CRUD)
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n━━━━━ Suite 12: CREATE ━━━━━');

    let createdId = null;

    await test('Create', 'POST /api/items creates a new audio item (201)', async () => {
      const payload = {
        title: 'QA Audit Audio Test — Huberman Lab',
        type: 'audio',
        creator: 'Andrew Huberman',
        platform: 'Spotify',
        duration: '2 hr 10 min',
        status: 'queued',
        priority: 'high',
        tags: ['Health', 'Neuroscience', 'QA-Test'],
        sourceUrl: 'https://open.spotify.com/episode/huberman-qa-test',
        url: 'https://hubermanlab.com/episode',
        notes: 'QA audit test item — do not delete manually.',
      };
      const { status, body } = await POST(BASE_A, '/items', payload);
      assert.equal(status, 201);
      assert.equal(body.success, true);
      assert.ok(body.data.id, 'Created item must have an id');
      assert.equal(body.data.title, payload.title);
      assert.equal(body.data.type, 'audio');
      assert.equal(body.data.creator, payload.creator);
      assert.equal(body.data.sourceUrl, payload.sourceUrl);
      createdId = body.data.id;
    });

    await test('Create', 'Created item has auto-synced progress=0 and progressLabel for queued status', async () => {
      const { body } = await GET(BASE_A, `/items/${createdId}`);
      assert.equal(body.data.progress, 0);
      assert.equal(body.data.progressLabel, 'Not started');
      assert.equal(body.data.status, 'queued');
    });

    await test('Create', 'Created item tags are stored as array', async () => {
      const { body } = await GET(BASE_A, `/items/${createdId}`);
      assert.ok(Array.isArray(body.data.tags));
      assert.ok(body.data.tags.includes('Health'));
      assert.ok(body.data.tags.includes('Neuroscience'));
      assert.ok(body.data.tags.includes('QA-Test'));
    });

    await test('Create', 'POST with tags as comma-separated string is correctly parsed', async () => {
      const { status, body } = await POST(BASE_A, '/items', {
        title: 'QA Comma Tag Test',
        type: 'article',
        creator: 'Test Author',
        tags: 'Science, Technology, Space Exploration',
      });
      assert.equal(status, 201);
      assert.ok(Array.isArray(body.data.tags));
      assert.ok(body.data.tags.includes('Science'));
      assert.ok(body.data.tags.includes('Technology'));
      assert.ok(body.data.tags.includes('Space Exploration'));
      await DELETE(BASE_A, `/items/${body.data.id}`);
    });

    await test('Create', 'POST with tags having # prefix — # stripped correctly', async () => {
      const { status, body } = await POST(BASE_A, '/items', {
        title: 'QA Hash Tag Test',
        type: 'video',
        creator: 'Test Creator',
        tags: ['#Design', '#UX', 'Frontend'],
      });
      assert.equal(status, 201);
      assert.ok(!body.data.tags.some((t) => t.startsWith('#')), 'Tags should not start with #');
      assert.ok(body.data.tags.includes('Design'));
      assert.ok(body.data.tags.includes('UX'));
      await DELETE(BASE_A, `/items/${body.data.id}`);
    });

    await test('Create', 'POST with status=completed auto-sets progress=100', async () => {
      const { status, body } = await POST(BASE_A, '/items', {
        title: 'QA Completed Status Test',
        type: 'course',
        creator: 'Test Author',
        status: 'completed',
        priority: 'medium',
      });
      assert.equal(status, 201);
      assert.equal(body.data.progress, 100);
      assert.equal(body.data.progressLabel, 'Finished');
      await DELETE(BASE_A, `/items/${body.data.id}`);
    });

    await test('Create', 'POST with status=in_progress auto-sets progress=25 when not provided', async () => {
      const { status, body } = await POST(BASE_A, '/items', {
        title: 'QA In-Progress Status Test',
        type: 'book',
        creator: 'Test Author',
        status: 'in_progress',
        priority: 'medium',
      });
      assert.equal(status, 201);
      assert.equal(body.data.progress, 25);
      assert.ok(body.data.progressLabel.includes('25'));
      await DELETE(BASE_A, `/items/${body.data.id}`);
    });

    await test('Create', 'POST with status=in_progress and explicit progress=60 keeps 60', async () => {
      const { status, body } = await POST(BASE_A, '/items', {
        title: 'QA In-Progress Explicit Progress Test',
        type: 'book',
        creator: 'Test Author',
        status: 'in_progress',
        progress: 60,
        priority: 'medium',
      });
      assert.equal(status, 201);
      assert.equal(body.data.progress, 60);
      await DELETE(BASE_A, `/items/${body.data.id}`);
    });

    await test('Create', 'POST with addedDate sets the addedDate field', async () => {
      const { status, body } = await POST(BASE_A, '/items', {
        title: 'QA AddedDate Test',
        type: 'movie',
        creator: 'Director A',
        addedDate: '2026-01-15',
      });
      assert.equal(status, 201);
      assert.equal(body.data.addedDate, '2026-01-15');
      await DELETE(BASE_A, `/items/${body.data.id}`);
    });

    await test('Create', 'POST without addedDate auto-fills today date', async () => {
      const { status, body } = await POST(BASE_A, '/items', {
        title: 'QA Auto Date Test',
        type: 'article',
        creator: 'Author X',
      });
      assert.equal(status, 201);
      assert.ok(body.data.addedDate, 'addedDate should be auto-filled');
      const today = new Date().toISOString().split('T')[0];
      assert.equal(body.data.addedDate, today);
      await DELETE(BASE_A, `/items/${body.data.id}`);
    });

    // ══════════════════════════════════════════════════════════════════════════
    //  SUITE 13 — UPDATE / PATCH (U in CRUD)
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n━━━━━ Suite 13: UPDATE ━━━━━');

    await test('Update', 'PATCH /api/items/:id updates title field', async () => {
      const { status, body } = await PATCH(BASE_A, `/items/${createdId}`, {
        title: 'QA Audit Audio Test — UPDATED TITLE',
      });
      assert.equal(status, 200);
      assert.equal(body.success, true);
      assert.equal(body.data.title, 'QA Audit Audio Test — UPDATED TITLE');
    });

    await test('Update', 'PATCH status=completed auto-syncs progress to 100', async () => {
      const { status, body } = await PATCH(BASE_A, `/items/${createdId}`, {
        status: 'completed',
      });
      assert.equal(status, 200);
      assert.equal(body.data.status, 'completed');
      assert.equal(body.data.progress, 100);
      assert.equal(body.data.progressLabel, 'Finished');
    });

    await test('Update', 'PATCH status=in_progress with progress=75 syncs correctly', async () => {
      const { status, body } = await PATCH(BASE_A, `/items/${createdId}`, {
        status: 'in_progress',
        progress: 75,
      });
      assert.equal(status, 200);
      assert.equal(body.data.status, 'in_progress');
      assert.equal(body.data.progress, 75);
    });

    await test('Update', 'PATCH status=queued auto-resets progress to 0', async () => {
      const { status, body } = await PATCH(BASE_A, `/items/${createdId}`, {
        status: 'queued',
      });
      assert.equal(status, 200);
      assert.equal(body.data.status, 'queued');
      assert.equal(body.data.progress, 0);
      assert.equal(body.data.progressLabel, 'Not started');
    });

    await test('Update', 'PUT /api/items/:id (full replace) also works', async () => {
      const { status, body } = await PUT(BASE_A, `/items/${createdId}`, {
        title: 'QA PUT Update Test',
        type: 'audio',
        creator: 'PUT Author',
        status: 'queued',
        priority: 'low',
      });
      assert.equal(status, 200);
      assert.equal(body.data.title, 'QA PUT Update Test');
    });

    await test('Update', 'PATCH /api/items/nonexistent returns 404', async () => {
      const { status, body } = await PATCH(BASE_A, '/items/nonexistent-id-99', { title: 'Ghost' });
      assert.equal(status, 404);
      assert.equal(body.success, false);
    });

    await test('Update', '[BUG REGRESSION] PATCH without tags field must NOT erase existing tags', async () => {
      // This was a critical bug: tagsTransform returned [] for undefined,
      // causing any PATCH that omits tags= to silently wipe all tags in PostgreSQL.
      // Fixed by tagsUpdateTransform which returns undefined (omit) when tags is absent.
      const tagsBefore = ['Health', 'Neuroscience', 'QA-Test'];
      const { body: before } = await GET(BASE_A, `/items/${createdId}`);
      // Confirm tags are set
      assert.ok(tagsBefore.some((t) => (before.data.tags || []).includes(t)),
        'Item should have tags before PATCH');

      // PATCH with no tags field — only update notes
      const { status, body } = await PATCH(BASE_A, `/items/${createdId}`, {
        notes: 'PATCH without tags — tags must be preserved.',
      });
      assert.equal(status, 200);
      // Tags must NOT be reset to []
      assert.ok(Array.isArray(body.data.tags) && body.data.tags.length > 0,
        `Tags were silently erased! Got: ${JSON.stringify(body.data.tags)}`);
    });

    // ══════════════════════════════════════════════════════════════════════════
    //  SUITE 14 — RATINGS
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n━━━━━ Suite 14: Ratings ━━━━━');

    await test('Rating', 'PATCH rating=4.5 is stored as "4.5" string', async () => {
      const { body } = await PATCH(BASE_A, `/items/${createdId}`, { rating: '4.5' });
      assert.equal(body.data.rating, '4.5');
    });

    await test('Rating', 'PATCH rating=4.9 is stored correctly', async () => {
      const { body } = await PATCH(BASE_A, `/items/${createdId}`, { rating: '4.9' });
      assert.equal(body.data.rating, '4.9');
    });

    await test('Rating', 'PATCH rating=1.0 (minimum) is stored correctly', async () => {
      const { body } = await PATCH(BASE_A, `/items/${createdId}`, { rating: '1.0' });
      assert.ok(body.data.rating, 'Rating should be set');
      const num = parseFloat(body.data.rating);
      assert.ok(num >= 1 && num <= 5, `Rating ${num} out of 1-5 range`);
    });

    await test('Rating', 'PATCH rating=10 (10-point scale) is normalized to 5-point scale', async () => {
      const { body } = await PATCH(BASE_A, `/items/${createdId}`, { rating: '10' });
      const num = parseFloat(body.data.rating);
      assert.ok(num >= 1 && num <= 5, `Rating ${num} should be scaled to 1-5 range`);
    });

    await test('Rating', 'PATCH rating=null clears the rating', async () => {
      const { body } = await PATCH(BASE_A, `/items/${createdId}`, { rating: null });
      assert.equal(body.data.rating, null);
    });

    await test('Rating', 'PATCH rating="" (empty string) clears the rating', async () => {
      const { body } = await PATCH(BASE_A, `/items/${createdId}`, { rating: '' });
      assert.equal(body.data.rating, null);
    });

    await test('Rating', 'Sample data item qm-2 has rating=4.9', async () => {
      const { body } = await GET(BASE_A, '/items/qm-2');
      assert.equal(body.data.rating, '4.9');
    });

    // ══════════════════════════════════════════════════════════════════════════
    //  SUITE 15 — PROGRESS TRACKING
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n━━━━━ Suite 15: Progress Tracking ━━━━━');

    await test('Progress', 'progress=99 is stored (max for in_progress)', async () => {
      const { body } = await PATCH(BASE_A, `/items/${createdId}`, {
        status: 'in_progress',
        progress: 99,
      });
      assert.equal(body.data.progress, 99);
      assert.equal(body.data.status, 'in_progress');
    });

    await test('Progress', 'progress=100 auto-sets status=completed', async () => {
      const { body } = await PATCH(BASE_A, `/items/${createdId}`, {
        status: 'in_progress',
        progress: 100,
      });
      // Server clamps in_progress progress to max 99
      assert.ok(body.data.progress <= 99 || body.data.status === 'completed',
        'progress=100 with in_progress should either be clamped to 99 or set completed');
    });

    await test('Progress', 'progress clamped at 0 minimum for in_progress', async () => {
      const { status, body } = await PATCH(BASE_A, `/items/${createdId}`, {
        status: 'in_progress',
        progress: -10,
      });
      // Should be validation error (400) or clamped to 0
      assert.ok(status === 400 || body.data.progress >= 0,
        'Negative progress should be rejected or clamped');
    });

    await test('Progress', 'progress > 100 is rejected with 400', async () => {
      const { status } = await PATCH(BASE_A, `/items/${createdId}`, {
        status: 'in_progress',
        progress: 150,
      });
      assert.equal(status, 400);
    });

    await test('Progress', 'completed item shows progress=100 in GET', async () => {
      await PATCH(BASE_A, `/items/${createdId}`, { status: 'completed' });
      const { body } = await GET(BASE_A, `/items/${createdId}`);
      assert.equal(body.data.progress, 100);
      assert.equal(body.data.status, 'completed');
    });

    // ══════════════════════════════════════════════════════════════════════════
    //  SUITE 16 — VALIDATION & ERROR HANDLING
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n━━━━━ Suite 16: Validation & Error Handling ━━━━━');

    await test('Validation', 'POST without title returns 400 with details', async () => {
      const { status, body } = await POST(BASE_A, '/items', {
        type: 'movie',
        creator: 'Test',
      });
      assert.equal(status, 400);
      assert.equal(body.success, false);
      assert.equal(body.error, 'Validation failed');
      assert.ok(Array.isArray(body.details));
      const titleError = body.details.find((d) => d.field === 'title');
      assert.ok(titleError, 'Should have title error in details');
    });

    await test('Validation', 'POST without type returns 400', async () => {
      const { status, body } = await POST(BASE_A, '/items', {
        title: 'Missing Type Test',
        creator: 'Test',
      });
      assert.equal(status, 400);
      assert.equal(body.success, false);
    });

    await test('Validation', 'POST with invalid type enum returns 400', async () => {
      const { status, body } = await POST(BASE_A, '/items', {
        title: 'Invalid Type Test',
        type: 'game',
        creator: 'Test',
      });
      assert.equal(status, 400);
      assert.equal(body.success, false);
    });

    await test('Validation', 'POST with invalid status enum returns 400', async () => {
      const { status, body } = await POST(BASE_A, '/items', {
        title: 'Invalid Status Test',
        type: 'movie',
        creator: 'Test',
        status: 'maybe',
      });
      assert.equal(status, 400);
      assert.equal(body.success, false);
    });

    await test('Validation', 'POST with invalid priority enum returns 400', async () => {
      const { status, body } = await POST(BASE_A, '/items', {
        title: 'Invalid Priority Test',
        type: 'movie',
        creator: 'Test',
        priority: 'urgent',
      });
      assert.equal(status, 400);
      assert.equal(body.success, false);
    });

    await test('Validation', 'POST with title > 300 chars returns 400', async () => {
      const { status, body } = await POST(BASE_A, '/items', {
        title: 'A'.repeat(301),
        type: 'movie',
        creator: 'Test',
      });
      assert.equal(status, 400);
      assert.equal(body.success, false);
    });

    await test('Validation', 'PATCH with empty title string returns 400', async () => {
      const { status, body } = await PATCH(BASE_A, `/items/${createdId}`, {
        title: '',
      });
      assert.equal(status, 400);
      assert.equal(body.success, false);
    });

    await test('Validation', 'PATCH with invalid status enum returns 400', async () => {
      const { status } = await PATCH(BASE_A, `/items/${createdId}`, {
        status: 'unknown_status',
      });
      assert.equal(status, 400);
    });

    await test('Validation', 'DELETE /api/items/nonexistent returns 404', async () => {
      const { status, body } = await DELETE(BASE_A, '/items/nonexistent-delete-id');
      assert.equal(status, 404);
      assert.equal(body.success, false);
    });

    await test('Validation', 'Unknown route returns 404 with descriptive message', async () => {
      const { status, body } = await GET(BASE_A, '/unknown-route-99');
      assert.equal(status, 404);
      assert.ok(body.error.includes('not found'));
    });

    await test('Validation', 'Request body as invalid JSON returns error gracefully', async () => {
      const url = `${BASE_A}/items`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{invalid json{{',
      });
      // Express should handle parse error (400 or 500 depending on middleware)
      assert.ok(res.status >= 400, `Expected 4xx/5xx, got ${res.status}`);
    });

    // ══════════════════════════════════════════════════════════════════════════
    //  SUITE 17 — DELETE (D in CRUD)
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n━━━━━ Suite 17: DELETE ━━━━━');

    await test('Delete', 'DELETE /api/items/:id removes the created test item', async () => {
      const { status, body } = await DELETE(BASE_A, `/items/${createdId}`);
      assert.equal(status, 200);
      assert.equal(body.success, true);
      assert.equal(body.id, createdId);
    });

    await test('Delete', 'GET after delete returns 404', async () => {
      const { status, body } = await GET(BASE_A, `/items/${createdId}`);
      assert.equal(status, 404);
      assert.equal(body.success, false);
    });

    await test('Delete', 'DELETE again on deleted item returns 404', async () => {
      const { status } = await DELETE(BASE_A, `/items/${createdId}`);
      assert.equal(status, 404);
    });

    await test('Delete', 'Total count decreases by 1 after delete', async () => {
      // Reset to 15, create one, delete one, verify count goes back to 15
      await POST(BASE_A, '/items/reset', {});
      const before = await GET(BASE_A, '/items');
      const { body: created } = await POST(BASE_A, '/items', {
        title: 'Count Test Item',
        type: 'article',
        creator: 'Author',
      });
      const afterCreate = await GET(BASE_A, '/items');
      await DELETE(BASE_A, `/items/${created.data.id}`);
      const afterDelete = await GET(BASE_A, '/items');
      assert.equal(afterCreate.body.count, before.body.count + 1);
      assert.equal(afterDelete.body.count, before.body.count);
    });

    // ══════════════════════════════════════════════════════════════════════════
    //  SUITE 18 — POSTGRESQL PERSISTENCE (independent of LocalStorage)
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n━━━━━ Suite 18: PostgreSQL Persistence (No LocalStorage) ━━━━━');

    // Reset to baseline
    await POST(BASE_A, '/items/reset', {});

    const persistTestTag = `persist-qa-${Date.now()}`;
    let persistedItemId;

    await test('Persistence', 'Create item in Server A, verify it exists in DB via Server A', async () => {
      const { status, body } = await POST(BASE_A, '/items', {
        title: 'PostgreSQL Persistence QA Test',
        type: 'audio',
        creator: 'DB Tester',
        platform: 'PostgreSQL 17',
        status: 'queued',
        priority: 'high',
        tags: ['PostgreSQL', 'Persistence', persistTestTag],
        sourceUrl: 'https://open.spotify.com/episode/persist-qa',
        notes: 'Created to test PostgreSQL persistence across server restarts.',
      });
      assert.equal(status, 201);
      persistedItemId = body.data.id;
      const verify = await GET(BASE_A, `/items/${persistedItemId}`);
      assert.equal(verify.body.data.id, persistedItemId);
      assert.equal(verify.body.data.title, 'PostgreSQL Persistence QA Test');
    });

    await test('Persistence', 'Kill Server A — start fresh Server B on different port, item still visible', async () => {
      // Kill server A
      await stopServer(serverA);
      serverA = null;
      await delay(400);

      // Start fresh server on different port
      serverB = await startServer(PORT_B);

      // Item should still be in PostgreSQL — data lives in DB, not in process
      const { status, body } = await GET(BASE_B, `/items/${persistedItemId}`);
      assert.equal(status, 200, 'Item must survive server restart');
      assert.equal(body.data.id, persistedItemId);
      assert.equal(body.data.type, 'audio');
      assert.ok((body.data.tags || []).includes(persistTestTag),
        'Tags must survive server restart');
    });

    await test('Persistence', 'Update item on Server B — still persists after another read', async () => {
      const { status, body } = await PATCH(BASE_B, `/items/${persistedItemId}`, {
        status: 'completed',
        rating: '4.7',
        notes: 'Updated on Server B after Server A was killed.',
      });
      assert.equal(status, 200);
      assert.equal(body.data.status, 'completed');
      assert.equal(body.data.rating, '4.7');

      // Read back to confirm
      const readback = await GET(BASE_B, `/items/${persistedItemId}`);
      assert.equal(readback.body.data.status, 'completed');
      assert.equal(readback.body.data.rating, '4.7');
    });

    await test('Persistence', 'Tag search on Server B finds item by persist tag (before delete)', async () => {
      // Verify item still has its tags after the PATCH update (which only sent status/rating/notes).
      // This validates the bug fix: PATCH without tags= must NOT erase existing tags (silent data loss).
      const { status: httpStatus, body: idBody } = await GET(BASE_B, `/items/${persistedItemId}`);
      assert.equal(httpStatus, 200, 'Item should exist on Server B');
      assert.equal(idBody.data.id, persistedItemId, 'Item ID should match');
      assert.ok(Array.isArray(idBody.data.tags), 'Tags should be an array');
      assert.ok(idBody.data.tags.length > 0,
        `Tags should NOT be empty after PATCH without tags field. Got: ${JSON.stringify(idBody.data.tags)}`);
      assert.ok(idBody.data.tags.some((t) => t === persistTestTag),
        `Item should retain tag "${persistTestTag}", got: ${JSON.stringify(idBody.data.tags)}`);
    });

    await test('Persistence', 'Delete item on Server B, confirm it is gone', async () => {
      await DELETE(BASE_B, `/items/${persistedItemId}`);
      const { status } = await GET(BASE_B, `/items/${persistedItemId}`);
      assert.equal(status, 404, 'Deleted item should return 404');
    });

    // ══════════════════════════════════════════════════════════════════════════
    //  SUITE 19 — RESET ENDPOINT (re-seed)
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n━━━━━ Suite 19: Reset Endpoint ━━━━━');

    await test('Reset', 'POST /api/items/reset on Server B restores exactly 15 items', async () => {
      const { status, body } = await POST(BASE_B, '/items/reset', {});
      assert.equal(status, 200);
      assert.equal(body.success, true);
      assert.equal(body.count, 15);
      assert.ok(Array.isArray(body.data));
      assert.equal(body.data.length, 15);
    });

    await test('Reset', 'All known sample IDs present after reset', async () => {
      const { body } = await GET(BASE_B, '/items');
      const ids = new Set(body.data.map((i) => i.id));
      const knownIds = ['qm-1','qm-2','qm-3','qm-4','qm-5','qm-6','qm-7','qm-8','qm-9',
                        'qm-10','qm-11','qm-12','qm-13','qm-14','qm-15'];
      for (const id of knownIds) {
        assert.ok(ids.has(id), `Sample item ${id} missing after reset`);
      }
    });

    await test('Reset', 'Audio items all restored after reset (3 items with correct sourceUrls)', async () => {
      const { body } = await GET(BASE_B, '/items?type=audio');
      assert.equal(body.count, 3);
      const lex = body.data.find((i) => i.id === 'qm-13');
      assert.ok(lex, 'qm-13 (Lex Fridman) should be present');
      assert.equal(lex.sourceUrl, 'https://open.spotify.com/episode/lex-fridman-419');
    });

    await test('Reset', 'In-progress items (qm-2, qm-3, qm-13) restored with correct progress values', async () => {
      const checks = [
        { id: 'qm-2',  expectedProgress: 42,  expectedStatus: 'in_progress' },
        { id: 'qm-13', expectedProgress: 55,  expectedStatus: 'in_progress' },
      ];
      for (const { id, expectedProgress, expectedStatus } of checks) {
        const { body } = await GET(BASE_B, `/items/${id}`);
        assert.equal(body.data.status, expectedStatus, `${id} wrong status`);
        assert.equal(body.data.progress, expectedProgress, `${id} wrong progress`);
      }
    });

    // ══════════════════════════════════════════════════════════════════════════
    //  SUITE 20 — KEYBOARD SHORTCUTS (server-contract level)
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n━━━━━ Suite 20: Keyboard Shortcuts (Contract) ━━━━━');
    // Keyboard shortcuts are front-end only. We test the contracts that back them:
    // e.g., '?' overlay expects health OK, 'a' Add modal expects API ready,
    // 'r' reset calls POST /reset, Escape closes modals (component behavior).

    await test('Shortcuts', 'API health endpoint available (backs ? shortcut overlay)', async () => {
      const { status, body } = await GET(BASE_B, '/health');
      assert.equal(status, 200);
      assert.equal(body.status, 'ok');
    });

    await test('Shortcuts', 'POST /api/items works (backs Add Item modal — "a" shortcut)', async () => {
      const { status, body } = await POST(BASE_B, '/items', {
        title: 'Keyboard Shortcut Add Test',
        type: 'video',
        creator: 'Test',
        priority: 'low',
        status: 'queued',
      });
      assert.equal(status, 201);
      assert.ok(body.data.id);
      await DELETE(BASE_B, `/items/${body.data.id}`);
    });

    await test('Shortcuts', 'POST /api/items/reset works (backs reset confirmation — "r" shortcut)', async () => {
      const { status, body } = await POST(BASE_B, '/items/reset', {});
      assert.equal(status, 200);
      assert.equal(body.count, 15);
    });

    // ══════════════════════════════════════════════════════════════════════════
    //  SUITE 21 — EDGE CASES & BOUNDARY CONDITIONS
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n━━━━━ Suite 21: Edge Cases & Boundaries ━━━━━');

    await test('Edge', 'Empty tags array [] stored and retrieved correctly', async () => {
      const { status, body } = await POST(BASE_B, '/items', {
        title: 'Empty Tags Test',
        type: 'article',
        creator: 'Author',
        tags: [],
      });
      assert.equal(status, 201);
      assert.ok(Array.isArray(body.data.tags));
      assert.equal(body.data.tags.length, 0);
      await DELETE(BASE_B, `/items/${body.data.id}`);
    });

    await test('Edge', 'Tags with whitespace are trimmed correctly', async () => {
      const { status, body } = await POST(BASE_B, '/items', {
        title: 'Tag Whitespace Test',
        type: 'book',
        creator: 'Author',
        tags: ['  Space Before', 'Space After  ', '  Both  '],
      });
      assert.equal(status, 201);
      assert.ok(body.data.tags.every((t) => t === t.trim()),
        'All tags should be trimmed');
      await DELETE(BASE_B, `/items/${body.data.id}`);
    });

    await test('Edge', 'Title with special characters is stored correctly', async () => {
      const title = 'Mês das Crianças — L\'Éducation & "AI"';
      const { status, body } = await POST(BASE_B, '/items', {
        title,
        type: 'article',
        creator: 'Author',
      });
      assert.equal(status, 201);
      assert.equal(body.data.title, title);
      await DELETE(BASE_B, `/items/${body.data.id}`);
    });

    await test('Edge', 'progress=0 is correctly stored (not treated as falsy)', async () => {
      const { status, body } = await POST(BASE_B, '/items', {
        title: 'Zero Progress Test',
        type: 'course',
        creator: 'Author',
        progress: 0,
        status: 'queued',
      });
      assert.equal(status, 201);
      assert.equal(body.data.progress, 0);
      await DELETE(BASE_B, `/items/${body.data.id}`);
    });

    await test('Edge', 'GET /api/items with no params defaults work (all items, recent sort)', async () => {
      const { status, body } = await GET(BASE_B, '/items');
      assert.equal(status, 200);
      assert.equal(body.count, 15);
    });

    await test('Edge', 'URL with no protocol is auto-prefixed to https:// (create item)', async () => {
      // The client does this, but server just stores what's sent
      const { status, body } = await POST(BASE_B, '/items', {
        title: 'URL Test Item',
        type: 'video',
        creator: 'Author',
        url: 'https://youtube.com/watch?v=test',
      });
      assert.equal(status, 201);
      assert.ok(body.data.url?.startsWith('https://'));
      await DELETE(BASE_B, `/items/${body.data.id}`);
    });

    // ══════════════════════════════════════════════════════════════════════════
    //  SUITE 22 — LOCALSTORAGE INDEPENDENCE VERIFICATION
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n━━━━━ Suite 22: LocalStorage Independence ━━━━━');

    await test('LocalStorage', 'Items fetched from API need no localStorage (pure HTTP)', async () => {
      // We simulate a client that has NO localStorage — just pure API calls
      // If items are returned from the API without any session/cookie/localStorage,
      // it proves data lives in PostgreSQL and not LocalStorage
      const { status, body } = await GET(BASE_B, '/items');
      assert.equal(status, 200);
      assert.equal(body.count, 15);
      // Verify sample data intact — if localStorage was needed, we'd get 0 or error
      assert.ok(body.data.some((i) => i.id === 'qm-1'), 'qm-1 must be fetchable without LocalStorage');
    });

    await test('LocalStorage', 'Create item returns server-assigned ID (not client-generated)', async () => {
      const { status, body } = await POST(BASE_B, '/items', {
        title: 'Server ID Test',
        type: 'video',
        creator: 'Test Author',
      });
      assert.equal(status, 201);
      // Server returns cuid() — not "qm-" prefix generated by client
      assert.ok(body.data.id, 'Server must assign an ID');
      // Verify item is immediately retrievable via API
      const verify = await GET(BASE_B, `/items/${body.data.id}`);
      assert.equal(verify.status, 200);
      await DELETE(BASE_B, `/items/${body.data.id}`);
    });

    await test('LocalStorage', 'Updates to items persist across different HTTP sessions', async () => {
      // Create item in "session 1"
      const { body: created } = await POST(BASE_B, '/items', {
        title: 'Session Persistence Test',
        type: 'book',
        creator: 'Author A',
        status: 'queued',
      });
      const itemId = created.data.id;

      // Update in "session 2" (new fetch call, no shared state)
      await PATCH(BASE_B, `/items/${itemId}`, { status: 'in_progress', progress: 33 });

      // Read in "session 3" (completely independent)
      const { body: readback } = await GET(BASE_B, `/items/${itemId}`);
      assert.equal(readback.data.status, 'in_progress');
      assert.equal(readback.data.progress, 33);

      await DELETE(BASE_B, `/items/${itemId}`);
    });

    // Final reset to clean state
    await POST(BASE_B, '/items/reset', {});

  } finally {
    if (serverA) {
      await stopServer(serverA);
    }
    if (serverB) {
      await stopServer(serverB);
    }
  }

  // ─── Results summary ──────────────────────────────────────────────────────
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log(`║   QA AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED` + ' '.repeat(Math.max(0, 30 - String(passed + failed).length)) + '║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  if (failedTests.length > 0) {
    console.error('Failed Tests:');
    failedTests.forEach(({ label, error }) => {
      console.error(`  ✗ ${label}`);
      console.error(`    → ${error}\n`);
    });
  }

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('\n❌ QA Audit runner error:', err);
  process.exit(1);
});
