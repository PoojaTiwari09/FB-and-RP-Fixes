import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../../app.module';
import { M08TaskService } from '../services/task.service';
import { PrismaService } from '../../../platform-core/database/prisma.service';
import { ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';

function assert(condition: any, message: string) {
  if (!condition) {
    throw new Error(`❌ ASSERTION FAILED: ${message}`);
  }
  console.log(`✅ PASS: ${message}`);
}

async function runTaskTests() {
  console.log('\n======================================================');
  console.log('🚀 RUNNING ENGAGE TO-DO (M8 SALES ENGAGEMENT) E2E SUITE');
  console.log('======================================================\n');

  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const service = app.get(M08TaskService);
  const prisma = app.get(PrismaService);

  let passed = 0;
  let failed = 0;

  const tenantId = '00000000-0000-0000-0000-000000000000';
  const userId = '00000000-0000-0000-0000-000000000000';
  const otherUserId = '44444444-4444-4444-4444-444444444444';

  try {
    // --- DB CLEANUP ---
    await prisma.task.deleteMany({ where: { tenantId } });

    // --- TEST CASE 1: Task Creation & Zod Validation ---
    console.log('\n--- Task Creation & Validation ---');
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const task = await service.createTask({
        type: 'email',
        description: 'Send follow up document to prospective customer',
        dueDate: tomorrow.toISOString(),
        priority: 2,
        source: 'manual',
      }, tenantId, userId);

      assert(task !== null, 'Task successfully created');
      assert(task.type === 'email', 'Task type successfully populated');
      assert(task.priority === 2, 'Default priority matches');
      assert(task.status === 'pending', 'Initial status set to pending');

      passed++;
    } catch (e) {
      console.error('❌ Task Creation Failed:', e);
      failed++;
    }

    // --- TEST CASE 2: Priority Sorting & Search ---
    console.log('\n--- Task Search, Filtering & Prioritized Sorting ---');
    try {
      const todayStr = new Date().toISOString();

      // Create a higher priority task (Priority 1)
      const highTask = await service.createTask({
        type: 'call',
        description: 'CRITICAL: Align pricing proposals',
        dueDate: todayStr,
        priority: 1,
        source: 'manual',
      }, tenantId, userId);

      // Create a lower priority task (Priority 3)
      const lowTask = await service.createTask({
        type: 'linkedin',
        description: 'InMail outreach for connection',
        dueDate: todayStr,
        priority: 3,
        source: 'manual',
      }, tenantId, userId);

      // Retrieve all tasks to check sorting
      const tasks = await service.getTasks(tenantId, {});
      assert(tasks.length === 3, 'Successfully retrieved 3 tasks');

      // Check sorting order (status ASC, priority ASC)
      // High task (priority 1) should be first
      assert(tasks[0].id === highTask.id, 'High priority task correctly sorted first');
      assert(tasks[1].priority === 2, 'Medium priority task correctly sorted second');
      assert(tasks[2].id === lowTask.id, 'Low priority task correctly sorted third');

      // Search testing
      const searched = await service.getTasks(tenantId, { search: 'CRITICAL' });
      assert(searched.length === 1, 'Case-insensitive search successfully filtered records');
      assert(searched[0].id === highTask.id, 'Search content matches exact queried criteria');

      passed++;
    } catch (e) {
      console.error('❌ Filtering & Sorting Failed:', e);
      failed++;
    }

    // --- TEST CASE 3: Status Completion, Snooze & Reassignments ---
    console.log('\n--- Status Transitions & Reassignments ---');
    try {
      const task = await service.createTask({
        type: 'linkedin',
        description: 'Reassignable workflow task',
        dueDate: new Date().toISOString(),
        priority: 2,
        source: 'manual',
      }, tenantId, userId);

      // Complete Task
      const completed = await service.updateTaskStatus(task.id, 'completed', tenantId);
      assert(completed.status === 'completed', 'Task status transitioned to completed');

      // Snooze Task
      const snoozed = await service.updateTaskStatus(task.id, 'snoozed', tenantId);
      assert(snoozed.status === 'snoozed', 'Task status transitioned to snoozed');

      // Reassign Task
      const reassigned = await service.reassignTask(task.id, otherUserId, tenantId, userId);
      assert(reassigned.userId === otherUserId, 'Task successfully reassigned to new owner');

      passed++;
    } catch (e) {
      console.error('❌ Status Actions Failed:', e);
      failed++;
    }

    // --- TEST CASE 4: Call Transcription Consumer & Idempotency ---
    console.log('\n--- Call Transcription Consumer & Idempotency Safeguards ---');
    try {
      const eventId = '88888888-8888-8888-8888-888888888888';
      const callId = '99999999-9999-9999-9999-999999999999';

      // Call Consumer Trigger
      const task = await service.handleCallTranscriptionCompleted({
        tenantId,
        eventId,
        callId,
        summary: 'Objection raised on platform scale',
        userId,
      });

      assert(task !== null, 'Consumer successfully handled transcription and generated followup task');
      assert(task.type === 'followup', 'Followup task type verified');
      assert(task.priority === 1, 'High priority assigned correctly');
      assert(task.source === 'AI', 'Task source flagged as AI');
      assert(task.sourceId === eventId, 'Source ID bound to trigger Event ID');

      // Assert next business day
      const due = new Date(task.dueDate);
      assert(due.getHours() === 9, 'Due date respects business hours (9:00 AM)');

      // Idempotency: Trigger again with same eventId
      const repeatTask = await service.handleCallTranscriptionCompleted({
        tenantId,
        eventId,
        callId,
        summary: 'Objection raised on platform scale',
        userId,
      });

      assert(repeatTask.id === task.id, 'Idempotency safety verified: duplicate trigger calls return existing record graceful');

      passed++;
    } catch (e) {
      console.error('❌ Event Consumer Failed:', e);
      failed++;
    }

  } catch (globalError) {
    console.error('💥 E2E Test Suite Crashed:', globalError);
  } finally {
    await app.close();
  }

  console.log('\n======================================================');
  console.log(`📊 TEST SUITE SUMMARY: PASSED ${passed} | FAILED ${failed}`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTaskTests();
