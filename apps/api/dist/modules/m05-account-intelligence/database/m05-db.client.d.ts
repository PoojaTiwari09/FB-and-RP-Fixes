declare class M05QueryBuilder {
    private readonly table;
    private filters;
    private orderBy;
    private limitN;
    private rangeFrom;
    private rangeTo;
    private wantSingle;
    private wantMaybeSingle;
    private countExact;
    private mutation;
    private mutationPayload;
    private upsertOnConflict;
    constructor(table: string);
    select(columns: string, opts?: {
        count?: string;
    }): this;
    private selectSpec;
    eq(col: string, val: unknown): this;
    in(col: string, vals: unknown[]): this;
    gte(col: string, val: unknown): this;
    lte(col: string, val: unknown): this;
    order(col: string, opts?: {
        ascending?: boolean;
    }): this;
    limit(n: number): this;
    range(from: number, to: number): this;
    single(): this;
    maybeSingle(): this;
    insert(payload: Record<string, unknown> | Record<string, unknown>[]): this;
    update(payload: Record<string, unknown>): this;
    delete(): this;
    upsert(payload: Record<string, unknown>, opts?: {
        onConflict?: string;
    }): this;
    private applyFilters;
    private sortRows;
    private paginate;
    private execute;
    then<TResult1 = any, TResult2 = never>(onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null): Promise<TResult1 | TResult2>;
}
export type M05DbClient = {
    from: (table: string) => M05QueryBuilder;
};
export declare function createM05DbClient(): M05DbClient;
export declare function getSupabase(): M05DbClient;
export {};
