import { randomUUID } from 'crypto';
import { M04CollectionKey, M04MemoryStore } from './m04-memory.store';

export function Between<T>(from: T, to: T): { _type: 'between'; from: T; to: T } {
  return { _type: 'between', from, to };
}

export function In<T>(values: T[]): { _type: 'in'; values: T[] } {
  return { _type: 'in', values };
}

export interface FindManyOptions<T> {
  where?: FindWhere<T> | FindWhere<T>[];
  relations?: string[];
  order?: Record<string, 'ASC' | 'DESC' | 'asc' | 'desc'>;
  skip?: number;
  take?: number;
}

export interface FindOneOptions<T> {
  where?: FindWhere<T>;
  relations?: string[];
  order?: Record<string, 'ASC' | 'DESC' | 'asc' | 'desc'>;
}

type FindWhere<T> = Partial<Record<keyof T & string, unknown>>;

const ENTITY_RELATIONS: Record<
  string,
  Record<string, { collection: M04CollectionKey; foreignKey: string }>
> = {
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

const JOIN_PARENT_FK: Record<string, string> = {
  'warning.deal': 'dealId',
  'activity.deal': 'dealId',
  'task.deal': 'dealId',
  'playbook.deal': 'dealId',
};

function toCamelCase(field: string): string {
  return field.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

function compareValues(actual: unknown, expected: unknown): number {
  const a = actual instanceof Date ? actual.getTime() : (actual as number);
  const b = expected instanceof Date ? expected.getTime() : (expected as number);
  return a < b ? -1 : a > b ? 1 : 0;
}

function getFieldValue(entity: Record<string, unknown>, fieldPath: string): unknown {
  const field = fieldPath.includes('.') ? fieldPath.split('.').pop()! : fieldPath;
  const key = toCamelCase(field);
  return entity[key];
}

function matchesWhereClause<T extends Record<string, unknown>>(
  entity: T,
  where?: FindWhere<T> | FindWhere<T>[],
): boolean {
  if (!where) return true;
  if (Array.isArray(where)) {
    return where.some((w) => matchesWhereClause(entity, w));
  }
  for (const [key, expected] of Object.entries(where)) {
    const actual = entity[key];
    if (expected && typeof expected === 'object' && '_type' in (expected as object)) {
      const marker = expected as { _type: string; from?: unknown; to?: unknown; values?: unknown[] };
      if (marker._type === 'between') {
        const val = actual instanceof Date ? actual.getTime() : (actual as number);
        const from = marker.from instanceof Date ? marker.from.getTime() : (marker.from as number);
        const to = marker.to instanceof Date ? marker.to.getTime() : (marker.to as number);
        if (val < from || val > to) return false;
      } else if (marker._type === 'in') {
        if (!marker.values?.includes(actual)) return false;
      }
    } else if (actual !== expected) {
      return false;
    }
  }
  return true;
}

function applyOrder<T extends Record<string, unknown>>(
  rows: T[],
  order?: Record<string, 'ASC' | 'DESC' | 'asc' | 'desc'>,
): T[] {
  if (!order) return rows;
  const entries = Object.entries(order);
  return [...rows].sort((a, b) => {
    for (const [field, dir] of entries) {
      const av = a[field];
      const bv = b[field];
      let cmp = 0;
      if (av instanceof Date && bv instanceof Date) cmp = av.getTime() - bv.getTime();
      else if (typeof av === 'number' && typeof bv === 'number') cmp = av - bv;
      else cmp = String(av ?? '').localeCompare(String(bv ?? ''));
      if (cmp !== 0) return dir.toUpperCase() === 'DESC' ? -cmp : cmp;
    }
    return 0;
  });
}

type WhereClause = { sql: string; params: Record<string, unknown> };
type JoinClause = {
  type: 'left' | 'inner';
  relation: string;
  alias: string;
};

export class M04QueryBuilder<T extends { id: string }> {
  private wheres: WhereClause[] = [];
  private joins: JoinClause[] = [];
  private orderClauses: Array<{ field: string; direction: string }> = [];
  private skipCount = 0;
  private takeCount?: number;
  private selectExprs: Array<{ expr: string; alias?: string }> = [];
  private groupByFields: string[] = [];
  private deleteMode = false;

  constructor(
    private readonly repository: M04EntityRepository<T>,
    private readonly alias: string,
  ) {}

  where(sql: string, params?: Record<string, unknown>): this {
    this.wheres.push({ sql, params: params ?? {} });
    return this;
  }

  andWhere(sql: string, params?: Record<string, unknown>): this {
    return this.where(sql, params);
  }

  leftJoinAndSelect(relation: string, alias: string): this {
    this.joins.push({ type: 'left', relation, alias });
    return this;
  }

  innerJoin(relation: string, alias: string): this {
    this.joins.push({ type: 'inner', relation, alias });
    return this;
  }

  orderBy(field: string, direction: 'ASC' | 'DESC' | 'asc' | 'desc' = 'ASC'): this {
    this.orderClauses = [{ field, direction }];
    return this;
  }

  addOrderBy(field: string, direction: 'ASC' | 'DESC' | 'asc' | 'desc' = 'ASC'): this {
    this.orderClauses.push({ field, direction });
    return this;
  }

  skip(n: number): this {
    this.skipCount = n;
    return this;
  }

  take(n: number): this {
    this.takeCount = n;
    return this;
  }

  limit(n: number): this {
    return this.take(n);
  }

  select(expr: string, alias?: string): this {
    this.selectExprs = [{ expr, alias }];
    return this;
  }

  addSelect(expr: string, alias?: string): this {
    this.selectExprs.push({ expr, alias });
    return this;
  }

  groupBy(field: string): this {
    this.groupByFields.push(field);
    return this;
  }

  delete(): this {
    this.deleteMode = true;
    return this;
  }

  async execute(): Promise<{ affected?: number }> {
    const rows = this.repository.getAllRows();
    const toDelete = rows.filter((row) => this.evaluateRow(row as T, {}));
    for (const row of toDelete) {
      this.repository.deleteFromStore(row.id);
    }
    return { affected: toDelete.length };
  }

  async getMany(): Promise<T[]> {
    const [rows] = await this.getManyAndCount();
    return rows;
  }

  async getManyAndCount(): Promise<[T[], number]> {
    if (this.selectExprs.length > 0 && this.groupByFields.length === 0 && this.selectExprs[0].expr.includes('SUM')) {
      const raw = await this.getRawOne();
      return [[], raw ? 1 : 0];
    }

    const all = this.buildResultRows();
    const total = all.length;
    const sliced = all.slice(this.skipCount, this.takeCount !== undefined ? this.skipCount + this.takeCount : undefined);
    return [sliced, total];
  }

  async getCount(): Promise<number> {
    const [, count] = await this.getManyAndCount();
    return count;
  }

  async getRawMany(): Promise<Record<string, unknown>[]> {
    const rows = this.repository.getAllRows() as T[];
    const filtered = rows.filter((row) => this.evaluateRow(row, {}));

    if (this.groupByFields.length > 0) {
      const groups = new Map<string, Record<string, unknown>>();
      for (const row of filtered) {
        const groupField = this.groupByFields[0].split('.').pop()!;
        const groupKey = String(getFieldValue(row as Record<string, unknown>, groupField) ?? '');
        const existing = groups.get(groupKey) ?? {
          [this.selectExprs[0]?.alias ?? groupField]: groupKey,
          count: 0,
        };
        existing.count = (existing.count as number) + 1;
        groups.set(groupKey, existing);
      }
      return Array.from(groups.values()).map((g) => ({
        [this.selectExprs[0]?.alias ?? 'stage']: g[this.selectExprs[0]?.alias ?? 'stage'] ?? Object.values(g)[0],
        count: String(g.count),
      }));
    }

    return filtered.map((row) => {
      const raw: Record<string, unknown> = {};
      for (const sel of this.selectExprs) {
        const alias = sel.alias ?? sel.expr;
        raw[alias] = this.evalSelectExpr(sel.expr, row as Record<string, unknown>);
      }
      return raw;
    });
  }

  async getRawOne(): Promise<Record<string, unknown> | undefined> {
    const expr = this.selectExprs[0]?.expr ?? '';
    if (expr.includes('SUM')) {
      const rows = this.repository.getAllRows() as T[];
      const filtered = rows.filter((row) => this.evaluateRow(row, {}));
      const field = expr.match(/SUM\([^)]*\.([^)]+)\)/i)?.[1] ?? 'amount';
      const sum = filtered.reduce((acc, row) => acc + Number(getFieldValue(row as Record<string, unknown>, field) ?? 0), 0);
      const alias = this.selectExprs[0]?.alias ?? 'total';
      return { [alias]: String(sum) };
    }
    const many = await this.getRawMany();
    return many[0];
  }

  private buildResultRows(): T[] {
    const rows = this.repository.getAllRows() as T[];
    const result: T[] = [];

    for (const row of rows) {
      const joined = this.resolveJoins(row);
      if (!this.hasRequiredJoins(row, joined)) continue;
      if (!this.evaluateRow(row, joined)) continue;

      const copy = { ...row } as T;
      for (const join of this.joins) {
        if (join.type === 'left') {
          const relName = join.relation.split('.')[1];
          (copy as Record<string, unknown>)[relName] = joined[join.alias];
        }
      }
      this.repository.attachRelations(copy, this.joins.map((j) => j.relation.split('.')[1]));
      result.push(copy);
    }

    const deduped = this.dedupeById(result);
    return applyOrder(
      deduped,
      this.orderClauses.reduce(
        (acc, o) => {
          const field = o.field.includes('.') ? o.field.split('.').pop()! : o.field;
          acc[field] = o.direction as 'ASC' | 'DESC';
          return acc;
        },
        {} as Record<string, 'ASC' | 'DESC'>,
      ),
    );
  }

  private dedupeById(rows: T[]): T[] {
    const seen = new Set<string>();
    return rows.filter((r) => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });
  }

  private resolveJoins(row: T): Record<string, Record<string, unknown>> {
    const joined: Record<string, Record<string, unknown>> = {};
    for (const join of this.joins) {
      const [, rel] = join.relation.split('.');
      const fk = JOIN_PARENT_FK[join.relation] ?? `${rel}Id`;
      const parentId = getFieldValue(row as Record<string, unknown>, fk);
      if (rel === 'deal') {
        const related = this.repository.store.getCollection('deals').get(String(parentId));
        if (related) joined[join.alias] = related as Record<string, unknown>;
      } else if (rel === 'permissions') {
        const perms = [...this.repository.store.getCollection('boardPermissions').values()].filter(
          (p) => (p as BoardPermissionLike).boardId === row.id,
        );
        joined[join.alias] = (perms[0] as Record<string, unknown>) ?? {};
      }
    }
    return joined;
  }

  private hasRequiredJoins(row: T, joined: Record<string, Record<string, unknown>>): boolean {
    for (const join of this.joins) {
      if (join.type === 'inner' && !joined[join.alias]) return false;
    }
    return true;
  }

  private evaluateRow(row: T, joined: Record<string, Record<string, unknown>>): boolean {
    if (this.wheres.length === 0) return true;
    return this.wheres.every((w) => this.evalSql(w.sql, w.params, row, joined));
  }

  private evalSql(
    sql: string,
    params: Record<string, unknown>,
    row: T,
    joined: Record<string, Record<string, unknown>>,
  ): boolean {
    const orParts = sql.split(/\s+OR\s+/i);
    if (orParts.length > 1) {
      return orParts.some((part) => this.evalSql(part.trim().replace(/^\(|\)$/g, ''), params, row, joined));
    }

    const andParts = sql.split(/\s+AND\s+/i);
    return andParts.every((part) => this.evalCondition(part.trim().replace(/^\(|\)$/g, ''), params, row, joined));
  }

  private evalCondition(
    condition: string,
    params: Record<string, unknown>,
    row: T,
    joined: Record<string, Record<string, unknown>>,
  ): boolean {
    const anyMatch = condition.match(/:(\w+)\s*=\s*ANY\(([^)]+)\)/i);
    if (anyMatch) {
      const paramKey = anyMatch[1];
      const fieldPath = anyMatch[2].trim();
      const value = params[paramKey];
      const entity = this.entityForPath(fieldPath, row, joined);
      const arr = getFieldValue(entity, fieldPath.split('.').pop()!) as unknown[];
      return Array.isArray(arr) && arr.includes(value);
    }

    const inSpread = condition.match(/(\w+\.\w+)\s+IN\s+\(:\.\.\.(\w+)\)/i);
    if (inSpread) {
      const [, fieldPath, paramKey] = inSpread;
      const entity = this.entityForPath(fieldPath, row, joined);
      const values = params[paramKey] as unknown[];
      return values?.includes(getFieldValue(entity, fieldPath));
    }

    const ilikeMatch = condition.match(/\(([^)]+)\)/);
    if (ilikeMatch && condition.toUpperCase().includes('ILIKE')) {
      const clauses = ilikeMatch[1].split(/\s+OR\s+/i);
      return clauses.some((clause) => {
        const m = clause.trim().match(/(\w+\.\w+)\s+ILIKE\s+:(\w+)/i);
        if (!m) return false;
        const entity = this.entityForPath(m[1], row, joined);
        const raw = String(params[m[2]] ?? '').replace(/%/g, '');
        const val = String(getFieldValue(entity, m[1]) ?? '');
        return val.toLowerCase().includes(raw.toLowerCase());
      });
    }

    const simple =
      condition.match(/(\w+\.\w+)\s*(=|!=|>=|<=|>|<)\s*:(\w+)/i) ||
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
          return (actual as number) > (expected as number);
        case '<':
          return (actual as number) < (expected as number);
        case '>=':
          return (actual as number) >= (expected as number);
        case '<=':
          return (actual as number) <= (expected as number);
        default:
          return false;
      }
    }

    const singleField = condition.match(/^([\w.]+)\s*(=|!=|>=|<=|>|<)\s*:(\w+)$/i);
    if (singleField) {
      const [, fieldPath, op, paramKey] = singleField;
      const entity = fieldPath.includes('.')
        ? this.entityForPath(fieldPath, row, joined)
        : (row as Record<string, unknown>);
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

  private entityForPath(
    fieldPath: string,
    row: T,
    joined: Record<string, Record<string, unknown>>,
  ): Record<string, unknown> {
    const [alias] = fieldPath.split('.');
    if (alias === this.alias) return row as Record<string, unknown>;
    return joined[alias] ?? (row as Record<string, unknown>);
  }

  private evalSelectExpr(expr: string, row: Record<string, unknown>): unknown {
    const m = expr.match(/(\w+)\.(\w+)/);
    if (m) return getFieldValue(row, m[2]);
    return null;
  }
}

interface BoardPermissionLike {
  boardId: string;
  subjectId: string;
}

export class M04EntityRepository<T extends { id: string }> {
  readonly entityName: string;

  constructor(
    private readonly entityClass: new () => T,
    readonly store: M04MemoryStore,
    private readonly collectionKey: M04CollectionKey,
  ) {
    this.entityName = entityClass.name;
  }

  create(partial: Partial<T>[]): T[];
  create(partial: Partial<T>): T;
  create(partial: Partial<T> | Partial<T>[]): T | T[] {
    if (Array.isArray(partial)) {
      return partial.map((p) => this.createOne(p));
    }
    return this.createOne(partial);
  }

  private createOne(partial: Partial<T>): T {
    const entity = Object.assign(new this.entityClass(), partial);
    if (!entity.id) {
      (entity as T & { id: string }).id = randomUUID();
    }
    const now = new Date();
    if ('createdAt' in entity && !(entity as Record<string, unknown>).createdAt) {
      (entity as Record<string, unknown>).createdAt = now;
    }
    if ('updatedAt' in entity && !(entity as Record<string, unknown>).updatedAt) {
      (entity as Record<string, unknown>).updatedAt = now;
    }
    return entity;
  }

  async save(entity: T[]): Promise<T[]>;
  async save(entity: T): Promise<T>;
  async save(entity: T | T[]): Promise<T | T[]> {
    if (Array.isArray(entity)) {
      return Promise.all(entity.map((e) => this.saveOne(e)));
    }
    return this.saveOne(entity);
  }

  private async saveOne(entity: T): Promise<T> {
    const collection = this.store.getCollection(this.collectionKey);
    const now = new Date();
    if ('updatedAt' in entity) {
      (entity as Record<string, unknown>).updatedAt = now;
    }
    collection.set(entity.id, { ...entity });
    return entity;
  }

  async find(options?: FindManyOptions<T>): Promise<T[]> {
    const [rows] = await this.findAndCount(options);
    return rows;
  }

  async findOne(options: FindOneOptions<T>): Promise<T | null> {
    let rows = this.getAllRows().filter((row) => matchesWhereClause(row as Record<string, unknown>, options.where));
    if (rows.length === 0) return null;
    if (options.order) {
      rows = applyOrder(rows, options.order as any);
    }
    const entity = { ...rows[0] } as T;
    if (options.relations?.length) {
      this.attachRelations(entity, options.relations);
    }
    return entity;
  }

  async findAndCount(options?: FindManyOptions<T>): Promise<[T[], number]> {
    let rows = this.getAllRows();
    rows = rows.filter((row) => matchesWhereClause(row as Record<string, unknown>, options?.where));
    rows = applyOrder(
      rows,
      options?.order as Record<string, 'ASC' | 'DESC'>,
    );
    const total = rows.length;
    const skip = options?.skip ?? 0;
    const take = options?.take;
    const sliced = rows.slice(skip, take !== undefined ? skip + take : undefined);
    const result = sliced.map((row) => {
      const entity = { ...row } as T;
      if (options?.relations?.length) {
        this.attachRelations(entity, options.relations);
      }
      return entity;
    });
    return [result, total];
  }

  async update(idOrCriteria: string | FindWhere<T>, partial: Partial<T>): Promise<void> {
    if (typeof idOrCriteria === 'string') {
      const existing = this.store.getCollection(this.collectionKey).get(idOrCriteria);
      if (existing) {
        await this.save({ ...(existing as T), ...partial, id: idOrCriteria });
      }
      return;
    }
    const rows = this.getAllRows().filter((row) =>
      matchesWhereClause(row as Record<string, unknown>, idOrCriteria),
    );
    for (const row of rows) {
      await this.save({ ...row, ...partial });
    }
  }

  async delete(criteria: string | FindWhere<T>): Promise<void> {
    if (typeof criteria === 'string') {
      this.deleteFromStore(criteria);
      return;
    }
    const rows = this.getAllRows().filter((row) =>
      matchesWhereClause(row as Record<string, unknown>, criteria),
    );
    for (const row of rows) {
      this.deleteFromStore(row.id);
    }
  }

  async remove(entity: T | T[]): Promise<T | T[]> {
    if (Array.isArray(entity)) {
      for (const e of entity) this.deleteFromStore(e.id);
      return entity;
    }
    this.deleteFromStore(entity.id);
    return entity;
  }

  createQueryBuilder(alias?: string): M04QueryBuilder<T> {
    const al = alias ?? this.entityName.charAt(0).toLowerCase() + this.entityName.slice(1);
    return new M04QueryBuilder(this, al);
  }

  getAllRows(): T[] {
    return [...this.store.getCollection(this.collectionKey).values()] as T[];
  }

  deleteFromStore(id: string): void {
    this.store.getCollection(this.collectionKey).delete(id);
  }

  attachRelations(entity: T, relations: string[]): void {
    const config = ENTITY_RELATIONS[this.entityName];
    if (!config) return;
    for (const rel of relations) {
      const relConfig = config[rel];
      if (!relConfig) continue;
      const related = [...this.store.getCollection(relConfig.collection).values()].filter(
        (item) => (item as Record<string, unknown>)[relConfig.foreignKey] === entity.id,
      );
      (entity as Record<string, unknown>)[rel] = related;
    }
  }
}
