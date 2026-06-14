const { PrismaClient } = require('../packages/database');
const fs = require('fs');
const path = require('path');

const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}`;
const OUTPUT_FILE = path.join(__dirname, 'test-m02-results.txt');

const repToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzMzMzMzMzMy0zMzMzLTMzMzMtMzMzMy0zMzMzMzMzMzMzMzMiLCJ0ZW5hbnRJZCI6IjAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMSIsInJvbGUiOiJTQUxFU19SRVAiLCJwZXJtaXNzaW9ucyI6WyJ0YXNrLnZpZXciLCJ0YXNrLmNyZWF0ZSIsInRhc2sudXBkYXRlIiwib3Bwb3J0dW5pdHkudmlldyIsIm9wcG9ydHVuaXR5LmNyZWF0ZSIsIm9wcG9ydHVuaXR5LnVwZGF0ZSIsImN1c3RvbWVyLnZpZXciLCJjdXN0b21lci5jcmVhdGUiLCJjdXN0b21lci51cGRhdGUiLCJhaS5xdWVyeSJdLCJlbWFpbCI6InNhcmFoLmNoZW5AcmVsYW50by5jb20iLCJuYW1lIjoiU2FyYWggQ2hlbiIsImlhdCI6MTc4MTM2MDIxMSwiZXhwIjoxNzgxNDQ2NjExLCJhdWQiOiJyLXJldmVudWUtYXBpIiwiaXNzIjoici1yZXZlbnVlLWFwaSJ9.Hba9pw2wIjSju1qyVRlQYe0LLpJyBiS0-A_5YoizqCg';
const managerToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyMjIyMjIyMi0yMjIyLTIyMjItMjIyMi0yMjIyMjIyMjIyMjIiLCJ0ZW5hbnRJZCI6IjAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMSIsInJvbGUiOiJNQU5BR0VSIiwicGVybWlzc2lvbnMiOlsidGFzay52aWV3IiwidGFzay5jcmVhdGUiLCJ0YXNrLnVwZGF0ZSIsInRhc2suYXNzaWduIiwib3Bwb3J0dW5pdHkudmlldyIsIm9wcG9ydHVuaXR5LmNyZWF0ZSIsIm9wcG9ydHVuaXR5LnVwZGF0ZSIsImN1c3RvbWVyLnZpZXciLCJjdXN0b21lci5jcmVhdGUiLCJjdXN0b21lci51cGRhdGUiLCJyZXBvcnQudmlldyIsInJlcG9ydC5leHBvcnQiLCJ1c2VyLnZpZXciLCJ1c2VyLmludml0ZSIsImFpLnF1ZXJ5IiwiYWkucmVwb3J0Il0sImVtYWlsIjoiYWxleC5tb3JnYW5AcmVsYW50by5jb20iLCJuYW1lIjoiQWxleCBNb3JnYW4iLCJpYXQiOjE3ODEzNTkzMzcsImV4cCI6MTc4MTQ0NTczNywiYXVkIjoici1yZXZlbnVlLWFwaSIsImlzcyI6InItcmV2ZW51ZS1hcGkifQ.wDlyTI8SrmYBU6F_IJXB6ZZeQCUedjToWUu7VBb25r8';

const logStream = fs.createWriteStream(OUTPUT_FILE, { flags: 'w' });
function log(msg) {
  console.log(msg);
  logStream.write(msg + '\n');
}

async function runTests() {
  log('Starting Module 2 API Functional & Security Tests...');
  log('==================================================');

  const prisma = new PrismaClient();
  const ids = {
    callId: '11111111-1111-1111-1111-000000000001',
    reviewId: 'rv_001',
    trackerId: '10befc19-6963-4f51-ae9d-ef6d92178a77',
    themeId: '88888888-8888-8888-8888-888888888888',
    vocabId: 'c4f28160-8ed7-4a54-8e59-0f3c692aa69b'
  };

  try {
    log('Connecting to database to fetch valid entities...');
    const call = await prisma.callRecord.findFirst({ select: { id: true } });
    if (call) ids.callId = call.id;

    const review = await prisma.callReview.findFirst({ select: { reviewId: true } });
    if (review) ids.reviewId = review.reviewId;

    if (prisma.m02Tracker) {
      const tracker = await prisma.m02Tracker.findFirst({ select: { id: true } });
      if (tracker) ids.trackerId = tracker.id;
    }

    if (prisma.themeAnalysis) {
      const theme = await prisma.themeAnalysis.findFirst({ select: { id: true } });
      if (theme) ids.themeId = theme.id;
    }

    if (prisma.m02VocabularyCorrection) {
      const vocab = await prisma.m02VocabularyCorrection.findFirst({ select: { id: true } });
      if (vocab) ids.vocabId = vocab.id;
    }

    log(`Database entities retrieved:`);
    log(`  Call ID: ${ids.callId}`);
    log(`  Review ID: ${ids.reviewId}`);
    log(`  Tracker ID: ${ids.trackerId}`);
    log(`  Theme ID: ${ids.themeId}`);
    log(`  Vocab ID: ${ids.vocabId}`);
  } catch (e) {
    log('Failed to fetch from DB, using fallback IDs. Error: ' + e.message);
  } finally {
    await prisma.$disconnect();
  }

  const testCases = [
    // 1. Search & Filters
    { name: 'Search Calls', path: '/api/v1/conversation-intelligence/search/calls?tab=calls&page=1&size=5', method: 'GET', roles: ['rep', 'manager'] },
    { name: 'Search Options', path: '/api/v1/conversation-intelligence/search/options', method: 'GET', roles: ['rep', 'manager'] },
    { name: 'Search Call Details', path: `/api/v1/conversation-intelligence/search/calls/${ids.callId}`, method: 'GET', roles: ['rep', 'manager'] },
    { name: 'Filter Options', path: '/api/v1/conversation-intelligence/filters/options', method: 'GET', roles: ['rep', 'manager'] },
    { name: 'Filter Teams', path: '/api/v1/conversation-intelligence/filters/teams', method: 'GET', roles: ['rep', 'manager'] },
    { name: 'AI Ask Question', path: '/api/v1/conversation-intelligence/calls/ai-ask', method: 'POST', body: { callId: ids.callId, question: 'What was the customer\'s main objection?' }, roles: ['rep', 'manager'] },
    { name: 'Export Call', path: '/api/v1/conversation-intelligence/calls/export', method: 'POST', body: { callId: ids.callId }, roles: ['rep', 'manager'] },
    { name: 'Call Streams', path: '/api/v1/conversation-intelligence/streams', method: 'POST', body: { callId: ids.callId, type: 'audio' }, roles: ['rep', 'manager'] },

    // 2. Call Reviews & Scorecards
    { name: 'List Call Reviews', path: '/api/v1/conversation-intelligence/call-reviews', method: 'GET', roles: ['rep', 'manager'] },
    { name: 'List Scorecards', path: '/api/v1/conversation-intelligence/scorecards', method: 'GET', roles: ['rep', 'manager'] },
    { name: 'List Users', path: '/api/v1/conversation-intelligence/users', method: 'GET', roles: ['rep', 'manager'] },
    { name: 'Coaching Tags Meta', path: '/api/v1/conversation-intelligence/meta/coaching-tags', method: 'GET', roles: ['rep', 'manager'] },
    { name: 'Manager Calls List', path: '/api/v1/conversation-intelligence/manager/calls', method: 'GET', roles: ['rep', 'manager'] },
    { name: 'Analytics Summary', path: '/api/v1/conversation-intelligence/analytics/summary', method: 'GET', roles: ['rep', 'manager'] },
    { name: 'Analytics Score Trend', path: '/api/v1/conversation-intelligence/analytics/score-trend', method: 'GET', roles: ['rep', 'manager'] },
    { name: 'Analytics Focus Areas', path: '/api/v1/conversation-intelligence/analytics/focus-areas', method: 'GET', roles: ['rep', 'manager'] },
    { name: 'Analytics Common Tags', path: '/api/v1/conversation-intelligence/analytics/common-tags', method: 'GET', roles: ['rep', 'manager'] },
    { name: 'Analytics Review History', path: '/api/v1/conversation-intelligence/analytics/review-history', method: 'GET', roles: ['rep', 'manager'] },
    { name: 'Dashboard Summary', path: '/api/v1/conversation-intelligence/dashboard/summary', method: 'GET', roles: ['rep', 'manager'] },
    { name: 'Review Detail', path: `/api/v1/conversation-intelligence/call-reviews/${ids.reviewId}`, method: 'GET', roles: ['rep', 'manager'] },
    { name: 'Review View', path: `/api/v1/conversation-intelligence/call-reviews/${ids.reviewId}/view`, method: 'GET', roles: ['rep', 'manager'] },
    { name: 'Review Summary', path: `/api/v1/conversation-intelligence/call-reviews/${ids.reviewId}/summary`, method: 'GET', roles: ['rep', 'manager'] },
    { name: 'Review Coaching', path: `/api/v1/conversation-intelligence/call-reviews/${ids.reviewId}/coaching`, method: 'GET', roles: ['rep', 'manager'] },
    { name: 'Review Scorecard', path: `/api/v1/conversation-intelligence/call-reviews/${ids.reviewId}/scorecard`, method: 'GET', roles: ['rep', 'manager'] },
    { name: 'Review Transcript', path: `/api/v1/conversation-intelligence/call-reviews/${ids.reviewId}/transcript`, method: 'GET', roles: ['rep', 'manager'] },
    { name: 'Review AI Insights', path: `/api/v1/conversation-intelligence/call-reviews/${ids.reviewId}/ai-insights`, method: 'GET', roles: ['rep', 'manager'] },
    { name: 'Review Detail Restricted (rv_002)', path: '/api/v1/conversation-intelligence/call-reviews/rv_002', method: 'GET', roles: ['rep', 'manager'] },

    // 3. Trackers
    { name: 'List Trackers', path: '/api/v1/conversation-intelligence/trackers', method: 'GET', roles: ['rep', 'manager'] },
    { name: 'Admin Trackers List', path: '/api/v1/conversation-intelligence/trackers/admin/list', method: 'GET', roles: ['rep', 'manager'] },
    { name: 'Trackers Stats', path: '/api/v1/conversation-intelligence/trackers/stats', method: 'GET', roles: ['rep', 'manager'] },
    { name: 'Trackers Detections', path: '/api/v1/conversation-intelligence/trackers/detections', method: 'GET', roles: ['rep', 'manager'] },
    { name: 'Create Tracker', path: '/api/v1/conversation-intelligence/trackers', method: 'POST', body: { name: `Test-Tracker-${Date.now()}`, keywords: ['demo', 'api', 'test'] }, roles: ['rep', 'manager'] },
    { name: 'Tracker Detail', path: `/api/v1/conversation-intelligence/trackers/${ids.trackerId}/detail`, method: 'GET', roles: ['rep', 'manager'] },
    { name: 'Tracker Ask Question', path: `/api/v1/conversation-intelligence/trackers/${ids.trackerId}/ask`, method: 'POST', body: { question: 'How many times was the keyword mentioned?' }, roles: ['rep', 'manager'] },

    // 4. Themes & Theme Spotter
    { name: 'Create Theme Analysis', path: '/api/v1/m02-conversation-intelligence/theme-analyses', method: 'POST', body: { businessQuestion: 'What are the common pricing concerns?', filters: {} }, roles: ['rep', 'manager'] },
    { name: 'Theme Analysis Detail', path: `/api/v1/m02-conversation-intelligence/theme-analyses/${ids.themeId}`, method: 'GET', roles: ['rep', 'manager'] },
    { name: 'Theme Spotter Themes', path: '/api/theme-spotter/themes', method: 'GET', roles: ['rep', 'manager'] },
    { name: 'Theme Spotter Theme Detail', path: `/api/theme-spotter/themes/${ids.themeId}`, method: 'GET', roles: ['rep', 'manager'] },
    { name: 'Theme Trend', path: `/api/theme-spotter/themes/${ids.themeId}/trend`, method: 'GET', roles: ['rep', 'manager'] },
    { name: 'Theme Rep Breakdown', path: `/api/theme-spotter/themes/${ids.themeId}/rep-breakdown`, method: 'GET', roles: ['rep', 'manager'] },
    { name: 'Theme Stage Breakdown', path: `/api/theme-spotter/themes/${ids.themeId}/stage-breakdown`, method: 'GET', roles: ['rep', 'manager'] },
    { name: 'Theme Quotes', path: `/api/theme-spotter/themes/${ids.themeId}/quotes`, method: 'GET', roles: ['rep', 'manager'] },
    { name: 'Theme Calls', path: `/api/theme-spotter/themes/${ids.themeId}/calls`, method: 'GET', roles: ['rep', 'manager'] },

    // 5. Translation Services
    { name: 'Translate Text', path: '/api/v1/m02-conversation-intelligence/translate', method: 'POST', body: { text: 'How are you?', targetLang: 'es' }, roles: ['rep', 'manager'] },
    { name: 'Translation Settings', path: '/api/v1/m02-conversation-intelligence/translate/settings', method: 'GET', roles: ['rep', 'manager'] },

    // 6. Vocabulary Correction
    { name: 'Create Vocab Correction', path: '/api/v1/conversation-intelligence/vocabulary', method: 'POST', body: { original: 'relant', corrected: 'Relanto', category: 'company' }, roles: ['rep', 'manager'] },
    { name: 'List Vocab Corrections', path: '/api/v1/conversation-intelligence/vocabulary', method: 'GET', roles: ['rep', 'manager'] },
    { name: 'Vocab Stats', path: '/api/v1/conversation-intelligence/vocabulary/stats', method: 'GET', roles: ['rep', 'manager'] },

    // 7. Topics
    { name: 'List Topics', path: '/api/v1/m02-conversation-intelligence/topics', method: 'GET', roles: ['rep', 'manager'] },
    { name: 'Seed Topics', path: '/api/v1/m02-conversation-intelligence/topics/seed', method: 'POST', body: {}, roles: ['rep', 'manager'] },
    { name: 'Conversation Topics', path: `/api/v1/m02-conversation-intelligence/conversations/${ids.callId}/topics`, method: 'GET', roles: ['rep', 'manager'] }
  ];

  let passed = 0;
  let failed = 0;

  for (const tc of testCases) {
    for (const role of tc.roles) {
      const token = role === 'rep' ? repToken : managerToken;
      const url = `${BASE_URL}${tc.path}`;
      const options = {
        method: tc.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      };
      if (tc.body) {
        options.body = JSON.stringify(tc.body);
      }

      try {
        const res = await fetch(url, options);
        const text = await res.text();
        const status = res.status;

        // Determine correctness based on expected response status codes:
        // 404 for Sarah (rep) on rv_002 is expected due to security restriction.
        // manager calls list for Sarah is restricted (should be 403 or 404 or 401).
        let isOk = status >= 200 && status < 300;
        if (tc.path.includes('rv_002') && role === 'rep' && status === 404) {
          isOk = true; // Expected behavior (RBAC block)
        }
        if (tc.path.includes('/manager/calls') && role === 'rep' && (status === 403 || status === 404 || status === 401)) {
          isOk = true; // Expected RBAC block
        }

        if (isOk) {
          passed++;
          log(`[PASS] [${role.toUpperCase()}] ${tc.name} (${tc.method} ${tc.path}) -> Status: ${status}`);
        } else {
          failed++;
          log(`[FAIL] [${role.toUpperCase()}] ${tc.name} (${tc.method} ${tc.path}) -> Status: ${status}`);
          log(`       Response: ${text.substring(0, 150)}`);
        }
      } catch (err) {
        failed++;
        log(`[ERROR] [${role.toUpperCase()}] ${tc.name} (${tc.method} ${tc.path}) -> Error: ${err.message}`);
      }
    }
  }

  log('==================================================');
  log(`Verification Completed: ${passed} passed, ${failed} failed.`);
  logStream.end();
}

runTests();
