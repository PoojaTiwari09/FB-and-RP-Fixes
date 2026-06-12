export interface TableMeta {
  name: string;
  description: string;
  rows: string;
  isActive: boolean;
}

export interface ColumnDef {
  name: string;
  type: 'VARCHAR' | 'TIMESTAMP' | 'INTEGER' | 'FLOAT' | 'BOOLEAN';
  nullable: 'NOT NULL' | 'YES';
  description: string;
  example: string;
}

export interface RelationshipNode {
  name: string;
  type: 'internal' | 'external';
}

export interface TableSchema {
  name: string;
  description: string;
  rowCountLabel: string;
  updateFreq: string;
  schemaName: string;
  primaryKey: string;
  primaryKeyDetails: string;
  partitionColumn: string;
  partitionColumnDetails: string;
  foreignKeysOutLabel: string;
  foreignKeysOutDetails: string;
  columns: ColumnDef[];
  relationships: RelationshipNode[];
  joinKeyInfo: string;
}

export interface ExportRun {
  id: string;
  startedAt: string;
  completedAt: string;
  status: 'SUCCESS' | 'FAILED' | 'RUNNING';
  recordsExported: number;
  tableName: string;
}

export interface ConnectionMeta {
  id: string;
  type: 'Snowflake' | 'PostgreSQL' | 'Redshift';
  name: string;
  host: string;
  database: string;
  schema: string;
  username: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  lastSynced: string;
}

export interface ComplianceLog {
  id: string;
  ruleName: string;
  appliedTo: string;
  status: 'COMPLIANT' | 'NON-COMPLIANT' | 'WARNING';
  checkedAt: string;
  details: string;
}

export const MOCK_TABLES: TableMeta[] = [
  {
    name: 'conversations',
    description: 'All customer conversations and interactions',
    rows: '45,621 rows',
    isActive: true,
  },
  {
    name: 'transcripts',
    description: 'Call transcripts with timestamps',
    rows: '32,108 rows',
    isActive: false,
  },
  {
    name: 'participants',
    description: 'Call and meeting participants',
    rows: '89,442 rows',
    isActive: false,
  },
  {
    name: 'tracker_detections',
    description: 'AI-detected keywords and phrases',
    rows: '1,56,789 rows',
    isActive: false,
  },
  {
    name: 'scorecard_responses',
    description: 'Call scoring and evaluation data',
    rows: '23,401 rows',
    isActive: false,
  },
  {
    name: 'forecast_submissions',
    description: 'Revenue forecast submissions by reps',
    rows: '4,821 rows',
    isActive: false,
  },
  {
    name: 'forecast_targets',
    description: 'Quarterly forecast targets and goals',
    rows: '892 rows',
    isActive: false,
  },
  {
    name: 'deal_scores',
    description: 'AI-generated deal health scores',
    rows: '12,654 rows',
    isActive: false,
  },
  {
    name: 'user_activity',
    description: 'User actions and engagement metrics',
    rows: '2,34,561 rows',
    isActive: false,
  },
  {
    name: 'user_hierarchy',
    description: 'Organization structure and reporting',
    rows: '423 rows',
    isActive: false,
  },
  {
    name: 'crm_associations',
    description: 'CRM data sync and associations',
    rows: '67,890 rows',
    isActive: false,
  },
];

export const MOCK_SCHEMAS: Record<string, TableSchema> = {
  conversations: {
    name: 'conversations',
    description: 'One row per recorded conversation (call, email, or meeting). The central fact table joins to all other RI tables via conversation_id and to CRM opportunities via crm_opportunity_id.',
    rowCountLabel: 'Rows ~ 1.2M',
    updateFreq: 'daily',
    schemaName: 'revenue_intelligence',
    primaryKey: 'conversation_id',
    primaryKeyDetails: 'Unique • Not null • Auto-generated',
    partitionColumn: 'started_at',
    partitionColumnDetails: 'TIMESTAMP • Daily partitions',
    foreignKeysOutLabel: '1 key',
    foreignKeysOutDetails: 'crm_opportunity_id -> CRM',
    columns: [
      {
        name: 'conversation_id',
        type: 'VARCHAR',
        nullable: 'NOT NULL',
        description: 'Unique identifier for each conversation record. Used as the primary join key across all RI tables.',
        example: 'conv_8a3f2d91e4',
      },
      {
        name: 'started_at',
        type: 'TIMESTAMP',
        nullable: 'NOT NULL',
        description: 'UTC timestamp when the conversation began. Used as the partition column for performance optimization.',
        example: '2026-05-19 14:32:07',
      },
      {
        name: 'ended_at',
        type: 'TIMESTAMP',
        nullable: 'YES',
        description: 'UTC timestamp when the conversation ended. Null for in-progress or interrupted conversations.',
        example: '2026-05-19 15:01:44',
      },
      {
        name: 'crm_opportunity_id',
        type: 'VARCHAR',
        nullable: 'YES',
        description: 'Foreign key linking to CRM opportunities. Null when no opportunity is associated with the conversation.',
        example: 'opp_00d7a08800FzxKpEAF',
      },
      {
        name: 'channel',
        type: 'VARCHAR',
        nullable: 'NOT NULL',
        description: 'Communication channel type. One of: call, email, meeting, chat.',
        example: 'call',
      },
      {
        name: 'duration_seconds',
        type: 'INTEGER',
        nullable: 'YES',
        description: 'Total conversation duration in seconds. Null for async channels (email).',
        example: '1777',
      },
      {
        name: 'rep_talk_ratio',
        type: 'FLOAT',
        nullable: 'YES',
        description: 'Percentage of speaking time attributed to the sales rep. Value between 0.0 and 1.0.',
        example: '0.42',
      },
      {
        name: 'recording_url',
        type: 'VARCHAR',
        nullable: 'YES',
        description: 'Secure S3 hosting URL for call video/audio recording.',
        example: 'https://s3.amazonaws.com/ri-calls/conv_8a3f.mp3',
      },
      {
        name: 'host_id',
        type: 'VARCHAR',
        nullable: 'NOT NULL',
        description: 'Internal employee ID of the employee who hosted or organized the conversation event.',
        example: 'emp_usr_9023412',
      },
      {
        name: 'is_analyzed',
        type: 'BOOLEAN',
        nullable: 'NOT NULL',
        description: 'Indicates if the conversation data has completed AI analysis processing.',
        example: 'true',
      },
      {
        name: 'sentiment_score',
        type: 'FLOAT',
        nullable: 'YES',
        description: 'Average sentiment score extracted from transcripts. Ranges from -1.0 (negative) to 1.0 (positive).',
        example: '0.68',
      },
      {
        name: 'language_code',
        type: 'VARCHAR',
        nullable: 'NOT NULL',
        description: 'The primary spoken ISO language code detected during speech analysis.',
        example: 'en-US',
      },
    ],
    relationships: [
      { name: 'transcripts', type: 'internal' },
      { name: 'participants', type: 'internal' },
      { name: 'tracker_detections', type: 'internal' },
      { name: 'CRM (external)', type: 'external' },
    ],
    joinKeyInfo: 'Join via conversation_id for internal tables - crm_opportunity_id for CRM',
  },
  transcripts: {
    name: 'transcripts',
    description: 'Stores text transcriptions mapped to timelines and speaker profiles, created from indexed audio feeds.',
    rowCountLabel: 'Rows ~ 820K',
    updateFreq: 'daily',
    schemaName: 'revenue_intelligence',
    primaryKey: 'transcript_id',
    primaryKeyDetails: 'Unique • Not null',
    partitionColumn: 'created_at',
    partitionColumnDetails: 'TIMESTAMP • Daily partitions',
    foreignKeysOutLabel: '1 key',
    foreignKeysOutDetails: 'conversation_id -> conversations',
    columns: [
      {
        name: 'transcript_id',
        type: 'VARCHAR',
        nullable: 'NOT NULL',
        description: 'Unique identifier for each transcript block.',
        example: 'trn_982b13fa21',
      },
      {
        name: 'conversation_id',
        type: 'VARCHAR',
        nullable: 'NOT NULL',
        description: 'Links back to the source conversation record.',
        example: 'conv_8a3f2d91e4',
      },
      {
        name: 'speaker_id',
        type: 'VARCHAR',
        nullable: 'YES',
        description: 'Speaker identifier linking to meeting participants.',
        example: 'part_3421x',
      },
      {
        name: 'utterance_text',
        type: 'VARCHAR',
        nullable: 'NOT NULL',
        description: 'The transcribed text snippet spoken.',
        example: 'So, let me review the pricing structure with you...',
      },
      {
        name: 'start_ms',
        type: 'INTEGER',
        nullable: 'NOT NULL',
        description: 'Millisecond offset from beginning of talk when speaker began.',
        example: '45210',
      },
      {
        name: 'end_ms',
        type: 'INTEGER',
        nullable: 'NOT NULL',
        description: 'Millisecond offset from beginning of talk when speaker ended.',
        example: '52190',
      },
    ],
    relationships: [
      { name: 'conversations', type: 'internal' },
      { name: 'participants', type: 'internal' },
    ],
    joinKeyInfo: 'Join via conversation_id to connect transcripts to root conversation metrics.',
  },
  participants: {
    name: 'participants',
    description: 'Tracks detailed metadata for call attendees, including contact associations, emails, and corporate roles.',
    rowCountLabel: 'Rows ~ 2.4M',
    updateFreq: 'daily',
    schemaName: 'revenue_intelligence',
    primaryKey: 'participant_id',
    primaryKeyDetails: 'Unique • Not null',
    partitionColumn: 'associated_date',
    partitionColumnDetails: 'TIMESTAMP • Monthly partitions',
    foreignKeysOutLabel: '2 keys',
    foreignKeysOutDetails: 'conversation_id -> conversations, contact_id -> CRM',
    columns: [
      {
        name: 'participant_id',
        type: 'VARCHAR',
        nullable: 'NOT NULL',
        description: 'Primary identifier for call attendee.',
        example: 'part_3421x',
      },
      {
        name: 'conversation_id',
        type: 'VARCHAR',
        nullable: 'NOT NULL',
        description: 'Foreign key to conversations table.',
        example: 'conv_8a3f2d91e4',
      },
      {
        name: 'email',
        type: 'VARCHAR',
        nullable: 'NOT NULL',
        description: 'Participant email address.',
        example: 'client.contact@externalcompany.com',
      },
      {
        name: 'name',
        type: 'VARCHAR',
        nullable: 'YES',
        description: 'Full name of the participant.',
        example: 'Sarah Jenkins',
      },
      {
        name: 'role',
        type: 'VARCHAR',
        nullable: 'NOT NULL',
        description: 'Role classification (external_buyer, internal_rep, internal_manager).',
        example: 'external_buyer',
      },
    ],
    relationships: [
      { name: 'conversations', type: 'internal' },
    ],
    joinKeyInfo: 'Join via conversation_id for conversation context.',
  },
};

// Generates fallback schemas dynamically if someone clicks a table that doesn't have an explicit schema defined.
export function getOrCreateSchema(tableName: string): TableSchema {
  if (MOCK_SCHEMAS[tableName]) {
    return MOCK_SCHEMAS[tableName];
  }
  const defaultMeta = MOCK_TABLES.find((t) => t.name === tableName) || {
    name: tableName,
    description: 'Database schema table references.',
    rows: '1,000 rows',
  };
  return {
    name: defaultMeta.name,
    description: defaultMeta.description,
    rowCountLabel: `Rows ~ ${defaultMeta.rows}`,
    updateFreq: 'daily',
    schemaName: 'revenue_intelligence',
    primaryKey: `${defaultMeta.name.replace(/s$/, '')}_id`,
    primaryKeyDetails: 'Unique • Not null',
    partitionColumn: 'created_at',
    partitionColumnDetails: 'TIMESTAMP • Daily partitions',
    foreignKeysOutLabel: '1 key',
    foreignKeysOutDetails: 'conversation_id -> conversations',
    columns: [
      {
        name: `${defaultMeta.name.replace(/s$/, '')}_id`,
        type: 'VARCHAR',
        nullable: 'NOT NULL',
        description: `Primary key identifier for table ${defaultMeta.name}.`,
        example: 'id_9023asdf12',
      },
      {
        name: 'conversation_id',
        type: 'VARCHAR',
        nullable: 'YES',
        description: 'Optional parent relation linking to conversations.',
        example: 'conv_8a3f2d91e4',
      },
      {
        name: 'created_at',
        type: 'TIMESTAMP',
        nullable: 'NOT NULL',
        description: 'Timestamp when this entry record was synced.',
        example: '2026-05-19 14:32:07',
      },
      {
        name: 'payload_data',
        type: 'VARCHAR',
        nullable: 'YES',
        description: 'Structured metadata attributes payload in JSON text format.',
        example: '{"key": "value"}',
      },
    ],
    relationships: [
      { name: 'conversations', type: 'internal' },
    ],
    joinKeyInfo: 'Join via conversation_id for core context.',
  };
}

export const MOCK_CONNECTIONS: ConnectionMeta[] = [
  {
    id: 'conn-snowflake-001',
    type: 'Snowflake',
    name: 'Snowflake Analytics Warehouse',
    host: 'relanto-ri.snowflakecomputing.com',
    database: 'RI_ANALYTICS',
    schema: 'revenue_intelligence',
    username: 'RI_DATA_READER',
    status: 'CONNECTED',
    lastSynced: '6 hours ago',
  },
];

export const MOCK_EXPORT_RUNS: ExportRun[] = [
  {
    id: 'run-9021',
    startedAt: '2026-06-08 08:00:00 UTC',
    completedAt: '2026-06-08 08:14:23 UTC',
    status: 'SUCCESS',
    recordsExported: 45621,
    tableName: 'conversations',
  },
  {
    id: 'run-9020',
    startedAt: '2026-06-08 08:00:00 UTC',
    completedAt: '2026-06-08 08:10:45 UTC',
    status: 'SUCCESS',
    recordsExported: 32108,
    tableName: 'transcripts',
  },
  {
    id: 'run-9019',
    startedAt: '2026-06-08 08:00:00 UTC',
    completedAt: '2026-06-08 08:05:12 UTC',
    status: 'SUCCESS',
    recordsExported: 89442,
    tableName: 'participants',
  },
  {
    id: 'run-9018',
    startedAt: '2026-06-07 08:00:00 UTC',
    completedAt: '2026-06-07 08:29:55 UTC',
    status: 'SUCCESS',
    recordsExported: 156789,
    tableName: 'tracker_detections',
  },
  {
    id: 'run-9017',
    startedAt: '2026-06-07 08:00:00 UTC',
    completedAt: '2026-06-07 08:02:11 UTC',
    status: 'FAILED',
    recordsExported: 0,
    tableName: 'scorecard_responses',
  },
];

export const MOCK_COMPLIANCE: ComplianceLog[] = [
  {
    id: 'comp-101',
    ruleName: 'GDPR PII Redaction',
    appliedTo: 'transcripts',
    status: 'COMPLIANT',
    checkedAt: '2026-06-08 11:30:00 UTC',
    details: 'Verified phone numbers and email structures are hashed in utterances.',
  },
  {
    id: 'comp-102',
    ruleName: 'CCPA Opt-Out Sync',
    appliedTo: 'conversations',
    status: 'COMPLIANT',
    checkedAt: '2026-06-08 11:15:00 UTC',
    details: 'Synced 12 opt-out signals, matching conversations scrubbed.',
  },
  {
    id: 'comp-103',
    ruleName: 'SOC2 Recording Encrypt',
    appliedTo: 'conversations',
    status: 'COMPLIANT',
    checkedAt: '2026-06-08 10:45:00 UTC',
    details: 'Verified S3 KMS encryption tags on all new recording paths.',
  },
  {
    id: 'comp-104',
    ruleName: 'HIPAA Compliance Guard',
    appliedTo: 'tracker_detections',
    status: 'WARNING',
    checkedAt: '2026-06-08 09:10:00 UTC',
    details: 'Flagged 2 keyword patterns matching medical diagnostic codes; manual check recommended.',
  },
];

export const MOCK_CRM_SYNC_STATUS = {
  lastSyncTime: '2 hours ago',
  status: 'HEALTHY',
  pendingRecords: 0,
  syncSchedule: 'Hourly',
  crmType: 'Salesforce',
};
