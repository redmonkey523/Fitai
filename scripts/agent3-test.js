/**
 * Agent 3 E2E Test Script
 * Tests: Routine create→start→finish, scan flow, upload reliability
 */

const { db } = require('../src/storage/db');
const { eventService } = require('../src/services/events');

async function testRoutineFlow() {
  console.log('\n=== Testing Routine Flow ===\n');
  
  try {
    // Initialize database
    await db.init();
    console.log('✓ Database initialized');

    // Test 1: Create routine
    console.log('\n1. Testing routine creation...');
    const routineId = `test_routine_${Date.now()}`;
    await db.execute(
      'INSERT INTO routines (id, name, description, difficulty, createdAt) VALUES (?, ?, ?, ?, ?)',
      [routineId, 'Test Routine', 'A test routine', 'intermediate', new Date().toISOString()]
    );
    console.log('✓ Routine created:', routineId);

    // Verify routine exists
    const routines = await db.execute('SELECT * FROM routines WHERE id = ?', [routineId]);
    if (routines.length > 0) {
      console.log('✓ Routine verified in database');
    } else {
      throw new Error('Routine not found in database');
    }

    // Test 2: Start workout session
    console.log('\n2. Testing workout session start...');
    const sessionId = `test_session_${Date.now()}`;
    await db.execute(
      'INSERT INTO workout_sessions (id, routineId, routineName, startedAt, status) VALUES (?, ?, ?, ?, ?)',
      [sessionId, routineId, 'Test Routine', new Date().toISOString(), 'in_progress']
    );
    console.log('✓ Workout session started:', sessionId);

    // Test 3: Complete workout session
    console.log('\n3. Testing workout session completion...');
    await db.execute(
      'UPDATE workout_sessions SET completedAt = ?, status = ? WHERE id = ?',
      [new Date().toISOString(), 'completed', sessionId]
    );
    console.log('✓ Workout session completed');

    // Verify session
    const sessions = await db.execute('SELECT * FROM workout_sessions WHERE id = ?', [sessionId]);
    if (sessions.length > 0 && sessions[0].status === 'completed') {
      console.log('✓ Session verified as completed');
    } else {
      throw new Error('Session not completed properly');
    }

    // Cleanup
    console.log('\n4. Cleaning up test data...');
    await db.execute('DELETE FROM workout_sessions WHERE id = ?', [sessionId]);
    await db.execute('DELETE FROM routines WHERE id = ?', [routineId]);
    console.log('✓ Test data cleaned up');

    console.log('\n✅ All routine flow tests passed!\n');
    return true;
  } catch (error) {
    console.error('\n❌ Routine flow test failed:', error);
    return false;
  }
}

async function testEventEmissions() {
  console.log('\n=== Testing Event Emissions ===\n');

  const events = [];
  const unsubscribers = [];

  try {
    // Subscribe to all test events
    const eventNames = [
      'routine_created',
      'workout_started',
      'workout_finished',
      'scan_success',
      'scan_failure',
    ];

    for (const eventName of eventNames) {
      const unsub = eventService.on(eventName, (name, payload) => {
        events.push({ name, payload, ts: Date.now() });
        console.log(`✓ Event received: ${name}`, payload);
      });
      unsubscribers.push(unsub);
    }

    // Emit test events
    console.log('\n1. Emitting test events...');
    
    eventService.emit('routine_created', { routineId: 'test_123', name: 'Test Routine' });
    eventService.emit('workout_started', { sessionId: 'session_123', routineName: 'Test Routine' });
    eventService.emit('workout_finished', { sessionId: 'session_123', completedAt: new Date().toISOString() });
    eventService.emit('scan_success', { type: 'EAN13', data: '1234567890123' });
    eventService.emit('scan_failure', { reason: 'test' });

    // Wait a bit for async events
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify events
    console.log('\n2. Verifying event log...');
    if (events.length === 5) {
      console.log('✓ All 5 events received');
    } else {
      throw new Error(`Expected 5 events, got ${events.length}`);
    }

    // Check recent events from service
    const recentEvents = eventService.getRecentEvents(10);
    if (recentEvents.length >= 5) {
      console.log('✓ Events logged in service');
    } else {
      throw new Error('Events not properly logged');
    }

    console.log('\n✅ All event emission tests passed!\n');
    return true;
  } catch (error) {
    console.error('\n❌ Event emission test failed:', error);
    return false;
  } finally {
    // Cleanup subscriptions
    unsubscribers.forEach(unsub => unsub());
  }
}

async function testUploadPersist() {
  console.log('\n=== Testing Upload Persistence ===\n');

  try {
    const { persistBeforeUpload, getFileInfo } = require('../src/features/media/Upload');

    console.log('1. Testing persistBeforeUpload function exists...');
    if (typeof persistBeforeUpload === 'function') {
      console.log('✓ persistBeforeUpload function found');
    } else {
      throw new Error('persistBeforeUpload function not found');
    }

    console.log('2. Testing getFileInfo function exists...');
    if (typeof getFileInfo === 'function') {
      console.log('✓ getFileInfo function found');
    } else {
      throw new Error('getFileInfo function not found');
    }

    // Note: Cannot test actual file operations without a real file system
    console.log('\nℹ️  File system operations require a running app');
    console.log('✓ Upload utility functions are properly exported');

    console.log('\n✅ Upload persistence tests passed!\n');
    return true;
  } catch (error) {
    console.error('\n❌ Upload persistence test failed:', error);
    return false;
  }
}

async function runAllTests() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║   Agent 3 - E2E Test Suite                ║');
  console.log('╚════════════════════════════════════════════╝\n');

  const results = {
    routineFlow: await testRoutineFlow(),
    eventEmissions: await testEventEmissions(),
    uploadPersist: await testUploadPersist(),
  };

  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║   Test Results Summary                     ║');
  console.log('╚════════════════════════════════════════════╝\n');

  console.log(`Routine Flow:       ${results.routineFlow ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Event Emissions:    ${results.eventEmissions ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Upload Persistence: ${results.uploadPersist ? '✅ PASSED' : '❌ FAILED'}`);

  const allPassed = Object.values(results).every(r => r === true);
  
  console.log('\n' + (allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED') + '\n');

  process.exit(allPassed ? 0 : 1);
}

// Run tests
runAllTests().catch((error) => {
  console.error('\n❌ Test suite crashed:', error);
  process.exit(1);
});

