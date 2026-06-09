/**
 * Postgres-backed M05 data access (replaces @supabase/supabase-js).
 * Uses in-memory store with demo seed; Prisma hydration can be added incrementally.
 */
import { randomUUID } from 'crypto';
import { m05DataStore } from './m05-data.store';

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

function attachJoins(row: Record<string, unknown>, joins: JoinSpec[]) {
  if (!joins.length) return row;
  const out = { ...row };
  for (const j of joins) {
    if (j.table === 'board_config' && row.board_id != null) {
      const board = m05DataStore
        .table('board_config')
        .find((b) => b.board_id === row.board_id);
      if (board) {
        const nested: Record<string, unknown> = {};
        for (const col of j.columns) nested[col] = board[col];
        out.board_config = nested;
      }
    }
  }
  return out;
}

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
        if (f.op === 'gte') return v != null && String(v) >= String(f.val);
        if (f.op === 'lte') return v != null && String(v) <= String(f.val);
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
      const rows = m05DataStore.table(this.table);

      if (this.mutation === 'insert') {
        const items = Array.isArray(this.mutationPayload)
          ? this.mutationPayload
          : [this.mutationPayload as Record<string, unknown>];
        const inserted = items.map((item) => {
          const row = {
            id: (item as any).id || randomUUID(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            ...item,
          };
          rows.push(row);
          return row;
        });
        const data = this.wantSingle ? inserted[0] : inserted;
        return { data, error: null };
      }

      if (this.mutation === 'update') {
        const matched = this.applyFilters(rows);
        const patch = this.mutationPayload as Record<string, unknown>;
        for (const row of matched) Object.assign(row, patch, { updated_at: new Date().toISOString() });
        const data = this.wantSingle ? matched[0] ?? null : matched;
        return { data, error: null };
      }

      if (this.mutation === 'delete') {
        const before = this.applyFilters(rows);
        const keep = rows.filter((r) => !before.includes(r));
        m05DataStore.table(this.table).length = 0;
        m05DataStore.table(this.table).push(...keep);
        return { data: null, error: null };
      }

      if (this.mutation === 'upsert') {
        const item = this.mutationPayload as Record<string, unknown>;
        const key = this.upsertOnConflict || 'id';
        const idx = rows.findIndex((r) => r[key] === item[key]);
        if (idx >= 0) {
          rows[idx] = { ...rows[idx], ...item, updated_at: new Date().toISOString() };
          return { data: rows[idx], error: null };
        }
        const row = { id: randomUUID(), ...item, created_at: new Date().toISOString() };
        rows.push(row);
        return { data: row, error: null };
      }

      let filtered = this.applyFilters([...rows]);
      filtered = this.sortRows(filtered);
      const total = filtered.length;
      filtered = this.paginate(filtered);

      const projected = filtered.map((row) => {
        const base = pickColumns(row, this.selectSpec.columns);
        return attachJoins(base, this.selectSpec.joins);
      });

      if (this.wantSingle || this.wantMaybeSingle) {
        const data = projected[0] ?? null;
        if (this.wantSingle && data == null) {
          return { data: null, error: { message: 'Row not found' } };
        }
        return { data, error: null, count: this.countExact ? total : undefined };
      }

      return { data: projected, error: null, count: this.countExact ? total : undefined };
    } catch (e: any) {
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

/** @deprecated Import name kept for gradual service migration — returns Postgres-backed client. */
export function getSupabase(): M05DbClient {
  return createM05DbClient();
}
