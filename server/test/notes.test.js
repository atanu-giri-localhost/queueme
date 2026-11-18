import 'dotenv/config';
import assert from 'node:assert/strict';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/app.js';
import prisma from '../src/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'queueme_dev_jwt_secret_fallback_key';

function createToken(userId, email) {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '1h' });
}

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    Error: ${err.message}`);
    throw err;
  }
}

async function runNotesTests() {
  console.log('🧪 Starting Notepad API automated tests...\n');

  const timestamp = Date.now();
  let userA = null;
  let userB = null;
  let tokenA = null;
  let tokenB = null;
  let noteAId = null;

  try {
    // Setup test users
    userA = await prisma.user.create({
      data: {
        email: `note.userA.${timestamp}@example.com`,
        name: 'User A',
        provider: 'LOCAL',
      },
    });
    tokenA = createToken(userA.id, userA.email);

    userB = await prisma.user.create({
      data: {
        email: `note.userB.${timestamp}@example.com`,
        name: 'User B',
        provider: 'LOCAL',
      },
    });
    tokenB = createToken(userB.id, userB.email);

    // 1. Rejects unauthenticated request
    await test('GET /api/notes rejects unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/notes');
      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
    });

    // 2. Create note
    await test('POST /api/notes creates a new note for User A', async () => {
      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: 'My First Cloud Note',
          content: 'This note was created and saved to PostgreSQL.',
          pinned: true,
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.title, 'My First Cloud Note');
      assert.equal(res.body.data.content, 'This note was created and saved to PostgreSQL.');
      assert.equal(res.body.data.pinned, true);
      assert.equal(res.body.data.userId, userA.id);
      noteAId = res.body.data.id;
    });

    // 3. Fetch notes list
    await test('GET /api/notes returns list containing User A note', async () => {
      const res = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${tokenA}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.count, 1);
      assert.equal(res.body.data[0].id, noteAId);
    });

    // 4. Fetch single note
    await test('GET /api/notes/:id returns note details', async () => {
      const res = await request(app)
        .get(`/api/notes/${noteAId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.id, noteAId);
    });

    // 5. Update note
    await test('PATCH /api/notes/:id updates note content and title', async () => {
      const res = await request(app)
        .patch(`/api/notes/${noteAId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: 'Updated Note Title',
          content: 'Updated content body',
          pinned: false,
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.title, 'Updated Note Title');
      assert.equal(res.body.data.content, 'Updated content body');
      assert.equal(res.body.data.pinned, false);
    });

    // 6. Multi-user isolation
    await test('Data Isolation: User B cannot access, update, or delete User A note', async () => {
      // User B get list -> 0 notes
      const listRes = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${tokenB}`);
      assert.equal(listRes.status, 200);
      assert.equal(listRes.body.count, 0);

      // User B get single -> 404
      const singleRes = await request(app)
        .get(`/api/notes/${noteAId}`)
        .set('Authorization', `Bearer ${tokenB}`);
      assert.equal(singleRes.status, 404);

      // User B update -> 404
      const updateRes = await request(app)
        .patch(`/api/notes/${noteAId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ title: 'Hacked' });
      assert.equal(updateRes.status, 404);

      // User B delete -> 404
      const deleteRes = await request(app)
        .delete(`/api/notes/${noteAId}`)
        .set('Authorization', `Bearer ${tokenB}`);
      assert.equal(deleteRes.status, 404);
    });

    // 7. Delete note
    await test('DELETE /api/notes/:id deletes note for owner', async () => {
      const res = await request(app)
        .delete(`/api/notes/${noteAId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);

      const check = await prisma.note.findUnique({ where: { id: noteAId } });
      assert.equal(check, null);
    });

  } finally {
    const userIds = [userA?.id, userB?.id].filter(Boolean);
    if (userIds.length > 0) {
      await prisma.note.deleteMany({ where: { userId: { in: userIds } } }).catch(() => {});
      await prisma.user.deleteMany({ where: { id: { in: userIds } } }).catch(() => {});
    }
    await prisma.$disconnect();
  }

  console.log('\n🏁 All Notepad API tests passed successfully!\n');
}

runNotesTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
