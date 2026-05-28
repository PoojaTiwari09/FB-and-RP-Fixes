// ── AI Data Extractor API Client ──────────────────────────────────────────────
// Covers: Field Library CRUD, Test Extraction, Per-Call Results, Run Extraction

import { m01ApiV1, DEV_TENANT_ID } from '../lib/api-env';

const M18 = m01ApiV1('/ai-extractor');

async function m18Fetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${M18}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id':  DEV_TENANT_ID,
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AiExtractionField {
  id:              string;
  tenantId:        string;
  question:        string;
  fieldLabel:      string;
  fieldName:       string;
  dataType:        'text' | 'boolean' | 'number' | 'date' | 'enum';
  enumOptions:     string[];
  extractionHint:  string | null;
  crmObject:       string | null;
  crmField:        string | null;
  isActive:        boolean;
  displayOrder:    number;
  createdAt:       string;
  updatedAt:       string;
}

export interface AiExtractionResult {
  id:                   string;
  fieldId:              string;
  callId:               string;
  extractedValue:       string | null;
  rawEvidence:          string | null;
  evidenceTimestampMs:  number | null;
  confidenceScore:      number | null;
  isManualOverride:     boolean;
  extractedAt:          string;
  field?:               AiExtractionField;
}

export interface CreateFieldPayload {
  question:        string;
  fieldLabel:      string;
  fieldName:       string;
  dataType:        string;
  enumOptions?:    string[];
  extractionHint?: string;
  crmObject?:      string;
  crmField?:       string;
}

export interface TestExtractionResult {
  fieldId:            string;
  fieldName:          string;
  extractedValue:     string | null;
  rawEvidence:        string | null;
  evidenceTimestampMs: number | null;
  confidenceScore:    number | null;
}

// ── Field Library CRUD ────────────────────────────────────────────────────────

/** List all extraction fields */
export const listFields = () =>
  m18Fetch<AiExtractionField[]>('/fields');

/** Create a new extraction field */
export const createField = (data: CreateFieldPayload) =>
  m18Fetch<AiExtractionField>('/fields', {
    method: 'POST',
    body: JSON.stringify(data),
  });

/** Update an extraction field */
export const updateField = (id: string, data: Partial<CreateFieldPayload>) =>
  m18Fetch<AiExtractionField>(`/fields/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

/** Delete an extraction field */
export const deleteField = (id: string) =>
  m18Fetch<{ success: boolean }>(`/fields/${id}`, { method: 'DELETE' });

/** Toggle field active/inactive */
export const toggleFieldActive = (id: string, isActive: boolean) =>
  m18Fetch<AiExtractionField>(`/fields/${id}/toggle`, {
    method: 'POST',
    body: JSON.stringify({ isActive }),
  });

// ── Test Extraction ───────────────────────────────────────────────────────────

/** Test a field against a sample transcript (Phase 2) */
export const testExtraction = (fieldId: string, callId: string) =>
  m18Fetch<TestExtractionResult>(`/fields/${fieldId}/test`, {
    method: 'POST',
    body: JSON.stringify({ callId }),
  });

// ── Per-Call Results ──────────────────────────────────────────────────────────

/** Get all extraction results for a specific call */
export const getCallExtractionResults = (callId: string) =>
  m18Fetch<AiExtractionResult[]>(`/calls/${callId}/results`);

/** Run extraction on a call (manually trigger for all active fields) */
export const runExtraction = (callId: string) =>
  m18Fetch<AiExtractionResult[]>(`/calls/${callId}/extract`, { method: 'POST' });
