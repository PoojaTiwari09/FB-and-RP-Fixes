"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createM05DbClient = createM05DbClient;
exports.getSupabase = getSupabase;
const crypto_1 = require("crypto");
const m05_data_store_1 = require("./m05-data.store");
function parseSelect(select) {
    const joins = [];
    let base = select.trim();
    const joinRe = /(\w+)\s*\(\s*([^)]+)\s*\)/g;
    let m;
    while ((m = joinRe.exec(select))) {
        joins.push({
            table: m[1],
            columns: m[2].split(',').map((c) => c.trim()),
        });
    }
    base = base.replace(joinRe, '').replace(/,\s*,/g, ',').trim();
    if (!base || base === '*')
        return { columns: '*', joins };
    return { columns: base.split(',').map((c) => c.trim()).filter(Boolean), joins };
}
function pickColumns(row, columns) {
    if (columns === '*')
        return { ...row };
    const out = {};
    for (const c of columns) {
        if (c in row)
            out[c] = row[c];
    }
    return out;
}
function attachJoins(row, joins) {
    if (!joins.length)
        return row;
    const out = { ...row };
    for (const j of joins) {
        if (j.table === 'board_config' && row.board_id != null) {
            const board = m05_data_store_1.m05DataStore
                .table('board_config')
                .find((b) => b.board_id === row.board_id);
            if (board) {
                const nested = {};
                for (const col of j.columns)
                    nested[col] = board[col];
                out.board_config = nested;
            }
        }
    }
    return out;
}
class M05QueryBuilder {
    table;
    filters = [];
    orderBy = null;
    limitN = null;
    rangeFrom = null;
    rangeTo = null;
    wantSingle = false;
    wantMaybeSingle = false;
    countExact = false;
    mutation = null;
    mutationPayload = null;
    upsertOnConflict = null;
    constructor(table) {
        this.table = table;
    }
    select(columns, opts) {
        if (opts?.count === 'exact')
            this.countExact = true;
        this.selectSpec = parseSelect(columns);
        return this;
    }
    selectSpec = { columns: '*', joins: [] };
    eq(col, val) {
        this.filters.push({ op: 'eq', col, val });
        return this;
    }
    in(col, vals) {
        this.filters.push({ op: 'in', col, vals });
        return this;
    }
    gte(col, val) {
        this.filters.push({ op: 'gte', col, val });
        return this;
    }
    lte(col, val) {
        this.filters.push({ op: 'lte', col, val });
        return this;
    }
    order(col, opts) {
        this.orderBy = { col, ascending: opts?.ascending !== false };
        return this;
    }
    limit(n) {
        this.limitN = n;
        return this;
    }
    range(from, to) {
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
    insert(payload) {
        this.mutation = 'insert';
        this.mutationPayload = payload;
        return this;
    }
    update(payload) {
        this.mutation = 'update';
        this.mutationPayload = payload;
        return this;
    }
    delete() {
        this.mutation = 'delete';
        return this;
    }
    upsert(payload, opts) {
        this.mutation = 'upsert';
        this.mutationPayload = payload;
        this.upsertOnConflict = opts?.onConflict || null;
        return this;
    }
    applyFilters(rows) {
        return rows.filter((row) => this.filters.every((f) => {
            const v = row[f.col];
            if (f.op === 'eq')
                return v === f.val || String(v) === String(f.val);
            if (f.op === 'in')
                return f.vals.some((x) => x === v || String(x) === String(v));
            if (f.op === 'gte')
                return v != null && String(v) >= String(f.val);
            if (f.op === 'lte')
                return v != null && String(v) <= String(f.val);
            return true;
        }));
    }
    sortRows(rows) {
        if (!this.orderBy)
            return rows;
        const { col, ascending } = this.orderBy;
        return [...rows].sort((a, b) => {
            const av = a[col];
            const bv = b[col];
            if (av === bv)
                return 0;
            if (av == null)
                return 1;
            if (bv == null)
                return -1;
            const cmp = av < bv ? -1 : 1;
            return ascending ? cmp : -cmp;
        });
    }
    paginate(rows) {
        let r = rows;
        if (this.rangeFrom != null && this.rangeTo != null) {
            r = r.slice(this.rangeFrom, this.rangeTo + 1);
        }
        else if (this.limitN != null) {
            r = r.slice(0, this.limitN);
        }
        return r;
    }
    async execute() {
        try {
            const rows = m05_data_store_1.m05DataStore.table(this.table);
            if (this.mutation === 'insert') {
                const items = Array.isArray(this.mutationPayload)
                    ? this.mutationPayload
                    : [this.mutationPayload];
                const inserted = items.map((item) => {
                    const row = {
                        id: item.id || (0, crypto_1.randomUUID)(),
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
                const patch = this.mutationPayload;
                for (const row of matched)
                    Object.assign(row, patch, { updated_at: new Date().toISOString() });
                const data = this.wantSingle ? matched[0] ?? null : matched;
                return { data, error: null };
            }
            if (this.mutation === 'delete') {
                const before = this.applyFilters(rows);
                const keep = rows.filter((r) => !before.includes(r));
                m05_data_store_1.m05DataStore.table(this.table).length = 0;
                m05_data_store_1.m05DataStore.table(this.table).push(...keep);
                return { data: null, error: null };
            }
            if (this.mutation === 'upsert') {
                const item = this.mutationPayload;
                const key = this.upsertOnConflict || 'id';
                const idx = rows.findIndex((r) => r[key] === item[key]);
                if (idx >= 0) {
                    rows[idx] = { ...rows[idx], ...item, updated_at: new Date().toISOString() };
                    return { data: rows[idx], error: null };
                }
                const row = { id: (0, crypto_1.randomUUID)(), ...item, created_at: new Date().toISOString() };
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
        }
        catch (e) {
            return { data: null, error: { message: e?.message || 'M05 database error' } };
        }
    }
    then(onfulfilled, onrejected) {
        return this.execute().then(onfulfilled, onrejected);
    }
}
function createM05DbClient() {
    return {
        from: (table) => new M05QueryBuilder(table),
    };
}
function getSupabase() {
    return createM05DbClient();
}
//# sourceMappingURL=m05-db.client.js.map