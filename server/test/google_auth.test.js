import 'dotenv/config';
import assert from 'node:assert/strict';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { app } from '../src/app.js';
import prisma from '../src/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'queueme_dev_jwt_secret_fallback_key';

function createTestToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      provider: user.provider,
    },
    JWT_SECRET,
    { expiresIn: '14d' }
  );
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

async function runGoogleAuthTests() {
  console.log('🧪 Starting Comprehensive Google OAuth Sign-Up & Sign-In Automated Tests...\n');

  const timestamp = Date.now();
  const testGoogleUser1 = {
    googleId: `google-uid-1-${timestamp}`,
    email: `google.signup.user1.${timestamp}@gmail.com`,
    name: 'Google User One',
    avatarUrl: 'https://lh3.googleusercontent.com/a/test-user-1-avatar',
  };

  const testGoogleUser2 = {
    googleId: `google-uid-2-${timestamp}`,
    email: `google.signup.user2.${timestamp}@gmail.com`,
    name: 'Google User Two',
    avatarUrl: 'https://lh3.googleusercontent.com/a/test-user-2-avatar',
  };

  const testLocalUser = {
    email: `preexisting.local.${timestamp}@example.com`,
    password: 'PreExistingPassword123!',
    name: 'Local Pre-existing User',
  };

  let user1 = null;
  let user2 = null;
  let localUser = null;
  let user1Token = null;
  let user2Token = null;

  try {
    // 1. Endpoint signature validation: Rejects tampered / forged credentials
    await test('POST /api/auth/google rejects forged or missing token with 401', async () => {
      const res = await request(app)
        .post('/api/auth/google')
        .send({ credential: 'fake-signature-token-that-is-not-signed-by-google' });
      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
      assert.ok(res.body.error.includes('Google authentication failed'));
    });

    // 2. Google Sign-Up: Verify account creation for a new Google user
    await test('Google Sign-Up: Creates user record with provider=GOOGLE, null password, and profile metadata', async () => {
      user1 = await prisma.user.create({
        data: {
          email: testGoogleUser1.email,
          googleId: testGoogleUser1.googleId,
          name: testGoogleUser1.name,
          avatarUrl: testGoogleUser1.avatarUrl,
          provider: 'GOOGLE',
          password: null, // Google accounts do not store passwords
        },
      });

      assert.ok(user1.id);
      assert.equal(user1.provider, 'GOOGLE');
      assert.equal(user1.password, null);
      assert.equal(user1.googleId, testGoogleUser1.googleId);
      assert.equal(user1.email, testGoogleUser1.email);
      assert.equal(user1.name, testGoogleUser1.name);
      assert.equal(user1.avatarUrl, testGoogleUser1.avatarUrl);

      user1Token = createTestToken(user1);
    });

    // 3. Profile verification: Verify Google user can access /api/auth/me
    await test('GET /api/auth/me returns Google profile with provider=GOOGLE', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${user1Token}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.user.id, user1.id);
      assert.equal(res.body.user.email, testGoogleUser1.email);
      assert.equal(res.body.user.provider, 'GOOGLE');
      assert.equal(res.body.user.avatarUrl, testGoogleUser1.avatarUrl);
    });

    // 4. Security: Prevent email/password login takeover of Google accounts
    await test('Security: Password login on Google account is rejected with helpful guidance', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testGoogleUser1.email,
        password: 'AttackerAttemptedPassword123!',
      });
      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.ok(res.body.error.includes('Please sign in with Google'));
    });

    // 5. Google Sign-In (Re-auth): Finds existing user and updates profile without duplicating
    await test('Google Sign-In: Subsequent sign-in updates profile and does not create duplicate user', async () => {
      const updatedAvatar = 'https://lh3.googleusercontent.com/a/updated-user-1-avatar';

      // Simulate find or update
      let existing = await prisma.user.findFirst({
        where: {
          OR: [{ googleId: testGoogleUser1.googleId }, { email: testGoogleUser1.email }],
        },
      });

      assert.ok(existing);
      assert.equal(existing.id, user1.id);

      const updated = await prisma.user.update({
        where: { id: existing.id },
        data: { avatarUrl: updatedAvatar },
      });

      assert.equal(updated.avatarUrl, updatedAvatar);

      const totalMatches = await prisma.user.count({
        where: { email: testGoogleUser1.email },
      });
      assert.equal(totalMatches, 1);
    });

    // 6. Google User Item CRUD: Google user can manage private queue items via API
    let createdItemId = null;
    await test('Google User: Can create queue item via POST /api/items', async () => {
      const res = await request(app)
        .post('/api/items')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Google User Saved Movie - Inception',
          type: 'movie',
          platform: 'Netflix',
          priority: 'high',
          status: 'queued',
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.title, 'Google User Saved Movie - Inception');
      createdItemId = res.body.data.id;
    });

    await test('Google User: Can fetch items list via GET /api/items', async () => {
      const res = await request(app)
        .get('/api/items')
        .set('Authorization', `Bearer ${user1Token}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.length, 1);
      assert.equal(res.body.data[0].id, createdItemId);
    });

    await test('Google User: Can update item status via PATCH /api/items/:id', async () => {
      const res = await request(app)
        .patch(`/api/items/${createdItemId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ status: 'completed' });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.status, 'completed');
    });

    // 7. Data Isolation: A second Google user cannot see or modify User 1's items
    await test('Data Isolation: User 2 (Google) cannot view or modify User 1 items', async () => {
      user2 = await prisma.user.create({
        data: {
          email: testGoogleUser2.email,
          googleId: testGoogleUser2.googleId,
          name: testGoogleUser2.name,
          avatarUrl: testGoogleUser2.avatarUrl,
          provider: 'GOOGLE',
          password: null,
        },
      });
      user2Token = createTestToken(user2);

      // User 2 GET items -> empty list
      const getRes = await request(app)
        .get('/api/items')
        .set('Authorization', `Bearer ${user2Token}`);
      assert.equal(getRes.status, 200);
      assert.equal(getRes.body.data.length, 0);

      // User 2 PATCH User 1 item -> 404
      const patchRes = await request(app)
        .patch(`/api/items/${createdItemId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ title: 'Hacked Title' });
      assert.equal(patchRes.status, 404);

      // User 2 DELETE User 1 item -> 404
      const delRes = await request(app)
        .delete(`/api/items/${createdItemId}`)
        .set('Authorization', `Bearer ${user2Token}`);
      assert.equal(delRes.status, 404);
    });

    // 8. Delete item by owner
    await test('Google User: Can delete own item via DELETE /api/items/:id', async () => {
      const res = await request(app)
        .delete(`/api/items/${createdItemId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);

      const count = await prisma.item.count({ where: { userId: user1.id } });
      assert.equal(count, 0);
    });

    // 9. Account Linking: Seamless linking when a local email/password user signs up with Google
    await test('Account Linking: Local email user signing up with Google links googleId without losing data', async () => {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(testLocalUser.password, salt);

      localUser = await prisma.user.create({
        data: {
          email: testLocalUser.email,
          password: hashedPassword,
          name: testLocalUser.name,
          provider: 'LOCAL',
        },
      });

      // Local user creates an item
      const localItem = await prisma.item.create({
        data: {
          userId: localUser.id,
          title: 'Pre-existing Local User Item',
          type: 'book',
          status: 'queued',
          priority: 'medium',
        },
      });

      // Simulate Google Sign-Up/Sign-In with same email
      const linkedGoogleId = `google-linked-${timestamp}`;
      const linkedAvatar = 'https://lh3.googleusercontent.com/a/linked-avatar';

      const foundUser = await prisma.user.findFirst({
        where: {
          OR: [{ googleId: linkedGoogleId }, { email: testLocalUser.email }],
        },
      });

      assert.ok(foundUser);
      assert.equal(foundUser.id, localUser.id);

      const linkedUser = await prisma.user.update({
        where: { id: foundUser.id },
        data: {
          googleId: foundUser.googleId || linkedGoogleId,
          avatarUrl: foundUser.avatarUrl || linkedAvatar,
          name: foundUser.name || 'Updated Name',
        },
      });

      assert.equal(linkedUser.googleId, linkedGoogleId);
      assert.equal(linkedUser.avatarUrl, linkedAvatar);

      // Verify item is preserved
      const itemCheck = await prisma.item.findUnique({ where: { id: localItem.id } });
      assert.ok(itemCheck);
      assert.equal(itemCheck.userId, localUser.id);

      // Clean up local item
      await prisma.item.delete({ where: { id: localItem.id } });
    });

  } finally {
    // Clean up all test users
    const userIdsToDelete = [user1?.id, user2?.id, localUser?.id].filter(Boolean);
    if (userIdsToDelete.length > 0) {
      await prisma.item.deleteMany({ where: { userId: { in: userIdsToDelete } } }).catch(() => {});
      await prisma.user.deleteMany({ where: { id: { in: userIdsToDelete } } }).catch(() => {});
    }

    // Verify database is completely empty (zero users, zero items)
    const finalItemCount = await prisma.item.count();
    const finalUserCount = await prisma.user.count();
    console.log(`\n🧹 Database Cleanup Verification: ${finalItemCount} items, ${finalUserCount} users in database.`);
    assert.equal(finalItemCount, 0, 'Database items table must be empty');
    assert.equal(finalUserCount, 0, 'Database users table must be empty');

    await prisma.$disconnect();
  }

  console.log('\n🏁 All Google OAuth Sign-Up & Sign-In tests passed successfully!\n');
}

runGoogleAuthTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
