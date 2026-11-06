import 'dotenv/config';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { prisma } from '../src/prisma.js';

const PORT = 5001; // Use 5001 for isolated persistence test
const BASE_URL = `http://localhost:${PORT}/api`;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function startServer() {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', ['server/src/index.js'], {
      env: { ...process.env, PORT: String(PORT) },
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
      // Ignore normal warnings
      if (!started && data.toString().includes('Error')) {
        reject(new Error(data.toString()));
      }
    });

    proc.on('exit', (code) => {
      if (!started) {
        reject(new Error(`Server exited prematurely with code ${code}`));
      }
    });

    // Timeout fallback
    setTimeout(() => {
      if (!started) {
        reject(new Error('Server failed to start within 5000ms'));
      }
    }, 5000);
  });
}

async function stopServer(proc) {
  if (!proc || proc.killed) return;
  return new Promise((resolve) => {
    proc.on('exit', () => resolve());
    proc.kill('SIGTERM');
    // Force kill if it doesn't exit promptly
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

async function runPersistenceVerification() {
  console.log('🔄 ====================================================');
  console.log('🔄  QueueMe PostgreSQL Persistence Across Server Restarts');
  console.log('🔄 ====================================================\n');

  let serverProc = null;
  const testId = `persist-test-${Date.now()}`;
  let createdItemId;

  try {
    // -------------------------------------------------------------
    // PHASE 1: START SERVER INSTANCE #1 & CREATE ITEM
    // -------------------------------------------------------------
    console.log('1️⃣  Starting Server Process #1...');
    serverProc = await startServer();
    console.log(`   ✓ Server Process #1 running on port ${PORT} (PID: ${serverProc.pid})`);

    const createPayload = {
      title: 'PostgreSQL Restart Test Item',
      type: 'audio',
      creator: 'Database Tester',
      platform: 'PostgreSQL 17 Container',
      duration: '45 min',
      status: 'queued',
      priority: 'high',
      tags: ['PostgreSQL', 'PersistenceCheck', testId],
      sourceUrl: 'https://open.spotify.com/episode/persisted-test',
      notes: 'Testing data persistence through server shutdowns and reboots.',
    };

    console.log('   Sending POST /api/items to Server Process #1...');
    const createRes = await fetch(`${BASE_URL}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createPayload),
    });
    const createBody = await createRes.json();
    assert.equal(createRes.status, 201);
    assert.equal(createBody.success, true);
    createdItemId = createBody.data.id;
    console.log(`   ✓ Item created via API with id: ${createdItemId}`);

    // Verify directly in PostgreSQL via independent Prisma connection
    console.log('   Inspecting PostgreSQL table directly via database query...');
    const dbRecord1 = await prisma.item.findUnique({ where: { id: createdItemId } });
    assert.ok(dbRecord1, 'Record MUST exist in PostgreSQL database');
    assert.equal(dbRecord1.title, createPayload.title);
    assert.equal(dbRecord1.type, 'audio');
    assert.equal(dbRecord1.sourceUrl, createPayload.sourceUrl);
    console.log(`   ✓ Verified: PostgreSQL database contains row '${createdItemId}'`);

    // -------------------------------------------------------------
    // PHASE 2: KILL SERVER PROCESS #1 (SIMULATE HARD SHUTDOWN)
    // -------------------------------------------------------------
    console.log('\n2️⃣  Killing Server Process #1 (simulating process restart)...');
    await stopServer(serverProc);
    serverProc = null;
    await delay(500);
    console.log('   ✓ Server Process #1 is completely dead.');

    // Confirm that PostgreSQL still has the data while NO server is running
    console.log('   Querying PostgreSQL while server is offline...');
    const dbRecordWhileOffline = await prisma.item.findUnique({ where: { id: createdItemId } });
    assert.ok(dbRecordWhileOffline, 'Record MUST persist in PostgreSQL even when server process is dead');
    console.log('   ✓ Verified: Row persisted in PostgreSQL database while server was offline.');

    // -------------------------------------------------------------
    // PHASE 3: START BRAND NEW SERVER PROCESS #2 & READ ITEM
    // -------------------------------------------------------------
    console.log('\n3️⃣  Starting Server Process #2 (fresh in-memory state)...');
    serverProc = await startServer();
    console.log(`   ✓ Server Process #2 running on port ${PORT} (PID: ${serverProc.pid})`);

    console.log(`   Sending GET /api/items/${createdItemId} to Server Process #2...`);
    const readRes = await fetch(`${BASE_URL}/items/${createdItemId}`);
    const readBody = await readRes.json();
    assert.equal(readRes.status, 200);
    assert.equal(readBody.success, true);
    assert.equal(readBody.data.id, createdItemId);
    assert.equal(readBody.data.title, createPayload.title);
    assert.equal(readBody.data.type, 'audio');
    console.log('   ✓ Verified: Server Process #2 successfully read persisted data from PostgreSQL.');

    // -------------------------------------------------------------
    // PHASE 4: UPDATE ITEM ON SERVER PROCESS #2
    // -------------------------------------------------------------
    console.log('\n4️⃣  Updating item via Server Process #2...');
    const updatePayload = {
      status: 'completed',
      rating: '4.9',
      notes: 'Updated before server restart #2 - testing update persistence.',
    };

    const updateRes = await fetch(`${BASE_URL}/items/${createdItemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload),
    });
    const updateBody = await updateRes.json();
    assert.equal(updateRes.status, 200);
    assert.equal(updateBody.data.status, 'completed');
    assert.equal(updateBody.data.progress, 100);
    assert.equal(updateBody.data.progressLabel, 'Finished');
    assert.equal(updateBody.data.rating, '4.9');
    console.log('   ✓ Item updated via API: status -> completed, progress -> 100');

    // -------------------------------------------------------------
    // PHASE 5: KILL SERVER PROCESS #2 (SECOND HARD SHUTDOWN)
    // -------------------------------------------------------------
    console.log('\n5️⃣  Killing Server Process #2...');
    await stopServer(serverProc);
    serverProc = null;
    await delay(500);
    console.log('   ✓ Server Process #2 is completely dead.');

    // Verify updated state directly in PostgreSQL
    const dbRecordUpdatedOffline = await prisma.item.findUnique({ where: { id: createdItemId } });
    assert.ok(dbRecordUpdatedOffline);
    assert.equal(dbRecordUpdatedOffline.status, 'completed');
    assert.equal(dbRecordUpdatedOffline.progress, 100);
    assert.equal(dbRecordUpdatedOffline.rating, '4.9');
    console.log('   ✓ Verified: PostgreSQL contains updated values (completed, 100%) while server is offline.');

    // -------------------------------------------------------------
    // PHASE 6: START SERVER PROCESS #3 & VERIFY UPDATED STATE
    // -------------------------------------------------------------
    console.log('\n6️⃣  Starting Server Process #3...');
    serverProc = await startServer();
    console.log(`   ✓ Server Process #3 running on port ${PORT} (PID: ${serverProc.pid})`);

    const readRes2 = await fetch(`${BASE_URL}/items/${createdItemId}`);
    const readBody2 = await readRes2.json();
    assert.equal(readRes2.status, 200);
    assert.equal(readBody2.data.status, 'completed');
    assert.equal(readBody2.data.progress, 100);
    assert.equal(readBody2.data.notes, updatePayload.notes);
    console.log('   ✓ Verified: Server Process #3 read the updated data from PostgreSQL.');

    // -------------------------------------------------------------
    // PHASE 7: DELETE ITEM VIA SERVER PROCESS #3
    // -------------------------------------------------------------
    console.log('\n7️⃣  Deleting item via Server Process #3...');
    const deleteRes = await fetch(`${BASE_URL}/items/${createdItemId}`, {
      method: 'DELETE',
    });
    const deleteBody = await deleteRes.json();
    assert.equal(deleteRes.status, 200);
    assert.equal(deleteBody.success, true);
    console.log('   ✓ Delete API call returned success.');

    // -------------------------------------------------------------
    // PHASE 8: KILL SERVER PROCESS #3 & VERIFY DELETION IN DB
    // -------------------------------------------------------------
    console.log('\n8️⃣  Killing Server Process #3...');
    await stopServer(serverProc);
    serverProc = null;
    await delay(500);
    console.log('   ✓ Server Process #3 is completely dead.');

    // Check direct PostgreSQL database
    const dbRecordAfterDelete = await prisma.item.findUnique({ where: { id: createdItemId } });
    assert.equal(dbRecordAfterDelete, null, 'Record MUST be deleted from PostgreSQL');
    console.log('   ✓ Verified: Row is completely removed from PostgreSQL table.');

    // -------------------------------------------------------------
    // PHASE 9: START SERVER PROCESS #4 & VERIFY 404
    // -------------------------------------------------------------
    console.log('\n9️⃣  Starting Server Process #4 (final verification)...');
    serverProc = await startServer();
    console.log(`   ✓ Server Process #4 running on port ${PORT} (PID: ${serverProc.pid})`);

    const readDeletedRes = await fetch(`${BASE_URL}/items/${createdItemId}`);
    assert.equal(readDeletedRes.status, 404);
    const readDeletedBody = await readDeletedRes.json();
    assert.equal(readDeletedBody.success, false);
    console.log('   ✓ Verified: Server Process #4 returns 404 for deleted item.');

    console.log('\n🎉 ====================================================');
    console.log('🎉  ALL POSTGRESQL PERSISTENCE TESTS PASSED (100% REAL DB)');
    console.log('🎉 ====================================================\n');
  } finally {
    if (serverProc) {
      await stopServer(serverProc);
    }
    await prisma.$disconnect();
  }
}

runPersistenceVerification().catch((err) => {
  console.error('\n❌ Persistence verification failed:', err);
  process.exit(1);
});
