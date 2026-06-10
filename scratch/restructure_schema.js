const fs = require('fs');
const path = require('path');

const schemaPath = path.resolve(__dirname, '../packages/database/prisma/schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

// Define Ingestion models
const ingestionModels = [
  'Call', 'CallRecord', 'Transcript', 'Utterance', 'CallNote', 'CallShare', 'LiveCallSession', 'LiveCallSummary'
];

// Define Revenue Graph models
const revenueGraphModels = [
  'Account', 'Deal', 'Dataset', 'DatasetRelationship', 'DatasetObject', 'DatasetField',
  'DataSource', 'DataSourceObject', 'DataSourceField', 'DataSourceRelationship',
  'Team', 'DashboardAccess', 'M10Account', 'M10Contact', 'M10Deal', 'M10DealContact',
  'M10Activity', 'M10InteractionLink', 'M10LinkDecisionLog', 'M10MappingRuleSet',
  'M10CrmSyncState', 'M10DataCloudConnection', 'M10DataCloudExportRun', 'M10DataCloudCheckpoint',
  'DealMeddpicc', 'M04DealDriver', 'DealComment', 'DealTask', 'DealWarning', 'DealPlaybook',
  'DealActivityEvent', 'DealNotification'
];

const relationFields = [
  'userId', 'callId', 'transcriptId', 'dashboardId', 'accountId', 'opportunityId', 'dealId',
  'objectId', 'fieldId', 'parentId', 'managerId', 'dataSourceId', 'trackerId', 'playId',
  'enrollmentId', 'runId', 'workflowId', 'approverId', 'activityId', 'connectionId', 'boardId',
  'submissionId', 'periodId', 'repUserId', 'authorId', 'sharedByUserId', 'sharedWithId',
  'createdById', 'actorId', 'configId', 'snapshotId', 'scenarioid', 'sessionid', 'scorecardid', 'recid'
];

const lines = schema.split('\n');
let inModel = false;
let currentModelName = '';

const newLines = [];

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  const trimmed = line.trim();

  if (trimmed.startsWith('model ')) {
    inModel = true;
    currentModelName = trimmed.match(/model (\w+)/)[1];
    newLines.push(line);
    continue;
  }

  if (trimmed === '}') {
    if (inModel) {
      if (currentModelName === 'Widget') {
        newLines.push('  tenantid    String     @db.Uuid');
        newLines.push('  @@index([tenantid, dashboardId])');
      } else if (currentModelName === 'LiveCallSummary') {
        newLines.push('  tenantid             String          @db.Uuid');
        newLines.push('  @@index([tenantid, sessionId])');
      }
      inModel = false;
    }
    newLines.push(line);
    continue;
  }

  if (inModel) {
    if (trimmed.startsWith('//') || trimmed.startsWith('///')) {
      newLines.push(line);
      continue;
    }

    // Convert @@schema
    if (trimmed.startsWith('@@schema(')) {
      if (ingestionModels.includes(currentModelName)) {
        line = line.replace(/@@schema\("[^"]+"\)/, '@@schema("ingestion")');
      } else if (revenueGraphModels.includes(currentModelName)) {
        line = line.replace(/@@schema\("[^"]+"\)/, '@@schema("revenuegraph")');
      }
    }

    // Rename tenantId/tenant_id to tenantid and convert to UUID
    if (trimmed.startsWith('tenantId ') || trimmed.startsWith('tenant_id ')) {
      const hasUuid = line.includes('@db.Uuid');
      line = line.replace(/tenantId\s+String/, 'tenantid         String' + (hasUuid ? '' : ' @db.Uuid'));
      line = line.replace(/tenant_id\s+String/, 'tenantid         String' + (hasUuid ? '' : ' @db.Uuid'));
      if (!line.includes('@db.Uuid') && !hasUuid) {
        line = line.replace(/tenantid\s+String/, 'tenantid         String @db.Uuid');
      }
    }

    // Convert primary key
    if (trimmed.startsWith('id ') && trimmed.includes('@id')) {
      line = line.replace(/@default\((cuid|uuid)\(\)\)/, '@default(dbgenerated("gen_random_uuid()"))');
      if (!line.includes('@db.Uuid')) {
        line = line.trimEnd() + ' @db.Uuid';
      }
    }

    // Handle other Pks
    const customPkFields = ['recid', 'snapshotid', 'configId', 'snapshotId', 'scenarioid', 'sessionid'];
    for (const pk of customPkFields) {
      if (trimmed.startsWith(pk + ' ') && trimmed.includes('@id')) {
        line = line.replace(/@default\((cuid|uuid)\(\)\)/, '@default(dbgenerated("gen_random_uuid()"))');
        if (!line.includes('@db.Uuid')) {
          line = line.trimEnd() + ' @db.Uuid';
        }
      }
    }

    // Rename references in indices
    line = line.replace(/tenantId/g, 'tenantid');

    // Parse field definitions for foreign keys
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2) {
      const fieldName = parts[0];
      const fieldType = parts[1];
      
      if (relationFields.includes(fieldName)) {
        if (fieldType === 'String' || fieldType === 'String?') {
          if (!line.includes('@db.Uuid')) {
            const index = line.indexOf(fieldType);
            const startPart = line.substring(0, index + fieldType.length);
            const endPart = line.substring(index + fieldType.length);
            line = startPart + ' @db.Uuid' + endPart;
          }
        }
      }
    }

    // Clean up any double @db.Uuid attributes
    line = line.replace(/@db\.Uuid/g, '__UUID_ATTR__');
    line = line.replace(/__UUID_ATTR__(\s*__UUID_ATTR__)+/g, '__UUID_ATTR__');
    line = line.replace(/__UUID_ATTR__/g, '@db.Uuid');
  }

  newLines.push(line);
}

let newSchema = newLines.join('\n');

// Enable schemas
newSchema = newSchema.replace(
  /schemas\s+=\s+\["dashboards",\s*"public"\]/,
  'schemas    = ["dashboards", "public", "ingestion", "revenuegraph"]'
);

// Inject composite indices under the index definitions of tenant-scoped tables
const indexAdditions = {
  'CallRecord': '  @@index([tenantid, callDate])',
  'Deal': '  @@index([tenantid, quarter])',
  'Account': '  @@index([tenantid, name])',
  'User': '  @@index([tenantid, role])',
  'Transcript': '  @@index([tenantid, callId])',
  'CallNote': '  @@index([tenantid, callId])',
  'CallShare': '  @@index([tenantid, callId])',
  'Dashboard': '  @@index([tenantid, ownerId])',
  'LiveCallSession': '  @@index([tenantid, status])'
};

const finalBlocks = newSchema.split(/(?=model \w+ \{)/g);
const mappedBlocks = finalBlocks.map(block => {
  if (block.startsWith('model ')) {
    const modelName = block.match(/model (\w+)/)[1];
    if (indexAdditions[modelName]) {
      const addition = indexAdditions[modelName];
      if (!block.includes(addition)) {
        block = block.replace(/\}\s*$/, `${addition}\n}`);
      }
    }
  }
  return block;
});

fs.writeFileSync(schemaPath, mappedBlocks.join(''), 'utf8');
console.log("Restructured all aspects successfully!");
