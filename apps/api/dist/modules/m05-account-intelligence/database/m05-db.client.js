"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSupabase = void 0;
exports.createM05DbClient = createM05DbClient;
const crypto_1 = require("crypto");
const database_1 = require("@rri/database");
const prisma = new database_1.PrismaClient();
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
async function attachJoins(row, joins) {
    if (!joins.length)
        return row;
    const out = { ...row };
    for (const j of joins) {
        if (j.table === 'board_config' && row.board_id != null) {
            const board = await prisma.m05BoardConfig.findUnique({
                where: { board_id: String(row.board_id) }
            });
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
const TABLE_MAP = {
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
const SCHEMA_KEYS = {
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
const PK_MAP = {
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
            const vDate = v instanceof Date ? v.toISOString() : String(v);
            const fDate = f.val instanceof Date ? f.val.toISOString() : String(f.val);
            if (f.op === 'gte')
                return v != null && vDate >= fDate;
            if (f.op === 'lte')
                return v != null && vDate <= fDate;
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
            const model = TABLE_MAP[this.table];
            if (!model)
                throw new Error(`Table not mapped: ${this.table}`);
            const pk = PK_MAP[this.table];
            if (this.mutation === 'insert') {
                const items = Array.isArray(this.mutationPayload)
                    ? this.mutationPayload
                    : [this.mutationPayload];
                const inserted = [];
                for (const item of items) {
                    const validKeys = SCHEMA_KEYS[this.table] || [];
                    const cleanItem = {};
                    for (const k of Object.keys(item)) {
                        if (validKeys.includes(k)) {
                            let val = item[k];
                            if (['exit_arr', 'employee_count', 'rep_talk_pct', 'client_talk_pct', 'duration_seconds', 'amount', 'ai_risk_score'].includes(k) && typeof val === 'string') {
                                val = Number(val);
                            }
                            cleanItem[k] = val;
                        }
                    }
                    const res = await model.create({
                        data: {
                            ...(pk === 'id' ? { id: item.id || (0, crypto_1.randomUUID)() } : {}),
                            ...cleanItem
                        }
                    });
                    inserted.push(res);
                }
                const data = this.wantSingle ? inserted[0] : inserted;
                return { data: JSON.parse(JSON.stringify(data)), error: null };
            }
            if (this.mutation === 'update') {
                const allRaw = await model.findMany();
                const matched = this.applyFilters(allRaw);
                const patch = this.mutationPayload;
                const updated = [];
                const validKeys = SCHEMA_KEYS[this.table] || [];
                for (const row of matched) {
                    const cleanPatch = {};
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
                const item = this.mutationPayload;
                const key = this.upsertOnConflict || pk;
                const validKeys = SCHEMA_KEYS[this.table] || [];
                const cleanItem = {};
                for (const k of Object.keys(item)) {
                    if (validKeys.includes(k)) {
                        let val = item[k];
                        if (['exit_arr', 'employee_count', 'rep_talk_pct', 'client_talk_pct', 'duration_seconds', 'amount', 'ai_risk_score'].includes(k) && typeof val === 'string') {
                            val = Number(val);
                        }
                        cleanItem[k] = val;
                    }
                }
                let res;
                try {
                    if (this.upsertOnConflict && this.upsertOnConflict.includes(',')) {
                        const keys = this.upsertOnConflict.split(',');
                        const findWhere = {};
                        for (const k of keys)
                            findWhere[k] = cleanItem[k];
                        const existing = await model.findFirst({ where: findWhere });
                        if (existing) {
                            res = await model.update({ where: { [pk]: existing[pk] }, data: cleanItem });
                            return { data: JSON.parse(JSON.stringify(res)), error: null };
                        }
                    }
                    else {
                        const key = this.upsertOnConflict || pk;
                        const existing = await model.findFirst({ where: { [key]: cleanItem[key] } });
                        if (existing) {
                            res = await model.update({ where: { [pk]: existing[pk] }, data: cleanItem });
                            return { data: JSON.parse(JSON.stringify(res)), error: null };
                        }
                    }
                    res = await model.create({
                        data: {
                            ...(pk === 'id' ? { id: item.id || (0, crypto_1.randomUUID)() } : {}),
                            ...cleanItem
                        }
                    });
                }
                catch (e) {
                    throw e;
                }
                return { data: JSON.parse(JSON.stringify(res)), error: null };
            }
            const rawRows = await model.findMany();
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
        }
        catch (e) {
            console.error('M05 DB Client Error:', e);
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
exports.getSupabase = createM05DbClient;
//# sourceMappingURL=m05-db.client.js.map