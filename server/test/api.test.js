import 'dotenv/config';
import request from 'supertest';
import assert from 'node:assert/strict';
import { app } from '../src/app.js';
import prisma from '../src/prisma.js';

async function runTests() {
  console.log('🧪 Starting QueueMe API & Auth automated tests...\n');
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

  const testEmailA = `test-user-a-${Date.now()}@example.com`;
  const testEmailB = `test-user-b-${Date.now()}@example.com`;
  const testPassword = 'Password123!';

  let tokenA = null;
  let userAId = null;
  let tokenB = null;
  let userBId = null;
  let createdItemId = null;

  try {
    // 1. Health check
    await test('GET /api/health returns 200 and ok status', async () => {
      const res = await request(app).get('/api/health');
      assert.equal(res.status, 200);
      assert.equal(res.body.status, 'ok');
      assert.equal(res.body.service, 'queueme-api');
    });

    // 2. Authentication: Registration
    await test('POST /api/auth/register registers user and returns JWT', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: testEmailA,
        password: testPassword,
        name: 'Test User A',
      });
      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.ok(res.body.token);
      assert.equal(res.body.user.email, testEmailA);
      assert.equal(res.body.user.name, 'Test User A');
      tokenA = res.body.token;
      userAId = res.body.user.id;
    });

    await test('POST /api/auth/register rejects duplicate email with 409', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: testEmailA,
        password: testPassword,
        name: 'Duplicate User',
      });
      assert.equal(res.status, 409);
      assert.equal(res.body.success, false);
    });

    await test('POST /api/auth/register validates short password with 400', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'short-pwd@example.com',
        password: '123',
      });
      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
    });

    // 3. Authentication: Login
    await test('POST /api/auth/login authenticates valid user', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testEmailA,
        password: testPassword,
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.token);
    });

    await test('POST /api/auth/login rejects invalid password with 401', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testEmailA,
        password: 'WrongPassword',
      });
      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
    });

    // 4. Authentication: Profile
    await test('GET /api/auth/me returns current user profile', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${tokenA}`);
      assert.equal(res.status, 200);
      assert.equal(res.body.user.email, testEmailA);
      assert.equal(res.body.user.name, 'Test User A');
    });

    // 5. Route Protection
    await test('GET /api/items rejects unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/items');
      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
    });

    // 6. User A Creates an Item
    await test('POST /api/items creates item attached to User A', async () => {
      const payload = {
        title: 'Huberman Lab – Optimal Sleep Protocol',
        type: 'audio',
        creator: 'Andrew Huberman',
        platform: 'Spotify',
        duration: '2 hr 10 min',
        status: 'queued',
        priority: 'high',
        tags: ['Health', 'Sleep'],
        sourceUrl: 'https://open.spotify.com/episode/huberman-sleep',
      };
      const res = await request(app)
        .post('/api/items')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(payload);
      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.userId, userAId);
      createdItemId = res.body.data.id;
      assert.ok(createdItemId);
    });

    // 7. Multi-User Isolation (User B cannot see User A's items)
    await test('Multi-user isolation: User B cannot access User A items', async () => {
      // Register User B
      const regRes = await request(app).post('/api/auth/register').send({
        email: testEmailB,
        password: testPassword,
        name: 'Test User B',
      });
      tokenB = regRes.body.token;
      userBId = regRes.body.user.id;

      // User B lists items -> must be empty
      const listRes = await request(app)
        .get('/api/items')
        .set('Authorization', `Bearer ${tokenB}`);
      assert.equal(listRes.status, 200);
      assert.equal(listRes.body.count, 0);
      assert.deepEqual(listRes.body.data, []);

      // User B tries to get User A's item -> 404
      const getItemRes = await request(app)
        .get(`/api/items/${createdItemId}`)
        .set('Authorization', `Bearer ${tokenB}`);
      assert.equal(getItemRes.status, 404);

      // User B tries to update User A's item -> 404
      const updateRes = await request(app)
        .patch(`/api/items/${createdItemId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ status: 'completed' });
      assert.equal(updateRes.status, 404);

      // User B tries to delete User A's item -> 404
      const deleteRes = await request(app)
        .delete(`/api/items/${createdItemId}`)
        .set('Authorization', `Bearer ${tokenB}`);
      assert.equal(deleteRes.status, 404);
    });

    // 8. User A updates and deletes their own item
    await test('PATCH /api/items/:id updates User A item', async () => {
      const res = await request(app)
        .patch(`/api/items/${createdItemId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'completed' });
      assert.equal(res.status, 200);
      assert.equal(res.body.data.status, 'completed');
      assert.equal(res.body.data.progress, 100);
    });

    await test('DELETE /api/items/:id deletes User A item', async () => {
      const res = await request(app)
        .delete(`/api/items/${createdItemId}`)
        .set('Authorization', `Bearer ${tokenA}`);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      createdItemId = null;
    });

  } finally {
    // Clean up test data from Neon DB
    try {
      if (userAId) {
        await prisma.user.delete({ where: { id: userAId } }).catch(() => {});
      }
      if (userBId) {
        await prisma.user.delete({ where: { id: userBId } }).catch(() => {});
      }
    } catch (cleanupErr) {
      console.warn('Test cleanup warning:', cleanupErr.message);
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
