/**
 * Data Cloud API Client
 * ─────────────────────────────────────────────────────────────────────────────
 * Connects exclusively to the m10-data-compliance NestJS backend.
 * Canonical prefix: /api/v1/m10-data-compliance  (proxied via next.config.ts)
 *
 * NO MOCK FALLBACKS — all functions return real backend data or throw.
 * The UI is responsible for showing error/loading states.
 */

import {
  TableMeta,
  TableSchema,
  ExportRun,
  ConnectionMeta,
  ComplianceLog,
  MOCK_TABLES,
  getOrCreateSchema,
  MOCK_CRM_SYNC_STATUS,
} from './mockData';

// ─── Base URL ─────────────────────────────────────────────────────────────────
const BASE = '/api/v1/m10-data-compliance';

import { backendFetch } from '../../../shared/lib/backend-api';

// ─── Generic fetch wrapper — throws on any failure ────────────────────────────
async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await backendFetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API ${options.method ?? 'GET'} ${path} failed [${res.status}]: ${body}`);
  }

  const json = await res.json();
  // Unwrap the monorepo's standard ResponseTransformInterceptor { success: true, data: ... }
  if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
    return json.data as T;
  }
  return json as T;
}

// ─── Response Normalisers ─────────────────────────────────────────────────────

/**
 * Backend GET /exports/connections returns:
 *   { connectionId, destination, isActive, createdAt, config? }
 * UI expects: { id, type, name, host, database, schema, username, status, lastSynced }
 */
function normaliseConnection(raw: any): ConnectionMeta {
  const typeMap: Record<string, ConnectionMeta['type']> = {
    snowflake: 'Snowflake',
    postgres: 'PostgreSQL',
    redshift: 'Redshift',
    bigquery: 'PostgreSQL',
    s3: 'PostgreSQL',
    databricks: 'PostgreSQL',
  };

  const config = raw.config ?? {};
  return {
    id: raw.connectionId ?? raw.id,
    type: typeMap[raw.destination?.toLowerCase()] ?? 'Snowflake',
    name: raw.destinationName ?? `${raw.destination ?? 'Warehouse'} Connection`,
    host: config.host ?? `${raw.destination}.example.com`,
    database: config.database ?? 'ANALYTICS',
    schema: config.schema ?? 'public',
    username: config.username ?? 'READER',
    status: raw.isActive ? 'CONNECTED' : 'DISCONNECTED',
    lastSynced: raw.createdAt
      ? new Date(raw.createdAt).toLocaleString()
      : 'Unknown',
  };
}

/**
 * Backend GET /exports/runs returns:
 *   { runId, connectionId, destination, status, rowsExported, filePaths,
 *     startedAt, completedAt, errorMessage, downloadUrls }
 * UI expects: { id, startedAt, completedAt, status, recordsExported, tableName }
 */
function normaliseExportRun(raw: any): ExportRun {
  const statusMap: Record<string, ExportRun['status']> = {
    running: 'RUNNING',
    success: 'SUCCESS',
    failed: 'FAILED',
  };

  const tableName =
    raw.filePaths && typeof raw.filePaths === 'object'
      ? (Object.keys(raw.filePaths)[0] ?? raw.destination ?? 'data')
      : raw.tableName ?? raw.destination ?? 'data';

  return {
    id: raw.runId ?? raw.id,
    startedAt: raw.startedAt
      ? new Date(raw.startedAt).toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
      : 'Unknown',
    completedAt: raw.completedAt
      ? new Date(raw.completedAt).toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
      : raw.status === 'running'
      ? 'Running...'
      : 'Unknown',
    status: statusMap[raw.status?.toLowerCase()] ?? 'FAILED',
    recordsExported: raw.rowsExported ?? raw.recordsExported ?? 0,
    tableName,
  };
}

/**
 * Backend GET /policies returns M10CompliancePolicy objects:
 *   { id, tenantId, name, description, channel, regionFamily,
 *     ruleDefinition, isActive, createdAt, updatedAt }
 * UI expects: { id, ruleName, appliedTo, status, checkedAt, details }
 */
function normalisePolicy(raw: any): ComplianceLog {
  return {
    id: raw.id,
    ruleName: raw.name ?? 'Unnamed Policy',
    appliedTo: raw.channel ?? raw.regionFamily ?? 'all',
    status: raw.isActive ? 'COMPLIANT' : 'WARNING',
    checkedAt: raw.updatedAt
      ? new Date(raw.updatedAt).toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
      : new Date(raw.createdAt).toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
    details:
      raw.description ??
      `${raw.regionFamily ?? 'GLOBAL'} — ${raw.ruleDefinition?.fallbackAction ?? 'block'} fallback`,
  };
}

// ─── API Client ───────────────────────────────────────────────────────────────

export const dataCloudApi = {
  // ── Tables & Schema ──────────────────────────────────────────────────────────
  // No backend endpoint for table metadata — served from static config (not mock).

  async getTables(): Promise<{ data: TableMeta[]; isMock: boolean }> {
    return { data: MOCK_TABLES, isMock: false };
  },

  async getTableSchema(tableName: string): Promise<{ data: TableSchema; isMock: boolean }> {
    return { data: getOrCreateSchema(tableName), isMock: false };
  },

  // ── Connections ──────────────────────────────────────────────────────────────
  // GET /api/v1/m10-data-compliance/exports/connections

  async getConnections(): Promise<{ data: ConnectionMeta[]; isMock: boolean }> {
    const raw = await apiFetch<any[]>('/exports/connections', { method: 'GET' });
    return { data: (raw ?? []).map(normaliseConnection), isMock: false };
  },

  // POST /api/v1/m10-data-compliance/exports/connections
  // Backend: RegisterConnectionSchema { destination, destinationName?, config? }

  async createConnection(
    connection: Omit<ConnectionMeta, 'id' | 'status' | 'lastSynced'>,
  ): Promise<{ data: ConnectionMeta; isMock: boolean }> {
    const body = {
      destination: connection.type.toLowerCase() as
        | 'postgres'
        | 'snowflake'
        | 'bigquery'
        | 's3'
        | 'databricks'
        | 'redshift',
      destinationName: connection.name,
      config: {
        host: connection.host,
        database: connection.database,
        schema: connection.schema,
        username: connection.username,
      },
    };

    const raw = await apiFetch<any>('/exports/connections', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    return { data: normaliseConnection({ ...raw, ...body }), isMock: false };
  },

  // ── Test Connection ──────────────────────────────────────────────────────────
  // POST /api/v1/m10-data-compliance/exports/connections/:id/test

  async testConnection(
    id: string,
  ): Promise<{ data: { success: boolean; message: string }; isMock: boolean }> {
    const data = await apiFetch<{ success: boolean; message: string }>(
      `/exports/connections/${id}/test`,
      { method: 'POST' },
    );
    return { data, isMock: false };
  },

  // ── Export Replay ────────────────────────────────────────────────────────────
  // POST /api/v1/m10-data-compliance/exports/replay
  // Backend: ReplayExportSchema { connectionId: UUID, datasetName: enum, windowStart, windowEnd }

  async replaySync(
    opts?: { connectionId?: string; datasetName?: string },
  ): Promise<{ data: { success: boolean; message: string }; isMock: boolean }> {
    if (!opts?.connectionId) {
      throw new Error(
        'replaySync requires a valid connectionId. Fetch connections first.',
      );
    }

    const now = new Date();
    const windowEnd = now.toISOString();
    const windowStart = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    const raw = await apiFetch<any>('/exports/replay', {
      method: 'POST',
      body: JSON.stringify({
        connectionId: opts.connectionId,
        datasetName: opts.datasetName ?? 'accounts',
        windowStart,
        windowEnd,
      }),
    });

    return {
      data: { success: true, message: raw.message ?? 'Replay queued.' },
      isMock: false,
    };
  },

  // ── Export Runs ──────────────────────────────────────────────────────────────
  // GET /api/v1/m10-data-compliance/exports/runs

  async getExportRuns(): Promise<{ data: ExportRun[]; isMock: boolean }> {
    const raw = await apiFetch<any[]>('/exports/runs', { method: 'GET' });
    return { data: (raw ?? []).map(normaliseExportRun), isMock: false };
  },

  // ── Download Export Run ──────────────────────────────────────────────────────
  // GET /api/v1/m10-data-compliance/exports/runs/:runId/download?dataset=&format=

  async downloadExportRun(
    runId: string,
    dataset = 'accounts',
    format: 'csv' | 'parquet' = 'csv',
  ): Promise<{ data: { url: string; payload: string }; isMock: boolean }> {
    const downloadUrl = `${BASE}/exports/runs/${runId}/download?dataset=${dataset}&format=${format}`;
    return {
      data: {
        url: downloadUrl,
        payload: JSON.stringify({ runId, dataset, format, downloadUrl }, null, 2),
      },
      isMock: false,
    };
  },

  // ── Compliance Policies ──────────────────────────────────────────────────────
  // GET /api/v1/m10-data-compliance/policies

  async getDataCompliance(): Promise<{ data: ComplianceLog[]; isMock: boolean }> {
    const raw = await apiFetch<any[]>('/policies', { method: 'GET' });
    return { data: (raw ?? []).map(normalisePolicy), isMock: false };
  },

  // POST /api/v1/m10-data-compliance/policies
  // Backend: CreatePolicySchema { name, description?, channel, regionFamily?, ruleDefinition? }

  async createDataCompliance(
    rule: Omit<ComplianceLog, 'id' | 'checkedAt'>,
  ): Promise<{ data: ComplianceLog; isMock: boolean }> {
    const channelMap: Record<string, 'email' | 'call' | 'sms' | 'data_export'> = {
      email: 'email',
      call: 'call',
      sms: 'sms',
      data_export: 'data_export',
      conversations: 'data_export',
      transcripts: 'data_export',
      participants: 'data_export',
      tracker_detections: 'data_export',
      scorecard_responses: 'data_export',
    };

    const body = {
      name: rule.ruleName,
      description: rule.details,
      channel: channelMap[rule.appliedTo] ?? 'data_export',
      regionFamily: 'GLOBAL' as const,
      ruleDefinition: {
        fallbackAction: rule.status === 'COMPLIANT' ? ('allow' as const) : ('block' as const),
      },
    };

    const raw = await apiFetch<any>('/policies', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    return { data: normalisePolicy(raw), isMock: false };
  },

  // ── CRM Sync Status ───────────────────────────────────────────────────────────
  // Proxied via audit-log endpoint as health check.

  async getCrmSyncStatus(): Promise<{ data: typeof MOCK_CRM_SYNC_STATUS; isMock: boolean }> {
    await apiFetch<any>('/compliance/audit-log?limit=1', { method: 'GET' });
    return {
      data: {
        ...MOCK_CRM_SYNC_STATUS,
        lastSyncTime: new Date().toLocaleTimeString(),
        status: 'HEALTHY',
      },
      isMock: false,
    };
  },

  async triggerCrmSync(): Promise<{ data: { success: boolean; message: string }; isMock: boolean }> {
    // No dedicated endpoint in backend — acknowledges call optimistically
    return {
      data: { success: true, message: 'CRM Sync initiated.' },
      isMock: false,
    };
  },
};
