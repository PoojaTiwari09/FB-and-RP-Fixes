"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.M04QueryBuilder = exports.M04EntityRepository = exports.M04PrismaRepository = exports.M04PrismaQueryBuilder = exports.M04_DEV_BOARD_2 = exports.M04_DEV_BOARD_1 = exports.M04_DEV_USER = exports.M04_DEV_TENANT = void 0;
exports.Between = Between;
exports.In = In;
const crypto_1 = require("crypto");
exports.M04_DEV_TENANT = 'dev-tenant-m04-001';
exports.M04_DEV_USER = '00000000-0000-0000-0000-000000000004';
exports.M04_DEV_BOARD_1 = '00000000-0000-0000-0000-000000000101';
exports.M04_DEV_BOARD_2 = '00000000-0000-0000-0000-000000000102';
function Between(from, to) {
    return { _type: 'between', from, to };
}
function In(values) {
    return { _type: 'in', values };
}
const ENTITY_TO_PRISMA_MODEL = {
    Deal: 'deal',
    DealBoard: 'm04DealBoard',
    BoardFilter: 'm04BoardFilter',
    BoardTab: 'm04BoardTab',
    BoardColumn: 'm04BoardColumn',
    BoardPermission: 'm04BoardPermission',
    DealWarning: 'dealWarning',
    DealPlaybook: 'dealPlaybook',
    DealActivity: 'dealActivityEvent',
    DealComment: 'dealComment',
    DealTask: 'dealTask',
    AuditLog: 'auditLog',
    SyncLog: 'm04SyncLog',
    DealSummary: 'm04DealSummary',
    User: 'user',
    Session: 'm04Session',
    UserPreference: 'm04UserPreference',
    AnalyticsSnapshot: 'm04AnalyticsSnapshot',
};
const JOIN_PARENT_FK = {
    'warning.deal': 'dealId',
    'activity.deal': 'dealId',
    'task.deal': 'dealId',
    'playbook.deal': 'dealId',
};
function toCamelCase(field) {
    return field.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}
function compareValues(actual, expected) {
    const a = actual instanceof Date ? actual.getTime() : actual;
    const b = expected instanceof Date ? expected.getTime() : expected;
    return a < b ? -1 : a > b ? 1 : 0;
}
function getFieldValue(entity, fieldPath) {
    const field = fieldPath.includes('.') ? fieldPath.split('.').pop() : fieldPath;
    const key = toCamelCase(field);
    return entity[key];
}
function matchesWhereClause(entity, where) {
    if (!where)
        return true;
    if (Array.isArray(where)) {
        return where.some((w) => matchesWhereClause(entity, w));
    }
    for (const [key, expected] of Object.entries(where)) {
        const actual = entity[key];
        if (expected && typeof expected === 'object' && '_type' in expected) {
            const marker = expected;
            if (marker._type === 'between') {
                const val = actual instanceof Date ? actual.getTime() : actual;
                const from = marker.from instanceof Date ? marker.from.getTime() : marker.from;
                const to = marker.to instanceof Date ? marker.to.getTime() : marker.to;
                if (val < from || val > to)
                    return false;
            }
            else if (marker._type === 'in') {
                if (!marker.values?.includes(actual))
                    return false;
            }
        }
        else if (actual !== expected) {
            return false;
        }
    }
    return true;
}
function applyOrder(rows, order) {
    if (!order)
        return rows;
    const entries = Object.entries(order);
    return [...rows].sort((a, b) => {
        for (const [field, dir] of entries) {
            const av = a[field];
            const bv = b[field];
            let cmp = 0;
            if (av instanceof Date && bv instanceof Date)
                cmp = av.getTime() - bv.getTime();
            else if (typeof av === 'number' && typeof bv === 'number')
                cmp = av - bv;
            else
                cmp = String(av ?? '').localeCompare(String(bv ?? ''));
            if (cmp !== 0)
                return dir.toUpperCase() === 'DESC' ? -cmp : cmp;
        }
        return 0;
    });
}
class M04PrismaQueryBuilder {
    repository;
    alias;
    wheres = [];
    joins = [];
    orderClauses = [];
    skipCount = 0;
    takeCount;
    selectExprs = [];
    groupByFields = [];
    deleteMode = false;
    constructor(repository, alias) {
        this.repository = repository;
        this.alias = alias;
    }
    where(sql, params) {
        this.wheres.push({ sql, params: params ?? {} });
        return this;
    }
    andWhere(sql, params) {
        return this.where(sql, params);
    }
    leftJoinAndSelect(relation, alias) {
        this.joins.push({ type: 'left', relation, alias });
        return this;
    }
    innerJoin(relation, alias) {
        this.joins.push({ type: 'inner', relation, alias });
        return this;
    }
    orderBy(field, direction = 'ASC') {
        this.orderClauses = [{ field, direction }];
        return this;
    }
    addOrderBy(field, direction = 'ASC') {
        this.orderClauses.push({ field, direction });
        return this;
    }
    skip(n) {
        this.skipCount = n;
        return this;
    }
    take(n) {
        this.takeCount = n;
        return this;
    }
    limit(n) {
        return this.take(n);
    }
    select(expr, alias) {
        this.selectExprs = [{ expr, alias }];
        return this;
    }
    addSelect(expr, alias) {
        this.selectExprs.push({ expr, alias });
        return this;
    }
    groupBy(field) {
        this.groupByFields.push(field);
        return this;
    }
    delete() {
        this.deleteMode = true;
        return this;
    }
    async execute() {
        const rows = await this.repository.getAllRows();
        const toDelete = rows.filter((row) => this.evaluateRow(row, {}));
        for (const row of toDelete) {
            await this.repository.deleteFromStore(row.id);
        }
        return { affected: toDelete.length };
    }
    async getMany() {
        const [rows] = await this.getManyAndCount();
        return rows;
    }
    async getManyAndCount() {
        if (this.selectExprs.length > 0 && this.groupByFields.length === 0 && this.selectExprs[0].expr.includes('SUM')) {
            const raw = await this.getRawOne();
            return [[], raw ? 1 : 0];
        }
        const all = await this.buildResultRows();
        const total = all.length;
        const sliced = all.slice(this.skipCount, this.takeCount !== undefined ? this.skipCount + this.takeCount : undefined);
        return [sliced, total];
    }
    async getCount() {
        const [, count] = await this.getManyAndCount();
        return count;
    }
    async getRawMany() {
        const rows = await this.repository.getAllRows();
        const filtered = rows.filter((row) => this.evaluateRow(row, {}));
        if (this.groupByFields.length > 0) {
            const groups = new Map();
            for (const row of filtered) {
                const groupField = this.groupByFields[0].split('.').pop();
                const groupKey = String(getFieldValue(row, groupField) ?? '');
                const existing = groups.get(groupKey) ?? {
                    [this.selectExprs[0]?.alias ?? groupField]: groupKey,
                    count: 0,
                };
                existing.count = existing.count + 1;
                groups.set(groupKey, existing);
            }
            return Array.from(groups.values()).map((g) => ({
                [this.selectExprs[0]?.alias ?? 'stage']: g[this.selectExprs[0]?.alias ?? 'stage'] ?? Object.values(g)[0],
                count: String(g.count),
            }));
        }
        return filtered.map((row) => {
            const raw = {};
            for (const sel of this.selectExprs) {
                const alias = sel.alias ?? sel.expr;
                raw[alias] = this.evalSelectExpr(sel.expr, row);
            }
            return raw;
        });
    }
    async getRawOne() {
        const expr = this.selectExprs[0]?.expr ?? '';
        if (expr.includes('SUM')) {
            const rows = await this.repository.getAllRows();
            const filtered = rows.filter((row) => this.evaluateRow(row, {}));
            const field = expr.match(/SUM\([^)]*\.([^)]+)\)/i)?.[1] ?? 'amount';
            const sum = filtered.reduce((acc, row) => acc + Number(getFieldValue(row, field) ?? 0), 0);
            const alias = this.selectExprs[0]?.alias ?? 'total';
            return { [alias]: String(sum) };
        }
        const many = await this.getRawMany();
        return many[0];
    }
    async buildResultRows() {
        const rows = await this.repository.getAllRows();
        const result = [];
        for (const row of rows) {
            const joined = await this.resolveJoins(row);
            if (!this.hasRequiredJoins(row, joined))
                continue;
            if (!this.evaluateRow(row, joined))
                continue;
            const copy = { ...row };
            for (const join of this.joins) {
                if (join.type === 'left') {
                    const relName = join.relation.split('.')[1];
                    copy[relName] = joined[join.alias];
                }
            }
            await this.repository.attachRelations(copy, this.joins.map((j) => j.relation.split('.')[1]));
            result.push(copy);
        }
        const deduped = this.dedupeById(result);
        return applyOrder(deduped, this.orderClauses.reduce((acc, o) => {
            const field = o.field.includes('.') ? o.field.split('.').pop() : o.field;
            acc[field] = o.direction;
            return acc;
        }, {}));
    }
    dedupeById(rows) {
        const seen = new Set();
        return rows.filter((r) => {
            if (seen.has(r.id))
                return false;
            seen.add(r.id);
            return true;
        });
    }
    async resolveJoins(row) {
        const joined = {};
        for (const join of this.joins) {
            const [, rel] = join.relation.split('.');
            const fk = JOIN_PARENT_FK[join.relation] ?? `${rel}Id`;
            const parentId = getFieldValue(row, fk);
            if (rel === 'deal') {
                const related = await this.repository.prisma.deal.findUnique({ where: { id: String(parentId) } });
                if (related)
                    joined[join.alias] = related;
            }
            else if (rel === 'permissions') {
                const perms = await this.repository.prisma.m04BoardPermission.findMany({
                    where: { boardId: row.id },
                });
                if (perms.length > 0) {
                    joined[join.alias] = perms[0];
                }
            }
        }
        return joined;
    }
    hasRequiredJoins(row, joined) {
        for (const join of this.joins) {
            if (join.type === 'inner' && !joined[join.alias])
                return false;
        }
        return true;
    }
    evaluateRow(row, joined) {
        if (this.wheres.length === 0)
            return true;
        return this.wheres.every((w) => this.evalSql(w.sql, w.params, row, joined));
    }
    evalSql(sql, params, row, joined) {
        const orParts = sql.split(/\s+OR\s+/i);
        if (orParts.length > 1) {
            return orParts.some((part) => this.evalSql(part.trim().replace(/^\(|\)$/g, ''), params, row, joined));
        }
        const andParts = sql.split(/\s+AND\s+/i);
        return andParts.every((part) => this.evalCondition(part.trim().replace(/^\(|\)$/g, ''), params, row, joined));
    }
    evalCondition(condition, params, row, joined) {
        const anyMatch = condition.match(/:(\w+)\s*=\s*ANY\(([^)]+)\)/i);
        if (anyMatch) {
            const paramKey = anyMatch[1];
            const fieldPath = anyMatch[2].trim();
            const value = params[paramKey];
            const entity = this.entityForPath(fieldPath, row, joined);
            const arr = getFieldValue(entity, fieldPath.split('.').pop());
            return Array.isArray(arr) && arr.includes(value);
        }
        const inSpread = condition.match(/(\w+\.\w+)\s+IN\s+\(:\.\.\.(\w+)\)/i);
        if (inSpread) {
            const [, fieldPath, paramKey] = inSpread;
            const entity = this.entityForPath(fieldPath, row, joined);
            const values = params[paramKey];
            return values?.includes(getFieldValue(entity, fieldPath));
        }
        const ilikeMatch = condition.match(/\(([^)]+)\)/);
        if (ilikeMatch && condition.toUpperCase().includes('ILIKE')) {
            const clauses = ilikeMatch[1].split(/\s+OR\s+/i);
            return clauses.some((clause) => {
                const m = clause.trim().match(/(\w+\.\w+)\s+ILIKE\s+:(\w+)/i);
                if (!m)
                    return false;
                const entity = this.entityForPath(m[1], row, joined);
                const raw = String(params[m[2]] ?? '').replace(/%/g, '');
                const val = String(getFieldValue(entity, m[1]) ?? '');
                return val.toLowerCase().includes(raw.toLowerCase());
            });
        }
        const simple = condition.match(/(\w+\.\w+)\s*(=|!=|>=|<=|>|<)\s*:(\w+)/i) ||
            condition.match(/(\w+\.\w+)\s*(=|!=|>=|<=|>|<)\s*:(\w+)/i);
        if (simple) {
            const [, fieldPath, op, paramKey] = simple;
            const entity = this.entityForPath(fieldPath, row, joined);
            const actual = getFieldValue(entity, fieldPath);
            const expected = params[paramKey];
            switch (op) {
                case '=':
                    return actual === expected;
                case '!=':
                    return actual !== expected;
                case '>':
                    return actual > expected;
                case '<':
                    return actual < expected;
                case '>=':
                    return actual >= expected;
                case '<=':
                    return actual <= expected;
                default:
                    return false;
            }
        }
        const singleField = condition.match(/^([\w.]+)\s*(=|!=|>=|<=|>|<)\s*:(\w+)$/i);
        if (singleField) {
            const [, fieldPath, op, paramKey] = singleField;
            const entity = fieldPath.includes('.')
                ? this.entityForPath(fieldPath, row, joined)
                : row;
            const actual = getFieldValue(entity, fieldPath);
            const expected = params[paramKey];
            switch (op) {
                case '=':
                    return actual === expected;
                case '!=':
                    return actual !== expected;
                case '>':
                    return compareValues(actual, expected) > 0;
                case '<':
                    return compareValues(actual, expected) < 0;
                case '>=':
                    return compareValues(actual, expected) >= 0;
                case '<=':
                    return compareValues(actual, expected) <= 0;
                default:
                    return false;
            }
        }
        return true;
    }
    entityForPath(fieldPath, row, joined) {
        const [alias] = fieldPath.split('.');
        if (alias === this.alias)
            return row;
        return joined[alias] ?? row;
    }
    evalSelectExpr(expr, row) {
        const m = expr.match(/(\w+)\.(\w+)/);
        if (m)
            return getFieldValue(row, m[2]);
        return null;
    }
}
exports.M04PrismaQueryBuilder = M04PrismaQueryBuilder;
exports.M04QueryBuilder = M04PrismaQueryBuilder;
class M04PrismaRepository {
    entityClass;
    prisma;
    collectionKey;
    entityName;
    prismaModelName;
    constructor(entityClass, prisma, collectionKey) {
        this.entityClass = entityClass;
        this.prisma = prisma;
        this.collectionKey = collectionKey;
        this.entityName = entityClass.name;
        this.prismaModelName = ENTITY_TO_PRISMA_MODEL[this.entityName] || this.entityName.charAt(0).toLowerCase() + this.entityName.slice(1);
    }
    create(partial) {
        if (Array.isArray(partial)) {
            return partial.map((p) => this.createOne(p));
        }
        return this.createOne(partial);
    }
    createOne(partial) {
        const entity = Object.assign(new this.entityClass(), partial);
        if (!entity.id) {
            entity.id = (0, crypto_1.randomUUID)();
        }
        const now = new Date();
        if ('createdAt' in entity && !entity.createdAt) {
            entity.createdAt = now;
        }
        if ('updatedAt' in entity && !entity.updatedAt) {
            entity.updatedAt = now;
        }
        return entity;
    }
    async save(entity) {
        if (Array.isArray(entity)) {
            return Promise.all(entity.map((e) => this.saveOne(e)));
        }
        return this.saveOne(entity);
    }
    async saveOne(entity) {
        const client = this.prisma[this.prismaModelName];
        const dbData = this.mapToPrisma(entity);
        const id = entity.id;
        const existing = await client.findUnique({
            where: { id },
        });
        let result;
        if (existing) {
            result = await client.update({
                where: { id },
                data: dbData,
            });
        }
        else {
            result = await client.create({
                data: dbData,
            });
        }
        const mapped = this.mapToEntity(result);
        const relationsToAttach = [];
        if (entity.warnings)
            relationsToAttach.push('warnings');
        if (entity.playbooks)
            relationsToAttach.push('playbooks');
        if (entity.activities)
            relationsToAttach.push('activities');
        if (entity.comments)
            relationsToAttach.push('comments');
        if (entity.tasks)
            relationsToAttach.push('tasks');
        if (entity.filters)
            relationsToAttach.push('filters');
        if (entity.tabs)
            relationsToAttach.push('tabs');
        if (entity.columns)
            relationsToAttach.push('columns');
        if (entity.permissions)
            relationsToAttach.push('permissions');
        if (entity.deal)
            relationsToAttach.push('deal');
        await this.attachRelations(mapped, relationsToAttach);
        return mapped;
    }
    async find(options) {
        const [rows] = await this.findAndCount(options);
        return rows;
    }
    async findOne(options) {
        const rows = await this.getAllRows();
        let filtered = rows.filter((row) => matchesWhereClause(row, options.where));
        if (filtered.length === 0)
            return null;
        if (options.order) {
            filtered = applyOrder(filtered, options.order);
        }
        const entity = filtered[0];
        if (options.relations?.length) {
            await this.attachRelations(entity, options.relations);
        }
        return entity;
    }
    async findAndCount(options) {
        let rows = await this.getAllRows();
        rows = rows.filter((row) => matchesWhereClause(row, options?.where));
        rows = applyOrder(rows, options?.order);
        const total = rows.length;
        const skip = options?.skip ?? 0;
        const take = options?.take;
        const sliced = rows.slice(skip, take !== undefined ? skip + take : undefined);
        const result = await Promise.all(sliced.map(async (row) => {
            if (options?.relations?.length) {
                await this.attachRelations(row, options.relations);
            }
            return row;
        }));
        return [result, total];
    }
    async update(idOrCriteria, partial) {
        const client = this.prisma[this.prismaModelName];
        const dbData = this.mapToPrisma(partial);
        delete dbData.id;
        if (typeof idOrCriteria === 'string') {
            await client.update({
                where: { id: idOrCriteria },
                data: dbData,
            });
            return;
        }
        const rows = await this.getAllRows();
        const filtered = rows.filter((row) => matchesWhereClause(row, idOrCriteria));
        for (const row of filtered) {
            await client.update({
                where: { id: row.id },
                data: dbData,
            });
        }
    }
    async delete(criteria) {
        const client = this.prisma[this.prismaModelName];
        if (typeof criteria === 'string') {
            await client.delete({ where: { id: criteria } });
            return;
        }
        const rows = await this.getAllRows();
        const filtered = rows.filter((row) => matchesWhereClause(row, criteria));
        for (const row of filtered) {
            await client.delete({ where: { id: row.id } });
        }
    }
    async remove(entity) {
        if (Array.isArray(entity)) {
            for (const e of entity)
                await this.delete(e.id);
            return entity;
        }
        await this.delete(entity.id);
        return entity;
    }
    createQueryBuilder(alias) {
        const al = alias ?? this.entityName.charAt(0).toLowerCase() + this.entityName.slice(1);
        return new M04PrismaQueryBuilder(this, al);
    }
    async getAllRows() {
        const client = this.prisma[this.prismaModelName];
        const rows = await client.findMany();
        return rows.map((r) => this.mapToEntity(r));
    }
    async deleteFromStore(id) {
        await this.delete(id);
    }
    async attachRelations(entity, relations) {
        if (!relations || relations.length === 0)
            return;
        for (const rel of relations) {
            if (this.entityName === 'DealBoard') {
                if (rel === 'filters') {
                    const filters = await this.prisma.m04BoardFilter.findMany({ where: { boardId: entity.id } });
                    entity.filters = filters.map(f => {
                        const fe = new (require('../entities').BoardFilter)();
                        Object.assign(fe, f);
                        fe.fieldName = f.field;
                        fe.tenantId = f.tenantid;
                        return fe;
                    });
                }
                if (rel === 'tabs') {
                    const tabs = await this.prisma.m04BoardTab.findMany({ where: { boardId: entity.id } });
                    entity.tabs = tabs.map(t => {
                        const te = new (require('../entities').BoardTab)();
                        Object.assign(te, t);
                        te.tenantId = t.tenantid;
                        return te;
                    });
                }
                if (rel === 'columns') {
                    const columns = await this.prisma.m04BoardColumn.findMany({ where: { boardId: entity.id } });
                    entity.columns = columns.map(c => {
                        const ce = new (require('../entities').BoardColumn)();
                        Object.assign(ce, c);
                        ce.fieldKey = c.field;
                        ce.tenantId = c.tenantid;
                        return ce;
                    });
                }
                if (rel === 'permissions') {
                    const permissions = await this.prisma.m04BoardPermission.findMany({ where: { boardId: entity.id } });
                    entity.permissions = permissions.map(p => {
                        const pe = new (require('../entities').BoardPermission)();
                        Object.assign(pe, p);
                        pe.subjectId = p.userId;
                        pe.tenantId = p.tenantid;
                        return pe;
                    });
                }
            }
            else if (this.entityName === 'Deal') {
                if (rel === 'warnings') {
                    const warnings = await this.prisma.dealWarning.findMany({ where: { dealId: entity.id, status: 'active' } });
                    entity.warnings = warnings.map(w => this.mapWarningToEntity(w));
                }
                if (rel === 'playbooks') {
                    const playbooks = await this.prisma.dealPlaybook.findMany({ where: { dealId: entity.id } });
                    entity.playbooks = playbooks.map(p => this.mapPlaybookToEntity(p));
                }
                if (rel === 'activities') {
                    const activities = await this.prisma.dealActivityEvent.findMany({ where: { dealId: entity.id } });
                    entity.activities = activities.map(a => this.mapActivityToEntity(a));
                }
                if (rel === 'comments') {
                    const comments = await this.prisma.dealComment.findMany({ where: { dealId: entity.id } });
                    entity.comments = comments.map(c => this.mapCommentToEntity(c));
                }
                if (rel === 'tasks') {
                    const tasks = await this.prisma.dealTask.findMany({ where: { dealId: entity.id } });
                    entity.tasks = tasks.map(t => this.mapTaskToEntity(t));
                }
            }
            else if (['DealWarning', 'DealActivity', 'DealTask', 'DealPlaybook'].includes(this.entityName)) {
                if (rel === 'deal' && entity.dealId) {
                    const deal = await this.prisma.deal.findUnique({ where: { id: entity.dealId } });
                    if (deal) {
                        entity.deal = {
                            id: deal.id,
                            tenantId: deal.tenantid,
                            crmDealId: deal.externalId || '',
                            name: deal.name,
                            stage: deal.stage,
                            amount: Number(deal.amount || 0),
                            forecastCategory: deal.forecastCategory || '',
                            ownerId: deal.ownerId || '',
                            ownerName: deal.ownerName || '',
                            probability: deal.probability || 0,
                            aiScore: deal.aiScore || 0,
                            warningCount: deal.warningsCount || 0,
                            nextStep: deal.nextStep || '',
                            lastActivityAt: deal.lastActivity || undefined,
                            createdAt: deal.createdAt,
                            updatedAt: deal.updatedAt,
                        };
                    }
                }
            }
        }
    }
    mapWarningToEntity(dbRow) {
        const e = new (require('../entities').DealWarning)();
        Object.assign(e, dbRow);
        e.tenantId = dbRow.tenantid;
        e.message = dbRow.description;
        e.recommendedAction = dbRow.suggestedAction;
        e.isActive = dbRow.status === 'active';
        return e;
    }
    mapPlaybookToEntity(dbRow) {
        const e = new (require('../entities').DealPlaybook)();
        Object.assign(e, dbRow);
        e.tenantId = dbRow.tenantid;
        e.criterion = dbRow.criterionName;
        e.aiSuggestion = dbRow.aiSuggestedNote;
        return e;
    }
    mapActivityToEntity(dbRow) {
        const e = new (require('../entities').DealActivity)();
        Object.assign(e, dbRow);
        e.tenantId = dbRow.tenantid;
        e.activityDate = dbRow.date ? new Date(dbRow.date) : dbRow.createdAt;
        e.durationMinutes = dbRow.duration || 0;
        return e;
    }
    mapCommentToEntity(dbRow) {
        const e = new (require('../entities').DealComment)();
        Object.assign(e, dbRow);
        e.tenantId = dbRow.tenantid;
        e.content = dbRow.comment;
        return e;
    }
    mapTaskToEntity(dbRow) {
        const e = new (require('../entities').DealTask)();
        Object.assign(e, dbRow);
        e.tenantId = dbRow.tenantid;
        return e;
    }
    mapToEntity(dbRow) {
        if (!dbRow)
            return dbRow;
        const entity = new this.entityClass();
        Object.assign(entity, dbRow);
        if (dbRow.tenantid) {
            entity.tenantId = dbRow.tenantid;
        }
        if (this.entityName === 'BoardFilter') {
            entity.fieldName = dbRow.field;
        }
        if (this.entityName === 'BoardColumn') {
            entity.fieldKey = dbRow.field;
        }
        if (this.entityName === 'BoardPermission') {
            entity.subjectId = dbRow.userId;
        }
        if (this.entityName === 'Deal') {
            entity.crmDealId = dbRow.externalId || '';
            entity.lastActivityAt = dbRow.lastActivity || undefined;
            entity.warningCount = dbRow.warningsCount || 0;
            entity.amount = Number(dbRow.amount || 0);
        }
        if (this.entityName === 'DealWarning') {
            entity.message = dbRow.description;
            entity.recommendedAction = dbRow.suggestedAction;
            entity.isActive = dbRow.status === 'active';
        }
        if (this.entityName === 'DealPlaybook') {
            entity.criterion = dbRow.criterionName;
            entity.aiSuggestion = dbRow.aiSuggestedNote;
        }
        if (this.entityName === 'DealActivity') {
            entity.activityDate = dbRow.date ? new Date(dbRow.date) : dbRow.createdAt;
            entity.durationMinutes = dbRow.duration || 0;
        }
        if (this.entityName === 'DealComment') {
            entity.content = dbRow.comment;
        }
        if (this.entityName === 'UserPreference') {
            entity.preferenceKey = dbRow.key;
            entity.preferenceValue = dbRow.value;
        }
        return entity;
    }
    mapToPrisma(entity) {
        const dbData = { ...entity };
        delete dbData.warnings;
        delete dbData.playbooks;
        delete dbData.activities;
        delete dbData.comments;
        delete dbData.tasks;
        delete dbData.filters;
        delete dbData.tabs;
        delete dbData.columns;
        delete dbData.permissions;
        delete dbData.deal;
        delete dbData.user;
        if (entity.tenantId) {
            dbData.tenantid = entity.tenantId;
            delete dbData.tenantId;
        }
        else {
            dbData.tenantid = '00000000-0000-0000-0000-000000000000';
        }
        if (this.entityName === 'BoardFilter') {
            dbData.field = entity.fieldName;
            delete dbData.fieldName;
        }
        if (this.entityName === 'BoardColumn') {
            dbData.field = entity.fieldKey || entity.field;
            delete dbData.fieldKey;
        }
        if (this.entityName === 'BoardPermission') {
            dbData.userId = entity.subjectId;
            delete dbData.subjectId;
        }
        if (this.entityName === 'Deal') {
            dbData.externalId = entity.crmDealId;
            dbData.lastActivity = entity.lastActivityAt;
            dbData.warningsCount = entity.warningCount;
            delete dbData.crmDealId;
            delete dbData.lastActivityAt;
            delete dbData.warningCount;
        }
        if (this.entityName === 'DealWarning') {
            dbData.description = entity.message;
            dbData.suggestedAction = entity.recommendedAction;
            dbData.status = entity.isActive === false ? 'resolved' : 'active';
            delete dbData.message;
            delete dbData.recommendedAction;
            delete dbData.isActive;
        }
        if (this.entityName === 'DealPlaybook') {
            dbData.criterionName = entity.criterion;
            dbData.aiSuggestedNote = entity.aiSuggestion;
            delete dbData.criterion;
            delete dbData.aiSuggestion;
        }
        if (this.entityName === 'DealActivity') {
            dbData.date = entity.activityDate ? (entity.activityDate instanceof Date ? entity.activityDate.toISOString() : entity.activityDate) : new Date().toISOString();
            dbData.duration = entity.durationMinutes;
            delete dbData.activityDate;
            delete dbData.durationMinutes;
        }
        if (this.entityName === 'DealComment') {
            dbData.comment = entity.content;
            delete dbData.content;
        }
        if (this.entityName === 'UserPreference') {
            dbData.key = entity.preferenceKey;
            dbData.value = entity.preferenceValue;
            delete dbData.preferenceKey;
            delete dbData.preferenceValue;
        }
        return dbData;
    }
}
exports.M04PrismaRepository = M04PrismaRepository;
exports.M04EntityRepository = M04PrismaRepository;
//# sourceMappingURL=m04-prisma.repository.js.map