const fs = require('fs');
const path = require('path');

// 1. Fix modules/m01-capture-transcription/seeds/seed.ts
const seedM01Path = path.resolve(__dirname, '../modules/m01-capture-transcription/seeds/seed.ts');
if (fs.existsSync(seedM01Path)) {
  let content = fs.readFileSync(seedM01Path, 'utf8');
  content = content.replace(/tenantId,(\r?\n)\s*fullText:/g, "tenantid: tenantId,$1    fullText:");
  content = content.replace(/tenantId,(\r?\n)\s*speaker:/g, "tenantid: tenantId,$1        speaker:");
  content = content.replace(/tenantId:\s*TENANT_ID,/g, "tenantid: TENANT_ID,");
  content = content.replace(/tenantId:\s*TENANT_ID,\s*id:\s*\{\s*in:\s*\[\.\.\.DEMO_CALL_IDS\]\s*\}/g, "tenantid: TENANT_ID, id: { in: [...DEMO_CALL_IDS] }");
  fs.writeFileSync(seedM01Path, content, 'utf8');
  console.log('Fixed modules/m01-capture-transcription/seeds/seed.ts');
}

// 2. Fix packages/database/prisma/seed-engage.ts
const seedEngagePath = path.resolve(__dirname, '../packages/database/prisma/seed-engage.ts');
if (fs.existsSync(seedEngagePath)) {
  let content = fs.readFileSync(seedEngagePath, 'utf8');
  content = content.replace(/tenantId:\s*TENANT_ID,/g, "tenantid: TENANT_ID,");
  fs.writeFileSync(seedEngagePath, content, 'utf8');
  console.log('Fixed packages/database/prisma/seed-engage.ts');
}

// 3. Fix packages/database/prisma/seed-trackers.ts
const seedTrackersPath = path.resolve(__dirname, '../packages/database/prisma/seed-trackers.ts');
if (fs.existsSync(seedTrackersPath)) {
  let content = fs.readFileSync(seedTrackersPath, 'utf8');
  content = content.replace(/tenantId:\s*TENANT_ID/g, "tenantid: TENANT_ID");
  fs.writeFileSync(seedTrackersPath, content, 'utf8');
  console.log('Fixed packages/database/prisma/seed-trackers.ts');
}

// 4. Fix packages/database/prisma/seed-call-reviews.ts
const seedCallReviewsPath = path.resolve(__dirname, '../packages/database/prisma/seed-call-reviews.ts');
if (fs.existsSync(seedCallReviewsPath)) {
  let content = fs.readFileSync(seedCallReviewsPath, 'utf8');
  content = content.replace(/tenantId,(\r?\n)/g, "tenantid: tenantId,$1");
  content = content.replace(/tenantId:\s*TENANT_ID/g, "tenantid: TENANT_ID");
  fs.writeFileSync(seedCallReviewsPath, content, 'utf8');
  console.log('Fixed packages/database/prisma/seed-call-reviews.ts');
}

// 5. Fix packages/database/prisma/seed-m06.ts
const seedM06Path = path.resolve(__dirname, '../packages/database/prisma/seed-m06.ts');
if (fs.existsSync(seedM06Path)) {
  let content = fs.readFileSync(seedM06Path, 'utf8');
  
  // Replace tenantId -> tenantid in queries and objects
  // Match where: { tenantId } or { tenantId, ... } or create/update/data properties
  content = content.replace(/where:\s*\{\s*tenantId\s*\}/g, "where: { tenantid: tenantId }");
  content = content.replace(/where:\s*\{\s*tenantId,\s*/g, "where: { tenantid: tenantId, ");
  content = content.replace(/update:\s*\{\s*tenantId/g, "update: { tenantid: tenantId");
  content = content.replace(/create:\s*\{\s*tenantId/g, "create: { tenantid: tenantId");
  content = content.replace(/tenantId,\r?\n\s*periodId/g, "tenantid: tenantId,\r\n      periodId");
  content = content.replace(/tenantId,\r?\n\s*repUserId/g, "tenantid: tenantId,\r\n      repUserId");
  content = content.replace(/tenantId,\r?\n\s*forecastSubmissionId/g, "tenantid: tenantId,\r\n        forecastSubmissionId");
  content = content.replace(/tenantId,\r?\n\s*predictedAmount/g, "tenantid: tenantId,\r\n      predictedAmount");
  content = content.replace(/tenantId,\r?\n\s*fromStage/g, "tenantid: tenantId,\r\n      fromStage");
  content = content.replace(/tenantId,\r?\n\s*dealName/g, "tenantid: tenantId,\r\n      dealName");
  content = content.replace(/tenantId,\r?\n\s*name/g, "tenantid: tenantId,\r\n      name");
  content = content.replace(/tenantId:\s*tenantId/g, "tenantid: tenantId");
  content = content.replace(/tenantId,\r?\n\s*scope/g, "tenantid: tenantId,\r\n      scope");
  content = content.replace(/tenantId,\r?\n\s*label/g, "tenantid: tenantId,\r\n      label");
  content = content.replace(/id:\s*'col-pipeline',\s*tenantId/g, "id: 'col-pipeline', tenantid: tenantId");
  content = content.replace(/id:\s*'col-best-case',\s*tenantId/g, "id: 'col-best-case', tenantid: tenantId");
  content = content.replace(/id:\s*'col-commit',\s*tenantId/g, "id: 'col-commit', tenantid: tenantId");
  content = content.replace(/id:\s*'col-closed',\s*tenantId/g, "id: 'col-closed', tenantid: tenantId");
  content = content.replace(/where:\s*\{\s*OR:\s*\[\s*\{\s*tenantId\s*\},/g, "where: { OR: [ { tenantid: tenantId },");
  content = content.replace(/count\(\{\s*where:\s*\{\s*tenantId\s*\}\s*\}\)/g, "count({ where: { tenantid: tenantId } })");
  content = content.replace(/quota\.deleteMany\(\{\s*where:\s*\{\s*tenantId\s*\}\s*\}\)/g, "quota.deleteMany({ where: { tenantid: tenantId } })");
  content = content.replace(/crmDeal\.deleteMany\(\{\s*where:\s*\{\s*tenantId\s*\}\s*\}\)/g, "crmDeal.deleteMany({ where: { tenantid: tenantId } })");
  content = content.replace(/forecastUser\.deleteMany\(\{\s*where:\s*\{\s*tenantId\s*\}\s*\}\)/g, "forecastUser.deleteMany({ where: { tenantid: tenantId } })");
  content = content.replace(/forecastPeriod\.deleteMany\(\{\s*where:\s*\{\s*tenantId\s*\}\s*\}\)/g, "forecastPeriod.deleteMany({ where: { tenantid: tenantId } })");
  content = content.replace(/historicalConversionRate\.deleteMany\(\{\s*where:\s*\{\s*tenantId\s*\}\s*\}\)/g, "historicalConversionRate.deleteMany({ where: { tenantid: tenantId } })");
  content = content.replace(/boardSubmissionAnnotation\.deleteMany\(\{\s*where:\s*\{\s*tenantId\s*\}\s*\}\)/g, "boardSubmissionAnnotation.deleteMany({ where: { tenantid: tenantId } })");
  content = content.replace(/boardExclusion\.deleteMany\(\{\s*where:\s*\{\s*tenantId\s*\}\s*\}\)/g, "boardExclusion.deleteMany({ where: { tenantid: tenantId } })");
  content = content.replace(/boardCrmMapping\.deleteMany\(\{\s*where:\s*\{\s*tenantId\s*\}\s*\}\)/g, "boardCrmMapping.deleteMany({ where: { tenantid: tenantId } })");
  content = content.replace(/boardReminderConfig\.deleteMany\(\{\s*where:\s*\{\s*tenantId\s*\}\s*\}\)/g, "boardReminderConfig.deleteMany({ where: { tenantid: tenantId } })");
  content = content.replace(/boardColumn\.deleteMany\(\{\s*where:\s*\{\s*tenantId\s*\}\s*\}\)/g, "boardColumn.deleteMany({ where: { tenantid: tenantId } })");
  content = content.replace(/forecastBoard\.deleteMany\(\{\s*where:\s*\{\s*tenantId\s*\}\s*\}\)/g, "forecastBoard.deleteMany({ where: { tenantid: tenantId } })");
  content = content.replace(/forecastAuditLog\.deleteMany\(\{\s*where:\s*\{\s*tenantId\s*\}\s*\}\)/g, "forecastAuditLog.deleteMany({ where: { tenantid: tenantId } })");
  content = content.replace(/forecastSubmission\.deleteMany\(\{\s*where:\s*\{\s*tenantId\s*\}\s*\}\)/g, "forecastSubmission.deleteMany({ where: { tenantid: tenantId } })");
  content = content.replace(/forecastPeriod\.deleteMany\(\{\s*where:\s*\{\s*id:\s*\{\s*in:\s*DEMO_PERIOD_IDS\s*\}\s*\}\s*\}\)/g, "forecastPeriod.deleteMany({ where: { id: { in: DEMO_PERIOD_IDS } } })");
  content = content.replace(/forecastBoard\.deleteMany\(\{\s*where:\s*\{\s*id:\s*\{\s*in:\s*DEMO_BOARD_IDS\s*\}\s*\}\s*\}\)/g, "forecastBoard.deleteMany({ where: { id: { in: DEMO_BOARD_IDS } } })");

  // Map TEAM member IDs to valid UUIDs in seed-m06.ts
  const repUuidMap = {
    'me': '00000000-0000-0000-0000-000000000003',
    'sarah': '00000000-0000-0000-0000-000000000004',
    'michael': '00000000-0000-0000-0000-000000000005',
    'david': '00000000-0000-0000-0000-000000000006',
    'emily': '00000000-0000-0000-0000-000000000007'
  };

  // Replace id: 'me', id: 'sarah', etc. in TEAM array
  for (const [key, val] of Object.entries(repUuidMap)) {
    content = content.replace(new RegExp(`id:\\s*'${key}'`, 'g'), `id: '${val}'`);
    content = content.replace(new RegExp(`repUserId:\\s*TEAM\\[0\\]\\.id`, 'g'), `repUserId: TEAM[0].id`);
    content = content.replace(new RegExp(`repUserId:\\s*rep\\.id`, 'g'), `repUserId: rep.id`);
    content = content.replace(new RegExp(`actorId:\\s*rep\\.id`, 'g'), `actorId: rep.id`);
    content = content.replace(new RegExp(`actorId:\\s*TEAM\\[0\\]\\.id`, 'g'), `actorId: TEAM[0].id`);
    content = content.replace(new RegExp(`repUserId:\\s*index < 3 \\? TEAM\\[0\\]\\.id : TEAM\\[1\\]\\.id`, 'g'), `repUserId: index < 3 ? TEAM[0].id : TEAM[1].id`);
  }
  
  fs.writeFileSync(seedM06Path, content, 'utf8');
  console.log('Fixed packages/database/prisma/seed-m06.ts');
}

// 6. Fix packages/database/prisma/seed-m04-dealboards.ts
const seedM04Path = path.resolve(__dirname, '../packages/database/prisma/seed-m04-dealboards.ts');
if (fs.existsSync(seedM04Path)) {
  let content = fs.readFileSync(seedM04Path, 'utf8');

  // Replace tenantId -> tenantid in queries and objects
  content = content.replace(/tenantId:\s*TENANT_ID/g, "tenantid: TENANT_ID");

  // Map deal IDs to stable test UUIDs:
  // managerDeals: '1'-'9'
  // repDeals: 'deal-1'-'deal-8'
  const dealUuidMap = {
    '1': '00000000-0000-0000-0000-000000000011',
    '2': '00000000-0000-0000-0000-000000000012',
    '3': '00000000-0000-0000-0000-000000000013',
    '4': '00000000-0000-0000-0000-000000000014',
    '5': '00000000-0000-0000-0000-000000000015',
    '6': '00000000-0000-0000-0000-000000000016',
    '7': '00000000-0000-0000-0000-000000000017',
    '8': '00000000-0000-0000-0000-000000000018',
    '9': '00000000-0000-0000-0000-000000000019',
    'deal-1': '00000000-0000-0000-0000-000000000021',
    'deal-2': '00000000-0000-0000-0000-000000000022',
    'deal-3': '00000000-0000-0000-0000-000000000023',
    'deal-4': '00000000-0000-0000-0000-000000000024',
    'deal-5': '00000000-0000-0000-0000-000000000025',
    'deal-6': '00000000-0000-0000-0000-000000000026',
    'deal-7': '00000000-0000-0000-0000-000000000027',
    'deal-8': '00000000-0000-0000-0000-000000000028'
  };

  // Replace ID definitions and foreign key references
  for (const [key, val] of Object.entries(dealUuidMap)) {
    // Exact quote replacement
    content = content.replace(new RegExp(`id:\\s*'${key}'`, 'g'), `id: '${val}'`);
    content = content.replace(new RegExp(`dealId:\\s*'${key}'`, 'g'), `dealId: '${val}'`);
  }

  // Double check and replace any array elements or in queries
  content = content.replace(/'deal-1',\s*'deal-2',\s*'deal-3',\s*'deal-4',\s*'deal-5',\s*'deal-6',\s*'deal-7',\s*'deal-8'/g, 
    "'00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000025', '00000000-0000-0000-0000-000000000026', '00000000-0000-0000-0000-000000000027', '00000000-0000-0000-0000-000000000028'");
  content = content.replace(/'deal-1',\s*'deal-2',\s*'deal-3',\s*'deal-4'/g, 
    "'00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000024'");

  fs.writeFileSync(seedM04Path, content, 'utf8');
  console.log('Fixed packages/database/prisma/seed-m04-dealboards.ts');
}

console.log('All seed fixes completed successfully.');
