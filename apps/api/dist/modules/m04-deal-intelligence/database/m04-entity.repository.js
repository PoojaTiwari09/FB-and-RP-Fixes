"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.M04EntityRepository = exports.M04QueryBuilder = void 0;
exports.Between = Between;
exports.In = In;
const crypto_1 = require("crypto");
function Between(from, to) {
    return { _type: 'between', from, to };
}
function In(values) {
    return { _type: 'in', values };
}
const ENTITY_RELATIONS = {
    Deal: {
        warnings: { collection: 'dealWarnings', foreignKey: 'dealId' },
        playbooks: { collection: 'dealPlaybooks', foreignKey: 'dealId' },
        activities: { collection: 'dealActivities', foreignKey: 'dealId' },
        comments: { collection: 'dealComments', foreignKey: 'dealId' },
        tasks: { collection: 'dealTasks', foreignKey: 'dealId' },
    },
    DealBoard: {
        filters: { collection: 'boardFilters', foreignKey: 'boardId' },
        tabs: { collection: 'boardTabs', foreignKey: 'boardId' },
        columns: { collection: 'boardColumns', foreignKey: 'boardId' },
        permissions: { collection: 'boardPermissions', foreignKey: 'boardId' },
    },
    DealWarning: { deal: { collection: 'deals', foreignKey: 'id' } },
    DealActivity: { deal: { collection: 'deals', foreignKey: 'id' } },
    DealTask: { deal: { collection: 'deals', foreignKey: 'id' } },
    DealPlaybook: { deal: { collection: 'deals', foreignKey: 'id' } },
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
class M04QueryBuilder {
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
        const rows = this.repository.getAllRows();
        const toDelete = rows.filter((row) => this.evaluateRow(row, {}));
        for (const row of toDelete) {
            this.repository.deleteFromStore(row.id);
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
        const all = this.buildResultRows();
        const total = all.length;
        const sliced = all.slice(this.skipCount, this.takeCount !== undefined ? this.skipCount + this.takeCount : undefined);
        return [sliced, total];
    }
    async getCount() {
        const [, count] = await this.getManyAndCount();
        return count;
    }
    async getRawMany() {
        const rows = this.repository.getAllRows();
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
            const rows = this.repository.getAllRows();
            const filtered = rows.filter((row) => this.evaluateRow(row, {}));
            const field = expr.match(/SUM\([^)]*\.([^)]+)\)/i)?.[1] ?? 'amount';
            const sum = filtered.reduce((acc, row) => acc + Number(getFieldValue(row, field) ?? 0), 0);
            const alias = this.selectExprs[0]?.alias ?? 'total';
            return { [alias]: String(sum) };
        }
        const many = await this.getRawMany();
        return many[0];
    }
    buildResultRows() {
        const rows = this.repository.getAllRows();
        const result = [];
        for (const row of rows) {
            const joined = this.resolveJoins(row);
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
            this.repository.attachRelations(copy, this.joins.map((j) => j.relation.split('.')[1]));
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
    resolveJoins(row) {
        const joined = {};
        for (const join of this.joins) {
            const [, rel] = join.relation.split('.');
            const fk = JOIN_PARENT_FK[join.relation] ?? `${rel}Id`;
            const parentId = getFieldValue(row, fk);
            if (rel === 'deal') {
                const related = this.repository.store.getCollection('deals').get(String(parentId));
                if (related)
                    joined[join.alias] = related;
            }
            else if (rel === 'permissions') {
                const perms = [...this.repository.store.getCollection('boardPermissions').values()].filter((p) => p.boardId === row.id);
                joined[join.alias] = perms[0] ?? {};
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
exports.M04QueryBuilder = M04QueryBuilder;
class M04EntityRepository {
    entityClass;
    store;
    collectionKey;
    entityName;
    constructor(entityClass, store, collectionKey) {
        this.entityClass = entityClass;
        this.store = store;
        this.collectionKey = collectionKey;
        this.entityName = entityClass.name;
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
        const collection = this.store.getCollection(this.collectionKey);
        const now = new Date();
        if ('updatedAt' in entity) {
            entity.updatedAt = now;
        }
        collection.set(entity.id, { ...entity });
        return entity;
    }
    async find(options) {
        const [rows] = await this.findAndCount(options);
        return rows;
    }
    async findOne(options) {
        let rows = this.getAllRows().filter((row) => matchesWhereClause(row, options.where));
        if (rows.length === 0)
            return null;
        if (options.order) {
            rows = applyOrder(rows, options.order);
        }
        const entity = { ...rows[0] };
        if (options.relations?.length) {
            this.attachRelations(entity, options.relations);
        }
        return entity;
    }
    async findAndCount(options) {
        let rows = this.getAllRows();
        rows = rows.filter((row) => matchesWhereClause(row, options?.where));
        rows = applyOrder(rows, options?.order);
        const total = rows.length;
        const skip = options?.skip ?? 0;
        const take = options?.take;
        const sliced = rows.slice(skip, take !== undefined ? skip + take : undefined);
        const result = sliced.map((row) => {
            const entity = { ...row };
            if (options?.relations?.length) {
                this.attachRelations(entity, options.relations);
            }
            return entity;
        });
        return [result, total];
    }
    async update(idOrCriteria, partial) {
        if (typeof idOrCriteria === 'string') {
            const existing = this.store.getCollection(this.collectionKey).get(idOrCriteria);
            if (existing) {
                await this.save({ ...existing, ...partial, id: idOrCriteria });
            }
            return;
        }
        const rows = this.getAllRows().filter((row) => matchesWhereClause(row, idOrCriteria));
        for (const row of rows) {
            await this.save({ ...row, ...partial });
        }
    }
    async delete(criteria) {
        if (typeof criteria === 'string') {
            this.deleteFromStore(criteria);
            return;
        }
        const rows = this.getAllRows().filter((row) => matchesWhereClause(row, criteria));
        for (const row of rows) {
            this.deleteFromStore(row.id);
        }
    }
    async remove(entity) {
        if (Array.isArray(entity)) {
            for (const e of entity)
                this.deleteFromStore(e.id);
            return entity;
        }
        this.deleteFromStore(entity.id);
        return entity;
    }
    createQueryBuilder(alias) {
        const al = alias ?? this.entityName.charAt(0).toLowerCase() + this.entityName.slice(1);
        return new M04QueryBuilder(this, al);
    }
    getAllRows() {
        return [...this.store.getCollection(this.collectionKey).values()];
    }
    deleteFromStore(id) {
        this.store.getCollection(this.collectionKey).delete(id);
    }
    attachRelations(entity, relations) {
        const config = ENTITY_RELATIONS[this.entityName];
        if (!config)
            return;
        for (const rel of relations) {
            const relConfig = config[rel];
            if (!relConfig)
                continue;
            const related = [...this.store.getCollection(relConfig.collection).values()].filter((item) => item[relConfig.foreignKey] === entity.id);
            entity[rel] = related;
        }
    }
}
exports.M04EntityRepository = M04EntityRepository;
//# sourceMappingURL=m04-entity.repository.js.map