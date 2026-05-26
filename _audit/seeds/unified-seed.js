/**
 * Unified seed for the consolidated Postgres database.
 *
 * Goals:
 *   1. Create a single tenant + a small set of canonical users / roles.
 *   2. Seed at least 1–2 rows into every model that smoke tests touch
 *      across modules M01..M10 + platform-core.
 *   3. Keep IDs deterministic so smoke tests can reuse them via curl.
 *
 * Run with:
 *   node _audit/seeds/unified-seed.js
 *
 * Re-runnable: every insert is wrapped in try/catch so unique violations
 * on a second run are ignored (idempotent enough for smoke testing).
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TENANT_ID = '11111111-1111-1111-1111-111111111111';
const TENANT_KEY = 'tenant-demo';
const ADMIN_USER_ID = '22222222-2222-2222-2222-222222222221';
const MANAGER_USER_ID = '22222222-2222-2222-2222-222222222222';
const REP_USER_ID = '22222222-2222-2222-2222-222222222223';
const ADMIN_ROLE_ID = '33333333-3333-3333-3333-333333333331';
const MANAGER_ROLE_ID = '33333333-3333-3333-3333-333333333332';
const REP_ROLE_ID = '33333333-3333-3333-3333-333333333333';

const ACCOUNT_ID = '44444444-4444-4444-4444-444444444441';
const CONTACT_ID = '44444444-4444-4444-4444-444444444442';
const DEAL_ID = '44444444-4444-4444-4444-444444444443';
const CALL_ID = '55555555-5555-5555-5555-555555555551';
const TRANSCRIPT_ID = '55555555-5555-5555-5555-555555555552';
const AUDIO_FILE_ID = '55555555-5555-5555-5555-555555555553';
const TOPIC_ID = '66666666-6666-6666-6666-666666666661';
const THEME_ID = '66666666-6666-6666-6666-666666666662';
const TRACKER_ID = '66666666-6666-6666-6666-666666666663';
const FORECAST_PERIOD_ID = '77777777-7777-7777-7777-777777777771';
const DASHBOARD_ID = '88888888-8888-8888-8888-888888888881';
const METRIC_ID = '88888888-8888-8888-8888-888888888882';
const WIDGET_ID = '88888888-8888-8888-8888-888888888883';
const EMAIL_TEMPLATE_ID = '99999999-9999-9999-9999-999999999991';
const EMAIL_FLOW_ID = '99999999-9999-9999-9999-999999999992';
const SALES_PLAY_ID = '99999999-9999-9999-9999-999999999993';
const SCORECARD_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1';
const TRAINING_SCENARIO_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2';
const COMPLIANCE_POLICY_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1';
const BRIEF_TEMPLATE_ID = 'cccccccc-cccc-cccc-cccc-ccccccccccc1';

const now = new Date();

async function safe(label, fn) {
  try {
    await fn();
    console.log(`  + ${label}`);
  } catch (err) {
    if (String(err.message).match(/Unique constraint|already exists|P2002/i)) {
      console.log(`  = ${label} (already present)`);
    } else {
      console.error(`  ! ${label} FAILED:`, err.message);
    }
  }
}

async function main() {
  console.log('== Seeding unified Postgres DB ==');

  // -----------------------------------------------------------------
  // Platform core: tenant, users, roles
  // -----------------------------------------------------------------
  console.log('\n[platform-core]');
  await safe('tenants', () =>
    prisma.tenants.upsert({
      where: { id: TENANT_ID },
      update: {},
      create: {
        id: TENANT_ID,
        tenantId: TENANT_KEY,
        name: 'Demo Tenant',
        createdAt: now,
        plan: 'enterprise',
        features: { ai: true, dashboards: true, coaching: true },
        isDeleted: false,
        status: 'active',
      },
    }),
  );

  await safe('users:admin', () =>
    prisma.users.upsert({
      where: { id: ADMIN_USER_ID },
      update: {},
      create: {
        id: ADMIN_USER_ID,
        tenantId: TENANT_ID,
        email: '[email protected]',
        name: 'Demo Admin',
        role: 'admin',
        isActive: true,
        firstName: 'Demo',
        lastName: 'Admin',
        createdAt: now,
      },
    }),
  );
  await safe('users:manager', () =>
    prisma.users.upsert({
      where: { id: MANAGER_USER_ID },
      update: {},
      create: {
        id: MANAGER_USER_ID,
        tenantId: TENANT_ID,
        email: '[email protected]',
        name: 'Demo Manager',
        role: 'manager',
        isActive: true,
        firstName: 'Demo',
        lastName: 'Manager',
        createdAt: now,
      },
    }),
  );
  await safe('users:rep', () =>
    prisma.users.upsert({
      where: { id: REP_USER_ID },
      update: {},
      create: {
        id: REP_USER_ID,
        tenantId: TENANT_ID,
        email: '[email protected]',
        name: 'Demo Rep',
        role: 'rep',
        isActive: true,
        firstName: 'Demo',
        lastName: 'Rep',
        managerId: MANAGER_USER_ID,
        createdAt: now,
      },
    }),
  );

  for (const r of [
    { id: ADMIN_ROLE_ID, name: 'admin' },
    { id: MANAGER_ROLE_ID, name: 'manager' },
    { id: REP_ROLE_ID, name: 'rep' },
  ]) {
    await safe(`roles:${r.name}`, () =>
      prisma.roles.upsert({
        where: { roleid: r.id },
        update: {},
        create: {
          roleid: r.id,
          tenantId: TENANT_ID,
          name: r.name,
          permissions: { all: r.name === 'admin' },
        },
      }),
    );
  }

  for (const ur of [
    { userId: ADMIN_USER_ID, roleid: ADMIN_ROLE_ID },
    { userId: MANAGER_USER_ID, roleid: MANAGER_ROLE_ID },
    { userId: REP_USER_ID, roleid: REP_ROLE_ID },
  ]) {
    await safe(`user_roles:${ur.userId.slice(-4)}`, () =>
      prisma.userRoles.upsert({
        where: {
          tenantId_userId_roleid: {
            tenantId: TENANT_ID,
            userId: ur.userId,
            roleid: ur.roleid,
          },
        },
        update: {},
        create: {
          tenantId: TENANT_ID,
          userId: ur.userId,
          roleid: ur.roleid,
          assignedat: now,
        },
      }),
    );
  }

  await safe('teams', () =>
    prisma.teams.upsert({
      where: { id: '12345678-1234-1234-1234-123456789012' },
      update: {},
      create: {
        id: '12345678-1234-1234-1234-123456789012',
        tenantId: TENANT_ID,
        name: 'West Coast Team',
        createdAt: now,
      },
    }),
  );

  // -----------------------------------------------------------------
  // Shared revenue graph: accounts, contacts, deals
  // -----------------------------------------------------------------
  console.log('\n[shared revenue graph]');
  await safe('accounts', () =>
    prisma.accounts.upsert({
      where: { id: ACCOUNT_ID },
      update: {},
      create: {
        id: ACCOUNT_ID,
        tenantId: TENANT_ID,
        name: 'Acme Corp',
        industry: 'Software',
        segment: 'Enterprise',
        region: 'NA',
        ownerUserId: REP_USER_ID,
        annualRecurringRevenue: 500000,
        healthscore: 0.78,
        createdAt: now,
      },
    }),
  );
  await safe('contacts', () =>
    prisma.contacts.upsert({
      where: { id: CONTACT_ID },
      update: {},
      create: {
        id: CONTACT_ID,
        tenantId: TENANT_ID,
        accountId: ACCOUNT_ID,
        name: 'Jane Buyer',
        email: '[email protected]',
        firstName: 'Jane',
        lastName: 'Buyer',
        jobTitle: 'VP Sales',
        isPrimary: true,
        createdAt: now,
      },
    }),
  );
  await safe('account_contacts', () =>
    prisma.accountContacts.upsert({
      where: {
        tenantId_accountId_contactId: {
          tenantId: TENANT_ID,
          accountId: ACCOUNT_ID,
          contactId: CONTACT_ID,
        },
      },
      update: {},
      create: {
        tenantId: TENANT_ID,
        accountId: ACCOUNT_ID,
        contactId: CONTACT_ID,
        isPrimary: true,
      },
    }),
  );
  await safe('deals', () =>
    prisma.deals.upsert({
      where: { id: DEAL_ID },
      update: {},
      create: {
        id: DEAL_ID,
        tenantId: TENANT_ID,
        accountId: ACCOUNT_ID,
        ownerUserId: REP_USER_ID,
        name: 'Acme Corp - Q1 Expansion',
        stage: 'Negotiation',
        status: 'open',
        amount: 75000,
        probability: 0.7,
        forecastCategory: 'Commit',
        nextStep: 'Send proposal',
        createdAt: now,
      },
    }),
  );

  // -----------------------------------------------------------------
  // M01 — capture & transcription
  // -----------------------------------------------------------------
  console.log('\n[M01 capture & transcription]');
  await safe('calls', () =>
    prisma.calls.upsert({
      where: { id: CALL_ID },
      update: {},
      create: {
        id: CALL_ID,
        tenantId: TENANT_ID,
        title: 'Discovery Call with Acme',
        callType: 'discovery',
        callSource: 'manual_upload',
        accountId: ACCOUNT_ID,
        dealId: DEAL_ID,
        ownerUserId: REP_USER_ID,
        durationSeconds: 1820,
        transcriptStatus: 'completed',
        sentiment: 'positive',
        language: 'en',
        status: 'completed',
        createdAt: now,
      },
    }),
  );
  await safe('audio_files', () =>
    prisma.audioFiles.upsert({
      where: { id: AUDIO_FILE_ID },
      update: {},
      create: {
        id: AUDIO_FILE_ID,
        tenantId: TENANT_ID,
        callId: CALL_ID,
        format: 'audio/mpeg',
        filesizebytes: 1024 * 1024,
        storagebucket: 'local',
        storagepath: 'uploads/audio/demo.mp3',
        uploadedat: now,
        createdAt: now,
      },
    }),
  );
  await safe('transcripts', () =>
    prisma.transcripts.upsert({
      where: { id: TRANSCRIPT_ID },
      update: {},
      create: {
        id: TRANSCRIPT_ID,
        tenantId: TENANT_ID,
        callId: CALL_ID,
        fullText:
          'Hello Jane, thanks for taking the time today. Let me walk you through how Revenue Intelligence can help your team forecast more accurately.',
        summary: 'Discovery call about forecasting needs',
        keyHighlights: 'Forecast accuracy is the top priority',
        nextSteps: 'Send proposal by Friday',
        talkRatio: 0.55,
        confidenceScore: 0.92,
        createdAt: now,
      },
    }),
  );
  await safe('speaker_segments', () =>
    prisma.speakerSegments.upsert({
      where: { id: '55555555-5555-5555-5555-555555555560' },
      update: {},
      create: {
        id: '55555555-5555-5555-5555-555555555560',
        tenantId: TENANT_ID,
        transcriptId: TRANSCRIPT_ID,
        callId: CALL_ID,
        speaker: 'rep',
        text: 'Hello Jane, thanks for taking the time today.',
        startMs: 0,
        endMs: 3500,
        confidence: '0.95',
        sequenceIndex: 0,
      },
    }),
  );

  await safe('m01_prompt_templates', () =>
    prisma.m01PromptTemplates.upsert({
      where: { id: '55555555-5555-5555-5555-555555555570' },
      update: {},
      create: {
        id: '55555555-5555-5555-5555-555555555570',
        tenantId: TENANT_ID,
        key: 'default-extraction',
        name: 'Default extraction',
        description: 'Sentiment / next steps / risks extraction.',
        templateText: 'Extract sentiment, next steps, and risks from the transcript.',
        version: 1,
        isActive: true,
        createdAt: now,
      },
    }),
  );

  // -----------------------------------------------------------------
  // M02 — conversation intelligence
  // -----------------------------------------------------------------
  console.log('\n[M02 conversation intelligence]');
  await safe('trackers', () =>
    prisma.trackers.upsert({
      where: { id: TRACKER_ID },
      update: {},
      create: {
        id: TRACKER_ID,
        tenantId: TENANT_ID,
        name: 'Pricing Objection',
        keywords: 'too expensive,price,cost,budget',
        description: 'Detects pricing objections',
        severitydefault: 'medium',
        isActive: true,
        createdAt: now,
      },
    }),
  );
  await safe('tracker_detections', () =>
    prisma.trackerDetections.upsert({
      where: { id: '66666666-6666-6666-6666-666666666670' },
      update: {},
      create: {
        id: '66666666-6666-6666-6666-666666666670',
        tenantId: TENANT_ID,
        trackerId: TRACKER_ID,
        entityType: 'call',
        entityId: CALL_ID,
        callId: CALL_ID,
        snippet: 'I think this might be too expensive for our budget',
        confidenceScore: 0.87,
        severity: 'medium',
        createdAt: now,
      },
    }),
  );
  await safe('topics', () =>
    prisma.topics.upsert({
      where: { id: TOPIC_ID },
      update: {},
      create: {
        id: TOPIC_ID,
        tenantId: TENANT_ID,
        name: 'Forecasting',
        phrases: ['forecast', 'pipeline', 'projection'],
        type: 'business',
        createdAt: now,
      },
    }),
  );
  await safe('topictags', () =>
    prisma.topictags.upsert({
      where: { id: '66666666-6666-6666-6666-666666666680' },
      update: {},
      create: {
        id: '66666666-6666-6666-6666-666666666680',
        tenantId: TENANT_ID,
        callId: CALL_ID,
        topicname: 'Forecasting',
        confidenceScore: 0.9,
      },
    }),
  );
  await safe('themes', () =>
    prisma.themes.upsert({
      where: { id: THEME_ID },
      update: {},
      create: {
        id: THEME_ID,
        tenantId: TENANT_ID,
        name: 'Forecast accuracy concerns',
        summary: 'Multiple deals raised forecast-accuracy questions',
        callcount: 5,
        accountcount: 3,
      },
    }),
  );

  // -----------------------------------------------------------------
  // M03 — AI summaries + GenAI
  // -----------------------------------------------------------------
  console.log('\n[M03 ai-summaries-genai]');
  await safe('brief_templates', () =>
    prisma.briefTemplates.upsert({
      where: { id: BRIEF_TEMPLATE_ID },
      update: {},
      create: {
        id: BRIEF_TEMPLATE_ID,
        tenantId: TENANT_ID,
        templateName: 'Account Brief Default',
        entityType: 'account',
        description: 'Default template for account briefs',
        isActive: true,
        versionNumber: 1,
        createdAt: now,
      },
    }),
  );
  await safe('ai_briefs', () =>
    prisma.aiBriefs.upsert({
      where: { id: 'cccccccc-cccc-cccc-cccc-ccccccccccc2' },
      update: {},
      create: {
        id: 'cccccccc-cccc-cccc-cccc-ccccccccccc2',
        tenantId: TENANT_ID,
        briefType: 'account',
        entityId: ACCOUNT_ID,
        llmModel: 'gpt-4o-mini',
        sourceReferences: '[]',
        createdAt: now,
      },
    }),
  );
  await safe('call_summaries', () =>
    prisma.callSummaries.upsert({
      where: { id: 'cccccccc-cccc-cccc-cccc-ccccccccccc3' },
      update: {},
      create: {
        id: 'cccccccc-cccc-cccc-cccc-ccccccccccc3',
        tenantId: TENANT_ID,
        callId: CALL_ID,
        onelinesummary: 'Discovery call - forecast accuracy pain point',
        keypoints: 'Forecast accuracy is the top priority',
        nextsteps: 'Send proposal by Friday',
        confidenceScore: 0.91,
        version: 1,
        generatedat: now,
      },
    }),
  );

  // -----------------------------------------------------------------
  // M05 — account intelligence
  // -----------------------------------------------------------------
  console.log('\n[M05 account-intelligence]');
  await safe('account_briefs', () =>
    prisma.accountBriefs.upsert({
      where: { id: 'cccccccc-cccc-cccc-cccc-ccccccccccc4' },
      update: {},
      create: {
        id: 'cccccccc-cccc-cccc-cccc-ccccccccccc4',
        tenantId: TENANT_ID,
        accountId: ACCOUNT_ID,
        summarytext: 'Acme Corp shows steady growth with strong product engagement.',
        healthsignals: 'positive_usage_trend,executive_sponsorship',
        renewalindicators: 'on_track',
        confidenceScore: 0.88,
        version: 1,
        generatedat: now,
      },
    }),
  );

  // -----------------------------------------------------------------
  // M06 — forecasting & prediction
  // -----------------------------------------------------------------
  console.log('\n[M06 forecasting-prediction]');
  await safe('forecast_periods', () =>
    prisma.forecastPeriods.upsert({
      where: { id: FORECAST_PERIOD_ID },
      update: {},
      create: {
        id: FORECAST_PERIOD_ID,
        tenantId: TENANT_ID,
        name: 'Q1 2026',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-03-31'),
        revenueTarget: '1000000',
        status: 'open',
        isLocked: false,
        createdAt: now,
      },
    }),
  );
  await safe('quotas', () =>
    prisma.quotas.upsert({
      where: { id: '77777777-7777-7777-7777-777777777780' },
      update: {},
      create: {
        id: '77777777-7777-7777-7777-777777777780',
        tenantId: TENANT_ID,
        periodId: FORECAST_PERIOD_ID,
        repUserId: REP_USER_ID,
        amount: 250000,
        createdAt: now,
      },
    }),
  );
  await safe('forecast_submissions', () =>
    prisma.forecastSubmissions.upsert({
      where: { id: '77777777-7777-7777-7777-777777777790' },
      update: {},
      create: {
        id: '77777777-7777-7777-7777-777777777790',
        tenantId: TENANT_ID,
        periodId: FORECAST_PERIOD_ID,
        repUserId: REP_USER_ID,
        version: 1,
        commitForecast: '180000',
        bestCaseForecast: '250000',
        status: 'submitted',
        submittedAt: now,
        createdAt: now,
      },
    }),
  );

  // -----------------------------------------------------------------
  // M07 — revenue dashboards
  // -----------------------------------------------------------------
  console.log('\n[M07 revenue-dashboards]');
  await safe('metrics', () =>
    prisma.metrics.upsert({
      where: { id: METRIC_ID },
      update: {},
      create: {
        id: METRIC_ID,
        tenantId: TENANT_ID,
        name: 'Pipeline Coverage',
        category: 'pipeline',
        formula: 'pipeline / quota',
        isActive: true,
        createdAt: now,
      },
    }),
  );
  await safe('dashboards', () =>
    prisma.dashboards.upsert({
      where: { id: DASHBOARD_ID },
      update: {},
      create: {
        id: DASHBOARD_ID,
        tenantId: TENANT_ID,
        name: 'CRO Default',
        description: 'Top-level CRO view',
        ownerId: ADMIN_USER_ID,
        isPublished: true,
        version: 1,
        createdAt: now,
      },
    }),
  );
  await safe('dashboard_widgets', () =>
    prisma.dashboardWidgets.upsert({
      where: { id: WIDGET_ID },
      update: {},
      create: {
        id: WIDGET_ID,
        tenantId: TENANT_ID,
        dashboardId: DASHBOARD_ID,
        metricId: METRIC_ID,
        title: 'Pipeline Coverage',
        chartType: 'gauge',
        gridX: 0,
        gridY: 0,
        width: 4,
        height: 3,
        createdAt: now,
      },
    }),
  );

  // -----------------------------------------------------------------
  // M08 — sales engagement
  // -----------------------------------------------------------------
  console.log('\n[M08 sales-engagement]');
  await safe('email_templates', () =>
    prisma.emailTemplates.upsert({
      where: { id: EMAIL_TEMPLATE_ID },
      update: {},
      create: {
        id: EMAIL_TEMPLATE_ID,
        tenantId: TENANT_ID,
        createdBy: MANAGER_USER_ID,
        name: 'Intro Email',
        subjectTemplate: 'Quick intro: {{firstName}}',
        bodyTemplate: 'Hi {{firstName}}, ...',
        language: 'en',
        createdAt: now,
      },
    }),
  );
  await safe('email_flows', () =>
    prisma.emailFlows.upsert({
      where: { id: EMAIL_FLOW_ID },
      update: {},
      create: {
        id: EMAIL_FLOW_ID,
        tenantId: TENANT_ID,
        createdBy: MANAGER_USER_ID,
        name: 'New Lead Nurture',
        triggerCondition: 'lead_created',
        steps: [{ stepNumber: 1, templateId: EMAIL_TEMPLATE_ID, delayDays: 0 }],
        isActive: true,
        createdAt: now,
      },
    }),
  );
  await safe('sales_plays', () =>
    prisma.salesPlays.upsert({
      where: { id: SALES_PLAY_ID },
      update: {},
      create: {
        id: SALES_PLAY_ID,
        tenantId: TENANT_ID,
        createdBy: MANAGER_USER_ID,
        name: 'Enterprise Outbound',
        steps: [{ name: 'Call exec', day: 1 }, { name: 'Personalized email', day: 2 }],
        triggerConditions: { segment: 'enterprise' },
        isActive: true,
        createdAt: now,
      },
    }),
  );
  await safe('scorecards', () =>
    prisma.scorecards.upsert({
      where: { id: SCORECARD_ID },
      update: {},
      create: {
        id: SCORECARD_ID,
        tenantId: TENANT_ID,
        name: 'Discovery Call Scorecard',
        description: 'Evaluates discovery quality',
        isActive: true,
        createdAt: now,
      },
    }),
  );

  // -----------------------------------------------------------------
  // M09 — coaching & training
  // -----------------------------------------------------------------
  console.log('\n[M09 coaching-training]');
  await safe('training_scenarios', () =>
    prisma.trainingScenarios.upsert({
      where: { id: TRAINING_SCENARIO_ID },
      update: {},
      create: {
        id: TRAINING_SCENARIO_ID,
        tenantId: TENANT_ID,
        personaName: 'Skeptical CFO',
        personaType: 'cfo',
        contextText: 'Cost-conscious decision maker',
        difficulty: 'medium',
        managerId: MANAGER_USER_ID,
        name: 'CFO Cost Objection',
        createdAt: now,
      },
    }),
  );
  await safe('coaching_notes', () =>
    prisma.coachingNotes.upsert({
      where: { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3' },
      update: {},
      create: {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
        tenantId: TENANT_ID,
        repId: REP_USER_ID,
        managerId: MANAGER_USER_ID,
        content: 'Work on opening questions',
        priority: 'high',
        weakestSkill: 'discovery',
        createdAt: now,
      },
    }),
  );

  // -----------------------------------------------------------------
  // M10 — data & compliance
  // -----------------------------------------------------------------
  console.log('\n[M10 data-compliance]');
  await safe('compliance_policies', () =>
    prisma.compliancePolicies.upsert({
      where: { id: COMPLIANCE_POLICY_ID },
      update: {},
      create: {
        id: COMPLIANCE_POLICY_ID,
        tenantId: TENANT_ID,
        name: 'GDPR Defaults',
        channel: 'email',
        region: 'EU',
        isActive: true,
        rules: { consent_required: true },
        createdBy: ADMIN_USER_ID,
        createdAt: now,
      },
    }),
  );
  await safe('audit_logs', () =>
    prisma.auditLogs.upsert({
      where: { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2' },
      update: {},
      create: {
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
        tenantId: TENANT_ID,
        actorId: ADMIN_USER_ID,
        actorType: 'user',
        action: 'seed',
        entityType: 'tenant',
        entityId: TENANT_ID,
        meta: { source: 'unified-seed' },
        createdAt: now,
      },
    }),
  );

  // -----------------------------------------------------------------
  // Final summary
  // -----------------------------------------------------------------
  await prisma.$executeRawUnsafe(`ANALYZE`);
  const counts = await prisma.$queryRawUnsafe(
    `SELECT relname, n_live_tup
       FROM pg_stat_user_tables
      WHERE schemaname = 'public' AND n_live_tup > 0
      ORDER BY relname`,
  );
  console.log('\n== Populated tables (n_live_tup) ==');
  for (const c of counts) {
    console.log(`  ${c.relname.padEnd(40)} ${c.n_live_tup}`);
  }
  console.log(`\nTotal populated tables: ${counts.length}`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
