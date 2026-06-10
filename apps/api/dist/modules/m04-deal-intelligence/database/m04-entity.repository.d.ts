import { M04CollectionKey, M04MemoryStore } from './m04-memory.store';
export declare function Between<T>(from: T, to: T): {
    _type: 'between';
    from: T;
    to: T;
};
export declare function In<T>(values: T[]): {
    _type: 'in';
    values: T[];
};
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
export declare class M04QueryBuilder<T extends {
    id: string;
}> {
    private readonly repository;
    private readonly alias;
    private wheres;
    private joins;
    private orderClauses;
    private skipCount;
    private takeCount?;
    private selectExprs;
    private groupByFields;
    private deleteMode;
    constructor(repository: M04EntityRepository<T>, alias: string);
    where(sql: string, params?: Record<string, unknown>): this;
    andWhere(sql: string, params?: Record<string, unknown>): this;
    leftJoinAndSelect(relation: string, alias: string): this;
    innerJoin(relation: string, alias: string): this;
    orderBy(field: string, direction?: 'ASC' | 'DESC' | 'asc' | 'desc'): this;
    addOrderBy(field: string, direction?: 'ASC' | 'DESC' | 'asc' | 'desc'): this;
    skip(n: number): this;
    take(n: number): this;
    limit(n: number): this;
    select(expr: string, alias?: string): this;
    addSelect(expr: string, alias?: string): this;
    groupBy(field: string): this;
    delete(): this;
    execute(): Promise<{
        affected?: number;
    }>;
    getMany(): Promise<T[]>;
    getManyAndCount(): Promise<[T[], number]>;
    getCount(): Promise<number>;
    getRawMany(): Promise<Record<string, unknown>[]>;
    getRawOne(): Promise<Record<string, unknown> | undefined>;
    private buildResultRows;
    private dedupeById;
    private resolveJoins;
    private hasRequiredJoins;
    private evaluateRow;
    private evalSql;
    private evalCondition;
    private entityForPath;
    private evalSelectExpr;
}
export declare class M04EntityRepository<T extends {
    id: string;
}> {
    private readonly entityClass;
    readonly store: M04MemoryStore;
    private readonly collectionKey;
    readonly entityName: string;
    constructor(entityClass: new () => T, store: M04MemoryStore, collectionKey: M04CollectionKey);
    create(partial: Partial<T>[]): T[];
    create(partial: Partial<T>): T;
    private createOne;
    save(entity: T[]): Promise<T[]>;
    save(entity: T): Promise<T>;
    private saveOne;
    find(options?: FindManyOptions<T>): Promise<T[]>;
    findOne(options: FindOneOptions<T>): Promise<T | null>;
    findAndCount(options?: FindManyOptions<T>): Promise<[T[], number]>;
    update(idOrCriteria: string | FindWhere<T>, partial: Partial<T>): Promise<void>;
    delete(criteria: string | FindWhere<T>): Promise<void>;
    remove(entity: T | T[]): Promise<T | T[]>;
    createQueryBuilder(alias?: string): M04QueryBuilder<T>;
    getAllRows(): T[];
    deleteFromStore(id: string): void;
    attachRelations(entity: T, relations: string[]): void;
}
export {};
