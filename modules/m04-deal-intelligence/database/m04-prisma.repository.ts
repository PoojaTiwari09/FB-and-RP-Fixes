import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

export const M04_DEV_TENANT = 'dev-tenant-m04-001';
export const M04_DEV_USER = '00000000-0000-0000-0000-000000000004';
export const M04_DEV_BOARD_1 = '00000000-0000-0000-0000-000000000101';
export const M04_DEV_BOARD_2 = '00000000-0000-0000-0000-000000000102';

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

const ENTITY_TO_PRISMA_MODEL: Record<string, string> = {
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

export class M04PrismaQueryBuilder<T extends { id: string }> {
  private wheres: WhereClause[] = [];
  private joins: JoinClause[] = [];
  private orderClauses: Array<{ field: string; direction: string }> = [];
  private skipCount = 0;
  private takeCount?: number;
  private selectExprs: Array<{ expr: string; alias?: string }> = [];
  private groupByFields: string[] = [];
  private deleteMode = false;

  constructor(
    private readonly repository: M04PrismaRepository<T>,
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
    const rows = await this.repository.getAllRows();
    const toDelete = rows.filter((row) => this.evaluateRow(row as T, {}));
    for (const row of toDelete) {
      await this.repository.deleteFromStore(row.id);
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

    const all = await this.buildResultRows();
    const total = all.length;
    const sliced = all.slice(this.skipCount, this.takeCount !== undefined ? this.skipCount + this.takeCount : undefined);
    return [sliced, total];
  }

  async getCount(): Promise<number> {
    const [, count] = await this.getManyAndCount();
    return count;
  }

  async getRawMany(): Promise<Record<string, unknown>[]> {
    const rows = await this.repository.getAllRows() as T[];
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
      const rows = await this.repository.getAllRows() as T[];
      const filtered = rows.filter((row) => this.evaluateRow(row, {}));
      const field = expr.match(/SUM\([^)]*\.([^)]+)\)/i)?.[1] ?? 'amount';
      const sum = filtered.reduce((acc, row) => acc + Number(getFieldValue(row as Record<string, unknown>, field) ?? 0), 0);
      const alias = this.selectExprs[0]?.alias ?? 'total';
      return { [alias]: String(sum) };
    }
    const many = await this.getRawMany();
    return many[0];
  }

  private async buildResultRows(): Promise<T[]> {
    const rows = await this.repository.getAllRows() as T[];
    const result: T[] = [];

    for (const row of rows) {
      const joined = await this.resolveJoins(row);
      if (!this.hasRequiredJoins(row, joined)) continue;
      if (!this.evaluateRow(row, joined)) continue;

      const copy = { ...row } as T;
      for (const join of this.joins) {
        if (join.type === 'left') {
          const relName = join.relation.split('.')[1];
          (copy as Record<string, unknown>)[relName] = joined[join.alias];
        }
      }
      await this.repository.attachRelations(copy, this.joins.map((j) => j.relation.split('.')[1]));
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

  private async resolveJoins(row: T): Promise<Record<string, Record<string, unknown>>> {
    const joined: Record<string, Record<string, unknown>> = {};
    for (const join of this.joins) {
      const [, rel] = join.relation.split('.');
      const fk = JOIN_PARENT_FK[join.relation] ?? `${rel}Id`;
      const parentId = getFieldValue(row as Record<string, unknown>, fk);
      
      if (rel === 'deal') {
        const related = await this.repository.prisma.deal.findUnique({ where: { id: String(parentId) } });
        if (related) joined[join.alias] = related as any;
      } else if (rel === 'permissions') {
        const perms = await this.repository.prisma.m04BoardPermission.findMany({
          where: { boardId: row.id },
        });
        if (perms.length > 0) {
          joined[join.alias] = perms[0] as any;
        }
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

export class M04PrismaRepository<T extends { id: string }> {
  readonly entityName: string;
  readonly prismaModelName: string;

  constructor(
    private readonly entityClass: new () => T,
    readonly prisma: PrismaService,
    private readonly collectionKey: string,
  ) {
    this.entityName = entityClass.name;
    this.prismaModelName = ENTITY_TO_PRISMA_MODEL[this.entityName] || this.entityName.charAt(0).toLowerCase() + this.entityName.slice(1);
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
      entity.id = randomUUID();
    }
    const now = new Date();
    if ('createdAt' in entity && !(entity as any).createdAt) {
      (entity as any).createdAt = now;
    }
    if ('updatedAt' in entity && !(entity as any).updatedAt) {
      (entity as any).updatedAt = now;
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
    const client = this.prisma[this.prismaModelName] as any;
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
    } else {
      result = await client.create({
        data: dbData,
      });
    }

    const mapped = this.mapToEntity(result);
    
    // Auto attach relations if they were specified in the original entity
    const relationsToAttach: string[] = [];
    if ((entity as any).warnings) relationsToAttach.push('warnings');
    if ((entity as any).playbooks) relationsToAttach.push('playbooks');
    if ((entity as any).activities) relationsToAttach.push('activities');
    if ((entity as any).comments) relationsToAttach.push('comments');
    if ((entity as any).tasks) relationsToAttach.push('tasks');
    if ((entity as any).filters) relationsToAttach.push('filters');
    if ((entity as any).tabs) relationsToAttach.push('tabs');
    if ((entity as any).columns) relationsToAttach.push('columns');
    if ((entity as any).permissions) relationsToAttach.push('permissions');
    if ((entity as any).deal) relationsToAttach.push('deal');

    await this.attachRelations(mapped, relationsToAttach);
    return mapped;
  }

  async find(options?: FindManyOptions<T>): Promise<T[]> {
    const [rows] = await this.findAndCount(options);
    return rows;
  }

  async findOne(options: FindOneOptions<T>): Promise<T | null> {
    const rows = await this.getAllRows();
    let filtered = rows.filter((row) => matchesWhereClause(row as Record<string, unknown>, options.where));
    if (filtered.length === 0) return null;
    if (options.order) {
      filtered = applyOrder(filtered, options.order as any);
    }
    const entity = filtered[0];
    if (options.relations?.length) {
      await this.attachRelations(entity, options.relations);
    }
    return entity;
  }

  async findAndCount(options?: FindManyOptions<T>): Promise<[T[], number]> {
    let rows = await this.getAllRows();
    rows = rows.filter((row) => matchesWhereClause(row as Record<string, unknown>, options?.where));
    rows = applyOrder(
      rows,
      options?.order as Record<string, 'ASC' | 'DESC'>,
    );
    const total = rows.length;
    const skip = options?.skip ?? 0;
    const take = options?.take;
    const sliced = rows.slice(skip, take !== undefined ? skip + take : undefined);
    
    const result = await Promise.all(
      sliced.map(async (row) => {
        if (options?.relations?.length) {
          await this.attachRelations(row, options.relations);
        }
        return row;
      })
    );
    return [result, total];
  }

  async update(idOrCriteria: string | FindWhere<T>, partial: Partial<T>): Promise<void> {
    const client = this.prisma[this.prismaModelName] as any;
    const dbData = this.mapToPrisma(partial as any);
    delete dbData.id; // cannot update ID

    if (typeof idOrCriteria === 'string') {
      await client.update({
        where: { id: idOrCriteria },
        data: dbData,
      });
      return;
    }

    const rows = await this.getAllRows();
    const filtered = rows.filter((row) =>
      matchesWhereClause(row as Record<string, unknown>, idOrCriteria),
    );
    for (const row of filtered) {
      await client.update({
        where: { id: row.id },
        data: dbData,
      });
    }
  }

  async delete(criteria: string | FindWhere<T>): Promise<void> {
    const client = this.prisma[this.prismaModelName] as any;

    if (typeof criteria === 'string') {
      await client.delete({ where: { id: criteria } });
      return;
    }

    const rows = await this.getAllRows();
    const filtered = rows.filter((row) =>
      matchesWhereClause(row as Record<string, unknown>, criteria),
    );
    for (const row of filtered) {
      await client.delete({ where: { id: row.id } });
    }
  }

  async remove(entity: T | T[]): Promise<T | T[]> {
    if (Array.isArray(entity)) {
      for (const e of entity) await this.delete(e.id);
      return entity;
    }
    await this.delete(entity.id);
    return entity;
  }

  createQueryBuilder(alias?: string): M04PrismaQueryBuilder<T> {
    const al = alias ?? this.entityName.charAt(0).toLowerCase() + this.entityName.slice(1);
    return new M04PrismaQueryBuilder(this, al);
  }

  async getAllRows(): Promise<T[]> {
    const client = this.prisma[this.prismaModelName] as any;
    const rows = await client.findMany();
    return rows.map((r: any) => this.mapToEntity(r));
  }

  async deleteFromStore(id: string): Promise<void> {
    await this.delete(id);
  }

  async attachRelations(entity: T, relations: string[]): Promise<void> {
    if (!relations || relations.length === 0) return;
    
    for (const rel of relations) {
      if (this.entityName === 'DealBoard') {
        if (rel === 'filters') {
          const filters = await this.prisma.m04BoardFilter.findMany({ where: { boardId: entity.id } });
          (entity as any).filters = filters.map(f => {
            const fe = new (require('../entities').BoardFilter)();
            Object.assign(fe, f);
            fe.fieldName = f.field;
            fe.tenantId = f.tenantid;
            return fe;
          });
        }
        if (rel === 'tabs') {
          const tabs = await this.prisma.m04BoardTab.findMany({ where: { boardId: entity.id } });
          (entity as any).tabs = tabs.map(t => {
            const te = new (require('../entities').BoardTab)();
            Object.assign(te, t);
            te.tenantId = t.tenantid;
            return te;
          });
        }
        if (rel === 'columns') {
          const columns = await this.prisma.m04BoardColumn.findMany({ where: { boardId: entity.id } });
          (entity as any).columns = columns.map(c => {
            const ce = new (require('../entities').BoardColumn)();
            Object.assign(ce, c);
            ce.fieldKey = c.field;
            ce.tenantId = c.tenantid;
            return ce;
          });
        }
        if (rel === 'permissions') {
          const permissions = await this.prisma.m04BoardPermission.findMany({ where: { boardId: entity.id } });
          (entity as any).permissions = permissions.map(p => {
            const pe = new (require('../entities').BoardPermission)();
            Object.assign(pe, p);
            pe.subjectId = p.userId;
            pe.tenantId = p.tenantid;
            return pe;
          });
        }
      } else if (this.entityName === 'Deal') {
        if (rel === 'warnings') {
          const warnings = await this.prisma.dealWarning.findMany({ where: { dealId: entity.id, status: 'active' } });
          (entity as any).warnings = warnings.map(w => this.mapWarningToEntity(w));
        }
        if (rel === 'playbooks') {
          const playbooks = await this.prisma.dealPlaybook.findMany({ where: { dealId: entity.id } });
          (entity as any).playbooks = playbooks.map(p => this.mapPlaybookToEntity(p));
        }
        if (rel === 'activities') {
          const activities = await this.prisma.dealActivityEvent.findMany({ where: { dealId: entity.id } });
          (entity as any).activities = activities.map(a => this.mapActivityToEntity(a));
        }
        if (rel === 'comments') {
          const comments = await this.prisma.dealComment.findMany({ where: { dealId: entity.id } });
          (entity as any).comments = comments.map(c => this.mapCommentToEntity(c));
        }
        if (rel === 'tasks') {
          const tasks = await this.prisma.dealTask.findMany({ where: { dealId: entity.id } });
          (entity as any).tasks = tasks.map(t => this.mapTaskToEntity(t));
        }
      } else if (['DealWarning', 'DealActivity', 'DealTask', 'DealPlaybook'].includes(this.entityName)) {
        if (rel === 'deal' && (entity as any).dealId) {
          const deal = await this.prisma.deal.findUnique({ where: { id: (entity as any).dealId } });
          if (deal) {
            (entity as any).deal = {
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

  private mapWarningToEntity(dbRow: any): any {
    const e = new (require('../entities').DealWarning)();
    Object.assign(e, dbRow);
    e.tenantId = dbRow.tenantid;
    e.message = dbRow.description;
    e.recommendedAction = dbRow.suggestedAction;
    e.isActive = dbRow.status === 'active';
    return e;
  }

  private mapPlaybookToEntity(dbRow: any): any {
    const e = new (require('../entities').DealPlaybook)();
    Object.assign(e, dbRow);
    e.tenantId = dbRow.tenantid;
    e.criterion = dbRow.criterionName;
    e.aiSuggestion = dbRow.aiSuggestedNote;
    return e;
  }

  private mapActivityToEntity(dbRow: any): any {
    const e = new (require('../entities').DealActivity)();
    Object.assign(e, dbRow);
    e.tenantId = dbRow.tenantid;
    e.activityDate = dbRow.date ? new Date(dbRow.date) : dbRow.createdAt;
    e.durationMinutes = dbRow.duration || 0;
    return e;
  }

  private mapCommentToEntity(dbRow: any): any {
    const e = new (require('../entities').DealComment)();
    Object.assign(e, dbRow);
    e.tenantId = dbRow.tenantid;
    e.content = dbRow.comment;
    return e;
  }

  private mapTaskToEntity(dbRow: any): any {
    const e = new (require('../entities').DealTask)();
    Object.assign(e, dbRow);
    e.tenantId = dbRow.tenantid;
    return e;
  }

  mapToEntity(dbRow: any): T {
    if (!dbRow) return dbRow;
    const entity = new this.entityClass() as any;
    
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

  mapToPrisma(entity: any): any {
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
    } else {
      dbData.tenantid = '00000000-0000-0000-0000-000000000000'; // Default fallback tenant
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

export { M04PrismaRepository as M04EntityRepository };
export { M04PrismaQueryBuilder as M04QueryBuilder };
