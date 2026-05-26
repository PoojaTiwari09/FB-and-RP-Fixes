export type SourceMode = "CRM_ONLY" | "CALLS_ONLY" | "TRANSCRIPTIONS_ONLY" | "COMBINED"
  | "hubspot"   // live HubSpot connection
  | "mock"      // crm_mock Postgres schema (different companies/deals from public)
  | "postgres"; // public.deal Postgres schema
export type ObjectKey = "deals" | "accounts" | "calls" | "transcriptions";
export type WidgetType = "KPI" | "BAR" | "LINE" | "PIE" | "DONUT" | "FUNNEL" | "SCATTER" | "AREA" | "WATERFALL" | "GAUGE" | "TABLE" | "MATRIX" | "MAP" | "TREEMAP" | "COLUMN" | "PERFORMANCE" | "ATTAINMENT_TREND" | "FORECAST" | "TRENDS" | "CHANGES" | "RISK_SCORECARD";

export type Relationship = {
  sourceObject: ObjectKey;
  sourceField: string;
  targetObject: ObjectKey;
  targetField: string;
  status: "AUTO_DETECTED" | "MANUAL_OVERRIDE" | "REJECTED";
  validationMessage?: string;
};

export type DatasetDefinition = {
  id: string;
  name: string;
  /** Data-scope mode (COMBINED etc.) — also overloaded with 'hubspot'|'mock'|'postgres'
   *  for routing: use resolveDataSource() to get the canonical source. */
  sourceMode: SourceMode;
  selectedObjects: ObjectKey[];
  selectedFields: Record<string, string[]>;
  relationships: Relationship[];
  mappingAccepted: boolean;
  createdAt: string;
};

/** Canonical data source for a dataset: 'hubspot', 'mock', or 'postgres' */
export function resolveDataSource(ds: Pick<DatasetDefinition, 'sourceMode'> & { name?: string }): 'hubspot' | 'mock' | 'postgres' {
  const m = ds.sourceMode as string;
  if (m === 'hubspot')  return 'hubspot';
  if (m === 'postgres') return 'postgres';
  if (m === 'mock')     return 'mock';

  // Legacy values ("COMBINED", "CRM_ONLY", etc.) — infer from dataset name as fallback.
  // Datasets named "Revenue …" / "Postgres …" / "Internal …" → public.deal schema.
  // Datasets with "mock" / "crm" / "test" in the name → crm_mock schema.
  const name = ((ds as any).name || '').toLowerCase();
  if (name.includes('mock') || name.includes('crm') || name.includes('test')) return 'mock';
  if (name.includes('revenue') || name.includes('postgres') || name.includes('internal')) return 'postgres';

  // Default for truly unknown legacy datasets → mock (crm_mock)
  return 'mock';
}

export type DashboardWidget = {
  id: string;
  title: string;
  type: WidgetType;
  xField: string;
  yMetric: string;
  filters: {
    customer: string;
    team: string;
    metricFilter: string;
  };
};

export type DashboardDefinition = {
  id: string;
  title: string;
  datasetId: string;
  access: "PRIVATE" | "TEAM" | "LINK";
  widgets: DashboardWidget[];
  createdAt: string;
};

export type DealRow = {
  dealName: string;
  amount: number;
  stage: string;
  pipelineStage: "Early" | "Mid" | "Late" | "Closed";
  ownerName: string;
  accountName: string;
  quarter: "Q1-2026" | "Q2-2026";
  teamName: "North Team" | "Strategic Team";
  closeDate: string;
  confidence: number;
  status: "On Track" | "At Risk" | "Needs Attention";
};

export const sampleDeals: DealRow[] = [];
export const sampleAccounts: any[] = [];
export const sampleCalls: any[] = [];
export const sampleTranscriptions: any[] = [];

export const hubspotFields = {
  deals: ["dealName", "amount", "stage", "ownerName", "accountName", "quarter", "teamName"],
  accounts: ["accountName", "ownerName", "industry", "segment", "teamName"],
  calls: ["ownerName", "durationSec", "occurredAt", "accountName", "callOutcome"],
  transcriptions: ["transcriptText", "occurredAt", "accountName", "sentiment"],
} satisfies Record<ObjectKey, string[]>;

export const fallbackBuilderConfig = {
  dataSources: [
    { key: "hubspot", label: "HubSpot CRM", mode: "CRM_ONLY", description: "Local sample CRM fields shaped like HubSpot objects." },
    { key: "calls", label: "Calls", mode: "CALLS_ONLY", description: "Sample call activity data only." },
    { key: "transcriptions", label: "Transcriptions", mode: "TRANSCRIPTIONS_ONLY", description: "Sample transcription data only." },
    { key: "combined", label: "Combined Dataset", mode: "COMBINED", description: "Combine CRM, calls, and transcriptions into one dataset." },
  ],
  sourceModes: ["CRM_ONLY", "CALLS_ONLY", "TRANSCRIPTIONS_ONLY", "COMBINED"] as SourceMode[],
  objects: [
    { key: "deals", label: "Deals", fields: hubspotFields.deals, sampleRows: sampleDeals.slice(0, 3) },
    { key: "accounts", label: "Accounts", fields: hubspotFields.accounts, sampleRows: sampleAccounts.slice(0, 3) },
    { key: "calls", label: "Calls", fields: hubspotFields.calls, sampleRows: sampleCalls.slice(0, 3) },
    { key: "transcriptions", label: "Transcriptions", fields: hubspotFields.transcriptions, sampleRows: sampleTranscriptions.slice(0, 3) },
  ],
  relationships: [
    { sourceObject: "deals", sourceField: "accountName", targetObject: "accounts", targetField: "accountName", status: "AUTO_DETECTED", validationMessage: "Deal to account mapping detected on accountName." },
    { sourceObject: "calls", sourceField: "accountName", targetObject: "accounts", targetField: "accountName", status: "AUTO_DETECTED", validationMessage: "Call to account mapping detected on accountName." },
    { sourceObject: "transcriptions", sourceField: "accountName", targetObject: "accounts", targetField: "accountName", status: "AUTO_DETECTED", validationMessage: "Transcription to account mapping detected on accountName." },
  ] satisfies Relationship[],
};

export const fallbackDashboardConfig = {
  availableChartTypes: ["KPI", "BAR", "COLUMN", "LINE", "AREA", "PIE", "DONUT", "SCATTER", "WATERFALL", "FUNNEL", "TREEMAP", "MAP", "GAUGE", "TABLE", "MATRIX", "PERFORMANCE", "ATTAINMENT_TREND", "FORECAST", "TRENDS", "CHANGES", "RISK_SCORECARD"] as WidgetType[],
  availableXFields: ["accountName", "stage", "quarter", "ownerName", "teamName"],
  availableMetrics: ["bookings", "targetAttainment", "winRate", "pipelineValue", "dealCount"],
  filters: {
    timeRanges: ["CURRENT_QUARTER", "LAST_QUARTER", "ALL_TIME", "CUSTOM_RANGE"],
    customers: ["All Customers", ...sampleAccounts.map((item) => item.accountName)],
    teams: ["All Teams", "North Team", "Strategic Team"],
    metricFilters: ["ALL", "WON_ONLY", "OPEN_PIPELINE"],
  },
};

/** Compute "Qn-YYYY" label dynamically from today's real date */
export function quarterLabel(timeRange: "CURRENT_QUARTER" | "LAST_QUARTER"): string {
  const now = new Date();
  const curQ = Math.ceil((now.getMonth() + 1) / 3);
  const curY = now.getFullYear();
  if (timeRange === "CURRENT_QUARTER") return `Q${curQ}-${curY}`;
  // Last quarter: roll back one quarter
  const prevQ = curQ === 1 ? 4 : curQ - 1;
  const prevY = curQ === 1 ? curY - 1 : curY;
  return `Q${prevQ}-${prevY}`;
}

/** Human-readable label for display in the UI, e.g. "Q2 2026" */
export function quarterDisplayLabel(timeRange: "CURRENT_QUARTER" | "LAST_QUARTER"): string {
  return quarterLabel(timeRange).replace("-", " ");
}

// ── Date Range Engine ─────────────────────────────────────────────────────────

export interface DateBounds {
  from: Date | null;
  to:   Date | null;
}

/**
 * Convert a timeRange string + optional custom date strings into concrete Date bounds.
 * Works identically on server (Node.js API routes) and client (browser).
 *
 * CURRENT_QUARTER / LAST_QUARTER → first/last day of that calendar quarter
 * ALL_TIME                        → { from: null, to: null } (no filter)
 * CUSTOM_RANGE                    → dateFrom / dateTo parsed as ISO date strings
 */
export function getDateBounds(
  timeRange: string,
  dateFrom?: string | null,
  dateTo?:   string | null,
): DateBounds {
  if (timeRange === 'ALL_TIME') return { from: null, to: null };

  if (timeRange === 'CUSTOM_RANGE') {
    if (!dateFrom || !dateTo) return { from: null, to: null };
    // Treat dates as local midnight → end-of-day to avoid TZ edge cases
    const from = new Date(dateFrom);
    const to   = new Date(dateTo);
    to.setHours(23, 59, 59, 999);
    return { from, to };
  }

  // CURRENT_QUARTER or LAST_QUARTER
  const now  = new Date();
  const curQ = Math.ceil((now.getMonth() + 1) / 3);
  const curY = now.getFullYear();

  let q: number, y: number;
  if (timeRange === 'CURRENT_QUARTER') {
    q = curQ; y = curY;
  } else {
    // LAST_QUARTER
    q = curQ === 1 ? 4 : curQ - 1;
    y = curQ === 1 ? curY - 1 : curY;
  }

  const fromMonth = (q - 1) * 3; // 0-indexed month (Jan = 0)
  const from = new Date(y, fromMonth, 1, 0, 0, 0, 0);
  const to   = new Date(y, fromMonth + 3, 0, 23, 59, 59, 999); // day 0 of next month = last day of quarter
  return { from, to };
}

/**
 * Return true when a "Q2-2026" quarter string overlaps with the given date range.
 * Used as a fallback when a deal has no closeDate field.
 */
function quarterInRange(quarter: string, from: Date, to: Date): boolean {
  const m = quarter.match(/^Q(\d)-(\d{4})$/);
  if (!m) return false;
  const q = parseInt(m[1], 10);
  const y = parseInt(m[2], 10);
  const qFrom = new Date(y, (q - 1) * 3,     1,  0,  0,  0,   0);
  const qTo   = new Date(y, (q - 1) * 3 + 3, 0, 23, 59, 59, 999);
  return qFrom <= to && qTo >= from;
}

export function validateDatasetDefinition(
  input: { selectedFields: Record<string, string[]>; relationships: Relationship[] },
  dbFields?: Record<string, any[]>
) {
  const rejectedFields: Array<{ objectName: string; field: string; reason: string }> = [];
  const relationshipErrors: Array<{ label: string; reason: string }> = [];

  const getAllowedFields = (objName: string) => {
    if (dbFields && dbFields[objName]) {
      return dbFields[objName].map(f => f.fieldName);
    }
    return hubspotFields[objName as ObjectKey] ?? [];
  };

  Object.entries(input.selectedFields).forEach(([objectName, fields]) => {
    const allowed = getAllowedFields(objectName);
    fields.forEach((field) => {
      if (!allowed.includes(field)) {
        rejectedFields.push({
          objectName,
          field,
          reason: "Field does not belong to the selected object.",
        });
      }
    });
  });

  input.relationships.forEach((relationship) => {
    // Skip validation for internal HubSpot join keys — these are system fields, not user-selected fields
    const isInternalKey = (f: string) => f === 'hubspot_id' || f.startsWith('associated_');
    if (isInternalKey(relationship.sourceField) || isInternalKey(relationship.targetField)) return;

    const sourceAllowed = getAllowedFields(relationship.sourceObject);
    const targetAllowed = getAllowedFields(relationship.targetObject);
    if (!sourceAllowed.includes(relationship.sourceField) || !targetAllowed.includes(relationship.targetField)) {
      relationshipErrors.push({
        label: `${relationship.sourceObject}.${relationship.sourceField} -> ${relationship.targetObject}.${relationship.targetField}`,
        reason: "Custom relationship uses mismapped fields.",
      });
    }
  });

  return {
    valid: rejectedFields.length === 0 && relationshipErrors.length === 0,
    rejectedFields,
    relationshipErrors,
  };
}


export function buildDatasetPreview(selectedFields: Record<string, string[]>) {
  return sampleDeals.slice(0, 5).map((deal) => {
    const account = sampleAccounts.find((item) => item.accountName === deal.accountName);
    const call = sampleCalls.find((item) => item.accountName === deal.accountName);
    const transcription = sampleTranscriptions.find((item) => item.accountName === deal.accountName);
    const combined = { ...deal, ...account, ...call, ...transcription };
    const row: Record<string, string | number | null> = {};
    Object.values(selectedFields).flat().forEach((field) => {
      row[field] = (combined as Record<string, string | number | undefined>)[field] ?? null;
    });
    return row;
  });
}

export function computeDashboardRows(
  rows: any[],
  filters: {
    timeRange: string;
    customer: string;
    team: string;
    metricFilter: string;
    /** ISO date string for custom range start, e.g. "2026-01-01" */
    dateFrom?: string | null;
    /** ISO date string for custom range end,   e.g. "2026-03-31" */
    dateTo?:   string | null;
  }
) {
  const { from, to } = getDateBounds(filters.timeRange, filters.dateFrom, filters.dateTo);

  return rows.filter((deal) => {
    // ── Date range filter ────────────────────────────────────────────────────
    if (from && to) {
      // Prefer actual closeDate — exact date beats a pre-computed quarter string.
      const rawDate = deal.closeDate || deal.close_date;
      if (rawDate) {
        const closeDate = new Date(rawDate);
        if (!isNaN(closeDate.getTime())) {
          // Fix: filter strictly by closeDate, not quarter string
          if (closeDate < from || closeDate > to) return false;
        } else {
          // closeDate exists but unparseable — fall back to quarter string
          if (deal.quarter) {
            if (!quarterInRange(deal.quarter, from, to)) return false;
          } else {
            // No usable date info → EXCLUDE from date-filtered views (fix null passthrough)
            return false;
          }
        }
      } else if (deal.quarter) {
        // No closeDate at all; use quarter string as secondary source
        if (!quarterInRange(deal.quarter, from, to)) return false;
      } else {
        // Absolutely no date information → exclude (fixes null quarter passthrough bug)
        return false;
      }
    }

    // ── Other filters ────────────────────────────────────────────────────────
    if (filters.customer !== "All Customers" && (deal.accountName || deal.name) !== filters.customer) return false;
    if (filters.team !== "All Teams" && deal.teamName !== filters.team) return false;
    if (filters.metricFilter === "WON_ONLY"       && deal.stage !== "Closed Won") return false;
    if (filters.metricFilter === "OPEN_PIPELINE"  && (deal.stage === "Closed Won" || deal.stage === "Closed Lost")) return false;
    return true;
  });
}

export function summarizeRows(rows: DealRow[], target: number = 150000) {
  const bookings = rows.reduce((sum, row) => sum + row.amount, 0);
  const wonCount = rows.filter((row) => row.stage === "Closed Won").length;
  return {
    bookings,
    target,
    targetAttainment: Math.round((bookings / target) * 100),
    winRate: rows.length ? Math.round((wonCount / rows.length) * 100) : 0,
  };
}

export function renderWidgetData(widget: DashboardWidget, rows: DealRow[]) {
  if (widget.type === "KPI") {
    const summary = summarizeRows(rows);
    return {
      value:
        widget.yMetric === "bookings"
          ? summary.bookings
          : widget.yMetric === "targetAttainment"
            ? summary.targetAttainment
            : summary.winRate,
      data: [],
    };
  }

  const groups = new Map<string, DealRow[]>();
  rows.forEach((row) => {
    const key = String((row as Record<string, string | number>)[widget.xField] ?? "Unknown");
    groups.set(key, [...(groups.get(key) ?? []), row]);
  });

  const data = Array.from(groups.entries()).map(([label, items]) => ({
    label,
    value:
      widget.yMetric === "dealCount"
        ? items.length
        : items.reduce((sum, item) => sum + item.amount, 0),
  }));

  return { value: 0, data };
}
