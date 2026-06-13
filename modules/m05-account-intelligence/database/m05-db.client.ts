/**
 * Postgres-backed M05 data access (replaces @supabase/supabase-js).
 * Wraps PrismaClient to emulate the Supabase query builder used by AccountsService.
 */
import { randomUUID } from 'crypto';
import { PrismaClient } from '@rri/database';

const prisma = new PrismaClient();

type Filter =
  | { op: 'eq'; col: string; val: unknown }
  | { op: 'in'; col: string; vals: unknown[] }
  | { op: 'gte'; col: string; val: unknown }
  | { op: 'lte'; col: string; val: unknown };

type JoinSpec = { table: string; columns: string[] };

function parseSelect(select: string): { columns: string[] | '*'; joins: JoinSpec[] } {
  const joins: JoinSpec[] = [];
  let base = select.trim();
  const joinRe = /(\w+)\s*\(\s*([^)]+)\s*\)/g;
  let m: RegExpExecArray | null;
  while ((m = joinRe.exec(select))) {
    joins.push({
      table: m[1],
      columns: m[2].split(',').map((c) => c.trim()),
    });
  }
  base = base.replace(joinRe, '').replace(/,\s*,/g, ',').trim();
  if (!base || base === '*') return { columns: '*', joins };
  return { columns: base.split(',').map((c) => c.trim()).filter(Boolean), joins };
}

function pickColumns(row: Record<string, unknown>, columns: string[] | '*') {
  if (columns === '*') return { ...row };
  const out: Record<string, unknown> = {};
  for (const c of columns) {
    if (c in row) out[c] = row[c];
  }
  return out;
}

async function attachJoins(row: Record<string, unknown>, joins: JoinSpec[]) {
  if (!joins.length) return row;
  const out = { ...row };
  for (const j of joins) {
    if (j.table === 'board_config' && row.board_id != null) {
      const board = await prisma.m05BoardConfig.findUnique({
        where: { board_id: String(row.board_id) }
      });
      if (board) {
        const nested: Record<string, unknown> = {};
        for (const col of j.columns) nested[col] = (board as any)[col];
        out.board_config = nested;
      }
    }
  }
  return out;
}

const TABLE_MAP: Record<string, any> = {
  'board_config': prisma.m05BoardConfig,
  'board_tabs': prisma.m05BoardTab,
  'board_columns': prisma.m05BoardColumn,
  'crm_companies': prisma.m05Company,
  'crm_activities': prisma.m05Activity,
  'crm_deals': prisma.m05Deal,
  'crm_contacts': prisma.m05Contact,
  'supplementary_accounts': prisma.m05SupplementaryAccount,
  'user_board_preferences': prisma.m05UserBoardPreference,
  'todos_notes': prisma.m05TodoNote,
  'ai_briefs_cache': prisma.m05AiBriefCache,
  'permission_profiles': prisma.m05PermissionProfile
};

const SCHEMA_KEYS: Record<string, string[]> = {
  'board_config': ['board_id', 'slug', 'name', 'ai_brief_config'],
  'board_tabs': ['tab_id', 'board_id', 'name', 'filter_config', 'order'],
  'board_columns': ['col_id', 'board_id', 'field_key', 'label', 'column_type', 'order', 'width', 'sortable', 'editable', 'visible_to_roles'],
  'crm_companies': ['hubspot_id', 'name', 'board', 'exit_arr', 'assigned_rep_id', 'hubspot_owner_id', 'industry', 'domain', 'employee_count', 'updated_at'],
  'crm_activities': ['local_id', 'hubspot_id', 'company_hubspot_id', 'type', 'direction', 'timestamp', 'body', 'assigned_rep_id', 'rep_talk_pct', 'client_talk_pct', 'call_outcome', 'duration_seconds', 'subject'],
  'crm_deals': ['hubspot_id', 'company_hubspot_id', 'deal_name', 'stage', 'amount', 'deal_type', 'assigned_rep_id', 'close_date'],
  'crm_contacts': ['hubspot_id', 'company_hubspot_id', 'first_name', 'last_name', 'email', 'title'],
  'supplementary_accounts': ['company_hubspot_id', 'ai_risk_score', 'ai_risk_label', 'notes', 'manager_note'],
  'user_board_preferences': ['id', 'session_role', 'board_id', 'active_tab_id', 'sort_field', 'sort_dir', 'page_size', 'updated_at'],
  'todos_notes': ['id', 'company_hubspot_id', 'type', 'content', 'completed', 'completed_at', 'created_by_role', 'created_at'],
  'ai_briefs_cache': ['id', 'company_hubspot_id', 'board_slug', 'brief_json', 'generated_at'],
  'permission_profiles': ['id', 'role', 'name', 'can_edit_board_config', 'can_edit_cells']
};

const PK_MAP: Record<string, string> = {
  'board_config': 'board_id',
  'board_tabs': 'tab_id',
  'board_columns': 'col_id',
  'crm_companies': 'hubspot_id',
  'crm_activities': 'local_id',
  'crm_deals': 'hubspot_id',
  'crm_contacts': 'hubspot_id',
  'supplementary_accounts': 'company_hubspot_id',
  'user_board_preferences': 'id',
  'todos_notes': 'id',
  'ai_briefs_cache': 'id',
  'permission_profiles': 'id'
};

class M05QueryBuilder {
  private filters: Filter[] = [];
  private orderBy: { col: string; ascending: boolean } | null = null;
  private limitN: number | null = null;
  private rangeFrom: number | null = null;
  private rangeTo: number | null = null;
  private wantSingle = false;
  private wantMaybeSingle = false;
  private countExact = false;
  private mutation: 'insert' | 'update' | 'delete' | 'upsert' | null = null;
  private mutationPayload: Record<string, unknown> | Record<string, unknown>[] | null = null;
  private upsertOnConflict: string | null = null;

  constructor(private readonly table: string) {}

  select(columns: string, opts?: { count?: string }) {
    if (opts?.count === 'exact') this.countExact = true;
    this.selectSpec = parseSelect(columns);
    return this;
  }

  private selectSpec: ReturnType<typeof parseSelect> = { columns: '*', joins: [] };

  eq(col: string, val: unknown) {
    this.filters.push({ op: 'eq', col, val });
    return this;
  }

  in(col: string, vals: unknown[]) {
    this.filters.push({ op: 'in', col, vals });
    return this;
  }

  gte(col: string, val: unknown) {
    this.filters.push({ op: 'gte', col, val });
    return this;
  }

  lte(col: string, val: unknown) {
    this.filters.push({ op: 'lte', col, val });
    return this;
  }

  order(col: string, opts?: { ascending?: boolean }) {
    this.orderBy = { col, ascending: opts?.ascending !== false };
    return this;
  }

  limit(n: number) {
    this.limitN = n;
    return this;
  }

  range(from: number, to: number) {
    this.rangeFrom = from;
    this.rangeTo = to;
    return this;
  }

  single() {
    this.wantSingle = true;
    return this;
  }

  maybeSingle() {
    this.wantMaybeSingle = true;
    return this;
  }

  insert(payload: Record<string, unknown> | Record<string, unknown>[]) {
    this.mutation = 'insert';
    this.mutationPayload = payload;
    return this;
  }

  update(payload: Record<string, unknown>) {
    this.mutation = 'update';
    this.mutationPayload = payload;
    return this;
  }

  delete() {
    this.mutation = 'delete';
    return this;
  }

  upsert(payload: Record<string, unknown>, opts?: { onConflict?: string }) {
    this.mutation = 'upsert';
    this.mutationPayload = payload;
    this.upsertOnConflict = opts?.onConflict || null;
    return this;
  }

  private applyFilters(rows: any[]): any[] {
    return rows.filter((row) =>
      this.filters.every((f) => {
        const v = row[f.col];
        if (f.op === 'eq') return v === f.val || String(v) === String(f.val);
        if (f.op === 'in') return f.vals.some((x) => x === v || String(x) === String(v));
        // Be careful with date comparisons
        const vDate = v instanceof Date ? v.toISOString() : String(v);
        const fDate = f.val instanceof Date ? f.val.toISOString() : String(f.val);
        
        if (f.op === 'gte') return v != null && vDate >= fDate;
        if (f.op === 'lte') return v != null && vDate <= fDate;
        return true;
      }),
    );
  }

  private sortRows(rows: any[]): any[] {
    if (!this.orderBy) return rows;
    const { col, ascending } = this.orderBy;
    return [...rows].sort((a, b) => {
      const av = a[col];
      const bv = b[col];
      if (av === bv) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = av < bv ? -1 : 1;
      return ascending ? cmp : -cmp;
    });
  }

  private paginate(rows: any[]): any[] {
    let r = rows;
    if (this.rangeFrom != null && this.rangeTo != null) {
      r = r.slice(this.rangeFrom, this.rangeTo + 1);
    } else if (this.limitN != null) {
      r = r.slice(0, this.limitN);
    }
    return r;
  }

  private async execute(): Promise<{ data: any; error: null; count?: number } | { data: null; error: { message: string } }> {
    try {
      const model = TABLE_MAP[this.table];
      if (!model) throw new Error(`Table not mapped: ${this.table}`);
      const pk = PK_MAP[this.table];

      if (this.mutation === 'insert') {
        const items = Array.isArray(this.mutationPayload)
          ? this.mutationPayload
          : [this.mutationPayload as Record<string, unknown>];
        const inserted = [];
        for (const item of items) {
          // Just grab a dummy row or try creating with raw item and catch error
          // Actually, Prisma create throws on unknown fields.
          // Let's just strip known bad fields like `id` if pk !== 'id', etc.
          // Since insert payload usually contains only valid fields, but just in case:
          const validKeys = SCHEMA_KEYS[this.table] || [];
          const cleanItem: Record<string, unknown> = {};
          for (const k of Object.keys(item)) {
            if (validKeys.includes(k)) {
              let val = item[k];
              if (['exit_arr', 'employee_count', 'rep_talk_pct', 'client_talk_pct', 'duration_seconds', 'amount', 'ai_risk_score'].includes(k) && typeof val === 'string') {
                val = Number(val);
              }
              cleanItem[k] = val;
            }
          }
          // Best effort without reading row: assume item keys match schema.
          const res = await model.create({
            data: {
              ...(pk === 'id' ? { id: item.id || randomUUID() } : {}),
              ...cleanItem
            }
          });
          inserted.push(res);
        }
        const data = this.wantSingle ? inserted[0] : inserted;
        return { data: JSON.parse(JSON.stringify(data)), error: null };
      }

      if (this.mutation === 'update') {
        // Fetch rows, filter in memory, then update
        const allRaw = await model.findMany();
        const matched = this.applyFilters(allRaw);
        const patch = this.mutationPayload as Record<string, unknown>;
        const updated = [];
        const validKeys = SCHEMA_KEYS[this.table] || [];
        for (const row of matched) {
          const cleanPatch: Record<string, unknown> = {};
          for (const k of Object.keys(patch)) {
            if (validKeys.includes(k) && k !== pk) {
              let val = patch[k];
              if (['exit_arr', 'employee_count', 'rep_talk_pct', 'client_talk_pct', 'duration_seconds', 'amount', 'ai_risk_score'].includes(k) && typeof val === 'string') {
                val = Number(val);
              }
              cleanPatch[k] = val;
            }
          }
          if (Object.keys(cleanPatch).length === 0) {
            updated.push(row);
            continue;
          }
          const res = await model.update({
            where: { [pk]: row[pk] },
            data: cleanPatch
          });
          updated.push(res);
        }
        const data = this.wantSingle ? updated[0] ?? null : updated;
        return { data: JSON.parse(JSON.stringify(data)), error: null };
      }

      if (this.mutation === 'delete') {
        const allRaw = await model.findMany();
        const before = this.applyFilters(allRaw);
        for (const row of before) {
          await model.delete({
            where: { [pk]: row[pk] }
          });
        }
        return { data: null, error: null };
      }

      if (this.mutation === 'upsert') {
        const item = this.mutationPayload as Record<string, unknown>;
        const key = this.upsertOnConflict || pk;
        
        const validKeys = SCHEMA_KEYS[this.table] || [];
        const cleanItem: Record<string, unknown> = {};
        for (const k of Object.keys(item)) {
          if (validKeys.includes(k)) {
            let val = item[k];
            if (['exit_arr', 'employee_count', 'rep_talk_pct', 'client_talk_pct', 'duration_seconds', 'amount', 'ai_risk_score'].includes(k) && typeof val === 'string') {
              val = Number(val);
            }
            cleanItem[k] = val;
          }
        }

        // Try to update
        let res;
        try {
          if (this.upsertOnConflict && this.upsertOnConflict.includes(',')) {
            const keys = this.upsertOnConflict.split(',');
            const findWhere: any = {};
            for (const k of keys) findWhere[k] = cleanItem[k];
            
            const existing = await model.findFirst({ where: findWhere });
            if (existing) {
              res = await model.update({ where: { [pk]: existing[pk] }, data: cleanItem });
              return { data: JSON.parse(JSON.stringify(res)), error: null };
            }
          } else {
            const key = this.upsertOnConflict || pk;
            const existing = await model.findFirst({ where: { [key]: cleanItem[key] } });
            if (existing) {
              res = await model.update({ where: { [pk]: existing[pk] }, data: cleanItem });
              return { data: JSON.parse(JSON.stringify(res)), error: null };
            }
          }

          // If not found, create
          res = await model.create({
            data: {
              ...(pk === 'id' ? { id: item.id || randomUUID() } : {}),
              ...cleanItem
            }
          });
        } catch (e: any) {
          throw e;
        }
        return { data: JSON.parse(JSON.stringify(res)), error: null };
      }

      // SELECT logic
      const rawRows = await model.findMany();
      // Date conversion hack for Supabase compatibility
      const parsedRows = JSON.parse(JSON.stringify(rawRows));
      
      let filtered = this.applyFilters(parsedRows);
      filtered = this.sortRows(filtered);
      const total = filtered.length;
      filtered = this.paginate(filtered);

      const projected = [];
      for (const row of filtered) {
        const base = pickColumns(row, this.selectSpec.columns);
        projected.push(await attachJoins(base, this.selectSpec.joins));
      }

      if (this.wantSingle || this.wantMaybeSingle) {
        const data = projected[0] ?? null;
        if (this.wantSingle && data == null) {
          return { data: null, error: { message: 'Row not found' } };
        }
        return { data, error: null, count: this.countExact ? total : undefined };
      }

      return { data: projected, error: null, count: this.countExact ? total : undefined };
    } catch (e: any) {
      console.error('M05 DB Client Error:', e);
      return { data: null, error: { message: e?.message || 'M05 database error' } };
    }
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

export type M05DbClient = {
  from: (table: string) => M05QueryBuilder;
};

export function createM05DbClient(): M05DbClient {
  return {
    from: (table: string) => new M05QueryBuilder(table),
  };
}

export const getSupabase = createM05DbClient;
