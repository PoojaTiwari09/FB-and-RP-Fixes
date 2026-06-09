
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model ForecastPeriod
 * 
 */
export type ForecastPeriod = $Result.DefaultSelection<Prisma.$ForecastPeriodPayload>
/**
 * Model AiForecastSnapshot
 * 
 */
export type AiForecastSnapshot = $Result.DefaultSelection<Prisma.$AiForecastSnapshotPayload>
/**
 * Model PipelineCoverageMetrics
 * 
 */
export type PipelineCoverageMetrics = $Result.DefaultSelection<Prisma.$PipelineCoverageMetricsPayload>
/**
 * Model HistoricalConversionRate
 * 
 */
export type HistoricalConversionRate = $Result.DefaultSelection<Prisma.$HistoricalConversionRatePayload>
/**
 * Model ForecastSubmission
 * 
 */
export type ForecastSubmission = $Result.DefaultSelection<Prisma.$ForecastSubmissionPayload>
/**
 * Model ForecastAuditLog
 * 
 */
export type ForecastAuditLog = $Result.DefaultSelection<Prisma.$ForecastAuditLogPayload>
/**
 * Model CrmDeal
 * 
 */
export type CrmDeal = $Result.DefaultSelection<Prisma.$CrmDealPayload>
/**
 * Model User
 * 
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model Quota
 * 
 */
export type Quota = $Result.DefaultSelection<Prisma.$QuotaPayload>

/**
 * ##  Prisma Client ʲˢ
 * 
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more ForecastPeriods
 * const forecastPeriods = await prisma.forecastPeriod.findMany()
 * ```
 *
 * 
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   * 
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more ForecastPeriods
   * const forecastPeriods = await prisma.forecastPeriod.findMany()
   * ```
   *
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): void;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb, ExtArgs>

      /**
   * `prisma.forecastPeriod`: Exposes CRUD operations for the **ForecastPeriod** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ForecastPeriods
    * const forecastPeriods = await prisma.forecastPeriod.findMany()
    * ```
    */
  get forecastPeriod(): Prisma.ForecastPeriodDelegate<ExtArgs>;

  /**
   * `prisma.aiForecastSnapshot`: Exposes CRUD operations for the **AiForecastSnapshot** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more AiForecastSnapshots
    * const aiForecastSnapshots = await prisma.aiForecastSnapshot.findMany()
    * ```
    */
  get aiForecastSnapshot(): Prisma.AiForecastSnapshotDelegate<ExtArgs>;

  /**
   * `prisma.pipelineCoverageMetrics`: Exposes CRUD operations for the **PipelineCoverageMetrics** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PipelineCoverageMetrics
    * const pipelineCoverageMetrics = await prisma.pipelineCoverageMetrics.findMany()
    * ```
    */
  get pipelineCoverageMetrics(): Prisma.PipelineCoverageMetricsDelegate<ExtArgs>;

  /**
   * `prisma.historicalConversionRate`: Exposes CRUD operations for the **HistoricalConversionRate** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more HistoricalConversionRates
    * const historicalConversionRates = await prisma.historicalConversionRate.findMany()
    * ```
    */
  get historicalConversionRate(): Prisma.HistoricalConversionRateDelegate<ExtArgs>;

  /**
   * `prisma.forecastSubmission`: Exposes CRUD operations for the **ForecastSubmission** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ForecastSubmissions
    * const forecastSubmissions = await prisma.forecastSubmission.findMany()
    * ```
    */
  get forecastSubmission(): Prisma.ForecastSubmissionDelegate<ExtArgs>;

  /**
   * `prisma.forecastAuditLog`: Exposes CRUD operations for the **ForecastAuditLog** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ForecastAuditLogs
    * const forecastAuditLogs = await prisma.forecastAuditLog.findMany()
    * ```
    */
  get forecastAuditLog(): Prisma.ForecastAuditLogDelegate<ExtArgs>;

  /**
   * `prisma.crmDeal`: Exposes CRUD operations for the **CrmDeal** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more CrmDeals
    * const crmDeals = await prisma.crmDeal.findMany()
    * ```
    */
  get crmDeal(): Prisma.CrmDealDelegate<ExtArgs>;

  /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs>;

  /**
   * `prisma.quota`: Exposes CRUD operations for the **Quota** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Quotas
    * const quotas = await prisma.quota.findMany()
    * ```
    */
  get quota(): Prisma.QuotaDelegate<ExtArgs>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError
  export import NotFoundError = runtime.NotFoundError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics 
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 5.22.0
   * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion 

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? K : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    ForecastPeriod: 'ForecastPeriod',
    AiForecastSnapshot: 'AiForecastSnapshot',
    PipelineCoverageMetrics: 'PipelineCoverageMetrics',
    HistoricalConversionRate: 'HistoricalConversionRate',
    ForecastSubmission: 'ForecastSubmission',
    ForecastAuditLog: 'ForecastAuditLog',
    CrmDeal: 'CrmDeal',
    User: 'User',
    Quota: 'Quota'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb extends $Utils.Fn<{extArgs: $Extensions.InternalArgs, clientOptions: PrismaClientOptions }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], this['params']['clientOptions']>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> = {
    meta: {
      modelProps: "forecastPeriod" | "aiForecastSnapshot" | "pipelineCoverageMetrics" | "historicalConversionRate" | "forecastSubmission" | "forecastAuditLog" | "crmDeal" | "user" | "quota"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      ForecastPeriod: {
        payload: Prisma.$ForecastPeriodPayload<ExtArgs>
        fields: Prisma.ForecastPeriodFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ForecastPeriodFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ForecastPeriodPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ForecastPeriodFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ForecastPeriodPayload>
          }
          findFirst: {
            args: Prisma.ForecastPeriodFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ForecastPeriodPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ForecastPeriodFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ForecastPeriodPayload>
          }
          findMany: {
            args: Prisma.ForecastPeriodFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ForecastPeriodPayload>[]
          }
          create: {
            args: Prisma.ForecastPeriodCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ForecastPeriodPayload>
          }
          createMany: {
            args: Prisma.ForecastPeriodCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ForecastPeriodCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ForecastPeriodPayload>[]
          }
          delete: {
            args: Prisma.ForecastPeriodDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ForecastPeriodPayload>
          }
          update: {
            args: Prisma.ForecastPeriodUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ForecastPeriodPayload>
          }
          deleteMany: {
            args: Prisma.ForecastPeriodDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ForecastPeriodUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.ForecastPeriodUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ForecastPeriodPayload>
          }
          aggregate: {
            args: Prisma.ForecastPeriodAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateForecastPeriod>
          }
          groupBy: {
            args: Prisma.ForecastPeriodGroupByArgs<ExtArgs>
            result: $Utils.Optional<ForecastPeriodGroupByOutputType>[]
          }
          count: {
            args: Prisma.ForecastPeriodCountArgs<ExtArgs>
            result: $Utils.Optional<ForecastPeriodCountAggregateOutputType> | number
          }
        }
      }
      AiForecastSnapshot: {
        payload: Prisma.$AiForecastSnapshotPayload<ExtArgs>
        fields: Prisma.AiForecastSnapshotFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AiForecastSnapshotFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AiForecastSnapshotPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AiForecastSnapshotFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AiForecastSnapshotPayload>
          }
          findFirst: {
            args: Prisma.AiForecastSnapshotFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AiForecastSnapshotPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AiForecastSnapshotFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AiForecastSnapshotPayload>
          }
          findMany: {
            args: Prisma.AiForecastSnapshotFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AiForecastSnapshotPayload>[]
          }
          create: {
            args: Prisma.AiForecastSnapshotCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AiForecastSnapshotPayload>
          }
          createMany: {
            args: Prisma.AiForecastSnapshotCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.AiForecastSnapshotCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AiForecastSnapshotPayload>[]
          }
          delete: {
            args: Prisma.AiForecastSnapshotDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AiForecastSnapshotPayload>
          }
          update: {
            args: Prisma.AiForecastSnapshotUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AiForecastSnapshotPayload>
          }
          deleteMany: {
            args: Prisma.AiForecastSnapshotDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AiForecastSnapshotUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.AiForecastSnapshotUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AiForecastSnapshotPayload>
          }
          aggregate: {
            args: Prisma.AiForecastSnapshotAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAiForecastSnapshot>
          }
          groupBy: {
            args: Prisma.AiForecastSnapshotGroupByArgs<ExtArgs>
            result: $Utils.Optional<AiForecastSnapshotGroupByOutputType>[]
          }
          count: {
            args: Prisma.AiForecastSnapshotCountArgs<ExtArgs>
            result: $Utils.Optional<AiForecastSnapshotCountAggregateOutputType> | number
          }
        }
      }
      PipelineCoverageMetrics: {
        payload: Prisma.$PipelineCoverageMetricsPayload<ExtArgs>
        fields: Prisma.PipelineCoverageMetricsFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PipelineCoverageMetricsFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PipelineCoverageMetricsPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PipelineCoverageMetricsFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PipelineCoverageMetricsPayload>
          }
          findFirst: {
            args: Prisma.PipelineCoverageMetricsFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PipelineCoverageMetricsPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PipelineCoverageMetricsFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PipelineCoverageMetricsPayload>
          }
          findMany: {
            args: Prisma.PipelineCoverageMetricsFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PipelineCoverageMetricsPayload>[]
          }
          create: {
            args: Prisma.PipelineCoverageMetricsCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PipelineCoverageMetricsPayload>
          }
          createMany: {
            args: Prisma.PipelineCoverageMetricsCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PipelineCoverageMetricsCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PipelineCoverageMetricsPayload>[]
          }
          delete: {
            args: Prisma.PipelineCoverageMetricsDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PipelineCoverageMetricsPayload>
          }
          update: {
            args: Prisma.PipelineCoverageMetricsUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PipelineCoverageMetricsPayload>
          }
          deleteMany: {
            args: Prisma.PipelineCoverageMetricsDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PipelineCoverageMetricsUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.PipelineCoverageMetricsUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PipelineCoverageMetricsPayload>
          }
          aggregate: {
            args: Prisma.PipelineCoverageMetricsAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePipelineCoverageMetrics>
          }
          groupBy: {
            args: Prisma.PipelineCoverageMetricsGroupByArgs<ExtArgs>
            result: $Utils.Optional<PipelineCoverageMetricsGroupByOutputType>[]
          }
          count: {
            args: Prisma.PipelineCoverageMetricsCountArgs<ExtArgs>
            result: $Utils.Optional<PipelineCoverageMetricsCountAggregateOutputType> | number
          }
        }
      }
      HistoricalConversionRate: {
        payload: Prisma.$HistoricalConversionRatePayload<ExtArgs>
        fields: Prisma.HistoricalConversionRateFieldRefs
        operations: {
          findUnique: {
            args: Prisma.HistoricalConversionRateFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HistoricalConversionRatePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.HistoricalConversionRateFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HistoricalConversionRatePayload>
          }
          findFirst: {
            args: Prisma.HistoricalConversionRateFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HistoricalConversionRatePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.HistoricalConversionRateFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HistoricalConversionRatePayload>
          }
          findMany: {
            args: Prisma.HistoricalConversionRateFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HistoricalConversionRatePayload>[]
          }
          create: {
            args: Prisma.HistoricalConversionRateCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HistoricalConversionRatePayload>
          }
          createMany: {
            args: Prisma.HistoricalConversionRateCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.HistoricalConversionRateCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HistoricalConversionRatePayload>[]
          }
          delete: {
            args: Prisma.HistoricalConversionRateDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HistoricalConversionRatePayload>
          }
          update: {
            args: Prisma.HistoricalConversionRateUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HistoricalConversionRatePayload>
          }
          deleteMany: {
            args: Prisma.HistoricalConversionRateDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.HistoricalConversionRateUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.HistoricalConversionRateUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HistoricalConversionRatePayload>
          }
          aggregate: {
            args: Prisma.HistoricalConversionRateAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateHistoricalConversionRate>
          }
          groupBy: {
            args: Prisma.HistoricalConversionRateGroupByArgs<ExtArgs>
            result: $Utils.Optional<HistoricalConversionRateGroupByOutputType>[]
          }
          count: {
            args: Prisma.HistoricalConversionRateCountArgs<ExtArgs>
            result: $Utils.Optional<HistoricalConversionRateCountAggregateOutputType> | number
          }
        }
      }
      ForecastSubmission: {
        payload: Prisma.$ForecastSubmissionPayload<ExtArgs>
        fields: Prisma.ForecastSubmissionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ForecastSubmissionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ForecastSubmissionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ForecastSubmissionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ForecastSubmissionPayload>
          }
          findFirst: {
            args: Prisma.ForecastSubmissionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ForecastSubmissionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ForecastSubmissionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ForecastSubmissionPayload>
          }
          findMany: {
            args: Prisma.ForecastSubmissionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ForecastSubmissionPayload>[]
          }
          create: {
            args: Prisma.ForecastSubmissionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ForecastSubmissionPayload>
          }
          createMany: {
            args: Prisma.ForecastSubmissionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ForecastSubmissionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ForecastSubmissionPayload>[]
          }
          delete: {
            args: Prisma.ForecastSubmissionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ForecastSubmissionPayload>
          }
          update: {
            args: Prisma.ForecastSubmissionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ForecastSubmissionPayload>
          }
          deleteMany: {
            args: Prisma.ForecastSubmissionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ForecastSubmissionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.ForecastSubmissionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ForecastSubmissionPayload>
          }
          aggregate: {
            args: Prisma.ForecastSubmissionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateForecastSubmission>
          }
          groupBy: {
            args: Prisma.ForecastSubmissionGroupByArgs<ExtArgs>
            result: $Utils.Optional<ForecastSubmissionGroupByOutputType>[]
          }
          count: {
            args: Prisma.ForecastSubmissionCountArgs<ExtArgs>
            result: $Utils.Optional<ForecastSubmissionCountAggregateOutputType> | number
          }
        }
      }
      ForecastAuditLog: {
        payload: Prisma.$ForecastAuditLogPayload<ExtArgs>
        fields: Prisma.ForecastAuditLogFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ForecastAuditLogFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ForecastAuditLogPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ForecastAuditLogFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ForecastAuditLogPayload>
          }
          findFirst: {
            args: Prisma.ForecastAuditLogFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ForecastAuditLogPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ForecastAuditLogFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ForecastAuditLogPayload>
          }
          findMany: {
            args: Prisma.ForecastAuditLogFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ForecastAuditLogPayload>[]
          }
          create: {
            args: Prisma.ForecastAuditLogCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ForecastAuditLogPayload>
          }
          createMany: {
            args: Prisma.ForecastAuditLogCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ForecastAuditLogCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ForecastAuditLogPayload>[]
          }
          delete: {
            args: Prisma.ForecastAuditLogDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ForecastAuditLogPayload>
          }
          update: {
            args: Prisma.ForecastAuditLogUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ForecastAuditLogPayload>
          }
          deleteMany: {
            args: Prisma.ForecastAuditLogDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ForecastAuditLogUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.ForecastAuditLogUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ForecastAuditLogPayload>
          }
          aggregate: {
            args: Prisma.ForecastAuditLogAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateForecastAuditLog>
          }
          groupBy: {
            args: Prisma.ForecastAuditLogGroupByArgs<ExtArgs>
            result: $Utils.Optional<ForecastAuditLogGroupByOutputType>[]
          }
          count: {
            args: Prisma.ForecastAuditLogCountArgs<ExtArgs>
            result: $Utils.Optional<ForecastAuditLogCountAggregateOutputType> | number
          }
        }
      }
      CrmDeal: {
        payload: Prisma.$CrmDealPayload<ExtArgs>
        fields: Prisma.CrmDealFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CrmDealFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrmDealPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CrmDealFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrmDealPayload>
          }
          findFirst: {
            args: Prisma.CrmDealFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrmDealPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CrmDealFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrmDealPayload>
          }
          findMany: {
            args: Prisma.CrmDealFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrmDealPayload>[]
          }
          create: {
            args: Prisma.CrmDealCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrmDealPayload>
          }
          createMany: {
            args: Prisma.CrmDealCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CrmDealCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrmDealPayload>[]
          }
          delete: {
            args: Prisma.CrmDealDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrmDealPayload>
          }
          update: {
            args: Prisma.CrmDealUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrmDealPayload>
          }
          deleteMany: {
            args: Prisma.CrmDealDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CrmDealUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.CrmDealUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrmDealPayload>
          }
          aggregate: {
            args: Prisma.CrmDealAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCrmDeal>
          }
          groupBy: {
            args: Prisma.CrmDealGroupByArgs<ExtArgs>
            result: $Utils.Optional<CrmDealGroupByOutputType>[]
          }
          count: {
            args: Prisma.CrmDealCountArgs<ExtArgs>
            result: $Utils.Optional<CrmDealCountAggregateOutputType> | number
          }
        }
      }
      User: {
        payload: Prisma.$UserPayload<ExtArgs>
        fields: Prisma.UserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      Quota: {
        payload: Prisma.$QuotaPayload<ExtArgs>
        fields: Prisma.QuotaFieldRefs
        operations: {
          findUnique: {
            args: Prisma.QuotaFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuotaPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.QuotaFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuotaPayload>
          }
          findFirst: {
            args: Prisma.QuotaFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuotaPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.QuotaFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuotaPayload>
          }
          findMany: {
            args: Prisma.QuotaFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuotaPayload>[]
          }
          create: {
            args: Prisma.QuotaCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuotaPayload>
          }
          createMany: {
            args: Prisma.QuotaCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.QuotaCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuotaPayload>[]
          }
          delete: {
            args: Prisma.QuotaDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuotaPayload>
          }
          update: {
            args: Prisma.QuotaUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuotaPayload>
          }
          deleteMany: {
            args: Prisma.QuotaDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.QuotaUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.QuotaUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuotaPayload>
          }
          aggregate: {
            args: Prisma.QuotaAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateQuota>
          }
          groupBy: {
            args: Prisma.QuotaGroupByArgs<ExtArgs>
            result: $Utils.Optional<QuotaGroupByOutputType>[]
          }
          count: {
            args: Prisma.QuotaCountArgs<ExtArgs>
            result: $Utils.Optional<QuotaCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
  }


  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type ForecastPeriodCountOutputType
   */

  export type ForecastPeriodCountOutputType = {
    snapshots: number
    submissions: number
  }

  export type ForecastPeriodCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    snapshots?: boolean | ForecastPeriodCountOutputTypeCountSnapshotsArgs
    submissions?: boolean | ForecastPeriodCountOutputTypeCountSubmissionsArgs
  }

  // Custom InputTypes
  /**
   * ForecastPeriodCountOutputType without action
   */
  export type ForecastPeriodCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ForecastPeriodCountOutputType
     */
    select?: ForecastPeriodCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ForecastPeriodCountOutputType without action
   */
  export type ForecastPeriodCountOutputTypeCountSnapshotsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AiForecastSnapshotWhereInput
  }

  /**
   * ForecastPeriodCountOutputType without action
   */
  export type ForecastPeriodCountOutputTypeCountSubmissionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ForecastSubmissionWhereInput
  }


  /**
   * Models
   */

  /**
   * Model ForecastPeriod
   */

  export type AggregateForecastPeriod = {
    _count: ForecastPeriodCountAggregateOutputType | null
    _avg: ForecastPeriodAvgAggregateOutputType | null
    _sum: ForecastPeriodSumAggregateOutputType | null
    _min: ForecastPeriodMinAggregateOutputType | null
    _max: ForecastPeriodMaxAggregateOutputType | null
  }

  export type ForecastPeriodAvgAggregateOutputType = {
    revenueTarget: number | null
  }

  export type ForecastPeriodSumAggregateOutputType = {
    revenueTarget: number | null
  }

  export type ForecastPeriodMinAggregateOutputType = {
    id: string | null
    tenantId: string | null
    name: string | null
    startDate: Date | null
    endDate: Date | null
    revenueTarget: number | null
    status: string | null
    isLocked: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ForecastPeriodMaxAggregateOutputType = {
    id: string | null
    tenantId: string | null
    name: string | null
    startDate: Date | null
    endDate: Date | null
    revenueTarget: number | null
    status: string | null
    isLocked: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ForecastPeriodCountAggregateOutputType = {
    id: number
    tenantId: number
    name: number
    startDate: number
    endDate: number
    revenueTarget: number
    status: number
    isLocked: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ForecastPeriodAvgAggregateInputType = {
    revenueTarget?: true
  }

  export type ForecastPeriodSumAggregateInputType = {
    revenueTarget?: true
  }

  export type ForecastPeriodMinAggregateInputType = {
    id?: true
    tenantId?: true
    name?: true
    startDate?: true
    endDate?: true
    revenueTarget?: true
    status?: true
    isLocked?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ForecastPeriodMaxAggregateInputType = {
    id?: true
    tenantId?: true
    name?: true
    startDate?: true
    endDate?: true
    revenueTarget?: true
    status?: true
    isLocked?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ForecastPeriodCountAggregateInputType = {
    id?: true
    tenantId?: true
    name?: true
    startDate?: true
    endDate?: true
    revenueTarget?: true
    status?: true
    isLocked?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ForecastPeriodAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ForecastPeriod to aggregate.
     */
    where?: ForecastPeriodWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ForecastPeriods to fetch.
     */
    orderBy?: ForecastPeriodOrderByWithRelationInput | ForecastPeriodOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ForecastPeriodWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ForecastPeriods from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ForecastPeriods.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ForecastPeriods
    **/
    _count?: true | ForecastPeriodCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ForecastPeriodAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ForecastPeriodSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ForecastPeriodMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ForecastPeriodMaxAggregateInputType
  }

  export type GetForecastPeriodAggregateType<T extends ForecastPeriodAggregateArgs> = {
        [P in keyof T & keyof AggregateForecastPeriod]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateForecastPeriod[P]>
      : GetScalarType<T[P], AggregateForecastPeriod[P]>
  }




  export type ForecastPeriodGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ForecastPeriodWhereInput
    orderBy?: ForecastPeriodOrderByWithAggregationInput | ForecastPeriodOrderByWithAggregationInput[]
    by: ForecastPeriodScalarFieldEnum[] | ForecastPeriodScalarFieldEnum
    having?: ForecastPeriodScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ForecastPeriodCountAggregateInputType | true
    _avg?: ForecastPeriodAvgAggregateInputType
    _sum?: ForecastPeriodSumAggregateInputType
    _min?: ForecastPeriodMinAggregateInputType
    _max?: ForecastPeriodMaxAggregateInputType
  }

  export type ForecastPeriodGroupByOutputType = {
    id: string
    tenantId: string
    name: string
    startDate: Date
    endDate: Date
    revenueTarget: number
    status: string
    isLocked: boolean
    createdAt: Date
    updatedAt: Date
    _count: ForecastPeriodCountAggregateOutputType | null
    _avg: ForecastPeriodAvgAggregateOutputType | null
    _sum: ForecastPeriodSumAggregateOutputType | null
    _min: ForecastPeriodMinAggregateOutputType | null
    _max: ForecastPeriodMaxAggregateOutputType | null
  }

  type GetForecastPeriodGroupByPayload<T extends ForecastPeriodGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ForecastPeriodGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ForecastPeriodGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ForecastPeriodGroupByOutputType[P]>
            : GetScalarType<T[P], ForecastPeriodGroupByOutputType[P]>
        }
      >
    >


  export type ForecastPeriodSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    name?: boolean
    startDate?: boolean
    endDate?: boolean
    revenueTarget?: boolean
    status?: boolean
    isLocked?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    snapshots?: boolean | ForecastPeriod$snapshotsArgs<ExtArgs>
    submissions?: boolean | ForecastPeriod$submissionsArgs<ExtArgs>
    _count?: boolean | ForecastPeriodCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["forecastPeriod"]>

  export type ForecastPeriodSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    name?: boolean
    startDate?: boolean
    endDate?: boolean
    revenueTarget?: boolean
    status?: boolean
    isLocked?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["forecastPeriod"]>

  export type ForecastPeriodSelectScalar = {
    id?: boolean
    tenantId?: boolean
    name?: boolean
    startDate?: boolean
    endDate?: boolean
    revenueTarget?: boolean
    status?: boolean
    isLocked?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ForecastPeriodInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    snapshots?: boolean | ForecastPeriod$snapshotsArgs<ExtArgs>
    submissions?: boolean | ForecastPeriod$submissionsArgs<ExtArgs>
    _count?: boolean | ForecastPeriodCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type ForecastPeriodIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $ForecastPeriodPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ForecastPeriod"
    objects: {
      snapshots: Prisma.$AiForecastSnapshotPayload<ExtArgs>[]
      submissions: Prisma.$ForecastSubmissionPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenantId: string
      name: string
      startDate: Date
      endDate: Date
      revenueTarget: number
      status: string
      isLocked: boolean
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["forecastPeriod"]>
    composites: {}
  }

  type ForecastPeriodGetPayload<S extends boolean | null | undefined | ForecastPeriodDefaultArgs> = $Result.GetResult<Prisma.$ForecastPeriodPayload, S>

  type ForecastPeriodCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<ForecastPeriodFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: ForecastPeriodCountAggregateInputType | true
    }

  export interface ForecastPeriodDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ForecastPeriod'], meta: { name: 'ForecastPeriod' } }
    /**
     * Find zero or one ForecastPeriod that matches the filter.
     * @param {ForecastPeriodFindUniqueArgs} args - Arguments to find a ForecastPeriod
     * @example
     * // Get one ForecastPeriod
     * const forecastPeriod = await prisma.forecastPeriod.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ForecastPeriodFindUniqueArgs>(args: SelectSubset<T, ForecastPeriodFindUniqueArgs<ExtArgs>>): Prisma__ForecastPeriodClient<$Result.GetResult<Prisma.$ForecastPeriodPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one ForecastPeriod that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {ForecastPeriodFindUniqueOrThrowArgs} args - Arguments to find a ForecastPeriod
     * @example
     * // Get one ForecastPeriod
     * const forecastPeriod = await prisma.forecastPeriod.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ForecastPeriodFindUniqueOrThrowArgs>(args: SelectSubset<T, ForecastPeriodFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ForecastPeriodClient<$Result.GetResult<Prisma.$ForecastPeriodPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first ForecastPeriod that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ForecastPeriodFindFirstArgs} args - Arguments to find a ForecastPeriod
     * @example
     * // Get one ForecastPeriod
     * const forecastPeriod = await prisma.forecastPeriod.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ForecastPeriodFindFirstArgs>(args?: SelectSubset<T, ForecastPeriodFindFirstArgs<ExtArgs>>): Prisma__ForecastPeriodClient<$Result.GetResult<Prisma.$ForecastPeriodPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first ForecastPeriod that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ForecastPeriodFindFirstOrThrowArgs} args - Arguments to find a ForecastPeriod
     * @example
     * // Get one ForecastPeriod
     * const forecastPeriod = await prisma.forecastPeriod.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ForecastPeriodFindFirstOrThrowArgs>(args?: SelectSubset<T, ForecastPeriodFindFirstOrThrowArgs<ExtArgs>>): Prisma__ForecastPeriodClient<$Result.GetResult<Prisma.$ForecastPeriodPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more ForecastPeriods that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ForecastPeriodFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ForecastPeriods
     * const forecastPeriods = await prisma.forecastPeriod.findMany()
     * 
     * // Get first 10 ForecastPeriods
     * const forecastPeriods = await prisma.forecastPeriod.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const forecastPeriodWithIdOnly = await prisma.forecastPeriod.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ForecastPeriodFindManyArgs>(args?: SelectSubset<T, ForecastPeriodFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ForecastPeriodPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a ForecastPeriod.
     * @param {ForecastPeriodCreateArgs} args - Arguments to create a ForecastPeriod.
     * @example
     * // Create one ForecastPeriod
     * const ForecastPeriod = await prisma.forecastPeriod.create({
     *   data: {
     *     // ... data to create a ForecastPeriod
     *   }
     * })
     * 
     */
    create<T extends ForecastPeriodCreateArgs>(args: SelectSubset<T, ForecastPeriodCreateArgs<ExtArgs>>): Prisma__ForecastPeriodClient<$Result.GetResult<Prisma.$ForecastPeriodPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many ForecastPeriods.
     * @param {ForecastPeriodCreateManyArgs} args - Arguments to create many ForecastPeriods.
     * @example
     * // Create many ForecastPeriods
     * const forecastPeriod = await prisma.forecastPeriod.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ForecastPeriodCreateManyArgs>(args?: SelectSubset<T, ForecastPeriodCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ForecastPeriods and returns the data saved in the database.
     * @param {ForecastPeriodCreateManyAndReturnArgs} args - Arguments to create many ForecastPeriods.
     * @example
     * // Create many ForecastPeriods
     * const forecastPeriod = await prisma.forecastPeriod.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ForecastPeriods and only return the `id`
     * const forecastPeriodWithIdOnly = await prisma.forecastPeriod.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ForecastPeriodCreateManyAndReturnArgs>(args?: SelectSubset<T, ForecastPeriodCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ForecastPeriodPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a ForecastPeriod.
     * @param {ForecastPeriodDeleteArgs} args - Arguments to delete one ForecastPeriod.
     * @example
     * // Delete one ForecastPeriod
     * const ForecastPeriod = await prisma.forecastPeriod.delete({
     *   where: {
     *     // ... filter to delete one ForecastPeriod
     *   }
     * })
     * 
     */
    delete<T extends ForecastPeriodDeleteArgs>(args: SelectSubset<T, ForecastPeriodDeleteArgs<ExtArgs>>): Prisma__ForecastPeriodClient<$Result.GetResult<Prisma.$ForecastPeriodPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one ForecastPeriod.
     * @param {ForecastPeriodUpdateArgs} args - Arguments to update one ForecastPeriod.
     * @example
     * // Update one ForecastPeriod
     * const forecastPeriod = await prisma.forecastPeriod.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ForecastPeriodUpdateArgs>(args: SelectSubset<T, ForecastPeriodUpdateArgs<ExtArgs>>): Prisma__ForecastPeriodClient<$Result.GetResult<Prisma.$ForecastPeriodPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more ForecastPeriods.
     * @param {ForecastPeriodDeleteManyArgs} args - Arguments to filter ForecastPeriods to delete.
     * @example
     * // Delete a few ForecastPeriods
     * const { count } = await prisma.forecastPeriod.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ForecastPeriodDeleteManyArgs>(args?: SelectSubset<T, ForecastPeriodDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ForecastPeriods.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ForecastPeriodUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ForecastPeriods
     * const forecastPeriod = await prisma.forecastPeriod.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ForecastPeriodUpdateManyArgs>(args: SelectSubset<T, ForecastPeriodUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one ForecastPeriod.
     * @param {ForecastPeriodUpsertArgs} args - Arguments to update or create a ForecastPeriod.
     * @example
     * // Update or create a ForecastPeriod
     * const forecastPeriod = await prisma.forecastPeriod.upsert({
     *   create: {
     *     // ... data to create a ForecastPeriod
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ForecastPeriod we want to update
     *   }
     * })
     */
    upsert<T extends ForecastPeriodUpsertArgs>(args: SelectSubset<T, ForecastPeriodUpsertArgs<ExtArgs>>): Prisma__ForecastPeriodClient<$Result.GetResult<Prisma.$ForecastPeriodPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of ForecastPeriods.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ForecastPeriodCountArgs} args - Arguments to filter ForecastPeriods to count.
     * @example
     * // Count the number of ForecastPeriods
     * const count = await prisma.forecastPeriod.count({
     *   where: {
     *     // ... the filter for the ForecastPeriods we want to count
     *   }
     * })
    **/
    count<T extends ForecastPeriodCountArgs>(
      args?: Subset<T, ForecastPeriodCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ForecastPeriodCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ForecastPeriod.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ForecastPeriodAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ForecastPeriodAggregateArgs>(args: Subset<T, ForecastPeriodAggregateArgs>): Prisma.PrismaPromise<GetForecastPeriodAggregateType<T>>

    /**
     * Group by ForecastPeriod.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ForecastPeriodGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ForecastPeriodGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ForecastPeriodGroupByArgs['orderBy'] }
        : { orderBy?: ForecastPeriodGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ForecastPeriodGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetForecastPeriodGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ForecastPeriod model
   */
  readonly fields: ForecastPeriodFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ForecastPeriod.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ForecastPeriodClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    snapshots<T extends ForecastPeriod$snapshotsArgs<ExtArgs> = {}>(args?: Subset<T, ForecastPeriod$snapshotsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AiForecastSnapshotPayload<ExtArgs>, T, "findMany"> | Null>
    submissions<T extends ForecastPeriod$submissionsArgs<ExtArgs> = {}>(args?: Subset<T, ForecastPeriod$submissionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ForecastSubmissionPayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ForecastPeriod model
   */ 
  interface ForecastPeriodFieldRefs {
    readonly id: FieldRef<"ForecastPeriod", 'String'>
    readonly tenantId: FieldRef<"ForecastPeriod", 'String'>
    readonly name: FieldRef<"ForecastPeriod", 'String'>
    readonly startDate: FieldRef<"ForecastPeriod", 'DateTime'>
    readonly endDate: FieldRef<"ForecastPeriod", 'DateTime'>
    readonly revenueTarget: FieldRef<"ForecastPeriod", 'Float'>
    readonly status: FieldRef<"ForecastPeriod", 'String'>
    readonly isLocked: FieldRef<"ForecastPeriod", 'Boolean'>
    readonly createdAt: FieldRef<"ForecastPeriod", 'DateTime'>
    readonly updatedAt: FieldRef<"ForecastPeriod", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ForecastPeriod findUnique
   */
  export type ForecastPeriodFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ForecastPeriod
     */
    select?: ForecastPeriodSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ForecastPeriodInclude<ExtArgs> | null
    /**
     * Filter, which ForecastPeriod to fetch.
     */
    where: ForecastPeriodWhereUniqueInput
  }

  /**
   * ForecastPeriod findUniqueOrThrow
   */
  export type ForecastPeriodFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ForecastPeriod
     */
    select?: ForecastPeriodSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ForecastPeriodInclude<ExtArgs> | null
    /**
     * Filter, which ForecastPeriod to fetch.
     */
    where: ForecastPeriodWhereUniqueInput
  }

  /**
   * ForecastPeriod findFirst
   */
  export type ForecastPeriodFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ForecastPeriod
     */
    select?: ForecastPeriodSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ForecastPeriodInclude<ExtArgs> | null
    /**
     * Filter, which ForecastPeriod to fetch.
     */
    where?: ForecastPeriodWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ForecastPeriods to fetch.
     */
    orderBy?: ForecastPeriodOrderByWithRelationInput | ForecastPeriodOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ForecastPeriods.
     */
    cursor?: ForecastPeriodWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ForecastPeriods from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ForecastPeriods.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ForecastPeriods.
     */
    distinct?: ForecastPeriodScalarFieldEnum | ForecastPeriodScalarFieldEnum[]
  }

  /**
   * ForecastPeriod findFirstOrThrow
   */
  export type ForecastPeriodFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ForecastPeriod
     */
    select?: ForecastPeriodSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ForecastPeriodInclude<ExtArgs> | null
    /**
     * Filter, which ForecastPeriod to fetch.
     */
    where?: ForecastPeriodWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ForecastPeriods to fetch.
     */
    orderBy?: ForecastPeriodOrderByWithRelationInput | ForecastPeriodOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ForecastPeriods.
     */
    cursor?: ForecastPeriodWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ForecastPeriods from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ForecastPeriods.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ForecastPeriods.
     */
    distinct?: ForecastPeriodScalarFieldEnum | ForecastPeriodScalarFieldEnum[]
  }

  /**
   * ForecastPeriod findMany
   */
  export type ForecastPeriodFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ForecastPeriod
     */
    select?: ForecastPeriodSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ForecastPeriodInclude<ExtArgs> | null
    /**
     * Filter, which ForecastPeriods to fetch.
     */
    where?: ForecastPeriodWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ForecastPeriods to fetch.
     */
    orderBy?: ForecastPeriodOrderByWithRelationInput | ForecastPeriodOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ForecastPeriods.
     */
    cursor?: ForecastPeriodWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ForecastPeriods from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ForecastPeriods.
     */
    skip?: number
    distinct?: ForecastPeriodScalarFieldEnum | ForecastPeriodScalarFieldEnum[]
  }

  /**
   * ForecastPeriod create
   */
  export type ForecastPeriodCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ForecastPeriod
     */
    select?: ForecastPeriodSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ForecastPeriodInclude<ExtArgs> | null
    /**
     * The data needed to create a ForecastPeriod.
     */
    data: XOR<ForecastPeriodCreateInput, ForecastPeriodUncheckedCreateInput>
  }

  /**
   * ForecastPeriod createMany
   */
  export type ForecastPeriodCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ForecastPeriods.
     */
    data: ForecastPeriodCreateManyInput | ForecastPeriodCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ForecastPeriod createManyAndReturn
   */
  export type ForecastPeriodCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ForecastPeriod
     */
    select?: ForecastPeriodSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many ForecastPeriods.
     */
    data: ForecastPeriodCreateManyInput | ForecastPeriodCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ForecastPeriod update
   */
  export type ForecastPeriodUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ForecastPeriod
     */
    select?: ForecastPeriodSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ForecastPeriodInclude<ExtArgs> | null
    /**
     * The data needed to update a ForecastPeriod.
     */
    data: XOR<ForecastPeriodUpdateInput, ForecastPeriodUncheckedUpdateInput>
    /**
     * Choose, which ForecastPeriod to update.
     */
    where: ForecastPeriodWhereUniqueInput
  }

  /**
   * ForecastPeriod updateMany
   */
  export type ForecastPeriodUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ForecastPeriods.
     */
    data: XOR<ForecastPeriodUpdateManyMutationInput, ForecastPeriodUncheckedUpdateManyInput>
    /**
     * Filter which ForecastPeriods to update
     */
    where?: ForecastPeriodWhereInput
  }

  /**
   * ForecastPeriod upsert
   */
  export type ForecastPeriodUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ForecastPeriod
     */
    select?: ForecastPeriodSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ForecastPeriodInclude<ExtArgs> | null
    /**
     * The filter to search for the ForecastPeriod to update in case it exists.
     */
    where: ForecastPeriodWhereUniqueInput
    /**
     * In case the ForecastPeriod found by the `where` argument doesn't exist, create a new ForecastPeriod with this data.
     */
    create: XOR<ForecastPeriodCreateInput, ForecastPeriodUncheckedCreateInput>
    /**
     * In case the ForecastPeriod was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ForecastPeriodUpdateInput, ForecastPeriodUncheckedUpdateInput>
  }

  /**
   * ForecastPeriod delete
   */
  export type ForecastPeriodDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ForecastPeriod
     */
    select?: ForecastPeriodSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ForecastPeriodInclude<ExtArgs> | null
    /**
     * Filter which ForecastPeriod to delete.
     */
    where: ForecastPeriodWhereUniqueInput
  }

  /**
   * ForecastPeriod deleteMany
   */
  export type ForecastPeriodDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ForecastPeriods to delete
     */
    where?: ForecastPeriodWhereInput
  }

  /**
   * ForecastPeriod.snapshots
   */
  export type ForecastPeriod$snapshotsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AiForecastSnapshot
     */
    select?: AiForecastSnapshotSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AiForecastSnapshotInclude<ExtArgs> | null
    where?: AiForecastSnapshotWhereInput
    orderBy?: AiForecastSnapshotOrderByWithRelationInput | AiForecastSnapshotOrderByWithRelationInput[]
    cursor?: AiForecastSnapshotWhereUniqueInput
    take?: number
    skip?: number
    distinct?: AiForecastSnapshotScalarFieldEnum | AiForecastSnapshotScalarFieldEnum[]
  }

  /**
   * ForecastPeriod.submissions
   */
  export type ForecastPeriod$submissionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ForecastSubmission
     */
    select?: ForecastSubmissionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ForecastSubmissionInclude<ExtArgs> | null
    where?: ForecastSubmissionWhereInput
    orderBy?: ForecastSubmissionOrderByWithRelationInput | ForecastSubmissionOrderByWithRelationInput[]
    cursor?: ForecastSubmissionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ForecastSubmissionScalarFieldEnum | ForecastSubmissionScalarFieldEnum[]
  }

  /**
   * ForecastPeriod without action
   */
  export type ForecastPeriodDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ForecastPeriod
     */
    select?: ForecastPeriodSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ForecastPeriodInclude<ExtArgs> | null
  }


  /**
   * Model AiForecastSnapshot
   */

  export type AggregateAiForecastSnapshot = {
    _count: AiForecastSnapshotCountAggregateOutputType | null
    _avg: AiForecastSnapshotAvgAggregateOutputType | null
    _sum: AiForecastSnapshotSumAggregateOutputType | null
    _min: AiForecastSnapshotMinAggregateOutputType | null
    _max: AiForecastSnapshotMaxAggregateOutputType | null
  }

  export type AiForecastSnapshotAvgAggregateOutputType = {
    predictedAmount: number | null
    confidenceRangeLow: number | null
    confidenceRangeHigh: number | null
    inputPipelineValue: number | null
  }

  export type AiForecastSnapshotSumAggregateOutputType = {
    predictedAmount: number | null
    confidenceRangeLow: number | null
    confidenceRangeHigh: number | null
    inputPipelineValue: number | null
  }

  export type AiForecastSnapshotMinAggregateOutputType = {
    snapshotId: string | null
    tenantId: string | null
    periodId: string | null
    predictedAmount: number | null
    confidenceRangeLow: number | null
    confidenceRangeHigh: number | null
    inputPipelineValue: number | null
    computedAt: Date | null
    idempotencyKey: string | null
  }

  export type AiForecastSnapshotMaxAggregateOutputType = {
    snapshotId: string | null
    tenantId: string | null
    periodId: string | null
    predictedAmount: number | null
    confidenceRangeLow: number | null
    confidenceRangeHigh: number | null
    inputPipelineValue: number | null
    computedAt: Date | null
    idempotencyKey: string | null
  }

  export type AiForecastSnapshotCountAggregateOutputType = {
    snapshotId: number
    tenantId: number
    periodId: number
    predictedAmount: number
    confidenceRangeLow: number
    confidenceRangeHigh: number
    modelInputs: number
    inputPipelineValue: number
    regionBreakdown: number
    computedAt: number
    idempotencyKey: number
    _all: number
  }


  export type AiForecastSnapshotAvgAggregateInputType = {
    predictedAmount?: true
    confidenceRangeLow?: true
    confidenceRangeHigh?: true
    inputPipelineValue?: true
  }

  export type AiForecastSnapshotSumAggregateInputType = {
    predictedAmount?: true
    confidenceRangeLow?: true
    confidenceRangeHigh?: true
    inputPipelineValue?: true
  }

  export type AiForecastSnapshotMinAggregateInputType = {
    snapshotId?: true
    tenantId?: true
    periodId?: true
    predictedAmount?: true
    confidenceRangeLow?: true
    confidenceRangeHigh?: true
    inputPipelineValue?: true
    computedAt?: true
    idempotencyKey?: true
  }

  export type AiForecastSnapshotMaxAggregateInputType = {
    snapshotId?: true
    tenantId?: true
    periodId?: true
    predictedAmount?: true
    confidenceRangeLow?: true
    confidenceRangeHigh?: true
    inputPipelineValue?: true
    computedAt?: true
    idempotencyKey?: true
  }

  export type AiForecastSnapshotCountAggregateInputType = {
    snapshotId?: true
    tenantId?: true
    periodId?: true
    predictedAmount?: true
    confidenceRangeLow?: true
    confidenceRangeHigh?: true
    modelInputs?: true
    inputPipelineValue?: true
    regionBreakdown?: true
    computedAt?: true
    idempotencyKey?: true
    _all?: true
  }

  export type AiForecastSnapshotAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AiForecastSnapshot to aggregate.
     */
    where?: AiForecastSnapshotWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AiForecastSnapshots to fetch.
     */
    orderBy?: AiForecastSnapshotOrderByWithRelationInput | AiForecastSnapshotOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AiForecastSnapshotWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AiForecastSnapshots from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AiForecastSnapshots.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned AiForecastSnapshots
    **/
    _count?: true | AiForecastSnapshotCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: AiForecastSnapshotAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: AiForecastSnapshotSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AiForecastSnapshotMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AiForecastSnapshotMaxAggregateInputType
  }

  export type GetAiForecastSnapshotAggregateType<T extends AiForecastSnapshotAggregateArgs> = {
        [P in keyof T & keyof AggregateAiForecastSnapshot]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAiForecastSnapshot[P]>
      : GetScalarType<T[P], AggregateAiForecastSnapshot[P]>
  }




  export type AiForecastSnapshotGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AiForecastSnapshotWhereInput
    orderBy?: AiForecastSnapshotOrderByWithAggregationInput | AiForecastSnapshotOrderByWithAggregationInput[]
    by: AiForecastSnapshotScalarFieldEnum[] | AiForecastSnapshotScalarFieldEnum
    having?: AiForecastSnapshotScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AiForecastSnapshotCountAggregateInputType | true
    _avg?: AiForecastSnapshotAvgAggregateInputType
    _sum?: AiForecastSnapshotSumAggregateInputType
    _min?: AiForecastSnapshotMinAggregateInputType
    _max?: AiForecastSnapshotMaxAggregateInputType
  }

  export type AiForecastSnapshotGroupByOutputType = {
    snapshotId: string
    tenantId: string
    periodId: string
    predictedAmount: number
    confidenceRangeLow: number
    confidenceRangeHigh: number
    modelInputs: JsonValue
    inputPipelineValue: number | null
    regionBreakdown: JsonValue | null
    computedAt: Date
    idempotencyKey: string
    _count: AiForecastSnapshotCountAggregateOutputType | null
    _avg: AiForecastSnapshotAvgAggregateOutputType | null
    _sum: AiForecastSnapshotSumAggregateOutputType | null
    _min: AiForecastSnapshotMinAggregateOutputType | null
    _max: AiForecastSnapshotMaxAggregateOutputType | null
  }

  type GetAiForecastSnapshotGroupByPayload<T extends AiForecastSnapshotGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AiForecastSnapshotGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AiForecastSnapshotGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AiForecastSnapshotGroupByOutputType[P]>
            : GetScalarType<T[P], AiForecastSnapshotGroupByOutputType[P]>
        }
      >
    >


  export type AiForecastSnapshotSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    snapshotId?: boolean
    tenantId?: boolean
    periodId?: boolean
    predictedAmount?: boolean
    confidenceRangeLow?: boolean
    confidenceRangeHigh?: boolean
    modelInputs?: boolean
    inputPipelineValue?: boolean
    regionBreakdown?: boolean
    computedAt?: boolean
    idempotencyKey?: boolean
    period?: boolean | ForecastPeriodDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["aiForecastSnapshot"]>

  export type AiForecastSnapshotSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    snapshotId?: boolean
    tenantId?: boolean
    periodId?: boolean
    predictedAmount?: boolean
    confidenceRangeLow?: boolean
    confidenceRangeHigh?: boolean
    modelInputs?: boolean
    inputPipelineValue?: boolean
    regionBreakdown?: boolean
    computedAt?: boolean
    idempotencyKey?: boolean
    period?: boolean | ForecastPeriodDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["aiForecastSnapshot"]>

  export type AiForecastSnapshotSelectScalar = {
    snapshotId?: boolean
    tenantId?: boolean
    periodId?: boolean
    predictedAmount?: boolean
    confidenceRangeLow?: boolean
    confidenceRangeHigh?: boolean
    modelInputs?: boolean
    inputPipelineValue?: boolean
    regionBreakdown?: boolean
    computedAt?: boolean
    idempotencyKey?: boolean
  }

  export type AiForecastSnapshotInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    period?: boolean | ForecastPeriodDefaultArgs<ExtArgs>
  }
  export type AiForecastSnapshotIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    period?: boolean | ForecastPeriodDefaultArgs<ExtArgs>
  }

  export type $AiForecastSnapshotPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "AiForecastSnapshot"
    objects: {
      period: Prisma.$ForecastPeriodPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      snapshotId: string
      tenantId: string
      periodId: string
      predictedAmount: number
      confidenceRangeLow: number
      confidenceRangeHigh: number
      modelInputs: Prisma.JsonValue
      inputPipelineValue: number | null
      regionBreakdown: Prisma.JsonValue | null
      computedAt: Date
      idempotencyKey: string
    }, ExtArgs["result"]["aiForecastSnapshot"]>
    composites: {}
  }

  type AiForecastSnapshotGetPayload<S extends boolean | null | undefined | AiForecastSnapshotDefaultArgs> = $Result.GetResult<Prisma.$AiForecastSnapshotPayload, S>

  type AiForecastSnapshotCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<AiForecastSnapshotFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: AiForecastSnapshotCountAggregateInputType | true
    }

  export interface AiForecastSnapshotDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['AiForecastSnapshot'], meta: { name: 'AiForecastSnapshot' } }
    /**
     * Find zero or one AiForecastSnapshot that matches the filter.
     * @param {AiForecastSnapshotFindUniqueArgs} args - Arguments to find a AiForecastSnapshot
     * @example
     * // Get one AiForecastSnapshot
     * const aiForecastSnapshot = await prisma.aiForecastSnapshot.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AiForecastSnapshotFindUniqueArgs>(args: SelectSubset<T, AiForecastSnapshotFindUniqueArgs<ExtArgs>>): Prisma__AiForecastSnapshotClient<$Result.GetResult<Prisma.$AiForecastSnapshotPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one AiForecastSnapshot that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {AiForecastSnapshotFindUniqueOrThrowArgs} args - Arguments to find a AiForecastSnapshot
     * @example
     * // Get one AiForecastSnapshot
     * const aiForecastSnapshot = await prisma.aiForecastSnapshot.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AiForecastSnapshotFindUniqueOrThrowArgs>(args: SelectSubset<T, AiForecastSnapshotFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AiForecastSnapshotClient<$Result.GetResult<Prisma.$AiForecastSnapshotPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first AiForecastSnapshot that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AiForecastSnapshotFindFirstArgs} args - Arguments to find a AiForecastSnapshot
     * @example
     * // Get one AiForecastSnapshot
     * const aiForecastSnapshot = await prisma.aiForecastSnapshot.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AiForecastSnapshotFindFirstArgs>(args?: SelectSubset<T, AiForecastSnapshotFindFirstArgs<ExtArgs>>): Prisma__AiForecastSnapshotClient<$Result.GetResult<Prisma.$AiForecastSnapshotPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first AiForecastSnapshot that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AiForecastSnapshotFindFirstOrThrowArgs} args - Arguments to find a AiForecastSnapshot
     * @example
     * // Get one AiForecastSnapshot
     * const aiForecastSnapshot = await prisma.aiForecastSnapshot.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AiForecastSnapshotFindFirstOrThrowArgs>(args?: SelectSubset<T, AiForecastSnapshotFindFirstOrThrowArgs<ExtArgs>>): Prisma__AiForecastSnapshotClient<$Result.GetResult<Prisma.$AiForecastSnapshotPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more AiForecastSnapshots that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AiForecastSnapshotFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all AiForecastSnapshots
     * const aiForecastSnapshots = await prisma.aiForecastSnapshot.findMany()
     * 
     * // Get first 10 AiForecastSnapshots
     * const aiForecastSnapshots = await prisma.aiForecastSnapshot.findMany({ take: 10 })
     * 
     * // Only select the `snapshotId`
     * const aiForecastSnapshotWithSnapshotIdOnly = await prisma.aiForecastSnapshot.findMany({ select: { snapshotId: true } })
     * 
     */
    findMany<T extends AiForecastSnapshotFindManyArgs>(args?: SelectSubset<T, AiForecastSnapshotFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AiForecastSnapshotPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a AiForecastSnapshot.
     * @param {AiForecastSnapshotCreateArgs} args - Arguments to create a AiForecastSnapshot.
     * @example
     * // Create one AiForecastSnapshot
     * const AiForecastSnapshot = await prisma.aiForecastSnapshot.create({
     *   data: {
     *     // ... data to create a AiForecastSnapshot
     *   }
     * })
     * 
     */
    create<T extends AiForecastSnapshotCreateArgs>(args: SelectSubset<T, AiForecastSnapshotCreateArgs<ExtArgs>>): Prisma__AiForecastSnapshotClient<$Result.GetResult<Prisma.$AiForecastSnapshotPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many AiForecastSnapshots.
     * @param {AiForecastSnapshotCreateManyArgs} args - Arguments to create many AiForecastSnapshots.
     * @example
     * // Create many AiForecastSnapshots
     * const aiForecastSnapshot = await prisma.aiForecastSnapshot.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AiForecastSnapshotCreateManyArgs>(args?: SelectSubset<T, AiForecastSnapshotCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many AiForecastSnapshots and returns the data saved in the database.
     * @param {AiForecastSnapshotCreateManyAndReturnArgs} args - Arguments to create many AiForecastSnapshots.
     * @example
     * // Create many AiForecastSnapshots
     * const aiForecastSnapshot = await prisma.aiForecastSnapshot.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many AiForecastSnapshots and only return the `snapshotId`
     * const aiForecastSnapshotWithSnapshotIdOnly = await prisma.aiForecastSnapshot.createManyAndReturn({ 
     *   select: { snapshotId: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends AiForecastSnapshotCreateManyAndReturnArgs>(args?: SelectSubset<T, AiForecastSnapshotCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AiForecastSnapshotPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a AiForecastSnapshot.
     * @param {AiForecastSnapshotDeleteArgs} args - Arguments to delete one AiForecastSnapshot.
     * @example
     * // Delete one AiForecastSnapshot
     * const AiForecastSnapshot = await prisma.aiForecastSnapshot.delete({
     *   where: {
     *     // ... filter to delete one AiForecastSnapshot
     *   }
     * })
     * 
     */
    delete<T extends AiForecastSnapshotDeleteArgs>(args: SelectSubset<T, AiForecastSnapshotDeleteArgs<ExtArgs>>): Prisma__AiForecastSnapshotClient<$Result.GetResult<Prisma.$AiForecastSnapshotPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one AiForecastSnapshot.
     * @param {AiForecastSnapshotUpdateArgs} args - Arguments to update one AiForecastSnapshot.
     * @example
     * // Update one AiForecastSnapshot
     * const aiForecastSnapshot = await prisma.aiForecastSnapshot.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AiForecastSnapshotUpdateArgs>(args: SelectSubset<T, AiForecastSnapshotUpdateArgs<ExtArgs>>): Prisma__AiForecastSnapshotClient<$Result.GetResult<Prisma.$AiForecastSnapshotPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more AiForecastSnapshots.
     * @param {AiForecastSnapshotDeleteManyArgs} args - Arguments to filter AiForecastSnapshots to delete.
     * @example
     * // Delete a few AiForecastSnapshots
     * const { count } = await prisma.aiForecastSnapshot.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AiForecastSnapshotDeleteManyArgs>(args?: SelectSubset<T, AiForecastSnapshotDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AiForecastSnapshots.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AiForecastSnapshotUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many AiForecastSnapshots
     * const aiForecastSnapshot = await prisma.aiForecastSnapshot.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AiForecastSnapshotUpdateManyArgs>(args: SelectSubset<T, AiForecastSnapshotUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one AiForecastSnapshot.
     * @param {AiForecastSnapshotUpsertArgs} args - Arguments to update or create a AiForecastSnapshot.
     * @example
     * // Update or create a AiForecastSnapshot
     * const aiForecastSnapshot = await prisma.aiForecastSnapshot.upsert({
     *   create: {
     *     // ... data to create a AiForecastSnapshot
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the AiForecastSnapshot we want to update
     *   }
     * })
     */
    upsert<T extends AiForecastSnapshotUpsertArgs>(args: SelectSubset<T, AiForecastSnapshotUpsertArgs<ExtArgs>>): Prisma__AiForecastSnapshotClient<$Result.GetResult<Prisma.$AiForecastSnapshotPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of AiForecastSnapshots.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AiForecastSnapshotCountArgs} args - Arguments to filter AiForecastSnapshots to count.
     * @example
     * // Count the number of AiForecastSnapshots
     * const count = await prisma.aiForecastSnapshot.count({
     *   where: {
     *     // ... the filter for the AiForecastSnapshots we want to count
     *   }
     * })
    **/
    count<T extends AiForecastSnapshotCountArgs>(
      args?: Subset<T, AiForecastSnapshotCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AiForecastSnapshotCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a AiForecastSnapshot.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AiForecastSnapshotAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AiForecastSnapshotAggregateArgs>(args: Subset<T, AiForecastSnapshotAggregateArgs>): Prisma.PrismaPromise<GetAiForecastSnapshotAggregateType<T>>

    /**
     * Group by AiForecastSnapshot.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AiForecastSnapshotGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AiForecastSnapshotGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AiForecastSnapshotGroupByArgs['orderBy'] }
        : { orderBy?: AiForecastSnapshotGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AiForecastSnapshotGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAiForecastSnapshotGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the AiForecastSnapshot model
   */
  readonly fields: AiForecastSnapshotFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for AiForecastSnapshot.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AiForecastSnapshotClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    period<T extends ForecastPeriodDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ForecastPeriodDefaultArgs<ExtArgs>>): Prisma__ForecastPeriodClient<$Result.GetResult<Prisma.$ForecastPeriodPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the AiForecastSnapshot model
   */ 
  interface AiForecastSnapshotFieldRefs {
    readonly snapshotId: FieldRef<"AiForecastSnapshot", 'String'>
    readonly tenantId: FieldRef<"AiForecastSnapshot", 'String'>
    readonly periodId: FieldRef<"AiForecastSnapshot", 'String'>
    readonly predictedAmount: FieldRef<"AiForecastSnapshot", 'Float'>
    readonly confidenceRangeLow: FieldRef<"AiForecastSnapshot", 'Float'>
    readonly confidenceRangeHigh: FieldRef<"AiForecastSnapshot", 'Float'>
    readonly modelInputs: FieldRef<"AiForecastSnapshot", 'Json'>
    readonly inputPipelineValue: FieldRef<"AiForecastSnapshot", 'Float'>
    readonly regionBreakdown: FieldRef<"AiForecastSnapshot", 'Json'>
    readonly computedAt: FieldRef<"AiForecastSnapshot", 'DateTime'>
    readonly idempotencyKey: FieldRef<"AiForecastSnapshot", 'String'>
  }
    

  // Custom InputTypes
  /**
   * AiForecastSnapshot findUnique
   */
  export type AiForecastSnapshotFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AiForecastSnapshot
     */
    select?: AiForecastSnapshotSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AiForecastSnapshotInclude<ExtArgs> | null
    /**
     * Filter, which AiForecastSnapshot to fetch.
     */
    where: AiForecastSnapshotWhereUniqueInput
  }

  /**
   * AiForecastSnapshot findUniqueOrThrow
   */
  export type AiForecastSnapshotFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AiForecastSnapshot
     */
    select?: AiForecastSnapshotSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AiForecastSnapshotInclude<ExtArgs> | null
    /**
     * Filter, which AiForecastSnapshot to fetch.
     */
    where: AiForecastSnapshotWhereUniqueInput
  }

  /**
   * AiForecastSnapshot findFirst
   */
  export type AiForecastSnapshotFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AiForecastSnapshot
     */
    select?: AiForecastSnapshotSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AiForecastSnapshotInclude<ExtArgs> | null
    /**
     * Filter, which AiForecastSnapshot to fetch.
     */
    where?: AiForecastSnapshotWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AiForecastSnapshots to fetch.
     */
    orderBy?: AiForecastSnapshotOrderByWithRelationInput | AiForecastSnapshotOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AiForecastSnapshots.
     */
    cursor?: AiForecastSnapshotWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AiForecastSnapshots from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AiForecastSnapshots.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AiForecastSnapshots.
     */
    distinct?: AiForecastSnapshotScalarFieldEnum | AiForecastSnapshotScalarFieldEnum[]
  }

  /**
   * AiForecastSnapshot findFirstOrThrow
   */
  export type AiForecastSnapshotFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AiForecastSnapshot
     */
    select?: AiForecastSnapshotSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AiForecastSnapshotInclude<ExtArgs> | null
    /**
     * Filter, which AiForecastSnapshot to fetch.
     */
    where?: AiForecastSnapshotWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AiForecastSnapshots to fetch.
     */
    orderBy?: AiForecastSnapshotOrderByWithRelationInput | AiForecastSnapshotOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AiForecastSnapshots.
     */
    cursor?: AiForecastSnapshotWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AiForecastSnapshots from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AiForecastSnapshots.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AiForecastSnapshots.
     */
    distinct?: AiForecastSnapshotScalarFieldEnum | AiForecastSnapshotScalarFieldEnum[]
  }

  /**
   * AiForecastSnapshot findMany
   */
  export type AiForecastSnapshotFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AiForecastSnapshot
     */
    select?: AiForecastSnapshotSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AiForecastSnapshotInclude<ExtArgs> | null
    /**
     * Filter, which AiForecastSnapshots to fetch.
     */
    where?: AiForecastSnapshotWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AiForecastSnapshots to fetch.
     */
    orderBy?: AiForecastSnapshotOrderByWithRelationInput | AiForecastSnapshotOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing AiForecastSnapshots.
     */
    cursor?: AiForecastSnapshotWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AiForecastSnapshots from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AiForecastSnapshots.
     */
    skip?: number
    distinct?: AiForecastSnapshotScalarFieldEnum | AiForecastSnapshotScalarFieldEnum[]
  }

  /**
   * AiForecastSnapshot create
   */
  export type AiForecastSnapshotCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AiForecastSnapshot
     */
    select?: AiForecastSnapshotSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AiForecastSnapshotInclude<ExtArgs> | null
    /**
     * The data needed to create a AiForecastSnapshot.
     */
    data: XOR<AiForecastSnapshotCreateInput, AiForecastSnapshotUncheckedCreateInput>
  }

  /**
   * AiForecastSnapshot createMany
   */
  export type AiForecastSnapshotCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many AiForecastSnapshots.
     */
    data: AiForecastSnapshotCreateManyInput | AiForecastSnapshotCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * AiForecastSnapshot createManyAndReturn
   */
  export type AiForecastSnapshotCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AiForecastSnapshot
     */
    select?: AiForecastSnapshotSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many AiForecastSnapshots.
     */
    data: AiForecastSnapshotCreateManyInput | AiForecastSnapshotCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AiForecastSnapshotIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * AiForecastSnapshot update
   */
  export type AiForecastSnapshotUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AiForecastSnapshot
     */
    select?: AiForecastSnapshotSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AiForecastSnapshotInclude<ExtArgs> | null
    /**
     * The data needed to update a AiForecastSnapshot.
     */
    data: XOR<AiForecastSnapshotUpdateInput, AiForecastSnapshotUncheckedUpdateInput>
    /**
     * Choose, which AiForecastSnapshot to update.
     */
    where: AiForecastSnapshotWhereUniqueInput
  }

  /**
   * AiForecastSnapshot updateMany
   */
  export type AiForecastSnapshotUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update AiForecastSnapshots.
     */
    data: XOR<AiForecastSnapshotUpdateManyMutationInput, AiForecastSnapshotUncheckedUpdateManyInput>
    /**
     * Filter which AiForecastSnapshots to update
     */
    where?: AiForecastSnapshotWhereInput
  }

  /**
   * AiForecastSnapshot upsert
   */
  export type AiForecastSnapshotUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AiForecastSnapshot
     */
    select?: AiForecastSnapshotSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AiForecastSnapshotInclude<ExtArgs> | null
    /**
     * The filter to search for the AiForecastSnapshot to update in case it exists.
     */
    where: AiForecastSnapshotWhereUniqueInput
    /**
     * In case the AiForecastSnapshot found by the `where` argument doesn't exist, create a new AiForecastSnapshot with this data.
     */
    create: XOR<AiForecastSnapshotCreateInput, AiForecastSnapshotUncheckedCreateInput>
    /**
     * In case the AiForecastSnapshot was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AiForecastSnapshotUpdateInput, AiForecastSnapshotUncheckedUpdateInput>
  }

  /**
   * AiForecastSnapshot delete
   */
  export type AiForecastSnapshotDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AiForecastSnapshot
     */
    select?: AiForecastSnapshotSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AiForecastSnapshotInclude<ExtArgs> | null
    /**
     * Filter which AiForecastSnapshot to delete.
     */
    where: AiForecastSnapshotWhereUniqueInput
  }

  /**
   * AiForecastSnapshot deleteMany
   */
  export type AiForecastSnapshotDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AiForecastSnapshots to delete
     */
    where?: AiForecastSnapshotWhereInput
  }

  /**
   * AiForecastSnapshot without action
   */
  export type AiForecastSnapshotDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AiForecastSnapshot
     */
    select?: AiForecastSnapshotSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AiForecastSnapshotInclude<ExtArgs> | null
  }


  /**
   * Model PipelineCoverageMetrics
   */

  export type AggregatePipelineCoverageMetrics = {
    _count: PipelineCoverageMetricsCountAggregateOutputType | null
    _avg: PipelineCoverageMetricsAvgAggregateOutputType | null
    _sum: PipelineCoverageMetricsSumAggregateOutputType | null
    _min: PipelineCoverageMetricsMinAggregateOutputType | null
    _max: PipelineCoverageMetricsMaxAggregateOutputType | null
  }

  export type PipelineCoverageMetricsAvgAggregateOutputType = {
    openPipelineValue: number | null
    weightedPipelineValue: number | null
    closedWonAmount: number | null
    coverageRatio: number | null
  }

  export type PipelineCoverageMetricsSumAggregateOutputType = {
    openPipelineValue: number | null
    weightedPipelineValue: number | null
    closedWonAmount: number | null
    coverageRatio: number | null
  }

  export type PipelineCoverageMetricsMinAggregateOutputType = {
    id: string | null
    tenantId: string | null
    periodId: string | null
    openPipelineValue: number | null
    weightedPipelineValue: number | null
    closedWonAmount: number | null
    coverageRatio: number | null
    computedAt: Date | null
  }

  export type PipelineCoverageMetricsMaxAggregateOutputType = {
    id: string | null
    tenantId: string | null
    periodId: string | null
    openPipelineValue: number | null
    weightedPipelineValue: number | null
    closedWonAmount: number | null
    coverageRatio: number | null
    computedAt: Date | null
  }

  export type PipelineCoverageMetricsCountAggregateOutputType = {
    id: number
    tenantId: number
    periodId: number
    openPipelineValue: number
    weightedPipelineValue: number
    closedWonAmount: number
    coverageRatio: number
    computedAt: number
    _all: number
  }


  export type PipelineCoverageMetricsAvgAggregateInputType = {
    openPipelineValue?: true
    weightedPipelineValue?: true
    closedWonAmount?: true
    coverageRatio?: true
  }

  export type PipelineCoverageMetricsSumAggregateInputType = {
    openPipelineValue?: true
    weightedPipelineValue?: true
    closedWonAmount?: true
    coverageRatio?: true
  }

  export type PipelineCoverageMetricsMinAggregateInputType = {
    id?: true
    tenantId?: true
    periodId?: true
    openPipelineValue?: true
    weightedPipelineValue?: true
    closedWonAmount?: true
    coverageRatio?: true
    computedAt?: true
  }

  export type PipelineCoverageMetricsMaxAggregateInputType = {
    id?: true
    tenantId?: true
    periodId?: true
    openPipelineValue?: true
    weightedPipelineValue?: true
    closedWonAmount?: true
    coverageRatio?: true
    computedAt?: true
  }

  export type PipelineCoverageMetricsCountAggregateInputType = {
    id?: true
    tenantId?: true
    periodId?: true
    openPipelineValue?: true
    weightedPipelineValue?: true
    closedWonAmount?: true
    coverageRatio?: true
    computedAt?: true
    _all?: true
  }

  export type PipelineCoverageMetricsAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PipelineCoverageMetrics to aggregate.
     */
    where?: PipelineCoverageMetricsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PipelineCoverageMetrics to fetch.
     */
    orderBy?: PipelineCoverageMetricsOrderByWithRelationInput | PipelineCoverageMetricsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PipelineCoverageMetricsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PipelineCoverageMetrics from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PipelineCoverageMetrics.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PipelineCoverageMetrics
    **/
    _count?: true | PipelineCoverageMetricsCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: PipelineCoverageMetricsAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: PipelineCoverageMetricsSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PipelineCoverageMetricsMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PipelineCoverageMetricsMaxAggregateInputType
  }

  export type GetPipelineCoverageMetricsAggregateType<T extends PipelineCoverageMetricsAggregateArgs> = {
        [P in keyof T & keyof AggregatePipelineCoverageMetrics]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePipelineCoverageMetrics[P]>
      : GetScalarType<T[P], AggregatePipelineCoverageMetrics[P]>
  }




  export type PipelineCoverageMetricsGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PipelineCoverageMetricsWhereInput
    orderBy?: PipelineCoverageMetricsOrderByWithAggregationInput | PipelineCoverageMetricsOrderByWithAggregationInput[]
    by: PipelineCoverageMetricsScalarFieldEnum[] | PipelineCoverageMetricsScalarFieldEnum
    having?: PipelineCoverageMetricsScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PipelineCoverageMetricsCountAggregateInputType | true
    _avg?: PipelineCoverageMetricsAvgAggregateInputType
    _sum?: PipelineCoverageMetricsSumAggregateInputType
    _min?: PipelineCoverageMetricsMinAggregateInputType
    _max?: PipelineCoverageMetricsMaxAggregateInputType
  }

  export type PipelineCoverageMetricsGroupByOutputType = {
    id: string
    tenantId: string
    periodId: string
    openPipelineValue: number
    weightedPipelineValue: number
    closedWonAmount: number
    coverageRatio: number
    computedAt: Date
    _count: PipelineCoverageMetricsCountAggregateOutputType | null
    _avg: PipelineCoverageMetricsAvgAggregateOutputType | null
    _sum: PipelineCoverageMetricsSumAggregateOutputType | null
    _min: PipelineCoverageMetricsMinAggregateOutputType | null
    _max: PipelineCoverageMetricsMaxAggregateOutputType | null
  }

  type GetPipelineCoverageMetricsGroupByPayload<T extends PipelineCoverageMetricsGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PipelineCoverageMetricsGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PipelineCoverageMetricsGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PipelineCoverageMetricsGroupByOutputType[P]>
            : GetScalarType<T[P], PipelineCoverageMetricsGroupByOutputType[P]>
        }
      >
    >


  export type PipelineCoverageMetricsSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    periodId?: boolean
    openPipelineValue?: boolean
    weightedPipelineValue?: boolean
    closedWonAmount?: boolean
    coverageRatio?: boolean
    computedAt?: boolean
  }, ExtArgs["result"]["pipelineCoverageMetrics"]>

  export type PipelineCoverageMetricsSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    periodId?: boolean
    openPipelineValue?: boolean
    weightedPipelineValue?: boolean
    closedWonAmount?: boolean
    coverageRatio?: boolean
    computedAt?: boolean
  }, ExtArgs["result"]["pipelineCoverageMetrics"]>

  export type PipelineCoverageMetricsSelectScalar = {
    id?: boolean
    tenantId?: boolean
    periodId?: boolean
    openPipelineValue?: boolean
    weightedPipelineValue?: boolean
    closedWonAmount?: boolean
    coverageRatio?: boolean
    computedAt?: boolean
  }


  export type $PipelineCoverageMetricsPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PipelineCoverageMetrics"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenantId: string
      periodId: string
      openPipelineValue: number
      weightedPipelineValue: number
      closedWonAmount: number
      coverageRatio: number
      computedAt: Date
    }, ExtArgs["result"]["pipelineCoverageMetrics"]>
    composites: {}
  }

  type PipelineCoverageMetricsGetPayload<S extends boolean | null | undefined | PipelineCoverageMetricsDefaultArgs> = $Result.GetResult<Prisma.$PipelineCoverageMetricsPayload, S>

  type PipelineCoverageMetricsCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<PipelineCoverageMetricsFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: PipelineCoverageMetricsCountAggregateInputType | true
    }

  export interface PipelineCoverageMetricsDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PipelineCoverageMetrics'], meta: { name: 'PipelineCoverageMetrics' } }
    /**
     * Find zero or one PipelineCoverageMetrics that matches the filter.
     * @param {PipelineCoverageMetricsFindUniqueArgs} args - Arguments to find a PipelineCoverageMetrics
     * @example
     * // Get one PipelineCoverageMetrics
     * const pipelineCoverageMetrics = await prisma.pipelineCoverageMetrics.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PipelineCoverageMetricsFindUniqueArgs>(args: SelectSubset<T, PipelineCoverageMetricsFindUniqueArgs<ExtArgs>>): Prisma__PipelineCoverageMetricsClient<$Result.GetResult<Prisma.$PipelineCoverageMetricsPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one PipelineCoverageMetrics that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {PipelineCoverageMetricsFindUniqueOrThrowArgs} args - Arguments to find a PipelineCoverageMetrics
     * @example
     * // Get one PipelineCoverageMetrics
     * const pipelineCoverageMetrics = await prisma.pipelineCoverageMetrics.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PipelineCoverageMetricsFindUniqueOrThrowArgs>(args: SelectSubset<T, PipelineCoverageMetricsFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PipelineCoverageMetricsClient<$Result.GetResult<Prisma.$PipelineCoverageMetricsPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first PipelineCoverageMetrics that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PipelineCoverageMetricsFindFirstArgs} args - Arguments to find a PipelineCoverageMetrics
     * @example
     * // Get one PipelineCoverageMetrics
     * const pipelineCoverageMetrics = await prisma.pipelineCoverageMetrics.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PipelineCoverageMetricsFindFirstArgs>(args?: SelectSubset<T, PipelineCoverageMetricsFindFirstArgs<ExtArgs>>): Prisma__PipelineCoverageMetricsClient<$Result.GetResult<Prisma.$PipelineCoverageMetricsPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first PipelineCoverageMetrics that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PipelineCoverageMetricsFindFirstOrThrowArgs} args - Arguments to find a PipelineCoverageMetrics
     * @example
     * // Get one PipelineCoverageMetrics
     * const pipelineCoverageMetrics = await prisma.pipelineCoverageMetrics.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PipelineCoverageMetricsFindFirstOrThrowArgs>(args?: SelectSubset<T, PipelineCoverageMetricsFindFirstOrThrowArgs<ExtArgs>>): Prisma__PipelineCoverageMetricsClient<$Result.GetResult<Prisma.$PipelineCoverageMetricsPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more PipelineCoverageMetrics that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PipelineCoverageMetricsFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PipelineCoverageMetrics
     * const pipelineCoverageMetrics = await prisma.pipelineCoverageMetrics.findMany()
     * 
     * // Get first 10 PipelineCoverageMetrics
     * const pipelineCoverageMetrics = await prisma.pipelineCoverageMetrics.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const pipelineCoverageMetricsWithIdOnly = await prisma.pipelineCoverageMetrics.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PipelineCoverageMetricsFindManyArgs>(args?: SelectSubset<T, PipelineCoverageMetricsFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PipelineCoverageMetricsPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a PipelineCoverageMetrics.
     * @param {PipelineCoverageMetricsCreateArgs} args - Arguments to create a PipelineCoverageMetrics.
     * @example
     * // Create one PipelineCoverageMetrics
     * const PipelineCoverageMetrics = await prisma.pipelineCoverageMetrics.create({
     *   data: {
     *     // ... data to create a PipelineCoverageMetrics
     *   }
     * })
     * 
     */
    create<T extends PipelineCoverageMetricsCreateArgs>(args: SelectSubset<T, PipelineCoverageMetricsCreateArgs<ExtArgs>>): Prisma__PipelineCoverageMetricsClient<$Result.GetResult<Prisma.$PipelineCoverageMetricsPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many PipelineCoverageMetrics.
     * @param {PipelineCoverageMetricsCreateManyArgs} args - Arguments to create many PipelineCoverageMetrics.
     * @example
     * // Create many PipelineCoverageMetrics
     * const pipelineCoverageMetrics = await prisma.pipelineCoverageMetrics.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PipelineCoverageMetricsCreateManyArgs>(args?: SelectSubset<T, PipelineCoverageMetricsCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many PipelineCoverageMetrics and returns the data saved in the database.
     * @param {PipelineCoverageMetricsCreateManyAndReturnArgs} args - Arguments to create many PipelineCoverageMetrics.
     * @example
     * // Create many PipelineCoverageMetrics
     * const pipelineCoverageMetrics = await prisma.pipelineCoverageMetrics.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many PipelineCoverageMetrics and only return the `id`
     * const pipelineCoverageMetricsWithIdOnly = await prisma.pipelineCoverageMetrics.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PipelineCoverageMetricsCreateManyAndReturnArgs>(args?: SelectSubset<T, PipelineCoverageMetricsCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PipelineCoverageMetricsPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a PipelineCoverageMetrics.
     * @param {PipelineCoverageMetricsDeleteArgs} args - Arguments to delete one PipelineCoverageMetrics.
     * @example
     * // Delete one PipelineCoverageMetrics
     * const PipelineCoverageMetrics = await prisma.pipelineCoverageMetrics.delete({
     *   where: {
     *     // ... filter to delete one PipelineCoverageMetrics
     *   }
     * })
     * 
     */
    delete<T extends PipelineCoverageMetricsDeleteArgs>(args: SelectSubset<T, PipelineCoverageMetricsDeleteArgs<ExtArgs>>): Prisma__PipelineCoverageMetricsClient<$Result.GetResult<Prisma.$PipelineCoverageMetricsPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one PipelineCoverageMetrics.
     * @param {PipelineCoverageMetricsUpdateArgs} args - Arguments to update one PipelineCoverageMetrics.
     * @example
     * // Update one PipelineCoverageMetrics
     * const pipelineCoverageMetrics = await prisma.pipelineCoverageMetrics.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PipelineCoverageMetricsUpdateArgs>(args: SelectSubset<T, PipelineCoverageMetricsUpdateArgs<ExtArgs>>): Prisma__PipelineCoverageMetricsClient<$Result.GetResult<Prisma.$PipelineCoverageMetricsPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more PipelineCoverageMetrics.
     * @param {PipelineCoverageMetricsDeleteManyArgs} args - Arguments to filter PipelineCoverageMetrics to delete.
     * @example
     * // Delete a few PipelineCoverageMetrics
     * const { count } = await prisma.pipelineCoverageMetrics.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PipelineCoverageMetricsDeleteManyArgs>(args?: SelectSubset<T, PipelineCoverageMetricsDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PipelineCoverageMetrics.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PipelineCoverageMetricsUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PipelineCoverageMetrics
     * const pipelineCoverageMetrics = await prisma.pipelineCoverageMetrics.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PipelineCoverageMetricsUpdateManyArgs>(args: SelectSubset<T, PipelineCoverageMetricsUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one PipelineCoverageMetrics.
     * @param {PipelineCoverageMetricsUpsertArgs} args - Arguments to update or create a PipelineCoverageMetrics.
     * @example
     * // Update or create a PipelineCoverageMetrics
     * const pipelineCoverageMetrics = await prisma.pipelineCoverageMetrics.upsert({
     *   create: {
     *     // ... data to create a PipelineCoverageMetrics
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PipelineCoverageMetrics we want to update
     *   }
     * })
     */
    upsert<T extends PipelineCoverageMetricsUpsertArgs>(args: SelectSubset<T, PipelineCoverageMetricsUpsertArgs<ExtArgs>>): Prisma__PipelineCoverageMetricsClient<$Result.GetResult<Prisma.$PipelineCoverageMetricsPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of PipelineCoverageMetrics.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PipelineCoverageMetricsCountArgs} args - Arguments to filter PipelineCoverageMetrics to count.
     * @example
     * // Count the number of PipelineCoverageMetrics
     * const count = await prisma.pipelineCoverageMetrics.count({
     *   where: {
     *     // ... the filter for the PipelineCoverageMetrics we want to count
     *   }
     * })
    **/
    count<T extends PipelineCoverageMetricsCountArgs>(
      args?: Subset<T, PipelineCoverageMetricsCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PipelineCoverageMetricsCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PipelineCoverageMetrics.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PipelineCoverageMetricsAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PipelineCoverageMetricsAggregateArgs>(args: Subset<T, PipelineCoverageMetricsAggregateArgs>): Prisma.PrismaPromise<GetPipelineCoverageMetricsAggregateType<T>>

    /**
     * Group by PipelineCoverageMetrics.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PipelineCoverageMetricsGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PipelineCoverageMetricsGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PipelineCoverageMetricsGroupByArgs['orderBy'] }
        : { orderBy?: PipelineCoverageMetricsGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PipelineCoverageMetricsGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPipelineCoverageMetricsGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PipelineCoverageMetrics model
   */
  readonly fields: PipelineCoverageMetricsFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PipelineCoverageMetrics.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PipelineCoverageMetricsClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the PipelineCoverageMetrics model
   */ 
  interface PipelineCoverageMetricsFieldRefs {
    readonly id: FieldRef<"PipelineCoverageMetrics", 'String'>
    readonly tenantId: FieldRef<"PipelineCoverageMetrics", 'String'>
    readonly periodId: FieldRef<"PipelineCoverageMetrics", 'String'>
    readonly openPipelineValue: FieldRef<"PipelineCoverageMetrics", 'Float'>
    readonly weightedPipelineValue: FieldRef<"PipelineCoverageMetrics", 'Float'>
    readonly closedWonAmount: FieldRef<"PipelineCoverageMetrics", 'Float'>
    readonly coverageRatio: FieldRef<"PipelineCoverageMetrics", 'Float'>
    readonly computedAt: FieldRef<"PipelineCoverageMetrics", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * PipelineCoverageMetrics findUnique
   */
  export type PipelineCoverageMetricsFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PipelineCoverageMetrics
     */
    select?: PipelineCoverageMetricsSelect<ExtArgs> | null
    /**
     * Filter, which PipelineCoverageMetrics to fetch.
     */
    where: PipelineCoverageMetricsWhereUniqueInput
  }

  /**
   * PipelineCoverageMetrics findUniqueOrThrow
   */
  export type PipelineCoverageMetricsFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PipelineCoverageMetrics
     */
    select?: PipelineCoverageMetricsSelect<ExtArgs> | null
    /**
     * Filter, which PipelineCoverageMetrics to fetch.
     */
    where: PipelineCoverageMetricsWhereUniqueInput
  }

  /**
   * PipelineCoverageMetrics findFirst
   */
  export type PipelineCoverageMetricsFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PipelineCoverageMetrics
     */
    select?: PipelineCoverageMetricsSelect<ExtArgs> | null
    /**
     * Filter, which PipelineCoverageMetrics to fetch.
     */
    where?: PipelineCoverageMetricsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PipelineCoverageMetrics to fetch.
     */
    orderBy?: PipelineCoverageMetricsOrderByWithRelationInput | PipelineCoverageMetricsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PipelineCoverageMetrics.
     */
    cursor?: PipelineCoverageMetricsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PipelineCoverageMetrics from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PipelineCoverageMetrics.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PipelineCoverageMetrics.
     */
    distinct?: PipelineCoverageMetricsScalarFieldEnum | PipelineCoverageMetricsScalarFieldEnum[]
  }

  /**
   * PipelineCoverageMetrics findFirstOrThrow
   */
  export type PipelineCoverageMetricsFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PipelineCoverageMetrics
     */
    select?: PipelineCoverageMetricsSelect<ExtArgs> | null
    /**
     * Filter, which PipelineCoverageMetrics to fetch.
     */
    where?: PipelineCoverageMetricsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PipelineCoverageMetrics to fetch.
     */
    orderBy?: PipelineCoverageMetricsOrderByWithRelationInput | PipelineCoverageMetricsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PipelineCoverageMetrics.
     */
    cursor?: PipelineCoverageMetricsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PipelineCoverageMetrics from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PipelineCoverageMetrics.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PipelineCoverageMetrics.
     */
    distinct?: PipelineCoverageMetricsScalarFieldEnum | PipelineCoverageMetricsScalarFieldEnum[]
  }

  /**
   * PipelineCoverageMetrics findMany
   */
  export type PipelineCoverageMetricsFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PipelineCoverageMetrics
     */
    select?: PipelineCoverageMetricsSelect<ExtArgs> | null
    /**
     * Filter, which PipelineCoverageMetrics to fetch.
     */
    where?: PipelineCoverageMetricsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PipelineCoverageMetrics to fetch.
     */
    orderBy?: PipelineCoverageMetricsOrderByWithRelationInput | PipelineCoverageMetricsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PipelineCoverageMetrics.
     */
    cursor?: PipelineCoverageMetricsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PipelineCoverageMetrics from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PipelineCoverageMetrics.
     */
    skip?: number
    distinct?: PipelineCoverageMetricsScalarFieldEnum | PipelineCoverageMetricsScalarFieldEnum[]
  }

  /**
   * PipelineCoverageMetrics create
   */
  export type PipelineCoverageMetricsCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PipelineCoverageMetrics
     */
    select?: PipelineCoverageMetricsSelect<ExtArgs> | null
    /**
     * The data needed to create a PipelineCoverageMetrics.
     */
    data: XOR<PipelineCoverageMetricsCreateInput, PipelineCoverageMetricsUncheckedCreateInput>
  }

  /**
   * PipelineCoverageMetrics createMany
   */
  export type PipelineCoverageMetricsCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PipelineCoverageMetrics.
     */
    data: PipelineCoverageMetricsCreateManyInput | PipelineCoverageMetricsCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PipelineCoverageMetrics createManyAndReturn
   */
  export type PipelineCoverageMetricsCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PipelineCoverageMetrics
     */
    select?: PipelineCoverageMetricsSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many PipelineCoverageMetrics.
     */
    data: PipelineCoverageMetricsCreateManyInput | PipelineCoverageMetricsCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PipelineCoverageMetrics update
   */
  export type PipelineCoverageMetricsUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PipelineCoverageMetrics
     */
    select?: PipelineCoverageMetricsSelect<ExtArgs> | null
    /**
     * The data needed to update a PipelineCoverageMetrics.
     */
    data: XOR<PipelineCoverageMetricsUpdateInput, PipelineCoverageMetricsUncheckedUpdateInput>
    /**
     * Choose, which PipelineCoverageMetrics to update.
     */
    where: PipelineCoverageMetricsWhereUniqueInput
  }

  /**
   * PipelineCoverageMetrics updateMany
   */
  export type PipelineCoverageMetricsUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PipelineCoverageMetrics.
     */
    data: XOR<PipelineCoverageMetricsUpdateManyMutationInput, PipelineCoverageMetricsUncheckedUpdateManyInput>
    /**
     * Filter which PipelineCoverageMetrics to update
     */
    where?: PipelineCoverageMetricsWhereInput
  }

  /**
   * PipelineCoverageMetrics upsert
   */
  export type PipelineCoverageMetricsUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PipelineCoverageMetrics
     */
    select?: PipelineCoverageMetricsSelect<ExtArgs> | null
    /**
     * The filter to search for the PipelineCoverageMetrics to update in case it exists.
     */
    where: PipelineCoverageMetricsWhereUniqueInput
    /**
     * In case the PipelineCoverageMetrics found by the `where` argument doesn't exist, create a new PipelineCoverageMetrics with this data.
     */
    create: XOR<PipelineCoverageMetricsCreateInput, PipelineCoverageMetricsUncheckedCreateInput>
    /**
     * In case the PipelineCoverageMetrics was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PipelineCoverageMetricsUpdateInput, PipelineCoverageMetricsUncheckedUpdateInput>
  }

  /**
   * PipelineCoverageMetrics delete
   */
  export type PipelineCoverageMetricsDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PipelineCoverageMetrics
     */
    select?: PipelineCoverageMetricsSelect<ExtArgs> | null
    /**
     * Filter which PipelineCoverageMetrics to delete.
     */
    where: PipelineCoverageMetricsWhereUniqueInput
  }

  /**
   * PipelineCoverageMetrics deleteMany
   */
  export type PipelineCoverageMetricsDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PipelineCoverageMetrics to delete
     */
    where?: PipelineCoverageMetricsWhereInput
  }

  /**
   * PipelineCoverageMetrics without action
   */
  export type PipelineCoverageMetricsDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PipelineCoverageMetrics
     */
    select?: PipelineCoverageMetricsSelect<ExtArgs> | null
  }


  /**
   * Model HistoricalConversionRate
   */

  export type AggregateHistoricalConversionRate = {
    _count: HistoricalConversionRateCountAggregateOutputType | null
    _avg: HistoricalConversionRateAvgAggregateOutputType | null
    _sum: HistoricalConversionRateSumAggregateOutputType | null
    _min: HistoricalConversionRateMinAggregateOutputType | null
    _max: HistoricalConversionRateMaxAggregateOutputType | null
  }

  export type HistoricalConversionRateAvgAggregateOutputType = {
    conversionRate: number | null
    sampleSize: number | null
  }

  export type HistoricalConversionRateSumAggregateOutputType = {
    conversionRate: number | null
    sampleSize: number | null
  }

  export type HistoricalConversionRateMinAggregateOutputType = {
    id: string | null
    tenantId: string | null
    fromStage: string | null
    toStage: string | null
    conversionRate: number | null
    sampleSize: number | null
    computedFromPeriod: string | null
    periodName: string | null
    computedAt: Date | null
  }

  export type HistoricalConversionRateMaxAggregateOutputType = {
    id: string | null
    tenantId: string | null
    fromStage: string | null
    toStage: string | null
    conversionRate: number | null
    sampleSize: number | null
    computedFromPeriod: string | null
    periodName: string | null
    computedAt: Date | null
  }

  export type HistoricalConversionRateCountAggregateOutputType = {
    id: number
    tenantId: number
    fromStage: number
    toStage: number
    conversionRate: number
    sampleSize: number
    computedFromPeriod: number
    periodName: number
    computedAt: number
    _all: number
  }


  export type HistoricalConversionRateAvgAggregateInputType = {
    conversionRate?: true
    sampleSize?: true
  }

  export type HistoricalConversionRateSumAggregateInputType = {
    conversionRate?: true
    sampleSize?: true
  }

  export type HistoricalConversionRateMinAggregateInputType = {
    id?: true
    tenantId?: true
    fromStage?: true
    toStage?: true
    conversionRate?: true
    sampleSize?: true
    computedFromPeriod?: true
    periodName?: true
    computedAt?: true
  }

  export type HistoricalConversionRateMaxAggregateInputType = {
    id?: true
    tenantId?: true
    fromStage?: true
    toStage?: true
    conversionRate?: true
    sampleSize?: true
    computedFromPeriod?: true
    periodName?: true
    computedAt?: true
  }

  export type HistoricalConversionRateCountAggregateInputType = {
    id?: true
    tenantId?: true
    fromStage?: true
    toStage?: true
    conversionRate?: true
    sampleSize?: true
    computedFromPeriod?: true
    periodName?: true
    computedAt?: true
    _all?: true
  }

  export type HistoricalConversionRateAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which HistoricalConversionRate to aggregate.
     */
    where?: HistoricalConversionRateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of HistoricalConversionRates to fetch.
     */
    orderBy?: HistoricalConversionRateOrderByWithRelationInput | HistoricalConversionRateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: HistoricalConversionRateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` HistoricalConversionRates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` HistoricalConversionRates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned HistoricalConversionRates
    **/
    _count?: true | HistoricalConversionRateCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: HistoricalConversionRateAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: HistoricalConversionRateSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: HistoricalConversionRateMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: HistoricalConversionRateMaxAggregateInputType
  }

  export type GetHistoricalConversionRateAggregateType<T extends HistoricalConversionRateAggregateArgs> = {
        [P in keyof T & keyof AggregateHistoricalConversionRate]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateHistoricalConversionRate[P]>
      : GetScalarType<T[P], AggregateHistoricalConversionRate[P]>
  }




  export type HistoricalConversionRateGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: HistoricalConversionRateWhereInput
    orderBy?: HistoricalConversionRateOrderByWithAggregationInput | HistoricalConversionRateOrderByWithAggregationInput[]
    by: HistoricalConversionRateScalarFieldEnum[] | HistoricalConversionRateScalarFieldEnum
    having?: HistoricalConversionRateScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: HistoricalConversionRateCountAggregateInputType | true
    _avg?: HistoricalConversionRateAvgAggregateInputType
    _sum?: HistoricalConversionRateSumAggregateInputType
    _min?: HistoricalConversionRateMinAggregateInputType
    _max?: HistoricalConversionRateMaxAggregateInputType
  }

  export type HistoricalConversionRateGroupByOutputType = {
    id: string
    tenantId: string
    fromStage: string
    toStage: string
    conversionRate: number
    sampleSize: number
    computedFromPeriod: string
    periodName: string | null
    computedAt: Date
    _count: HistoricalConversionRateCountAggregateOutputType | null
    _avg: HistoricalConversionRateAvgAggregateOutputType | null
    _sum: HistoricalConversionRateSumAggregateOutputType | null
    _min: HistoricalConversionRateMinAggregateOutputType | null
    _max: HistoricalConversionRateMaxAggregateOutputType | null
  }

  type GetHistoricalConversionRateGroupByPayload<T extends HistoricalConversionRateGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<HistoricalConversionRateGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof HistoricalConversionRateGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], HistoricalConversionRateGroupByOutputType[P]>
            : GetScalarType<T[P], HistoricalConversionRateGroupByOutputType[P]>
        }
      >
    >


  export type HistoricalConversionRateSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    fromStage?: boolean
    toStage?: boolean
    conversionRate?: boolean
    sampleSize?: boolean
    computedFromPeriod?: boolean
    periodName?: boolean
    computedAt?: boolean
  }, ExtArgs["result"]["historicalConversionRate"]>

  export type HistoricalConversionRateSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    fromStage?: boolean
    toStage?: boolean
    conversionRate?: boolean
    sampleSize?: boolean
    computedFromPeriod?: boolean
    periodName?: boolean
    computedAt?: boolean
  }, ExtArgs["result"]["historicalConversionRate"]>

  export type HistoricalConversionRateSelectScalar = {
    id?: boolean
    tenantId?: boolean
    fromStage?: boolean
    toStage?: boolean
    conversionRate?: boolean
    sampleSize?: boolean
    computedFromPeriod?: boolean
    periodName?: boolean
    computedAt?: boolean
  }


  export type $HistoricalConversionRatePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "HistoricalConversionRate"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenantId: string
      fromStage: string
      toStage: string
      conversionRate: number
      sampleSize: number
      computedFromPeriod: string
      periodName: string | null
      computedAt: Date
    }, ExtArgs["result"]["historicalConversionRate"]>
    composites: {}
  }

  type HistoricalConversionRateGetPayload<S extends boolean | null | undefined | HistoricalConversionRateDefaultArgs> = $Result.GetResult<Prisma.$HistoricalConversionRatePayload, S>

  type HistoricalConversionRateCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<HistoricalConversionRateFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: HistoricalConversionRateCountAggregateInputType | true
    }

  export interface HistoricalConversionRateDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['HistoricalConversionRate'], meta: { name: 'HistoricalConversionRate' } }
    /**
     * Find zero or one HistoricalConversionRate that matches the filter.
     * @param {HistoricalConversionRateFindUniqueArgs} args - Arguments to find a HistoricalConversionRate
     * @example
     * // Get one HistoricalConversionRate
     * const historicalConversionRate = await prisma.historicalConversionRate.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends HistoricalConversionRateFindUniqueArgs>(args: SelectSubset<T, HistoricalConversionRateFindUniqueArgs<ExtArgs>>): Prisma__HistoricalConversionRateClient<$Result.GetResult<Prisma.$HistoricalConversionRatePayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one HistoricalConversionRate that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {HistoricalConversionRateFindUniqueOrThrowArgs} args - Arguments to find a HistoricalConversionRate
     * @example
     * // Get one HistoricalConversionRate
     * const historicalConversionRate = await prisma.historicalConversionRate.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends HistoricalConversionRateFindUniqueOrThrowArgs>(args: SelectSubset<T, HistoricalConversionRateFindUniqueOrThrowArgs<ExtArgs>>): Prisma__HistoricalConversionRateClient<$Result.GetResult<Prisma.$HistoricalConversionRatePayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first HistoricalConversionRate that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HistoricalConversionRateFindFirstArgs} args - Arguments to find a HistoricalConversionRate
     * @example
     * // Get one HistoricalConversionRate
     * const historicalConversionRate = await prisma.historicalConversionRate.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends HistoricalConversionRateFindFirstArgs>(args?: SelectSubset<T, HistoricalConversionRateFindFirstArgs<ExtArgs>>): Prisma__HistoricalConversionRateClient<$Result.GetResult<Prisma.$HistoricalConversionRatePayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first HistoricalConversionRate that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HistoricalConversionRateFindFirstOrThrowArgs} args - Arguments to find a HistoricalConversionRate
     * @example
     * // Get one HistoricalConversionRate
     * const historicalConversionRate = await prisma.historicalConversionRate.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends HistoricalConversionRateFindFirstOrThrowArgs>(args?: SelectSubset<T, HistoricalConversionRateFindFirstOrThrowArgs<ExtArgs>>): Prisma__HistoricalConversionRateClient<$Result.GetResult<Prisma.$HistoricalConversionRatePayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more HistoricalConversionRates that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HistoricalConversionRateFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all HistoricalConversionRates
     * const historicalConversionRates = await prisma.historicalConversionRate.findMany()
     * 
     * // Get first 10 HistoricalConversionRates
     * const historicalConversionRates = await prisma.historicalConversionRate.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const historicalConversionRateWithIdOnly = await prisma.historicalConversionRate.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends HistoricalConversionRateFindManyArgs>(args?: SelectSubset<T, HistoricalConversionRateFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$HistoricalConversionRatePayload<ExtArgs>, T, "findMany">>

    /**
     * Create a HistoricalConversionRate.
     * @param {HistoricalConversionRateCreateArgs} args - Arguments to create a HistoricalConversionRate.
     * @example
     * // Create one HistoricalConversionRate
     * const HistoricalConversionRate = await prisma.historicalConversionRate.create({
     *   data: {
     *     // ... data to create a HistoricalConversionRate
     *   }
     * })
     * 
     */
    create<T extends HistoricalConversionRateCreateArgs>(args: SelectSubset<T, HistoricalConversionRateCreateArgs<ExtArgs>>): Prisma__HistoricalConversionRateClient<$Result.GetResult<Prisma.$HistoricalConversionRatePayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many HistoricalConversionRates.
     * @param {HistoricalConversionRateCreateManyArgs} args - Arguments to create many HistoricalConversionRates.
     * @example
     * // Create many HistoricalConversionRates
     * const historicalConversionRate = await prisma.historicalConversionRate.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends HistoricalConversionRateCreateManyArgs>(args?: SelectSubset<T, HistoricalConversionRateCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many HistoricalConversionRates and returns the data saved in the database.
     * @param {HistoricalConversionRateCreateManyAndReturnArgs} args - Arguments to create many HistoricalConversionRates.
     * @example
     * // Create many HistoricalConversionRates
     * const historicalConversionRate = await prisma.historicalConversionRate.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many HistoricalConversionRates and only return the `id`
     * const historicalConversionRateWithIdOnly = await prisma.historicalConversionRate.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends HistoricalConversionRateCreateManyAndReturnArgs>(args?: SelectSubset<T, HistoricalConversionRateCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$HistoricalConversionRatePayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a HistoricalConversionRate.
     * @param {HistoricalConversionRateDeleteArgs} args - Arguments to delete one HistoricalConversionRate.
     * @example
     * // Delete one HistoricalConversionRate
     * const HistoricalConversionRate = await prisma.historicalConversionRate.delete({
     *   where: {
     *     // ... filter to delete one HistoricalConversionRate
     *   }
     * })
     * 
     */
    delete<T extends HistoricalConversionRateDeleteArgs>(args: SelectSubset<T, HistoricalConversionRateDeleteArgs<ExtArgs>>): Prisma__HistoricalConversionRateClient<$Result.GetResult<Prisma.$HistoricalConversionRatePayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one HistoricalConversionRate.
     * @param {HistoricalConversionRateUpdateArgs} args - Arguments to update one HistoricalConversionRate.
     * @example
     * // Update one HistoricalConversionRate
     * const historicalConversionRate = await prisma.historicalConversionRate.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends HistoricalConversionRateUpdateArgs>(args: SelectSubset<T, HistoricalConversionRateUpdateArgs<ExtArgs>>): Prisma__HistoricalConversionRateClient<$Result.GetResult<Prisma.$HistoricalConversionRatePayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more HistoricalConversionRates.
     * @param {HistoricalConversionRateDeleteManyArgs} args - Arguments to filter HistoricalConversionRates to delete.
     * @example
     * // Delete a few HistoricalConversionRates
     * const { count } = await prisma.historicalConversionRate.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends HistoricalConversionRateDeleteManyArgs>(args?: SelectSubset<T, HistoricalConversionRateDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more HistoricalConversionRates.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HistoricalConversionRateUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many HistoricalConversionRates
     * const historicalConversionRate = await prisma.historicalConversionRate.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends HistoricalConversionRateUpdateManyArgs>(args: SelectSubset<T, HistoricalConversionRateUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one HistoricalConversionRate.
     * @param {HistoricalConversionRateUpsertArgs} args - Arguments to update or create a HistoricalConversionRate.
     * @example
     * // Update or create a HistoricalConversionRate
     * const historicalConversionRate = await prisma.historicalConversionRate.upsert({
     *   create: {
     *     // ... data to create a HistoricalConversionRate
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the HistoricalConversionRate we want to update
     *   }
     * })
     */
    upsert<T extends HistoricalConversionRateUpsertArgs>(args: SelectSubset<T, HistoricalConversionRateUpsertArgs<ExtArgs>>): Prisma__HistoricalConversionRateClient<$Result.GetResult<Prisma.$HistoricalConversionRatePayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of HistoricalConversionRates.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HistoricalConversionRateCountArgs} args - Arguments to filter HistoricalConversionRates to count.
     * @example
     * // Count the number of HistoricalConversionRates
     * const count = await prisma.historicalConversionRate.count({
     *   where: {
     *     // ... the filter for the HistoricalConversionRates we want to count
     *   }
     * })
    **/
    count<T extends HistoricalConversionRateCountArgs>(
      args?: Subset<T, HistoricalConversionRateCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], HistoricalConversionRateCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a HistoricalConversionRate.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HistoricalConversionRateAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends HistoricalConversionRateAggregateArgs>(args: Subset<T, HistoricalConversionRateAggregateArgs>): Prisma.PrismaPromise<GetHistoricalConversionRateAggregateType<T>>

    /**
     * Group by HistoricalConversionRate.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HistoricalConversionRateGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends HistoricalConversionRateGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: HistoricalConversionRateGroupByArgs['orderBy'] }
        : { orderBy?: HistoricalConversionRateGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, HistoricalConversionRateGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetHistoricalConversionRateGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the HistoricalConversionRate model
   */
  readonly fields: HistoricalConversionRateFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for HistoricalConversionRate.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__HistoricalConversionRateClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the HistoricalConversionRate model
   */ 
  interface HistoricalConversionRateFieldRefs {
    readonly id: FieldRef<"HistoricalConversionRate", 'String'>
    readonly tenantId: FieldRef<"HistoricalConversionRate", 'String'>
    readonly fromStage: FieldRef<"HistoricalConversionRate", 'String'>
    readonly toStage: FieldRef<"HistoricalConversionRate", 'String'>
    readonly conversionRate: FieldRef<"HistoricalConversionRate", 'Float'>
    readonly sampleSize: FieldRef<"HistoricalConversionRate", 'Int'>
    readonly computedFromPeriod: FieldRef<"HistoricalConversionRate", 'String'>
    readonly periodName: FieldRef<"HistoricalConversionRate", 'String'>
    readonly computedAt: FieldRef<"HistoricalConversionRate", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * HistoricalConversionRate findUnique
   */
  export type HistoricalConversionRateFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HistoricalConversionRate
     */
    select?: HistoricalConversionRateSelect<ExtArgs> | null
    /**
     * Filter, which HistoricalConversionRate to fetch.
     */
    where: HistoricalConversionRateWhereUniqueInput
  }

  /**
   * HistoricalConversionRate findUniqueOrThrow
   */
  export type HistoricalConversionRateFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HistoricalConversionRate
     */
    select?: HistoricalConversionRateSelect<ExtArgs> | null
    /**
     * Filter, which HistoricalConversionRate to fetch.
     */
    where: HistoricalConversionRateWhereUniqueInput
  }

  /**
   * HistoricalConversionRate findFirst
   */
  export type HistoricalConversionRateFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HistoricalConversionRate
     */
    select?: HistoricalConversionRateSelect<ExtArgs> | null
    /**
     * Filter, which HistoricalConversionRate to fetch.
     */
    where?: HistoricalConversionRateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of HistoricalConversionRates to fetch.
     */
    orderBy?: HistoricalConversionRateOrderByWithRelationInput | HistoricalConversionRateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for HistoricalConversionRates.
     */
    cursor?: HistoricalConversionRateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` HistoricalConversionRates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` HistoricalConversionRates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of HistoricalConversionRates.
     */
    distinct?: HistoricalConversionRateScalarFieldEnum | HistoricalConversionRateScalarFieldEnum[]
  }

  /**
   * HistoricalConversionRate findFirstOrThrow
   */
  export type HistoricalConversionRateFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HistoricalConversionRate
     */
    select?: HistoricalConversionRateSelect<ExtArgs> | null
    /**
     * Filter, which HistoricalConversionRate to fetch.
     */
    where?: HistoricalConversionRateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of HistoricalConversionRates to fetch.
     */
    orderBy?: HistoricalConversionRateOrderByWithRelationInput | HistoricalConversionRateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for HistoricalConversionRates.
     */
    cursor?: HistoricalConversionRateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` HistoricalConversionRates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` HistoricalConversionRates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of HistoricalConversionRates.
     */
    distinct?: HistoricalConversionRateScalarFieldEnum | HistoricalConversionRateScalarFieldEnum[]
  }

  /**
   * HistoricalConversionRate findMany
   */
  export type HistoricalConversionRateFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HistoricalConversionRate
     */
    select?: HistoricalConversionRateSelect<ExtArgs> | null
    /**
     * Filter, which HistoricalConversionRates to fetch.
     */
    where?: HistoricalConversionRateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of HistoricalConversionRates to fetch.
     */
    orderBy?: HistoricalConversionRateOrderByWithRelationInput | HistoricalConversionRateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing HistoricalConversionRates.
     */
    cursor?: HistoricalConversionRateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` HistoricalConversionRates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` HistoricalConversionRates.
     */
    skip?: number
    distinct?: HistoricalConversionRateScalarFieldEnum | HistoricalConversionRateScalarFieldEnum[]
  }

  /**
   * HistoricalConversionRate create
   */
  export type HistoricalConversionRateCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HistoricalConversionRate
     */
    select?: HistoricalConversionRateSelect<ExtArgs> | null
    /**
     * The data needed to create a HistoricalConversionRate.
     */
    data: XOR<HistoricalConversionRateCreateInput, HistoricalConversionRateUncheckedCreateInput>
  }

  /**
   * HistoricalConversionRate createMany
   */
  export type HistoricalConversionRateCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many HistoricalConversionRates.
     */
    data: HistoricalConversionRateCreateManyInput | HistoricalConversionRateCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * HistoricalConversionRate createManyAndReturn
   */
  export type HistoricalConversionRateCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HistoricalConversionRate
     */
    select?: HistoricalConversionRateSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many HistoricalConversionRates.
     */
    data: HistoricalConversionRateCreateManyInput | HistoricalConversionRateCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * HistoricalConversionRate update
   */
  export type HistoricalConversionRateUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HistoricalConversionRate
     */
    select?: HistoricalConversionRateSelect<ExtArgs> | null
    /**
     * The data needed to update a HistoricalConversionRate.
     */
    data: XOR<HistoricalConversionRateUpdateInput, HistoricalConversionRateUncheckedUpdateInput>
    /**
     * Choose, which HistoricalConversionRate to update.
     */
    where: HistoricalConversionRateWhereUniqueInput
  }

  /**
   * HistoricalConversionRate updateMany
   */
  export type HistoricalConversionRateUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update HistoricalConversionRates.
     */
    data: XOR<HistoricalConversionRateUpdateManyMutationInput, HistoricalConversionRateUncheckedUpdateManyInput>
    /**
     * Filter which HistoricalConversionRates to update
     */
    where?: HistoricalConversionRateWhereInput
  }

  /**
   * HistoricalConversionRate upsert
   */
  export type HistoricalConversionRateUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HistoricalConversionRate
     */
    select?: HistoricalConversionRateSelect<ExtArgs> | null
    /**
     * The filter to search for the HistoricalConversionRate to update in case it exists.
     */
    where: HistoricalConversionRateWhereUniqueInput
    /**
     * In case the HistoricalConversionRate found by the `where` argument doesn't exist, create a new HistoricalConversionRate with this data.
     */
    create: XOR<HistoricalConversionRateCreateInput, HistoricalConversionRateUncheckedCreateInput>
    /**
     * In case the HistoricalConversionRate was found with the provided `where` argument, update it with this data.
     */
    update: XOR<HistoricalConversionRateUpdateInput, HistoricalConversionRateUncheckedUpdateInput>
  }

  /**
   * HistoricalConversionRate delete
   */
  export type HistoricalConversionRateDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HistoricalConversionRate
     */
    select?: HistoricalConversionRateSelect<ExtArgs> | null
    /**
     * Filter which HistoricalConversionRate to delete.
     */
    where: HistoricalConversionRateWhereUniqueInput
  }

  /**
   * HistoricalConversionRate deleteMany
   */
  export type HistoricalConversionRateDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which HistoricalConversionRates to delete
     */
    where?: HistoricalConversionRateWhereInput
  }

  /**
   * HistoricalConversionRate without action
   */
  export type HistoricalConversionRateDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HistoricalConversionRate
     */
    select?: HistoricalConversionRateSelect<ExtArgs> | null
  }


  /**
   * Model ForecastSubmission
   */

  export type AggregateForecastSubmission = {
    _count: ForecastSubmissionCountAggregateOutputType | null
    _avg: ForecastSubmissionAvgAggregateOutputType | null
    _sum: ForecastSubmissionSumAggregateOutputType | null
    _min: ForecastSubmissionMinAggregateOutputType | null
    _max: ForecastSubmissionMaxAggregateOutputType | null
  }

  export type ForecastSubmissionAvgAggregateOutputType = {
    version: number | null
    commitForecast: number | null
    bestCaseForecast: number | null
    managerOverride: number | null
  }

  export type ForecastSubmissionSumAggregateOutputType = {
    version: number | null
    commitForecast: number | null
    bestCaseForecast: number | null
    managerOverride: number | null
  }

  export type ForecastSubmissionMinAggregateOutputType = {
    id: string | null
    tenantId: string | null
    periodId: string | null
    repUserId: string | null
    lob: string | null
    version: number | null
    commitForecast: number | null
    bestCaseForecast: number | null
    notes: string | null
    status: string | null
    submittedAt: Date | null
    managerOverride: number | null
    managerComment: string | null
    managerId: string | null
    managerName: string | null
    approvedAt: Date | null
    reopenedAt: Date | null
    overriddenAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ForecastSubmissionMaxAggregateOutputType = {
    id: string | null
    tenantId: string | null
    periodId: string | null
    repUserId: string | null
    lob: string | null
    version: number | null
    commitForecast: number | null
    bestCaseForecast: number | null
    notes: string | null
    status: string | null
    submittedAt: Date | null
    managerOverride: number | null
    managerComment: string | null
    managerId: string | null
    managerName: string | null
    approvedAt: Date | null
    reopenedAt: Date | null
    overriddenAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ForecastSubmissionCountAggregateOutputType = {
    id: number
    tenantId: number
    periodId: number
    repUserId: number
    lob: number
    version: number
    commitForecast: number
    bestCaseForecast: number
    notes: number
    status: number
    submittedAt: number
    managerOverride: number
    managerComment: number
    managerId: number
    managerName: number
    approvedAt: number
    reopenedAt: number
    overriddenAt: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ForecastSubmissionAvgAggregateInputType = {
    version?: true
    commitForecast?: true
    bestCaseForecast?: true
    managerOverride?: true
  }

  export type ForecastSubmissionSumAggregateInputType = {
    version?: true
    commitForecast?: true
    bestCaseForecast?: true
    managerOverride?: true
  }

  export type ForecastSubmissionMinAggregateInputType = {
    id?: true
    tenantId?: true
    periodId?: true
    repUserId?: true
    lob?: true
    version?: true
    commitForecast?: true
    bestCaseForecast?: true
    notes?: true
    status?: true
    submittedAt?: true
    managerOverride?: true
    managerComment?: true
    managerId?: true
    managerName?: true
    approvedAt?: true
    reopenedAt?: true
    overriddenAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ForecastSubmissionMaxAggregateInputType = {
    id?: true
    tenantId?: true
    periodId?: true
    repUserId?: true
    lob?: true
    version?: true
    commitForecast?: true
    bestCaseForecast?: true
    notes?: true
    status?: true
    submittedAt?: true
    managerOverride?: true
    managerComment?: true
    managerId?: true
    managerName?: true
    approvedAt?: true
    reopenedAt?: true
    overriddenAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ForecastSubmissionCountAggregateInputType = {
    id?: true
    tenantId?: true
    periodId?: true
    repUserId?: true
    lob?: true
    version?: true
    commitForecast?: true
    bestCaseForecast?: true
    notes?: true
    status?: true
    submittedAt?: true
    managerOverride?: true
    managerComment?: true
    managerId?: true
    managerName?: true
    approvedAt?: true
    reopenedAt?: true
    overriddenAt?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ForecastSubmissionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ForecastSubmission to aggregate.
     */
    where?: ForecastSubmissionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ForecastSubmissions to fetch.
     */
    orderBy?: ForecastSubmissionOrderByWithRelationInput | ForecastSubmissionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ForecastSubmissionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ForecastSubmissions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ForecastSubmissions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ForecastSubmissions
    **/
    _count?: true | ForecastSubmissionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ForecastSubmissionAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ForecastSubmissionSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ForecastSubmissionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ForecastSubmissionMaxAggregateInputType
  }

  export type GetForecastSubmissionAggregateType<T extends ForecastSubmissionAggregateArgs> = {
        [P in keyof T & keyof AggregateForecastSubmission]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateForecastSubmission[P]>
      : GetScalarType<T[P], AggregateForecastSubmission[P]>
  }




  export type ForecastSubmissionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ForecastSubmissionWhereInput
    orderBy?: ForecastSubmissionOrderByWithAggregationInput | ForecastSubmissionOrderByWithAggregationInput[]
    by: ForecastSubmissionScalarFieldEnum[] | ForecastSubmissionScalarFieldEnum
    having?: ForecastSubmissionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ForecastSubmissionCountAggregateInputType | true
    _avg?: ForecastSubmissionAvgAggregateInputType
    _sum?: ForecastSubmissionSumAggregateInputType
    _min?: ForecastSubmissionMinAggregateInputType
    _max?: ForecastSubmissionMaxAggregateInputType
  }

  export type ForecastSubmissionGroupByOutputType = {
    id: string
    tenantId: string
    periodId: string
    repUserId: string
    lob: string
    version: number
    commitForecast: number
    bestCaseForecast: number | null
    notes: string | null
    status: string
    submittedAt: Date | null
    managerOverride: number | null
    managerComment: string | null
    managerId: string | null
    managerName: string | null
    approvedAt: Date | null
    reopenedAt: Date | null
    overriddenAt: Date | null
    createdAt: Date
    updatedAt: Date
    _count: ForecastSubmissionCountAggregateOutputType | null
    _avg: ForecastSubmissionAvgAggregateOutputType | null
    _sum: ForecastSubmissionSumAggregateOutputType | null
    _min: ForecastSubmissionMinAggregateOutputType | null
    _max: ForecastSubmissionMaxAggregateOutputType | null
  }

  type GetForecastSubmissionGroupByPayload<T extends ForecastSubmissionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ForecastSubmissionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ForecastSubmissionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ForecastSubmissionGroupByOutputType[P]>
            : GetScalarType<T[P], ForecastSubmissionGroupByOutputType[P]>
        }
      >
    >


  export type ForecastSubmissionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    periodId?: boolean
    repUserId?: boolean
    lob?: boolean
    version?: boolean
    commitForecast?: boolean
    bestCaseForecast?: boolean
    notes?: boolean
    status?: boolean
    submittedAt?: boolean
    managerOverride?: boolean
    managerComment?: boolean
    managerId?: boolean
    managerName?: boolean
    approvedAt?: boolean
    reopenedAt?: boolean
    overriddenAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    period?: boolean | ForecastPeriodDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["forecastSubmission"]>

  export type ForecastSubmissionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    periodId?: boolean
    repUserId?: boolean
    lob?: boolean
    version?: boolean
    commitForecast?: boolean
    bestCaseForecast?: boolean
    notes?: boolean
    status?: boolean
    submittedAt?: boolean
    managerOverride?: boolean
    managerComment?: boolean
    managerId?: boolean
    managerName?: boolean
    approvedAt?: boolean
    reopenedAt?: boolean
    overriddenAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    period?: boolean | ForecastPeriodDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["forecastSubmission"]>

  export type ForecastSubmissionSelectScalar = {
    id?: boolean
    tenantId?: boolean
    periodId?: boolean
    repUserId?: boolean
    lob?: boolean
    version?: boolean
    commitForecast?: boolean
    bestCaseForecast?: boolean
    notes?: boolean
    status?: boolean
    submittedAt?: boolean
    managerOverride?: boolean
    managerComment?: boolean
    managerId?: boolean
    managerName?: boolean
    approvedAt?: boolean
    reopenedAt?: boolean
    overriddenAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ForecastSubmissionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    period?: boolean | ForecastPeriodDefaultArgs<ExtArgs>
  }
  export type ForecastSubmissionIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    period?: boolean | ForecastPeriodDefaultArgs<ExtArgs>
  }

  export type $ForecastSubmissionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ForecastSubmission"
    objects: {
      period: Prisma.$ForecastPeriodPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenantId: string
      periodId: string
      repUserId: string
      lob: string
      version: number
      commitForecast: number
      bestCaseForecast: number | null
      notes: string | null
      status: string
      submittedAt: Date | null
      managerOverride: number | null
      managerComment: string | null
      managerId: string | null
      managerName: string | null
      approvedAt: Date | null
      reopenedAt: Date | null
      overriddenAt: Date | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["forecastSubmission"]>
    composites: {}
  }

  type ForecastSubmissionGetPayload<S extends boolean | null | undefined | ForecastSubmissionDefaultArgs> = $Result.GetResult<Prisma.$ForecastSubmissionPayload, S>

  type ForecastSubmissionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<ForecastSubmissionFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: ForecastSubmissionCountAggregateInputType | true
    }

  export interface ForecastSubmissionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ForecastSubmission'], meta: { name: 'ForecastSubmission' } }
    /**
     * Find zero or one ForecastSubmission that matches the filter.
     * @param {ForecastSubmissionFindUniqueArgs} args - Arguments to find a ForecastSubmission
     * @example
     * // Get one ForecastSubmission
     * const forecastSubmission = await prisma.forecastSubmission.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ForecastSubmissionFindUniqueArgs>(args: SelectSubset<T, ForecastSubmissionFindUniqueArgs<ExtArgs>>): Prisma__ForecastSubmissionClient<$Result.GetResult<Prisma.$ForecastSubmissionPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one ForecastSubmission that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {ForecastSubmissionFindUniqueOrThrowArgs} args - Arguments to find a ForecastSubmission
     * @example
     * // Get one ForecastSubmission
     * const forecastSubmission = await prisma.forecastSubmission.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ForecastSubmissionFindUniqueOrThrowArgs>(args: SelectSubset<T, ForecastSubmissionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ForecastSubmissionClient<$Result.GetResult<Prisma.$ForecastSubmissionPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first ForecastSubmission that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ForecastSubmissionFindFirstArgs} args - Arguments to find a ForecastSubmission
     * @example
     * // Get one ForecastSubmission
     * const forecastSubmission = await prisma.forecastSubmission.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ForecastSubmissionFindFirstArgs>(args?: SelectSubset<T, ForecastSubmissionFindFirstArgs<ExtArgs>>): Prisma__ForecastSubmissionClient<$Result.GetResult<Prisma.$ForecastSubmissionPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first ForecastSubmission that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ForecastSubmissionFindFirstOrThrowArgs} args - Arguments to find a ForecastSubmission
     * @example
     * // Get one ForecastSubmission
     * const forecastSubmission = await prisma.forecastSubmission.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ForecastSubmissionFindFirstOrThrowArgs>(args?: SelectSubset<T, ForecastSubmissionFindFirstOrThrowArgs<ExtArgs>>): Prisma__ForecastSubmissionClient<$Result.GetResult<Prisma.$ForecastSubmissionPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more ForecastSubmissions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ForecastSubmissionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ForecastSubmissions
     * const forecastSubmissions = await prisma.forecastSubmission.findMany()
     * 
     * // Get first 10 ForecastSubmissions
     * const forecastSubmissions = await prisma.forecastSubmission.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const forecastSubmissionWithIdOnly = await prisma.forecastSubmission.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ForecastSubmissionFindManyArgs>(args?: SelectSubset<T, ForecastSubmissionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ForecastSubmissionPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a ForecastSubmission.
     * @param {ForecastSubmissionCreateArgs} args - Arguments to create a ForecastSubmission.
     * @example
     * // Create one ForecastSubmission
     * const ForecastSubmission = await prisma.forecastSubmission.create({
     *   data: {
     *     // ... data to create a ForecastSubmission
     *   }
     * })
     * 
     */
    create<T extends ForecastSubmissionCreateArgs>(args: SelectSubset<T, ForecastSubmissionCreateArgs<ExtArgs>>): Prisma__ForecastSubmissionClient<$Result.GetResult<Prisma.$ForecastSubmissionPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many ForecastSubmissions.
     * @param {ForecastSubmissionCreateManyArgs} args - Arguments to create many ForecastSubmissions.
     * @example
     * // Create many ForecastSubmissions
     * const forecastSubmission = await prisma.forecastSubmission.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ForecastSubmissionCreateManyArgs>(args?: SelectSubset<T, ForecastSubmissionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ForecastSubmissions and returns the data saved in the database.
     * @param {ForecastSubmissionCreateManyAndReturnArgs} args - Arguments to create many ForecastSubmissions.
     * @example
     * // Create many ForecastSubmissions
     * const forecastSubmission = await prisma.forecastSubmission.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ForecastSubmissions and only return the `id`
     * const forecastSubmissionWithIdOnly = await prisma.forecastSubmission.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ForecastSubmissionCreateManyAndReturnArgs>(args?: SelectSubset<T, ForecastSubmissionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ForecastSubmissionPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a ForecastSubmission.
     * @param {ForecastSubmissionDeleteArgs} args - Arguments to delete one ForecastSubmission.
     * @example
     * // Delete one ForecastSubmission
     * const ForecastSubmission = await prisma.forecastSubmission.delete({
     *   where: {
     *     // ... filter to delete one ForecastSubmission
     *   }
     * })
     * 
     */
    delete<T extends ForecastSubmissionDeleteArgs>(args: SelectSubset<T, ForecastSubmissionDeleteArgs<ExtArgs>>): Prisma__ForecastSubmissionClient<$Result.GetResult<Prisma.$ForecastSubmissionPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one ForecastSubmission.
     * @param {ForecastSubmissionUpdateArgs} args - Arguments to update one ForecastSubmission.
     * @example
     * // Update one ForecastSubmission
     * const forecastSubmission = await prisma.forecastSubmission.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ForecastSubmissionUpdateArgs>(args: SelectSubset<T, ForecastSubmissionUpdateArgs<ExtArgs>>): Prisma__ForecastSubmissionClient<$Result.GetResult<Prisma.$ForecastSubmissionPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more ForecastSubmissions.
     * @param {ForecastSubmissionDeleteManyArgs} args - Arguments to filter ForecastSubmissions to delete.
     * @example
     * // Delete a few ForecastSubmissions
     * const { count } = await prisma.forecastSubmission.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ForecastSubmissionDeleteManyArgs>(args?: SelectSubset<T, ForecastSubmissionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ForecastSubmissions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ForecastSubmissionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ForecastSubmissions
     * const forecastSubmission = await prisma.forecastSubmission.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ForecastSubmissionUpdateManyArgs>(args: SelectSubset<T, ForecastSubmissionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one ForecastSubmission.
     * @param {ForecastSubmissionUpsertArgs} args - Arguments to update or create a ForecastSubmission.
     * @example
     * // Update or create a ForecastSubmission
     * const forecastSubmission = await prisma.forecastSubmission.upsert({
     *   create: {
     *     // ... data to create a ForecastSubmission
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ForecastSubmission we want to update
     *   }
     * })
     */
    upsert<T extends ForecastSubmissionUpsertArgs>(args: SelectSubset<T, ForecastSubmissionUpsertArgs<ExtArgs>>): Prisma__ForecastSubmissionClient<$Result.GetResult<Prisma.$ForecastSubmissionPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of ForecastSubmissions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ForecastSubmissionCountArgs} args - Arguments to filter ForecastSubmissions to count.
     * @example
     * // Count the number of ForecastSubmissions
     * const count = await prisma.forecastSubmission.count({
     *   where: {
     *     // ... the filter for the ForecastSubmissions we want to count
     *   }
     * })
    **/
    count<T extends ForecastSubmissionCountArgs>(
      args?: Subset<T, ForecastSubmissionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ForecastSubmissionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ForecastSubmission.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ForecastSubmissionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ForecastSubmissionAggregateArgs>(args: Subset<T, ForecastSubmissionAggregateArgs>): Prisma.PrismaPromise<GetForecastSubmissionAggregateType<T>>

    /**
     * Group by ForecastSubmission.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ForecastSubmissionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ForecastSubmissionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ForecastSubmissionGroupByArgs['orderBy'] }
        : { orderBy?: ForecastSubmissionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ForecastSubmissionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetForecastSubmissionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ForecastSubmission model
   */
  readonly fields: ForecastSubmissionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ForecastSubmission.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ForecastSubmissionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    period<T extends ForecastPeriodDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ForecastPeriodDefaultArgs<ExtArgs>>): Prisma__ForecastPeriodClient<$Result.GetResult<Prisma.$ForecastPeriodPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ForecastSubmission model
   */ 
  interface ForecastSubmissionFieldRefs {
    readonly id: FieldRef<"ForecastSubmission", 'String'>
    readonly tenantId: FieldRef<"ForecastSubmission", 'String'>
    readonly periodId: FieldRef<"ForecastSubmission", 'String'>
    readonly repUserId: FieldRef<"ForecastSubmission", 'String'>
    readonly lob: FieldRef<"ForecastSubmission", 'String'>
    readonly version: FieldRef<"ForecastSubmission", 'Int'>
    readonly commitForecast: FieldRef<"ForecastSubmission", 'Float'>
    readonly bestCaseForecast: FieldRef<"ForecastSubmission", 'Float'>
    readonly notes: FieldRef<"ForecastSubmission", 'String'>
    readonly status: FieldRef<"ForecastSubmission", 'String'>
    readonly submittedAt: FieldRef<"ForecastSubmission", 'DateTime'>
    readonly managerOverride: FieldRef<"ForecastSubmission", 'Float'>
    readonly managerComment: FieldRef<"ForecastSubmission", 'String'>
    readonly managerId: FieldRef<"ForecastSubmission", 'String'>
    readonly managerName: FieldRef<"ForecastSubmission", 'String'>
    readonly approvedAt: FieldRef<"ForecastSubmission", 'DateTime'>
    readonly reopenedAt: FieldRef<"ForecastSubmission", 'DateTime'>
    readonly overriddenAt: FieldRef<"ForecastSubmission", 'DateTime'>
    readonly createdAt: FieldRef<"ForecastSubmission", 'DateTime'>
    readonly updatedAt: FieldRef<"ForecastSubmission", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ForecastSubmission findUnique
   */
  export type ForecastSubmissionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ForecastSubmission
     */
    select?: ForecastSubmissionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ForecastSubmissionInclude<ExtArgs> | null
    /**
     * Filter, which ForecastSubmission to fetch.
     */
    where: ForecastSubmissionWhereUniqueInput
  }

  /**
   * ForecastSubmission findUniqueOrThrow
   */
  export type ForecastSubmissionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ForecastSubmission
     */
    select?: ForecastSubmissionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ForecastSubmissionInclude<ExtArgs> | null
    /**
     * Filter, which ForecastSubmission to fetch.
     */
    where: ForecastSubmissionWhereUniqueInput
  }

  /**
   * ForecastSubmission findFirst
   */
  export type ForecastSubmissionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ForecastSubmission
     */
    select?: ForecastSubmissionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ForecastSubmissionInclude<ExtArgs> | null
    /**
     * Filter, which ForecastSubmission to fetch.
     */
    where?: ForecastSubmissionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ForecastSubmissions to fetch.
     */
    orderBy?: ForecastSubmissionOrderByWithRelationInput | ForecastSubmissionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ForecastSubmissions.
     */
    cursor?: ForecastSubmissionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ForecastSubmissions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ForecastSubmissions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ForecastSubmissions.
     */
    distinct?: ForecastSubmissionScalarFieldEnum | ForecastSubmissionScalarFieldEnum[]
  }

  /**
   * ForecastSubmission findFirstOrThrow
   */
  export type ForecastSubmissionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ForecastSubmission
     */
    select?: ForecastSubmissionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ForecastSubmissionInclude<ExtArgs> | null
    /**
     * Filter, which ForecastSubmission to fetch.
     */
    where?: ForecastSubmissionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ForecastSubmissions to fetch.
     */
    orderBy?: ForecastSubmissionOrderByWithRelationInput | ForecastSubmissionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ForecastSubmissions.
     */
    cursor?: ForecastSubmissionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ForecastSubmissions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ForecastSubmissions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ForecastSubmissions.
     */
    distinct?: ForecastSubmissionScalarFieldEnum | ForecastSubmissionScalarFieldEnum[]
  }

  /**
   * ForecastSubmission findMany
   */
  export type ForecastSubmissionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ForecastSubmission
     */
    select?: ForecastSubmissionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ForecastSubmissionInclude<ExtArgs> | null
    /**
     * Filter, which ForecastSubmissions to fetch.
     */
    where?: ForecastSubmissionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ForecastSubmissions to fetch.
     */
    orderBy?: ForecastSubmissionOrderByWithRelationInput | ForecastSubmissionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ForecastSubmissions.
     */
    cursor?: ForecastSubmissionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ForecastSubmissions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ForecastSubmissions.
     */
    skip?: number
    distinct?: ForecastSubmissionScalarFieldEnum | ForecastSubmissionScalarFieldEnum[]
  }

  /**
   * ForecastSubmission create
   */
  export type ForecastSubmissionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ForecastSubmission
     */
    select?: ForecastSubmissionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ForecastSubmissionInclude<ExtArgs> | null
    /**
     * The data needed to create a ForecastSubmission.
     */
    data: XOR<ForecastSubmissionCreateInput, ForecastSubmissionUncheckedCreateInput>
  }

  /**
   * ForecastSubmission createMany
   */
  export type ForecastSubmissionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ForecastSubmissions.
     */
    data: ForecastSubmissionCreateManyInput | ForecastSubmissionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ForecastSubmission createManyAndReturn
   */
  export type ForecastSubmissionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ForecastSubmission
     */
    select?: ForecastSubmissionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many ForecastSubmissions.
     */
    data: ForecastSubmissionCreateManyInput | ForecastSubmissionCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ForecastSubmissionIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * ForecastSubmission update
   */
  export type ForecastSubmissionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ForecastSubmission
     */
    select?: ForecastSubmissionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ForecastSubmissionInclude<ExtArgs> | null
    /**
     * The data needed to update a ForecastSubmission.
     */
    data: XOR<ForecastSubmissionUpdateInput, ForecastSubmissionUncheckedUpdateInput>
    /**
     * Choose, which ForecastSubmission to update.
     */
    where: ForecastSubmissionWhereUniqueInput
  }

  /**
   * ForecastSubmission updateMany
   */
  export type ForecastSubmissionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ForecastSubmissions.
     */
    data: XOR<ForecastSubmissionUpdateManyMutationInput, ForecastSubmissionUncheckedUpdateManyInput>
    /**
     * Filter which ForecastSubmissions to update
     */
    where?: ForecastSubmissionWhereInput
  }

  /**
   * ForecastSubmission upsert
   */
  export type ForecastSubmissionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ForecastSubmission
     */
    select?: ForecastSubmissionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ForecastSubmissionInclude<ExtArgs> | null
    /**
     * The filter to search for the ForecastSubmission to update in case it exists.
     */
    where: ForecastSubmissionWhereUniqueInput
    /**
     * In case the ForecastSubmission found by the `where` argument doesn't exist, create a new ForecastSubmission with this data.
     */
    create: XOR<ForecastSubmissionCreateInput, ForecastSubmissionUncheckedCreateInput>
    /**
     * In case the ForecastSubmission was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ForecastSubmissionUpdateInput, ForecastSubmissionUncheckedUpdateInput>
  }

  /**
   * ForecastSubmission delete
   */
  export type ForecastSubmissionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ForecastSubmission
     */
    select?: ForecastSubmissionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ForecastSubmissionInclude<ExtArgs> | null
    /**
     * Filter which ForecastSubmission to delete.
     */
    where: ForecastSubmissionWhereUniqueInput
  }

  /**
   * ForecastSubmission deleteMany
   */
  export type ForecastSubmissionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ForecastSubmissions to delete
     */
    where?: ForecastSubmissionWhereInput
  }

  /**
   * ForecastSubmission without action
   */
  export type ForecastSubmissionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ForecastSubmission
     */
    select?: ForecastSubmissionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ForecastSubmissionInclude<ExtArgs> | null
  }


  /**
   * Model ForecastAuditLog
   */

  export type AggregateForecastAuditLog = {
    _count: ForecastAuditLogCountAggregateOutputType | null
    _min: ForecastAuditLogMinAggregateOutputType | null
    _max: ForecastAuditLogMaxAggregateOutputType | null
  }

  export type ForecastAuditLogMinAggregateOutputType = {
    id: string | null
    tenantId: string | null
    forecastSubmissionId: string | null
    action: string | null
    actorId: string | null
    actorName: string | null
    actorRole: string | null
    createdAt: Date | null
  }

  export type ForecastAuditLogMaxAggregateOutputType = {
    id: string | null
    tenantId: string | null
    forecastSubmissionId: string | null
    action: string | null
    actorId: string | null
    actorName: string | null
    actorRole: string | null
    createdAt: Date | null
  }

  export type ForecastAuditLogCountAggregateOutputType = {
    id: number
    tenantId: number
    forecastSubmissionId: number
    action: number
    actorId: number
    actorName: number
    actorRole: number
    metadata: number
    createdAt: number
    _all: number
  }


  export type ForecastAuditLogMinAggregateInputType = {
    id?: true
    tenantId?: true
    forecastSubmissionId?: true
    action?: true
    actorId?: true
    actorName?: true
    actorRole?: true
    createdAt?: true
  }

  export type ForecastAuditLogMaxAggregateInputType = {
    id?: true
    tenantId?: true
    forecastSubmissionId?: true
    action?: true
    actorId?: true
    actorName?: true
    actorRole?: true
    createdAt?: true
  }

  export type ForecastAuditLogCountAggregateInputType = {
    id?: true
    tenantId?: true
    forecastSubmissionId?: true
    action?: true
    actorId?: true
    actorName?: true
    actorRole?: true
    metadata?: true
    createdAt?: true
    _all?: true
  }

  export type ForecastAuditLogAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ForecastAuditLog to aggregate.
     */
    where?: ForecastAuditLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ForecastAuditLogs to fetch.
     */
    orderBy?: ForecastAuditLogOrderByWithRelationInput | ForecastAuditLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ForecastAuditLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ForecastAuditLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ForecastAuditLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ForecastAuditLogs
    **/
    _count?: true | ForecastAuditLogCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ForecastAuditLogMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ForecastAuditLogMaxAggregateInputType
  }

  export type GetForecastAuditLogAggregateType<T extends ForecastAuditLogAggregateArgs> = {
        [P in keyof T & keyof AggregateForecastAuditLog]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateForecastAuditLog[P]>
      : GetScalarType<T[P], AggregateForecastAuditLog[P]>
  }




  export type ForecastAuditLogGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ForecastAuditLogWhereInput
    orderBy?: ForecastAuditLogOrderByWithAggregationInput | ForecastAuditLogOrderByWithAggregationInput[]
    by: ForecastAuditLogScalarFieldEnum[] | ForecastAuditLogScalarFieldEnum
    having?: ForecastAuditLogScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ForecastAuditLogCountAggregateInputType | true
    _min?: ForecastAuditLogMinAggregateInputType
    _max?: ForecastAuditLogMaxAggregateInputType
  }

  export type ForecastAuditLogGroupByOutputType = {
    id: string
    tenantId: string
    forecastSubmissionId: string
    action: string
    actorId: string
    actorName: string | null
    actorRole: string
    metadata: JsonValue | null
    createdAt: Date
    _count: ForecastAuditLogCountAggregateOutputType | null
    _min: ForecastAuditLogMinAggregateOutputType | null
    _max: ForecastAuditLogMaxAggregateOutputType | null
  }

  type GetForecastAuditLogGroupByPayload<T extends ForecastAuditLogGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ForecastAuditLogGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ForecastAuditLogGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ForecastAuditLogGroupByOutputType[P]>
            : GetScalarType<T[P], ForecastAuditLogGroupByOutputType[P]>
        }
      >
    >


  export type ForecastAuditLogSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    forecastSubmissionId?: boolean
    action?: boolean
    actorId?: boolean
    actorName?: boolean
    actorRole?: boolean
    metadata?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["forecastAuditLog"]>

  export type ForecastAuditLogSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    forecastSubmissionId?: boolean
    action?: boolean
    actorId?: boolean
    actorName?: boolean
    actorRole?: boolean
    metadata?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["forecastAuditLog"]>

  export type ForecastAuditLogSelectScalar = {
    id?: boolean
    tenantId?: boolean
    forecastSubmissionId?: boolean
    action?: boolean
    actorId?: boolean
    actorName?: boolean
    actorRole?: boolean
    metadata?: boolean
    createdAt?: boolean
  }


  export type $ForecastAuditLogPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ForecastAuditLog"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenantId: string
      forecastSubmissionId: string
      action: string
      actorId: string
      actorName: string | null
      actorRole: string
      metadata: Prisma.JsonValue | null
      createdAt: Date
    }, ExtArgs["result"]["forecastAuditLog"]>
    composites: {}
  }

  type ForecastAuditLogGetPayload<S extends boolean | null | undefined | ForecastAuditLogDefaultArgs> = $Result.GetResult<Prisma.$ForecastAuditLogPayload, S>

  type ForecastAuditLogCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<ForecastAuditLogFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: ForecastAuditLogCountAggregateInputType | true
    }

  export interface ForecastAuditLogDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ForecastAuditLog'], meta: { name: 'ForecastAuditLog' } }
    /**
     * Find zero or one ForecastAuditLog that matches the filter.
     * @param {ForecastAuditLogFindUniqueArgs} args - Arguments to find a ForecastAuditLog
     * @example
     * // Get one ForecastAuditLog
     * const forecastAuditLog = await prisma.forecastAuditLog.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ForecastAuditLogFindUniqueArgs>(args: SelectSubset<T, ForecastAuditLogFindUniqueArgs<ExtArgs>>): Prisma__ForecastAuditLogClient<$Result.GetResult<Prisma.$ForecastAuditLogPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one ForecastAuditLog that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {ForecastAuditLogFindUniqueOrThrowArgs} args - Arguments to find a ForecastAuditLog
     * @example
     * // Get one ForecastAuditLog
     * const forecastAuditLog = await prisma.forecastAuditLog.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ForecastAuditLogFindUniqueOrThrowArgs>(args: SelectSubset<T, ForecastAuditLogFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ForecastAuditLogClient<$Result.GetResult<Prisma.$ForecastAuditLogPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first ForecastAuditLog that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ForecastAuditLogFindFirstArgs} args - Arguments to find a ForecastAuditLog
     * @example
     * // Get one ForecastAuditLog
     * const forecastAuditLog = await prisma.forecastAuditLog.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ForecastAuditLogFindFirstArgs>(args?: SelectSubset<T, ForecastAuditLogFindFirstArgs<ExtArgs>>): Prisma__ForecastAuditLogClient<$Result.GetResult<Prisma.$ForecastAuditLogPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first ForecastAuditLog that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ForecastAuditLogFindFirstOrThrowArgs} args - Arguments to find a ForecastAuditLog
     * @example
     * // Get one ForecastAuditLog
     * const forecastAuditLog = await prisma.forecastAuditLog.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ForecastAuditLogFindFirstOrThrowArgs>(args?: SelectSubset<T, ForecastAuditLogFindFirstOrThrowArgs<ExtArgs>>): Prisma__ForecastAuditLogClient<$Result.GetResult<Prisma.$ForecastAuditLogPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more ForecastAuditLogs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ForecastAuditLogFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ForecastAuditLogs
     * const forecastAuditLogs = await prisma.forecastAuditLog.findMany()
     * 
     * // Get first 10 ForecastAuditLogs
     * const forecastAuditLogs = await prisma.forecastAuditLog.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const forecastAuditLogWithIdOnly = await prisma.forecastAuditLog.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ForecastAuditLogFindManyArgs>(args?: SelectSubset<T, ForecastAuditLogFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ForecastAuditLogPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a ForecastAuditLog.
     * @param {ForecastAuditLogCreateArgs} args - Arguments to create a ForecastAuditLog.
     * @example
     * // Create one ForecastAuditLog
     * const ForecastAuditLog = await prisma.forecastAuditLog.create({
     *   data: {
     *     // ... data to create a ForecastAuditLog
     *   }
     * })
     * 
     */
    create<T extends ForecastAuditLogCreateArgs>(args: SelectSubset<T, ForecastAuditLogCreateArgs<ExtArgs>>): Prisma__ForecastAuditLogClient<$Result.GetResult<Prisma.$ForecastAuditLogPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many ForecastAuditLogs.
     * @param {ForecastAuditLogCreateManyArgs} args - Arguments to create many ForecastAuditLogs.
     * @example
     * // Create many ForecastAuditLogs
     * const forecastAuditLog = await prisma.forecastAuditLog.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ForecastAuditLogCreateManyArgs>(args?: SelectSubset<T, ForecastAuditLogCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ForecastAuditLogs and returns the data saved in the database.
     * @param {ForecastAuditLogCreateManyAndReturnArgs} args - Arguments to create many ForecastAuditLogs.
     * @example
     * // Create many ForecastAuditLogs
     * const forecastAuditLog = await prisma.forecastAuditLog.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ForecastAuditLogs and only return the `id`
     * const forecastAuditLogWithIdOnly = await prisma.forecastAuditLog.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ForecastAuditLogCreateManyAndReturnArgs>(args?: SelectSubset<T, ForecastAuditLogCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ForecastAuditLogPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a ForecastAuditLog.
     * @param {ForecastAuditLogDeleteArgs} args - Arguments to delete one ForecastAuditLog.
     * @example
     * // Delete one ForecastAuditLog
     * const ForecastAuditLog = await prisma.forecastAuditLog.delete({
     *   where: {
     *     // ... filter to delete one ForecastAuditLog
     *   }
     * })
     * 
     */
    delete<T extends ForecastAuditLogDeleteArgs>(args: SelectSubset<T, ForecastAuditLogDeleteArgs<ExtArgs>>): Prisma__ForecastAuditLogClient<$Result.GetResult<Prisma.$ForecastAuditLogPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one ForecastAuditLog.
     * @param {ForecastAuditLogUpdateArgs} args - Arguments to update one ForecastAuditLog.
     * @example
     * // Update one ForecastAuditLog
     * const forecastAuditLog = await prisma.forecastAuditLog.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ForecastAuditLogUpdateArgs>(args: SelectSubset<T, ForecastAuditLogUpdateArgs<ExtArgs>>): Prisma__ForecastAuditLogClient<$Result.GetResult<Prisma.$ForecastAuditLogPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more ForecastAuditLogs.
     * @param {ForecastAuditLogDeleteManyArgs} args - Arguments to filter ForecastAuditLogs to delete.
     * @example
     * // Delete a few ForecastAuditLogs
     * const { count } = await prisma.forecastAuditLog.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ForecastAuditLogDeleteManyArgs>(args?: SelectSubset<T, ForecastAuditLogDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ForecastAuditLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ForecastAuditLogUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ForecastAuditLogs
     * const forecastAuditLog = await prisma.forecastAuditLog.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ForecastAuditLogUpdateManyArgs>(args: SelectSubset<T, ForecastAuditLogUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one ForecastAuditLog.
     * @param {ForecastAuditLogUpsertArgs} args - Arguments to update or create a ForecastAuditLog.
     * @example
     * // Update or create a ForecastAuditLog
     * const forecastAuditLog = await prisma.forecastAuditLog.upsert({
     *   create: {
     *     // ... data to create a ForecastAuditLog
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ForecastAuditLog we want to update
     *   }
     * })
     */
    upsert<T extends ForecastAuditLogUpsertArgs>(args: SelectSubset<T, ForecastAuditLogUpsertArgs<ExtArgs>>): Prisma__ForecastAuditLogClient<$Result.GetResult<Prisma.$ForecastAuditLogPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of ForecastAuditLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ForecastAuditLogCountArgs} args - Arguments to filter ForecastAuditLogs to count.
     * @example
     * // Count the number of ForecastAuditLogs
     * const count = await prisma.forecastAuditLog.count({
     *   where: {
     *     // ... the filter for the ForecastAuditLogs we want to count
     *   }
     * })
    **/
    count<T extends ForecastAuditLogCountArgs>(
      args?: Subset<T, ForecastAuditLogCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ForecastAuditLogCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ForecastAuditLog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ForecastAuditLogAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ForecastAuditLogAggregateArgs>(args: Subset<T, ForecastAuditLogAggregateArgs>): Prisma.PrismaPromise<GetForecastAuditLogAggregateType<T>>

    /**
     * Group by ForecastAuditLog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ForecastAuditLogGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ForecastAuditLogGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ForecastAuditLogGroupByArgs['orderBy'] }
        : { orderBy?: ForecastAuditLogGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ForecastAuditLogGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetForecastAuditLogGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ForecastAuditLog model
   */
  readonly fields: ForecastAuditLogFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ForecastAuditLog.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ForecastAuditLogClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ForecastAuditLog model
   */ 
  interface ForecastAuditLogFieldRefs {
    readonly id: FieldRef<"ForecastAuditLog", 'String'>
    readonly tenantId: FieldRef<"ForecastAuditLog", 'String'>
    readonly forecastSubmissionId: FieldRef<"ForecastAuditLog", 'String'>
    readonly action: FieldRef<"ForecastAuditLog", 'String'>
    readonly actorId: FieldRef<"ForecastAuditLog", 'String'>
    readonly actorName: FieldRef<"ForecastAuditLog", 'String'>
    readonly actorRole: FieldRef<"ForecastAuditLog", 'String'>
    readonly metadata: FieldRef<"ForecastAuditLog", 'Json'>
    readonly createdAt: FieldRef<"ForecastAuditLog", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ForecastAuditLog findUnique
   */
  export type ForecastAuditLogFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ForecastAuditLog
     */
    select?: ForecastAuditLogSelect<ExtArgs> | null
    /**
     * Filter, which ForecastAuditLog to fetch.
     */
    where: ForecastAuditLogWhereUniqueInput
  }

  /**
   * ForecastAuditLog findUniqueOrThrow
   */
  export type ForecastAuditLogFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ForecastAuditLog
     */
    select?: ForecastAuditLogSelect<ExtArgs> | null
    /**
     * Filter, which ForecastAuditLog to fetch.
     */
    where: ForecastAuditLogWhereUniqueInput
  }

  /**
   * ForecastAuditLog findFirst
   */
  export type ForecastAuditLogFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ForecastAuditLog
     */
    select?: ForecastAuditLogSelect<ExtArgs> | null
    /**
     * Filter, which ForecastAuditLog to fetch.
     */
    where?: ForecastAuditLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ForecastAuditLogs to fetch.
     */
    orderBy?: ForecastAuditLogOrderByWithRelationInput | ForecastAuditLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ForecastAuditLogs.
     */
    cursor?: ForecastAuditLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ForecastAuditLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ForecastAuditLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ForecastAuditLogs.
     */
    distinct?: ForecastAuditLogScalarFieldEnum | ForecastAuditLogScalarFieldEnum[]
  }

  /**
   * ForecastAuditLog findFirstOrThrow
   */
  export type ForecastAuditLogFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ForecastAuditLog
     */
    select?: ForecastAuditLogSelect<ExtArgs> | null
    /**
     * Filter, which ForecastAuditLog to fetch.
     */
    where?: ForecastAuditLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ForecastAuditLogs to fetch.
     */
    orderBy?: ForecastAuditLogOrderByWithRelationInput | ForecastAuditLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ForecastAuditLogs.
     */
    cursor?: ForecastAuditLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ForecastAuditLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ForecastAuditLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ForecastAuditLogs.
     */
    distinct?: ForecastAuditLogScalarFieldEnum | ForecastAuditLogScalarFieldEnum[]
  }

  /**
   * ForecastAuditLog findMany
   */
  export type ForecastAuditLogFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ForecastAuditLog
     */
    select?: ForecastAuditLogSelect<ExtArgs> | null
    /**
     * Filter, which ForecastAuditLogs to fetch.
     */
    where?: ForecastAuditLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ForecastAuditLogs to fetch.
     */
    orderBy?: ForecastAuditLogOrderByWithRelationInput | ForecastAuditLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ForecastAuditLogs.
     */
    cursor?: ForecastAuditLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ForecastAuditLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ForecastAuditLogs.
     */
    skip?: number
    distinct?: ForecastAuditLogScalarFieldEnum | ForecastAuditLogScalarFieldEnum[]
  }

  /**
   * ForecastAuditLog create
   */
  export type ForecastAuditLogCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ForecastAuditLog
     */
    select?: ForecastAuditLogSelect<ExtArgs> | null
    /**
     * The data needed to create a ForecastAuditLog.
     */
    data: XOR<ForecastAuditLogCreateInput, ForecastAuditLogUncheckedCreateInput>
  }

  /**
   * ForecastAuditLog createMany
   */
  export type ForecastAuditLogCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ForecastAuditLogs.
     */
    data: ForecastAuditLogCreateManyInput | ForecastAuditLogCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ForecastAuditLog createManyAndReturn
   */
  export type ForecastAuditLogCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ForecastAuditLog
     */
    select?: ForecastAuditLogSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many ForecastAuditLogs.
     */
    data: ForecastAuditLogCreateManyInput | ForecastAuditLogCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ForecastAuditLog update
   */
  export type ForecastAuditLogUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ForecastAuditLog
     */
    select?: ForecastAuditLogSelect<ExtArgs> | null
    /**
     * The data needed to update a ForecastAuditLog.
     */
    data: XOR<ForecastAuditLogUpdateInput, ForecastAuditLogUncheckedUpdateInput>
    /**
     * Choose, which ForecastAuditLog to update.
     */
    where: ForecastAuditLogWhereUniqueInput
  }

  /**
   * ForecastAuditLog updateMany
   */
  export type ForecastAuditLogUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ForecastAuditLogs.
     */
    data: XOR<ForecastAuditLogUpdateManyMutationInput, ForecastAuditLogUncheckedUpdateManyInput>
    /**
     * Filter which ForecastAuditLogs to update
     */
    where?: ForecastAuditLogWhereInput
  }

  /**
   * ForecastAuditLog upsert
   */
  export type ForecastAuditLogUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ForecastAuditLog
     */
    select?: ForecastAuditLogSelect<ExtArgs> | null
    /**
     * The filter to search for the ForecastAuditLog to update in case it exists.
     */
    where: ForecastAuditLogWhereUniqueInput
    /**
     * In case the ForecastAuditLog found by the `where` argument doesn't exist, create a new ForecastAuditLog with this data.
     */
    create: XOR<ForecastAuditLogCreateInput, ForecastAuditLogUncheckedCreateInput>
    /**
     * In case the ForecastAuditLog was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ForecastAuditLogUpdateInput, ForecastAuditLogUncheckedUpdateInput>
  }

  /**
   * ForecastAuditLog delete
   */
  export type ForecastAuditLogDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ForecastAuditLog
     */
    select?: ForecastAuditLogSelect<ExtArgs> | null
    /**
     * Filter which ForecastAuditLog to delete.
     */
    where: ForecastAuditLogWhereUniqueInput
  }

  /**
   * ForecastAuditLog deleteMany
   */
  export type ForecastAuditLogDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ForecastAuditLogs to delete
     */
    where?: ForecastAuditLogWhereInput
  }

  /**
   * ForecastAuditLog without action
   */
  export type ForecastAuditLogDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ForecastAuditLog
     */
    select?: ForecastAuditLogSelect<ExtArgs> | null
  }


  /**
   * Model CrmDeal
   */

  export type AggregateCrmDeal = {
    _count: CrmDealCountAggregateOutputType | null
    _avg: CrmDealAvgAggregateOutputType | null
    _sum: CrmDealSumAggregateOutputType | null
    _min: CrmDealMinAggregateOutputType | null
    _max: CrmDealMaxAggregateOutputType | null
  }

  export type CrmDealAvgAggregateOutputType = {
    amount: number | null
    probability: number | null
  }

  export type CrmDealSumAggregateOutputType = {
    amount: number | null
    probability: number | null
  }

  export type CrmDealMinAggregateOutputType = {
    id: string | null
    tenantId: string | null
    dealName: string | null
    stage: string | null
    amount: number | null
    closeDate: Date | null
    probability: number | null
    isClosedWon: boolean | null
    isClosedLost: boolean | null
    region: string | null
    lob: string | null
    repUserId: string | null
    hubspotId: string | null
    lastActivityDate: Date | null
    riskReason: string | null
    source: string | null
    createdBy: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CrmDealMaxAggregateOutputType = {
    id: string | null
    tenantId: string | null
    dealName: string | null
    stage: string | null
    amount: number | null
    closeDate: Date | null
    probability: number | null
    isClosedWon: boolean | null
    isClosedLost: boolean | null
    region: string | null
    lob: string | null
    repUserId: string | null
    hubspotId: string | null
    lastActivityDate: Date | null
    riskReason: string | null
    source: string | null
    createdBy: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CrmDealCountAggregateOutputType = {
    id: number
    tenantId: number
    dealName: number
    stage: number
    amount: number
    closeDate: number
    probability: number
    isClosedWon: number
    isClosedLost: number
    region: number
    lob: number
    repUserId: number
    hubspotId: number
    lastActivityDate: number
    riskReason: number
    source: number
    createdBy: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type CrmDealAvgAggregateInputType = {
    amount?: true
    probability?: true
  }

  export type CrmDealSumAggregateInputType = {
    amount?: true
    probability?: true
  }

  export type CrmDealMinAggregateInputType = {
    id?: true
    tenantId?: true
    dealName?: true
    stage?: true
    amount?: true
    closeDate?: true
    probability?: true
    isClosedWon?: true
    isClosedLost?: true
    region?: true
    lob?: true
    repUserId?: true
    hubspotId?: true
    lastActivityDate?: true
    riskReason?: true
    source?: true
    createdBy?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CrmDealMaxAggregateInputType = {
    id?: true
    tenantId?: true
    dealName?: true
    stage?: true
    amount?: true
    closeDate?: true
    probability?: true
    isClosedWon?: true
    isClosedLost?: true
    region?: true
    lob?: true
    repUserId?: true
    hubspotId?: true
    lastActivityDate?: true
    riskReason?: true
    source?: true
    createdBy?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CrmDealCountAggregateInputType = {
    id?: true
    tenantId?: true
    dealName?: true
    stage?: true
    amount?: true
    closeDate?: true
    probability?: true
    isClosedWon?: true
    isClosedLost?: true
    region?: true
    lob?: true
    repUserId?: true
    hubspotId?: true
    lastActivityDate?: true
    riskReason?: true
    source?: true
    createdBy?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type CrmDealAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CrmDeal to aggregate.
     */
    where?: CrmDealWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CrmDeals to fetch.
     */
    orderBy?: CrmDealOrderByWithRelationInput | CrmDealOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CrmDealWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CrmDeals from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CrmDeals.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned CrmDeals
    **/
    _count?: true | CrmDealCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: CrmDealAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: CrmDealSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CrmDealMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CrmDealMaxAggregateInputType
  }

  export type GetCrmDealAggregateType<T extends CrmDealAggregateArgs> = {
        [P in keyof T & keyof AggregateCrmDeal]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCrmDeal[P]>
      : GetScalarType<T[P], AggregateCrmDeal[P]>
  }




  export type CrmDealGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CrmDealWhereInput
    orderBy?: CrmDealOrderByWithAggregationInput | CrmDealOrderByWithAggregationInput[]
    by: CrmDealScalarFieldEnum[] | CrmDealScalarFieldEnum
    having?: CrmDealScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CrmDealCountAggregateInputType | true
    _avg?: CrmDealAvgAggregateInputType
    _sum?: CrmDealSumAggregateInputType
    _min?: CrmDealMinAggregateInputType
    _max?: CrmDealMaxAggregateInputType
  }

  export type CrmDealGroupByOutputType = {
    id: string
    tenantId: string
    dealName: string
    stage: string
    amount: number
    closeDate: Date
    probability: number | null
    isClosedWon: boolean
    isClosedLost: boolean
    region: string | null
    lob: string | null
    repUserId: string | null
    hubspotId: string | null
    lastActivityDate: Date | null
    riskReason: string | null
    source: string
    createdBy: string
    createdAt: Date
    updatedAt: Date
    _count: CrmDealCountAggregateOutputType | null
    _avg: CrmDealAvgAggregateOutputType | null
    _sum: CrmDealSumAggregateOutputType | null
    _min: CrmDealMinAggregateOutputType | null
    _max: CrmDealMaxAggregateOutputType | null
  }

  type GetCrmDealGroupByPayload<T extends CrmDealGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CrmDealGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CrmDealGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CrmDealGroupByOutputType[P]>
            : GetScalarType<T[P], CrmDealGroupByOutputType[P]>
        }
      >
    >


  export type CrmDealSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    dealName?: boolean
    stage?: boolean
    amount?: boolean
    closeDate?: boolean
    probability?: boolean
    isClosedWon?: boolean
    isClosedLost?: boolean
    region?: boolean
    lob?: boolean
    repUserId?: boolean
    hubspotId?: boolean
    lastActivityDate?: boolean
    riskReason?: boolean
    source?: boolean
    createdBy?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["crmDeal"]>

  export type CrmDealSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    dealName?: boolean
    stage?: boolean
    amount?: boolean
    closeDate?: boolean
    probability?: boolean
    isClosedWon?: boolean
    isClosedLost?: boolean
    region?: boolean
    lob?: boolean
    repUserId?: boolean
    hubspotId?: boolean
    lastActivityDate?: boolean
    riskReason?: boolean
    source?: boolean
    createdBy?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["crmDeal"]>

  export type CrmDealSelectScalar = {
    id?: boolean
    tenantId?: boolean
    dealName?: boolean
    stage?: boolean
    amount?: boolean
    closeDate?: boolean
    probability?: boolean
    isClosedWon?: boolean
    isClosedLost?: boolean
    region?: boolean
    lob?: boolean
    repUserId?: boolean
    hubspotId?: boolean
    lastActivityDate?: boolean
    riskReason?: boolean
    source?: boolean
    createdBy?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }


  export type $CrmDealPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "CrmDeal"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenantId: string
      dealName: string
      stage: string
      amount: number
      closeDate: Date
      probability: number | null
      isClosedWon: boolean
      isClosedLost: boolean
      region: string | null
      lob: string | null
      repUserId: string | null
      hubspotId: string | null
      lastActivityDate: Date | null
      riskReason: string | null
      source: string
      createdBy: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["crmDeal"]>
    composites: {}
  }

  type CrmDealGetPayload<S extends boolean | null | undefined | CrmDealDefaultArgs> = $Result.GetResult<Prisma.$CrmDealPayload, S>

  type CrmDealCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<CrmDealFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: CrmDealCountAggregateInputType | true
    }

  export interface CrmDealDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['CrmDeal'], meta: { name: 'CrmDeal' } }
    /**
     * Find zero or one CrmDeal that matches the filter.
     * @param {CrmDealFindUniqueArgs} args - Arguments to find a CrmDeal
     * @example
     * // Get one CrmDeal
     * const crmDeal = await prisma.crmDeal.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CrmDealFindUniqueArgs>(args: SelectSubset<T, CrmDealFindUniqueArgs<ExtArgs>>): Prisma__CrmDealClient<$Result.GetResult<Prisma.$CrmDealPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one CrmDeal that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {CrmDealFindUniqueOrThrowArgs} args - Arguments to find a CrmDeal
     * @example
     * // Get one CrmDeal
     * const crmDeal = await prisma.crmDeal.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CrmDealFindUniqueOrThrowArgs>(args: SelectSubset<T, CrmDealFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CrmDealClient<$Result.GetResult<Prisma.$CrmDealPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first CrmDeal that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CrmDealFindFirstArgs} args - Arguments to find a CrmDeal
     * @example
     * // Get one CrmDeal
     * const crmDeal = await prisma.crmDeal.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CrmDealFindFirstArgs>(args?: SelectSubset<T, CrmDealFindFirstArgs<ExtArgs>>): Prisma__CrmDealClient<$Result.GetResult<Prisma.$CrmDealPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first CrmDeal that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CrmDealFindFirstOrThrowArgs} args - Arguments to find a CrmDeal
     * @example
     * // Get one CrmDeal
     * const crmDeal = await prisma.crmDeal.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CrmDealFindFirstOrThrowArgs>(args?: SelectSubset<T, CrmDealFindFirstOrThrowArgs<ExtArgs>>): Prisma__CrmDealClient<$Result.GetResult<Prisma.$CrmDealPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more CrmDeals that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CrmDealFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all CrmDeals
     * const crmDeals = await prisma.crmDeal.findMany()
     * 
     * // Get first 10 CrmDeals
     * const crmDeals = await prisma.crmDeal.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const crmDealWithIdOnly = await prisma.crmDeal.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CrmDealFindManyArgs>(args?: SelectSubset<T, CrmDealFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CrmDealPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a CrmDeal.
     * @param {CrmDealCreateArgs} args - Arguments to create a CrmDeal.
     * @example
     * // Create one CrmDeal
     * const CrmDeal = await prisma.crmDeal.create({
     *   data: {
     *     // ... data to create a CrmDeal
     *   }
     * })
     * 
     */
    create<T extends CrmDealCreateArgs>(args: SelectSubset<T, CrmDealCreateArgs<ExtArgs>>): Prisma__CrmDealClient<$Result.GetResult<Prisma.$CrmDealPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many CrmDeals.
     * @param {CrmDealCreateManyArgs} args - Arguments to create many CrmDeals.
     * @example
     * // Create many CrmDeals
     * const crmDeal = await prisma.crmDeal.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CrmDealCreateManyArgs>(args?: SelectSubset<T, CrmDealCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many CrmDeals and returns the data saved in the database.
     * @param {CrmDealCreateManyAndReturnArgs} args - Arguments to create many CrmDeals.
     * @example
     * // Create many CrmDeals
     * const crmDeal = await prisma.crmDeal.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many CrmDeals and only return the `id`
     * const crmDealWithIdOnly = await prisma.crmDeal.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CrmDealCreateManyAndReturnArgs>(args?: SelectSubset<T, CrmDealCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CrmDealPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a CrmDeal.
     * @param {CrmDealDeleteArgs} args - Arguments to delete one CrmDeal.
     * @example
     * // Delete one CrmDeal
     * const CrmDeal = await prisma.crmDeal.delete({
     *   where: {
     *     // ... filter to delete one CrmDeal
     *   }
     * })
     * 
     */
    delete<T extends CrmDealDeleteArgs>(args: SelectSubset<T, CrmDealDeleteArgs<ExtArgs>>): Prisma__CrmDealClient<$Result.GetResult<Prisma.$CrmDealPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one CrmDeal.
     * @param {CrmDealUpdateArgs} args - Arguments to update one CrmDeal.
     * @example
     * // Update one CrmDeal
     * const crmDeal = await prisma.crmDeal.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CrmDealUpdateArgs>(args: SelectSubset<T, CrmDealUpdateArgs<ExtArgs>>): Prisma__CrmDealClient<$Result.GetResult<Prisma.$CrmDealPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more CrmDeals.
     * @param {CrmDealDeleteManyArgs} args - Arguments to filter CrmDeals to delete.
     * @example
     * // Delete a few CrmDeals
     * const { count } = await prisma.crmDeal.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CrmDealDeleteManyArgs>(args?: SelectSubset<T, CrmDealDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CrmDeals.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CrmDealUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many CrmDeals
     * const crmDeal = await prisma.crmDeal.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CrmDealUpdateManyArgs>(args: SelectSubset<T, CrmDealUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one CrmDeal.
     * @param {CrmDealUpsertArgs} args - Arguments to update or create a CrmDeal.
     * @example
     * // Update or create a CrmDeal
     * const crmDeal = await prisma.crmDeal.upsert({
     *   create: {
     *     // ... data to create a CrmDeal
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the CrmDeal we want to update
     *   }
     * })
     */
    upsert<T extends CrmDealUpsertArgs>(args: SelectSubset<T, CrmDealUpsertArgs<ExtArgs>>): Prisma__CrmDealClient<$Result.GetResult<Prisma.$CrmDealPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of CrmDeals.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CrmDealCountArgs} args - Arguments to filter CrmDeals to count.
     * @example
     * // Count the number of CrmDeals
     * const count = await prisma.crmDeal.count({
     *   where: {
     *     // ... the filter for the CrmDeals we want to count
     *   }
     * })
    **/
    count<T extends CrmDealCountArgs>(
      args?: Subset<T, CrmDealCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CrmDealCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a CrmDeal.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CrmDealAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CrmDealAggregateArgs>(args: Subset<T, CrmDealAggregateArgs>): Prisma.PrismaPromise<GetCrmDealAggregateType<T>>

    /**
     * Group by CrmDeal.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CrmDealGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends CrmDealGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CrmDealGroupByArgs['orderBy'] }
        : { orderBy?: CrmDealGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CrmDealGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCrmDealGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the CrmDeal model
   */
  readonly fields: CrmDealFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for CrmDeal.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CrmDealClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the CrmDeal model
   */ 
  interface CrmDealFieldRefs {
    readonly id: FieldRef<"CrmDeal", 'String'>
    readonly tenantId: FieldRef<"CrmDeal", 'String'>
    readonly dealName: FieldRef<"CrmDeal", 'String'>
    readonly stage: FieldRef<"CrmDeal", 'String'>
    readonly amount: FieldRef<"CrmDeal", 'Float'>
    readonly closeDate: FieldRef<"CrmDeal", 'DateTime'>
    readonly probability: FieldRef<"CrmDeal", 'Float'>
    readonly isClosedWon: FieldRef<"CrmDeal", 'Boolean'>
    readonly isClosedLost: FieldRef<"CrmDeal", 'Boolean'>
    readonly region: FieldRef<"CrmDeal", 'String'>
    readonly lob: FieldRef<"CrmDeal", 'String'>
    readonly repUserId: FieldRef<"CrmDeal", 'String'>
    readonly hubspotId: FieldRef<"CrmDeal", 'String'>
    readonly lastActivityDate: FieldRef<"CrmDeal", 'DateTime'>
    readonly riskReason: FieldRef<"CrmDeal", 'String'>
    readonly source: FieldRef<"CrmDeal", 'String'>
    readonly createdBy: FieldRef<"CrmDeal", 'String'>
    readonly createdAt: FieldRef<"CrmDeal", 'DateTime'>
    readonly updatedAt: FieldRef<"CrmDeal", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * CrmDeal findUnique
   */
  export type CrmDealFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrmDeal
     */
    select?: CrmDealSelect<ExtArgs> | null
    /**
     * Filter, which CrmDeal to fetch.
     */
    where: CrmDealWhereUniqueInput
  }

  /**
   * CrmDeal findUniqueOrThrow
   */
  export type CrmDealFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrmDeal
     */
    select?: CrmDealSelect<ExtArgs> | null
    /**
     * Filter, which CrmDeal to fetch.
     */
    where: CrmDealWhereUniqueInput
  }

  /**
   * CrmDeal findFirst
   */
  export type CrmDealFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrmDeal
     */
    select?: CrmDealSelect<ExtArgs> | null
    /**
     * Filter, which CrmDeal to fetch.
     */
    where?: CrmDealWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CrmDeals to fetch.
     */
    orderBy?: CrmDealOrderByWithRelationInput | CrmDealOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CrmDeals.
     */
    cursor?: CrmDealWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CrmDeals from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CrmDeals.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CrmDeals.
     */
    distinct?: CrmDealScalarFieldEnum | CrmDealScalarFieldEnum[]
  }

  /**
   * CrmDeal findFirstOrThrow
   */
  export type CrmDealFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrmDeal
     */
    select?: CrmDealSelect<ExtArgs> | null
    /**
     * Filter, which CrmDeal to fetch.
     */
    where?: CrmDealWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CrmDeals to fetch.
     */
    orderBy?: CrmDealOrderByWithRelationInput | CrmDealOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CrmDeals.
     */
    cursor?: CrmDealWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CrmDeals from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CrmDeals.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CrmDeals.
     */
    distinct?: CrmDealScalarFieldEnum | CrmDealScalarFieldEnum[]
  }

  /**
   * CrmDeal findMany
   */
  export type CrmDealFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrmDeal
     */
    select?: CrmDealSelect<ExtArgs> | null
    /**
     * Filter, which CrmDeals to fetch.
     */
    where?: CrmDealWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CrmDeals to fetch.
     */
    orderBy?: CrmDealOrderByWithRelationInput | CrmDealOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing CrmDeals.
     */
    cursor?: CrmDealWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CrmDeals from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CrmDeals.
     */
    skip?: number
    distinct?: CrmDealScalarFieldEnum | CrmDealScalarFieldEnum[]
  }

  /**
   * CrmDeal create
   */
  export type CrmDealCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrmDeal
     */
    select?: CrmDealSelect<ExtArgs> | null
    /**
     * The data needed to create a CrmDeal.
     */
    data: XOR<CrmDealCreateInput, CrmDealUncheckedCreateInput>
  }

  /**
   * CrmDeal createMany
   */
  export type CrmDealCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many CrmDeals.
     */
    data: CrmDealCreateManyInput | CrmDealCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * CrmDeal createManyAndReturn
   */
  export type CrmDealCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrmDeal
     */
    select?: CrmDealSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many CrmDeals.
     */
    data: CrmDealCreateManyInput | CrmDealCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * CrmDeal update
   */
  export type CrmDealUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrmDeal
     */
    select?: CrmDealSelect<ExtArgs> | null
    /**
     * The data needed to update a CrmDeal.
     */
    data: XOR<CrmDealUpdateInput, CrmDealUncheckedUpdateInput>
    /**
     * Choose, which CrmDeal to update.
     */
    where: CrmDealWhereUniqueInput
  }

  /**
   * CrmDeal updateMany
   */
  export type CrmDealUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update CrmDeals.
     */
    data: XOR<CrmDealUpdateManyMutationInput, CrmDealUncheckedUpdateManyInput>
    /**
     * Filter which CrmDeals to update
     */
    where?: CrmDealWhereInput
  }

  /**
   * CrmDeal upsert
   */
  export type CrmDealUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrmDeal
     */
    select?: CrmDealSelect<ExtArgs> | null
    /**
     * The filter to search for the CrmDeal to update in case it exists.
     */
    where: CrmDealWhereUniqueInput
    /**
     * In case the CrmDeal found by the `where` argument doesn't exist, create a new CrmDeal with this data.
     */
    create: XOR<CrmDealCreateInput, CrmDealUncheckedCreateInput>
    /**
     * In case the CrmDeal was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CrmDealUpdateInput, CrmDealUncheckedUpdateInput>
  }

  /**
   * CrmDeal delete
   */
  export type CrmDealDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrmDeal
     */
    select?: CrmDealSelect<ExtArgs> | null
    /**
     * Filter which CrmDeal to delete.
     */
    where: CrmDealWhereUniqueInput
  }

  /**
   * CrmDeal deleteMany
   */
  export type CrmDealDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CrmDeals to delete
     */
    where?: CrmDealWhereInput
  }

  /**
   * CrmDeal without action
   */
  export type CrmDealDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrmDeal
     */
    select?: CrmDealSelect<ExtArgs> | null
  }


  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserMinAggregateOutputType = {
    id: string | null
    tenantId: string | null
    name: string | null
    email: string | null
    password: string | null
    role: string | null
    repId: string | null
    managerId: string | null
    region: string | null
    teamName: string | null
    createdAt: Date | null
  }

  export type UserMaxAggregateOutputType = {
    id: string | null
    tenantId: string | null
    name: string | null
    email: string | null
    password: string | null
    role: string | null
    repId: string | null
    managerId: string | null
    region: string | null
    teamName: string | null
    createdAt: Date | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    tenantId: number
    name: number
    email: number
    password: number
    role: number
    repId: number
    managerId: number
    region: number
    teamName: number
    createdAt: number
    _all: number
  }


  export type UserMinAggregateInputType = {
    id?: true
    tenantId?: true
    name?: true
    email?: true
    password?: true
    role?: true
    repId?: true
    managerId?: true
    region?: true
    teamName?: true
    createdAt?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    tenantId?: true
    name?: true
    email?: true
    password?: true
    role?: true
    repId?: true
    managerId?: true
    region?: true
    teamName?: true
    createdAt?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    tenantId?: true
    name?: true
    email?: true
    password?: true
    role?: true
    repId?: true
    managerId?: true
    region?: true
    teamName?: true
    createdAt?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type UserGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
    orderBy?: UserOrderByWithAggregationInput | UserOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: string
    tenantId: string
    name: string
    email: string
    password: string
    role: string
    repId: string | null
    managerId: string | null
    region: string | null
    teamName: string | null
    createdAt: Date
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type UserSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    name?: boolean
    email?: boolean
    password?: boolean
    role?: boolean
    repId?: boolean
    managerId?: boolean
    region?: boolean
    teamName?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    name?: boolean
    email?: boolean
    password?: boolean
    role?: boolean
    repId?: boolean
    managerId?: boolean
    region?: boolean
    teamName?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectScalar = {
    id?: boolean
    tenantId?: boolean
    name?: boolean
    email?: boolean
    password?: boolean
    role?: boolean
    repId?: boolean
    managerId?: boolean
    region?: boolean
    teamName?: boolean
    createdAt?: boolean
  }


  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenantId: string
      name: string
      email: string
      password: string
      role: string
      repId: string | null
      managerId: string | null
      region: string | null
      teamName: string | null
      createdAt: Date
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<UserFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['User'], meta: { name: 'User' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     * 
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserFindManyArgs>(args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     * 
     */
    create<T extends UserCreateArgs>(args: SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserCreateManyArgs>(args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Users and returns the data saved in the database.
     * @param {UserCreateManyAndReturnArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Users and only return the `id`
     * const userWithIdOnly = await prisma.user.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UserCreateManyAndReturnArgs>(args?: SelectSubset<T, UserCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     * 
     */
    delete<T extends UserDeleteArgs>(args: SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserUpdateArgs>(args: SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserDeleteManyArgs>(args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserUpdateManyArgs>(args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(args: SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the User model
   */
  readonly fields: UserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the User model
   */ 
  interface UserFieldRefs {
    readonly id: FieldRef<"User", 'String'>
    readonly tenantId: FieldRef<"User", 'String'>
    readonly name: FieldRef<"User", 'String'>
    readonly email: FieldRef<"User", 'String'>
    readonly password: FieldRef<"User", 'String'>
    readonly role: FieldRef<"User", 'String'>
    readonly repId: FieldRef<"User", 'String'>
    readonly managerId: FieldRef<"User", 'String'>
    readonly region: FieldRef<"User", 'String'>
    readonly teamName: FieldRef<"User", 'String'>
    readonly createdAt: FieldRef<"User", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findFirst
   */
  export type UserFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findMany
   */
  export type UserFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User create
   */
  export type UserCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }

  /**
   * User createMany
   */
  export type UserCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User createManyAndReturn
   */
  export type UserCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User update
   */
  export type UserUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
  }

  /**
   * User upsert
   */
  export type UserUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }

  /**
   * User delete
   */
  export type UserDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
  }

  /**
   * User without action
   */
  export type UserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
  }


  /**
   * Model Quota
   */

  export type AggregateQuota = {
    _count: QuotaCountAggregateOutputType | null
    _avg: QuotaAvgAggregateOutputType | null
    _sum: QuotaSumAggregateOutputType | null
    _min: QuotaMinAggregateOutputType | null
    _max: QuotaMaxAggregateOutputType | null
  }

  export type QuotaAvgAggregateOutputType = {
    amount: number | null
  }

  export type QuotaSumAggregateOutputType = {
    amount: number | null
  }

  export type QuotaMinAggregateOutputType = {
    id: string | null
    tenantId: string | null
    periodId: string | null
    repUserId: string | null
    amount: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type QuotaMaxAggregateOutputType = {
    id: string | null
    tenantId: string | null
    periodId: string | null
    repUserId: string | null
    amount: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type QuotaCountAggregateOutputType = {
    id: number
    tenantId: number
    periodId: number
    repUserId: number
    amount: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type QuotaAvgAggregateInputType = {
    amount?: true
  }

  export type QuotaSumAggregateInputType = {
    amount?: true
  }

  export type QuotaMinAggregateInputType = {
    id?: true
    tenantId?: true
    periodId?: true
    repUserId?: true
    amount?: true
    createdAt?: true
    updatedAt?: true
  }

  export type QuotaMaxAggregateInputType = {
    id?: true
    tenantId?: true
    periodId?: true
    repUserId?: true
    amount?: true
    createdAt?: true
    updatedAt?: true
  }

  export type QuotaCountAggregateInputType = {
    id?: true
    tenantId?: true
    periodId?: true
    repUserId?: true
    amount?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type QuotaAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Quota to aggregate.
     */
    where?: QuotaWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Quotas to fetch.
     */
    orderBy?: QuotaOrderByWithRelationInput | QuotaOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: QuotaWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Quotas from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Quotas.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Quotas
    **/
    _count?: true | QuotaCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: QuotaAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: QuotaSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: QuotaMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: QuotaMaxAggregateInputType
  }

  export type GetQuotaAggregateType<T extends QuotaAggregateArgs> = {
        [P in keyof T & keyof AggregateQuota]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateQuota[P]>
      : GetScalarType<T[P], AggregateQuota[P]>
  }




  export type QuotaGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: QuotaWhereInput
    orderBy?: QuotaOrderByWithAggregationInput | QuotaOrderByWithAggregationInput[]
    by: QuotaScalarFieldEnum[] | QuotaScalarFieldEnum
    having?: QuotaScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: QuotaCountAggregateInputType | true
    _avg?: QuotaAvgAggregateInputType
    _sum?: QuotaSumAggregateInputType
    _min?: QuotaMinAggregateInputType
    _max?: QuotaMaxAggregateInputType
  }

  export type QuotaGroupByOutputType = {
    id: string
    tenantId: string
    periodId: string
    repUserId: string
    amount: number
    createdAt: Date
    updatedAt: Date
    _count: QuotaCountAggregateOutputType | null
    _avg: QuotaAvgAggregateOutputType | null
    _sum: QuotaSumAggregateOutputType | null
    _min: QuotaMinAggregateOutputType | null
    _max: QuotaMaxAggregateOutputType | null
  }

  type GetQuotaGroupByPayload<T extends QuotaGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<QuotaGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof QuotaGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], QuotaGroupByOutputType[P]>
            : GetScalarType<T[P], QuotaGroupByOutputType[P]>
        }
      >
    >


  export type QuotaSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    periodId?: boolean
    repUserId?: boolean
    amount?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["quota"]>

  export type QuotaSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    periodId?: boolean
    repUserId?: boolean
    amount?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["quota"]>

  export type QuotaSelectScalar = {
    id?: boolean
    tenantId?: boolean
    periodId?: boolean
    repUserId?: boolean
    amount?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }


  export type $QuotaPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Quota"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenantId: string
      periodId: string
      repUserId: string
      amount: number
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["quota"]>
    composites: {}
  }

  type QuotaGetPayload<S extends boolean | null | undefined | QuotaDefaultArgs> = $Result.GetResult<Prisma.$QuotaPayload, S>

  type QuotaCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<QuotaFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: QuotaCountAggregateInputType | true
    }

  export interface QuotaDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Quota'], meta: { name: 'Quota' } }
    /**
     * Find zero or one Quota that matches the filter.
     * @param {QuotaFindUniqueArgs} args - Arguments to find a Quota
     * @example
     * // Get one Quota
     * const quota = await prisma.quota.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends QuotaFindUniqueArgs>(args: SelectSubset<T, QuotaFindUniqueArgs<ExtArgs>>): Prisma__QuotaClient<$Result.GetResult<Prisma.$QuotaPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Quota that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {QuotaFindUniqueOrThrowArgs} args - Arguments to find a Quota
     * @example
     * // Get one Quota
     * const quota = await prisma.quota.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends QuotaFindUniqueOrThrowArgs>(args: SelectSubset<T, QuotaFindUniqueOrThrowArgs<ExtArgs>>): Prisma__QuotaClient<$Result.GetResult<Prisma.$QuotaPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Quota that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuotaFindFirstArgs} args - Arguments to find a Quota
     * @example
     * // Get one Quota
     * const quota = await prisma.quota.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends QuotaFindFirstArgs>(args?: SelectSubset<T, QuotaFindFirstArgs<ExtArgs>>): Prisma__QuotaClient<$Result.GetResult<Prisma.$QuotaPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Quota that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuotaFindFirstOrThrowArgs} args - Arguments to find a Quota
     * @example
     * // Get one Quota
     * const quota = await prisma.quota.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends QuotaFindFirstOrThrowArgs>(args?: SelectSubset<T, QuotaFindFirstOrThrowArgs<ExtArgs>>): Prisma__QuotaClient<$Result.GetResult<Prisma.$QuotaPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Quotas that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuotaFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Quotas
     * const quotas = await prisma.quota.findMany()
     * 
     * // Get first 10 Quotas
     * const quotas = await prisma.quota.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const quotaWithIdOnly = await prisma.quota.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends QuotaFindManyArgs>(args?: SelectSubset<T, QuotaFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuotaPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Quota.
     * @param {QuotaCreateArgs} args - Arguments to create a Quota.
     * @example
     * // Create one Quota
     * const Quota = await prisma.quota.create({
     *   data: {
     *     // ... data to create a Quota
     *   }
     * })
     * 
     */
    create<T extends QuotaCreateArgs>(args: SelectSubset<T, QuotaCreateArgs<ExtArgs>>): Prisma__QuotaClient<$Result.GetResult<Prisma.$QuotaPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Quotas.
     * @param {QuotaCreateManyArgs} args - Arguments to create many Quotas.
     * @example
     * // Create many Quotas
     * const quota = await prisma.quota.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends QuotaCreateManyArgs>(args?: SelectSubset<T, QuotaCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Quotas and returns the data saved in the database.
     * @param {QuotaCreateManyAndReturnArgs} args - Arguments to create many Quotas.
     * @example
     * // Create many Quotas
     * const quota = await prisma.quota.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Quotas and only return the `id`
     * const quotaWithIdOnly = await prisma.quota.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends QuotaCreateManyAndReturnArgs>(args?: SelectSubset<T, QuotaCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuotaPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Quota.
     * @param {QuotaDeleteArgs} args - Arguments to delete one Quota.
     * @example
     * // Delete one Quota
     * const Quota = await prisma.quota.delete({
     *   where: {
     *     // ... filter to delete one Quota
     *   }
     * })
     * 
     */
    delete<T extends QuotaDeleteArgs>(args: SelectSubset<T, QuotaDeleteArgs<ExtArgs>>): Prisma__QuotaClient<$Result.GetResult<Prisma.$QuotaPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Quota.
     * @param {QuotaUpdateArgs} args - Arguments to update one Quota.
     * @example
     * // Update one Quota
     * const quota = await prisma.quota.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends QuotaUpdateArgs>(args: SelectSubset<T, QuotaUpdateArgs<ExtArgs>>): Prisma__QuotaClient<$Result.GetResult<Prisma.$QuotaPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Quotas.
     * @param {QuotaDeleteManyArgs} args - Arguments to filter Quotas to delete.
     * @example
     * // Delete a few Quotas
     * const { count } = await prisma.quota.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends QuotaDeleteManyArgs>(args?: SelectSubset<T, QuotaDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Quotas.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuotaUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Quotas
     * const quota = await prisma.quota.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends QuotaUpdateManyArgs>(args: SelectSubset<T, QuotaUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Quota.
     * @param {QuotaUpsertArgs} args - Arguments to update or create a Quota.
     * @example
     * // Update or create a Quota
     * const quota = await prisma.quota.upsert({
     *   create: {
     *     // ... data to create a Quota
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Quota we want to update
     *   }
     * })
     */
    upsert<T extends QuotaUpsertArgs>(args: SelectSubset<T, QuotaUpsertArgs<ExtArgs>>): Prisma__QuotaClient<$Result.GetResult<Prisma.$QuotaPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Quotas.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuotaCountArgs} args - Arguments to filter Quotas to count.
     * @example
     * // Count the number of Quotas
     * const count = await prisma.quota.count({
     *   where: {
     *     // ... the filter for the Quotas we want to count
     *   }
     * })
    **/
    count<T extends QuotaCountArgs>(
      args?: Subset<T, QuotaCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], QuotaCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Quota.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuotaAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends QuotaAggregateArgs>(args: Subset<T, QuotaAggregateArgs>): Prisma.PrismaPromise<GetQuotaAggregateType<T>>

    /**
     * Group by Quota.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuotaGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends QuotaGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: QuotaGroupByArgs['orderBy'] }
        : { orderBy?: QuotaGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, QuotaGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetQuotaGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Quota model
   */
  readonly fields: QuotaFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Quota.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__QuotaClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Quota model
   */ 
  interface QuotaFieldRefs {
    readonly id: FieldRef<"Quota", 'String'>
    readonly tenantId: FieldRef<"Quota", 'String'>
    readonly periodId: FieldRef<"Quota", 'String'>
    readonly repUserId: FieldRef<"Quota", 'String'>
    readonly amount: FieldRef<"Quota", 'Float'>
    readonly createdAt: FieldRef<"Quota", 'DateTime'>
    readonly updatedAt: FieldRef<"Quota", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Quota findUnique
   */
  export type QuotaFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Quota
     */
    select?: QuotaSelect<ExtArgs> | null
    /**
     * Filter, which Quota to fetch.
     */
    where: QuotaWhereUniqueInput
  }

  /**
   * Quota findUniqueOrThrow
   */
  export type QuotaFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Quota
     */
    select?: QuotaSelect<ExtArgs> | null
    /**
     * Filter, which Quota to fetch.
     */
    where: QuotaWhereUniqueInput
  }

  /**
   * Quota findFirst
   */
  export type QuotaFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Quota
     */
    select?: QuotaSelect<ExtArgs> | null
    /**
     * Filter, which Quota to fetch.
     */
    where?: QuotaWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Quotas to fetch.
     */
    orderBy?: QuotaOrderByWithRelationInput | QuotaOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Quotas.
     */
    cursor?: QuotaWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Quotas from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Quotas.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Quotas.
     */
    distinct?: QuotaScalarFieldEnum | QuotaScalarFieldEnum[]
  }

  /**
   * Quota findFirstOrThrow
   */
  export type QuotaFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Quota
     */
    select?: QuotaSelect<ExtArgs> | null
    /**
     * Filter, which Quota to fetch.
     */
    where?: QuotaWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Quotas to fetch.
     */
    orderBy?: QuotaOrderByWithRelationInput | QuotaOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Quotas.
     */
    cursor?: QuotaWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Quotas from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Quotas.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Quotas.
     */
    distinct?: QuotaScalarFieldEnum | QuotaScalarFieldEnum[]
  }

  /**
   * Quota findMany
   */
  export type QuotaFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Quota
     */
    select?: QuotaSelect<ExtArgs> | null
    /**
     * Filter, which Quotas to fetch.
     */
    where?: QuotaWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Quotas to fetch.
     */
    orderBy?: QuotaOrderByWithRelationInput | QuotaOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Quotas.
     */
    cursor?: QuotaWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Quotas from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Quotas.
     */
    skip?: number
    distinct?: QuotaScalarFieldEnum | QuotaScalarFieldEnum[]
  }

  /**
   * Quota create
   */
  export type QuotaCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Quota
     */
    select?: QuotaSelect<ExtArgs> | null
    /**
     * The data needed to create a Quota.
     */
    data: XOR<QuotaCreateInput, QuotaUncheckedCreateInput>
  }

  /**
   * Quota createMany
   */
  export type QuotaCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Quotas.
     */
    data: QuotaCreateManyInput | QuotaCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Quota createManyAndReturn
   */
  export type QuotaCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Quota
     */
    select?: QuotaSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Quotas.
     */
    data: QuotaCreateManyInput | QuotaCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Quota update
   */
  export type QuotaUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Quota
     */
    select?: QuotaSelect<ExtArgs> | null
    /**
     * The data needed to update a Quota.
     */
    data: XOR<QuotaUpdateInput, QuotaUncheckedUpdateInput>
    /**
     * Choose, which Quota to update.
     */
    where: QuotaWhereUniqueInput
  }

  /**
   * Quota updateMany
   */
  export type QuotaUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Quotas.
     */
    data: XOR<QuotaUpdateManyMutationInput, QuotaUncheckedUpdateManyInput>
    /**
     * Filter which Quotas to update
     */
    where?: QuotaWhereInput
  }

  /**
   * Quota upsert
   */
  export type QuotaUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Quota
     */
    select?: QuotaSelect<ExtArgs> | null
    /**
     * The filter to search for the Quota to update in case it exists.
     */
    where: QuotaWhereUniqueInput
    /**
     * In case the Quota found by the `where` argument doesn't exist, create a new Quota with this data.
     */
    create: XOR<QuotaCreateInput, QuotaUncheckedCreateInput>
    /**
     * In case the Quota was found with the provided `where` argument, update it with this data.
     */
    update: XOR<QuotaUpdateInput, QuotaUncheckedUpdateInput>
  }

  /**
   * Quota delete
   */
  export type QuotaDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Quota
     */
    select?: QuotaSelect<ExtArgs> | null
    /**
     * Filter which Quota to delete.
     */
    where: QuotaWhereUniqueInput
  }

  /**
   * Quota deleteMany
   */
  export type QuotaDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Quotas to delete
     */
    where?: QuotaWhereInput
  }

  /**
   * Quota without action
   */
  export type QuotaDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Quota
     */
    select?: QuotaSelect<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const ForecastPeriodScalarFieldEnum: {
    id: 'id',
    tenantId: 'tenantId',
    name: 'name',
    startDate: 'startDate',
    endDate: 'endDate',
    revenueTarget: 'revenueTarget',
    status: 'status',
    isLocked: 'isLocked',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ForecastPeriodScalarFieldEnum = (typeof ForecastPeriodScalarFieldEnum)[keyof typeof ForecastPeriodScalarFieldEnum]


  export const AiForecastSnapshotScalarFieldEnum: {
    snapshotId: 'snapshotId',
    tenantId: 'tenantId',
    periodId: 'periodId',
    predictedAmount: 'predictedAmount',
    confidenceRangeLow: 'confidenceRangeLow',
    confidenceRangeHigh: 'confidenceRangeHigh',
    modelInputs: 'modelInputs',
    inputPipelineValue: 'inputPipelineValue',
    regionBreakdown: 'regionBreakdown',
    computedAt: 'computedAt',
    idempotencyKey: 'idempotencyKey'
  };

  export type AiForecastSnapshotScalarFieldEnum = (typeof AiForecastSnapshotScalarFieldEnum)[keyof typeof AiForecastSnapshotScalarFieldEnum]


  export const PipelineCoverageMetricsScalarFieldEnum: {
    id: 'id',
    tenantId: 'tenantId',
    periodId: 'periodId',
    openPipelineValue: 'openPipelineValue',
    weightedPipelineValue: 'weightedPipelineValue',
    closedWonAmount: 'closedWonAmount',
    coverageRatio: 'coverageRatio',
    computedAt: 'computedAt'
  };

  export type PipelineCoverageMetricsScalarFieldEnum = (typeof PipelineCoverageMetricsScalarFieldEnum)[keyof typeof PipelineCoverageMetricsScalarFieldEnum]


  export const HistoricalConversionRateScalarFieldEnum: {
    id: 'id',
    tenantId: 'tenantId',
    fromStage: 'fromStage',
    toStage: 'toStage',
    conversionRate: 'conversionRate',
    sampleSize: 'sampleSize',
    computedFromPeriod: 'computedFromPeriod',
    periodName: 'periodName',
    computedAt: 'computedAt'
  };

  export type HistoricalConversionRateScalarFieldEnum = (typeof HistoricalConversionRateScalarFieldEnum)[keyof typeof HistoricalConversionRateScalarFieldEnum]


  export const ForecastSubmissionScalarFieldEnum: {
    id: 'id',
    tenantId: 'tenantId',
    periodId: 'periodId',
    repUserId: 'repUserId',
    lob: 'lob',
    version: 'version',
    commitForecast: 'commitForecast',
    bestCaseForecast: 'bestCaseForecast',
    notes: 'notes',
    status: 'status',
    submittedAt: 'submittedAt',
    managerOverride: 'managerOverride',
    managerComment: 'managerComment',
    managerId: 'managerId',
    managerName: 'managerName',
    approvedAt: 'approvedAt',
    reopenedAt: 'reopenedAt',
    overriddenAt: 'overriddenAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ForecastSubmissionScalarFieldEnum = (typeof ForecastSubmissionScalarFieldEnum)[keyof typeof ForecastSubmissionScalarFieldEnum]


  export const ForecastAuditLogScalarFieldEnum: {
    id: 'id',
    tenantId: 'tenantId',
    forecastSubmissionId: 'forecastSubmissionId',
    action: 'action',
    actorId: 'actorId',
    actorName: 'actorName',
    actorRole: 'actorRole',
    metadata: 'metadata',
    createdAt: 'createdAt'
  };

  export type ForecastAuditLogScalarFieldEnum = (typeof ForecastAuditLogScalarFieldEnum)[keyof typeof ForecastAuditLogScalarFieldEnum]


  export const CrmDealScalarFieldEnum: {
    id: 'id',
    tenantId: 'tenantId',
    dealName: 'dealName',
    stage: 'stage',
    amount: 'amount',
    closeDate: 'closeDate',
    probability: 'probability',
    isClosedWon: 'isClosedWon',
    isClosedLost: 'isClosedLost',
    region: 'region',
    lob: 'lob',
    repUserId: 'repUserId',
    hubspotId: 'hubspotId',
    lastActivityDate: 'lastActivityDate',
    riskReason: 'riskReason',
    source: 'source',
    createdBy: 'createdBy',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type CrmDealScalarFieldEnum = (typeof CrmDealScalarFieldEnum)[keyof typeof CrmDealScalarFieldEnum]


  export const UserScalarFieldEnum: {
    id: 'id',
    tenantId: 'tenantId',
    name: 'name',
    email: 'email',
    password: 'password',
    role: 'role',
    repId: 'repId',
    managerId: 'managerId',
    region: 'region',
    teamName: 'teamName',
    createdAt: 'createdAt'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const QuotaScalarFieldEnum: {
    id: 'id',
    tenantId: 'tenantId',
    periodId: 'periodId',
    repUserId: 'repUserId',
    amount: 'amount',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type QuotaScalarFieldEnum = (typeof QuotaScalarFieldEnum)[keyof typeof QuotaScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const JsonNullValueInput: {
    JsonNull: typeof JsonNull
  };

  export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput]


  export const NullableJsonNullValueInput: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull
  };

  export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references 
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    
  /**
   * Deep Input Types
   */


  export type ForecastPeriodWhereInput = {
    AND?: ForecastPeriodWhereInput | ForecastPeriodWhereInput[]
    OR?: ForecastPeriodWhereInput[]
    NOT?: ForecastPeriodWhereInput | ForecastPeriodWhereInput[]
    id?: StringFilter<"ForecastPeriod"> | string
    tenantId?: StringFilter<"ForecastPeriod"> | string
    name?: StringFilter<"ForecastPeriod"> | string
    startDate?: DateTimeFilter<"ForecastPeriod"> | Date | string
    endDate?: DateTimeFilter<"ForecastPeriod"> | Date | string
    revenueTarget?: FloatFilter<"ForecastPeriod"> | number
    status?: StringFilter<"ForecastPeriod"> | string
    isLocked?: BoolFilter<"ForecastPeriod"> | boolean
    createdAt?: DateTimeFilter<"ForecastPeriod"> | Date | string
    updatedAt?: DateTimeFilter<"ForecastPeriod"> | Date | string
    snapshots?: AiForecastSnapshotListRelationFilter
    submissions?: ForecastSubmissionListRelationFilter
  }

  export type ForecastPeriodOrderByWithRelationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    name?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    revenueTarget?: SortOrder
    status?: SortOrder
    isLocked?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    snapshots?: AiForecastSnapshotOrderByRelationAggregateInput
    submissions?: ForecastSubmissionOrderByRelationAggregateInput
  }

  export type ForecastPeriodWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ForecastPeriodWhereInput | ForecastPeriodWhereInput[]
    OR?: ForecastPeriodWhereInput[]
    NOT?: ForecastPeriodWhereInput | ForecastPeriodWhereInput[]
    tenantId?: StringFilter<"ForecastPeriod"> | string
    name?: StringFilter<"ForecastPeriod"> | string
    startDate?: DateTimeFilter<"ForecastPeriod"> | Date | string
    endDate?: DateTimeFilter<"ForecastPeriod"> | Date | string
    revenueTarget?: FloatFilter<"ForecastPeriod"> | number
    status?: StringFilter<"ForecastPeriod"> | string
    isLocked?: BoolFilter<"ForecastPeriod"> | boolean
    createdAt?: DateTimeFilter<"ForecastPeriod"> | Date | string
    updatedAt?: DateTimeFilter<"ForecastPeriod"> | Date | string
    snapshots?: AiForecastSnapshotListRelationFilter
    submissions?: ForecastSubmissionListRelationFilter
  }, "id">

  export type ForecastPeriodOrderByWithAggregationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    name?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    revenueTarget?: SortOrder
    status?: SortOrder
    isLocked?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ForecastPeriodCountOrderByAggregateInput
    _avg?: ForecastPeriodAvgOrderByAggregateInput
    _max?: ForecastPeriodMaxOrderByAggregateInput
    _min?: ForecastPeriodMinOrderByAggregateInput
    _sum?: ForecastPeriodSumOrderByAggregateInput
  }

  export type ForecastPeriodScalarWhereWithAggregatesInput = {
    AND?: ForecastPeriodScalarWhereWithAggregatesInput | ForecastPeriodScalarWhereWithAggregatesInput[]
    OR?: ForecastPeriodScalarWhereWithAggregatesInput[]
    NOT?: ForecastPeriodScalarWhereWithAggregatesInput | ForecastPeriodScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ForecastPeriod"> | string
    tenantId?: StringWithAggregatesFilter<"ForecastPeriod"> | string
    name?: StringWithAggregatesFilter<"ForecastPeriod"> | string
    startDate?: DateTimeWithAggregatesFilter<"ForecastPeriod"> | Date | string
    endDate?: DateTimeWithAggregatesFilter<"ForecastPeriod"> | Date | string
    revenueTarget?: FloatWithAggregatesFilter<"ForecastPeriod"> | number
    status?: StringWithAggregatesFilter<"ForecastPeriod"> | string
    isLocked?: BoolWithAggregatesFilter<"ForecastPeriod"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"ForecastPeriod"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"ForecastPeriod"> | Date | string
  }

  export type AiForecastSnapshotWhereInput = {
    AND?: AiForecastSnapshotWhereInput | AiForecastSnapshotWhereInput[]
    OR?: AiForecastSnapshotWhereInput[]
    NOT?: AiForecastSnapshotWhereInput | AiForecastSnapshotWhereInput[]
    snapshotId?: StringFilter<"AiForecastSnapshot"> | string
    tenantId?: StringFilter<"AiForecastSnapshot"> | string
    periodId?: StringFilter<"AiForecastSnapshot"> | string
    predictedAmount?: FloatFilter<"AiForecastSnapshot"> | number
    confidenceRangeLow?: FloatFilter<"AiForecastSnapshot"> | number
    confidenceRangeHigh?: FloatFilter<"AiForecastSnapshot"> | number
    modelInputs?: JsonFilter<"AiForecastSnapshot">
    inputPipelineValue?: FloatNullableFilter<"AiForecastSnapshot"> | number | null
    regionBreakdown?: JsonNullableFilter<"AiForecastSnapshot">
    computedAt?: DateTimeFilter<"AiForecastSnapshot"> | Date | string
    idempotencyKey?: StringFilter<"AiForecastSnapshot"> | string
    period?: XOR<ForecastPeriodRelationFilter, ForecastPeriodWhereInput>
  }

  export type AiForecastSnapshotOrderByWithRelationInput = {
    snapshotId?: SortOrder
    tenantId?: SortOrder
    periodId?: SortOrder
    predictedAmount?: SortOrder
    confidenceRangeLow?: SortOrder
    confidenceRangeHigh?: SortOrder
    modelInputs?: SortOrder
    inputPipelineValue?: SortOrderInput | SortOrder
    regionBreakdown?: SortOrderInput | SortOrder
    computedAt?: SortOrder
    idempotencyKey?: SortOrder
    period?: ForecastPeriodOrderByWithRelationInput
  }

  export type AiForecastSnapshotWhereUniqueInput = Prisma.AtLeast<{
    snapshotId?: string
    idempotencyKey?: string
    AND?: AiForecastSnapshotWhereInput | AiForecastSnapshotWhereInput[]
    OR?: AiForecastSnapshotWhereInput[]
    NOT?: AiForecastSnapshotWhereInput | AiForecastSnapshotWhereInput[]
    tenantId?: StringFilter<"AiForecastSnapshot"> | string
    periodId?: StringFilter<"AiForecastSnapshot"> | string
    predictedAmount?: FloatFilter<"AiForecastSnapshot"> | number
    confidenceRangeLow?: FloatFilter<"AiForecastSnapshot"> | number
    confidenceRangeHigh?: FloatFilter<"AiForecastSnapshot"> | number
    modelInputs?: JsonFilter<"AiForecastSnapshot">
    inputPipelineValue?: FloatNullableFilter<"AiForecastSnapshot"> | number | null
    regionBreakdown?: JsonNullableFilter<"AiForecastSnapshot">
    computedAt?: DateTimeFilter<"AiForecastSnapshot"> | Date | string
    period?: XOR<ForecastPeriodRelationFilter, ForecastPeriodWhereInput>
  }, "snapshotId" | "idempotencyKey">

  export type AiForecastSnapshotOrderByWithAggregationInput = {
    snapshotId?: SortOrder
    tenantId?: SortOrder
    periodId?: SortOrder
    predictedAmount?: SortOrder
    confidenceRangeLow?: SortOrder
    confidenceRangeHigh?: SortOrder
    modelInputs?: SortOrder
    inputPipelineValue?: SortOrderInput | SortOrder
    regionBreakdown?: SortOrderInput | SortOrder
    computedAt?: SortOrder
    idempotencyKey?: SortOrder
    _count?: AiForecastSnapshotCountOrderByAggregateInput
    _avg?: AiForecastSnapshotAvgOrderByAggregateInput
    _max?: AiForecastSnapshotMaxOrderByAggregateInput
    _min?: AiForecastSnapshotMinOrderByAggregateInput
    _sum?: AiForecastSnapshotSumOrderByAggregateInput
  }

  export type AiForecastSnapshotScalarWhereWithAggregatesInput = {
    AND?: AiForecastSnapshotScalarWhereWithAggregatesInput | AiForecastSnapshotScalarWhereWithAggregatesInput[]
    OR?: AiForecastSnapshotScalarWhereWithAggregatesInput[]
    NOT?: AiForecastSnapshotScalarWhereWithAggregatesInput | AiForecastSnapshotScalarWhereWithAggregatesInput[]
    snapshotId?: StringWithAggregatesFilter<"AiForecastSnapshot"> | string
    tenantId?: StringWithAggregatesFilter<"AiForecastSnapshot"> | string
    periodId?: StringWithAggregatesFilter<"AiForecastSnapshot"> | string
    predictedAmount?: FloatWithAggregatesFilter<"AiForecastSnapshot"> | number
    confidenceRangeLow?: FloatWithAggregatesFilter<"AiForecastSnapshot"> | number
    confidenceRangeHigh?: FloatWithAggregatesFilter<"AiForecastSnapshot"> | number
    modelInputs?: JsonWithAggregatesFilter<"AiForecastSnapshot">
    inputPipelineValue?: FloatNullableWithAggregatesFilter<"AiForecastSnapshot"> | number | null
    regionBreakdown?: JsonNullableWithAggregatesFilter<"AiForecastSnapshot">
    computedAt?: DateTimeWithAggregatesFilter<"AiForecastSnapshot"> | Date | string
    idempotencyKey?: StringWithAggregatesFilter<"AiForecastSnapshot"> | string
  }

  export type PipelineCoverageMetricsWhereInput = {
    AND?: PipelineCoverageMetricsWhereInput | PipelineCoverageMetricsWhereInput[]
    OR?: PipelineCoverageMetricsWhereInput[]
    NOT?: PipelineCoverageMetricsWhereInput | PipelineCoverageMetricsWhereInput[]
    id?: StringFilter<"PipelineCoverageMetrics"> | string
    tenantId?: StringFilter<"PipelineCoverageMetrics"> | string
    periodId?: StringFilter<"PipelineCoverageMetrics"> | string
    openPipelineValue?: FloatFilter<"PipelineCoverageMetrics"> | number
    weightedPipelineValue?: FloatFilter<"PipelineCoverageMetrics"> | number
    closedWonAmount?: FloatFilter<"PipelineCoverageMetrics"> | number
    coverageRatio?: FloatFilter<"PipelineCoverageMetrics"> | number
    computedAt?: DateTimeFilter<"PipelineCoverageMetrics"> | Date | string
  }

  export type PipelineCoverageMetricsOrderByWithRelationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    periodId?: SortOrder
    openPipelineValue?: SortOrder
    weightedPipelineValue?: SortOrder
    closedWonAmount?: SortOrder
    coverageRatio?: SortOrder
    computedAt?: SortOrder
  }

  export type PipelineCoverageMetricsWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: PipelineCoverageMetricsWhereInput | PipelineCoverageMetricsWhereInput[]
    OR?: PipelineCoverageMetricsWhereInput[]
    NOT?: PipelineCoverageMetricsWhereInput | PipelineCoverageMetricsWhereInput[]
    tenantId?: StringFilter<"PipelineCoverageMetrics"> | string
    periodId?: StringFilter<"PipelineCoverageMetrics"> | string
    openPipelineValue?: FloatFilter<"PipelineCoverageMetrics"> | number
    weightedPipelineValue?: FloatFilter<"PipelineCoverageMetrics"> | number
    closedWonAmount?: FloatFilter<"PipelineCoverageMetrics"> | number
    coverageRatio?: FloatFilter<"PipelineCoverageMetrics"> | number
    computedAt?: DateTimeFilter<"PipelineCoverageMetrics"> | Date | string
  }, "id">

  export type PipelineCoverageMetricsOrderByWithAggregationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    periodId?: SortOrder
    openPipelineValue?: SortOrder
    weightedPipelineValue?: SortOrder
    closedWonAmount?: SortOrder
    coverageRatio?: SortOrder
    computedAt?: SortOrder
    _count?: PipelineCoverageMetricsCountOrderByAggregateInput
    _avg?: PipelineCoverageMetricsAvgOrderByAggregateInput
    _max?: PipelineCoverageMetricsMaxOrderByAggregateInput
    _min?: PipelineCoverageMetricsMinOrderByAggregateInput
    _sum?: PipelineCoverageMetricsSumOrderByAggregateInput
  }

  export type PipelineCoverageMetricsScalarWhereWithAggregatesInput = {
    AND?: PipelineCoverageMetricsScalarWhereWithAggregatesInput | PipelineCoverageMetricsScalarWhereWithAggregatesInput[]
    OR?: PipelineCoverageMetricsScalarWhereWithAggregatesInput[]
    NOT?: PipelineCoverageMetricsScalarWhereWithAggregatesInput | PipelineCoverageMetricsScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"PipelineCoverageMetrics"> | string
    tenantId?: StringWithAggregatesFilter<"PipelineCoverageMetrics"> | string
    periodId?: StringWithAggregatesFilter<"PipelineCoverageMetrics"> | string
    openPipelineValue?: FloatWithAggregatesFilter<"PipelineCoverageMetrics"> | number
    weightedPipelineValue?: FloatWithAggregatesFilter<"PipelineCoverageMetrics"> | number
    closedWonAmount?: FloatWithAggregatesFilter<"PipelineCoverageMetrics"> | number
    coverageRatio?: FloatWithAggregatesFilter<"PipelineCoverageMetrics"> | number
    computedAt?: DateTimeWithAggregatesFilter<"PipelineCoverageMetrics"> | Date | string
  }

  export type HistoricalConversionRateWhereInput = {
    AND?: HistoricalConversionRateWhereInput | HistoricalConversionRateWhereInput[]
    OR?: HistoricalConversionRateWhereInput[]
    NOT?: HistoricalConversionRateWhereInput | HistoricalConversionRateWhereInput[]
    id?: StringFilter<"HistoricalConversionRate"> | string
    tenantId?: StringFilter<"HistoricalConversionRate"> | string
    fromStage?: StringFilter<"HistoricalConversionRate"> | string
    toStage?: StringFilter<"HistoricalConversionRate"> | string
    conversionRate?: FloatFilter<"HistoricalConversionRate"> | number
    sampleSize?: IntFilter<"HistoricalConversionRate"> | number
    computedFromPeriod?: StringFilter<"HistoricalConversionRate"> | string
    periodName?: StringNullableFilter<"HistoricalConversionRate"> | string | null
    computedAt?: DateTimeFilter<"HistoricalConversionRate"> | Date | string
  }

  export type HistoricalConversionRateOrderByWithRelationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    fromStage?: SortOrder
    toStage?: SortOrder
    conversionRate?: SortOrder
    sampleSize?: SortOrder
    computedFromPeriod?: SortOrder
    periodName?: SortOrderInput | SortOrder
    computedAt?: SortOrder
  }

  export type HistoricalConversionRateWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: HistoricalConversionRateWhereInput | HistoricalConversionRateWhereInput[]
    OR?: HistoricalConversionRateWhereInput[]
    NOT?: HistoricalConversionRateWhereInput | HistoricalConversionRateWhereInput[]
    tenantId?: StringFilter<"HistoricalConversionRate"> | string
    fromStage?: StringFilter<"HistoricalConversionRate"> | string
    toStage?: StringFilter<"HistoricalConversionRate"> | string
    conversionRate?: FloatFilter<"HistoricalConversionRate"> | number
    sampleSize?: IntFilter<"HistoricalConversionRate"> | number
    computedFromPeriod?: StringFilter<"HistoricalConversionRate"> | string
    periodName?: StringNullableFilter<"HistoricalConversionRate"> | string | null
    computedAt?: DateTimeFilter<"HistoricalConversionRate"> | Date | string
  }, "id">

  export type HistoricalConversionRateOrderByWithAggregationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    fromStage?: SortOrder
    toStage?: SortOrder
    conversionRate?: SortOrder
    sampleSize?: SortOrder
    computedFromPeriod?: SortOrder
    periodName?: SortOrderInput | SortOrder
    computedAt?: SortOrder
    _count?: HistoricalConversionRateCountOrderByAggregateInput
    _avg?: HistoricalConversionRateAvgOrderByAggregateInput
    _max?: HistoricalConversionRateMaxOrderByAggregateInput
    _min?: HistoricalConversionRateMinOrderByAggregateInput
    _sum?: HistoricalConversionRateSumOrderByAggregateInput
  }

  export type HistoricalConversionRateScalarWhereWithAggregatesInput = {
    AND?: HistoricalConversionRateScalarWhereWithAggregatesInput | HistoricalConversionRateScalarWhereWithAggregatesInput[]
    OR?: HistoricalConversionRateScalarWhereWithAggregatesInput[]
    NOT?: HistoricalConversionRateScalarWhereWithAggregatesInput | HistoricalConversionRateScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"HistoricalConversionRate"> | string
    tenantId?: StringWithAggregatesFilter<"HistoricalConversionRate"> | string
    fromStage?: StringWithAggregatesFilter<"HistoricalConversionRate"> | string
    toStage?: StringWithAggregatesFilter<"HistoricalConversionRate"> | string
    conversionRate?: FloatWithAggregatesFilter<"HistoricalConversionRate"> | number
    sampleSize?: IntWithAggregatesFilter<"HistoricalConversionRate"> | number
    computedFromPeriod?: StringWithAggregatesFilter<"HistoricalConversionRate"> | string
    periodName?: StringNullableWithAggregatesFilter<"HistoricalConversionRate"> | string | null
    computedAt?: DateTimeWithAggregatesFilter<"HistoricalConversionRate"> | Date | string
  }

  export type ForecastSubmissionWhereInput = {
    AND?: ForecastSubmissionWhereInput | ForecastSubmissionWhereInput[]
    OR?: ForecastSubmissionWhereInput[]
    NOT?: ForecastSubmissionWhereInput | ForecastSubmissionWhereInput[]
    id?: StringFilter<"ForecastSubmission"> | string
    tenantId?: StringFilter<"ForecastSubmission"> | string
    periodId?: StringFilter<"ForecastSubmission"> | string
    repUserId?: StringFilter<"ForecastSubmission"> | string
    lob?: StringFilter<"ForecastSubmission"> | string
    version?: IntFilter<"ForecastSubmission"> | number
    commitForecast?: FloatFilter<"ForecastSubmission"> | number
    bestCaseForecast?: FloatNullableFilter<"ForecastSubmission"> | number | null
    notes?: StringNullableFilter<"ForecastSubmission"> | string | null
    status?: StringFilter<"ForecastSubmission"> | string
    submittedAt?: DateTimeNullableFilter<"ForecastSubmission"> | Date | string | null
    managerOverride?: FloatNullableFilter<"ForecastSubmission"> | number | null
    managerComment?: StringNullableFilter<"ForecastSubmission"> | string | null
    managerId?: StringNullableFilter<"ForecastSubmission"> | string | null
    managerName?: StringNullableFilter<"ForecastSubmission"> | string | null
    approvedAt?: DateTimeNullableFilter<"ForecastSubmission"> | Date | string | null
    reopenedAt?: DateTimeNullableFilter<"ForecastSubmission"> | Date | string | null
    overriddenAt?: DateTimeNullableFilter<"ForecastSubmission"> | Date | string | null
    createdAt?: DateTimeFilter<"ForecastSubmission"> | Date | string
    updatedAt?: DateTimeFilter<"ForecastSubmission"> | Date | string
    period?: XOR<ForecastPeriodRelationFilter, ForecastPeriodWhereInput>
  }

  export type ForecastSubmissionOrderByWithRelationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    periodId?: SortOrder
    repUserId?: SortOrder
    lob?: SortOrder
    version?: SortOrder
    commitForecast?: SortOrder
    bestCaseForecast?: SortOrderInput | SortOrder
    notes?: SortOrderInput | SortOrder
    status?: SortOrder
    submittedAt?: SortOrderInput | SortOrder
    managerOverride?: SortOrderInput | SortOrder
    managerComment?: SortOrderInput | SortOrder
    managerId?: SortOrderInput | SortOrder
    managerName?: SortOrderInput | SortOrder
    approvedAt?: SortOrderInput | SortOrder
    reopenedAt?: SortOrderInput | SortOrder
    overriddenAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    period?: ForecastPeriodOrderByWithRelationInput
  }

  export type ForecastSubmissionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ForecastSubmissionWhereInput | ForecastSubmissionWhereInput[]
    OR?: ForecastSubmissionWhereInput[]
    NOT?: ForecastSubmissionWhereInput | ForecastSubmissionWhereInput[]
    tenantId?: StringFilter<"ForecastSubmission"> | string
    periodId?: StringFilter<"ForecastSubmission"> | string
    repUserId?: StringFilter<"ForecastSubmission"> | string
    lob?: StringFilter<"ForecastSubmission"> | string
    version?: IntFilter<"ForecastSubmission"> | number
    commitForecast?: FloatFilter<"ForecastSubmission"> | number
    bestCaseForecast?: FloatNullableFilter<"ForecastSubmission"> | number | null
    notes?: StringNullableFilter<"ForecastSubmission"> | string | null
    status?: StringFilter<"ForecastSubmission"> | string
    submittedAt?: DateTimeNullableFilter<"ForecastSubmission"> | Date | string | null
    managerOverride?: FloatNullableFilter<"ForecastSubmission"> | number | null
    managerComment?: StringNullableFilter<"ForecastSubmission"> | string | null
    managerId?: StringNullableFilter<"ForecastSubmission"> | string | null
    managerName?: StringNullableFilter<"ForecastSubmission"> | string | null
    approvedAt?: DateTimeNullableFilter<"ForecastSubmission"> | Date | string | null
    reopenedAt?: DateTimeNullableFilter<"ForecastSubmission"> | Date | string | null
    overriddenAt?: DateTimeNullableFilter<"ForecastSubmission"> | Date | string | null
    createdAt?: DateTimeFilter<"ForecastSubmission"> | Date | string
    updatedAt?: DateTimeFilter<"ForecastSubmission"> | Date | string
    period?: XOR<ForecastPeriodRelationFilter, ForecastPeriodWhereInput>
  }, "id">

  export type ForecastSubmissionOrderByWithAggregationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    periodId?: SortOrder
    repUserId?: SortOrder
    lob?: SortOrder
    version?: SortOrder
    commitForecast?: SortOrder
    bestCaseForecast?: SortOrderInput | SortOrder
    notes?: SortOrderInput | SortOrder
    status?: SortOrder
    submittedAt?: SortOrderInput | SortOrder
    managerOverride?: SortOrderInput | SortOrder
    managerComment?: SortOrderInput | SortOrder
    managerId?: SortOrderInput | SortOrder
    managerName?: SortOrderInput | SortOrder
    approvedAt?: SortOrderInput | SortOrder
    reopenedAt?: SortOrderInput | SortOrder
    overriddenAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ForecastSubmissionCountOrderByAggregateInput
    _avg?: ForecastSubmissionAvgOrderByAggregateInput
    _max?: ForecastSubmissionMaxOrderByAggregateInput
    _min?: ForecastSubmissionMinOrderByAggregateInput
    _sum?: ForecastSubmissionSumOrderByAggregateInput
  }

  export type ForecastSubmissionScalarWhereWithAggregatesInput = {
    AND?: ForecastSubmissionScalarWhereWithAggregatesInput | ForecastSubmissionScalarWhereWithAggregatesInput[]
    OR?: ForecastSubmissionScalarWhereWithAggregatesInput[]
    NOT?: ForecastSubmissionScalarWhereWithAggregatesInput | ForecastSubmissionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ForecastSubmission"> | string
    tenantId?: StringWithAggregatesFilter<"ForecastSubmission"> | string
    periodId?: StringWithAggregatesFilter<"ForecastSubmission"> | string
    repUserId?: StringWithAggregatesFilter<"ForecastSubmission"> | string
    lob?: StringWithAggregatesFilter<"ForecastSubmission"> | string
    version?: IntWithAggregatesFilter<"ForecastSubmission"> | number
    commitForecast?: FloatWithAggregatesFilter<"ForecastSubmission"> | number
    bestCaseForecast?: FloatNullableWithAggregatesFilter<"ForecastSubmission"> | number | null
    notes?: StringNullableWithAggregatesFilter<"ForecastSubmission"> | string | null
    status?: StringWithAggregatesFilter<"ForecastSubmission"> | string
    submittedAt?: DateTimeNullableWithAggregatesFilter<"ForecastSubmission"> | Date | string | null
    managerOverride?: FloatNullableWithAggregatesFilter<"ForecastSubmission"> | number | null
    managerComment?: StringNullableWithAggregatesFilter<"ForecastSubmission"> | string | null
    managerId?: StringNullableWithAggregatesFilter<"ForecastSubmission"> | string | null
    managerName?: StringNullableWithAggregatesFilter<"ForecastSubmission"> | string | null
    approvedAt?: DateTimeNullableWithAggregatesFilter<"ForecastSubmission"> | Date | string | null
    reopenedAt?: DateTimeNullableWithAggregatesFilter<"ForecastSubmission"> | Date | string | null
    overriddenAt?: DateTimeNullableWithAggregatesFilter<"ForecastSubmission"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"ForecastSubmission"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"ForecastSubmission"> | Date | string
  }

  export type ForecastAuditLogWhereInput = {
    AND?: ForecastAuditLogWhereInput | ForecastAuditLogWhereInput[]
    OR?: ForecastAuditLogWhereInput[]
    NOT?: ForecastAuditLogWhereInput | ForecastAuditLogWhereInput[]
    id?: StringFilter<"ForecastAuditLog"> | string
    tenantId?: StringFilter<"ForecastAuditLog"> | string
    forecastSubmissionId?: StringFilter<"ForecastAuditLog"> | string
    action?: StringFilter<"ForecastAuditLog"> | string
    actorId?: StringFilter<"ForecastAuditLog"> | string
    actorName?: StringNullableFilter<"ForecastAuditLog"> | string | null
    actorRole?: StringFilter<"ForecastAuditLog"> | string
    metadata?: JsonNullableFilter<"ForecastAuditLog">
    createdAt?: DateTimeFilter<"ForecastAuditLog"> | Date | string
  }

  export type ForecastAuditLogOrderByWithRelationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    forecastSubmissionId?: SortOrder
    action?: SortOrder
    actorId?: SortOrder
    actorName?: SortOrderInput | SortOrder
    actorRole?: SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
  }

  export type ForecastAuditLogWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ForecastAuditLogWhereInput | ForecastAuditLogWhereInput[]
    OR?: ForecastAuditLogWhereInput[]
    NOT?: ForecastAuditLogWhereInput | ForecastAuditLogWhereInput[]
    tenantId?: StringFilter<"ForecastAuditLog"> | string
    forecastSubmissionId?: StringFilter<"ForecastAuditLog"> | string
    action?: StringFilter<"ForecastAuditLog"> | string
    actorId?: StringFilter<"ForecastAuditLog"> | string
    actorName?: StringNullableFilter<"ForecastAuditLog"> | string | null
    actorRole?: StringFilter<"ForecastAuditLog"> | string
    metadata?: JsonNullableFilter<"ForecastAuditLog">
    createdAt?: DateTimeFilter<"ForecastAuditLog"> | Date | string
  }, "id">

  export type ForecastAuditLogOrderByWithAggregationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    forecastSubmissionId?: SortOrder
    action?: SortOrder
    actorId?: SortOrder
    actorName?: SortOrderInput | SortOrder
    actorRole?: SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: ForecastAuditLogCountOrderByAggregateInput
    _max?: ForecastAuditLogMaxOrderByAggregateInput
    _min?: ForecastAuditLogMinOrderByAggregateInput
  }

  export type ForecastAuditLogScalarWhereWithAggregatesInput = {
    AND?: ForecastAuditLogScalarWhereWithAggregatesInput | ForecastAuditLogScalarWhereWithAggregatesInput[]
    OR?: ForecastAuditLogScalarWhereWithAggregatesInput[]
    NOT?: ForecastAuditLogScalarWhereWithAggregatesInput | ForecastAuditLogScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ForecastAuditLog"> | string
    tenantId?: StringWithAggregatesFilter<"ForecastAuditLog"> | string
    forecastSubmissionId?: StringWithAggregatesFilter<"ForecastAuditLog"> | string
    action?: StringWithAggregatesFilter<"ForecastAuditLog"> | string
    actorId?: StringWithAggregatesFilter<"ForecastAuditLog"> | string
    actorName?: StringNullableWithAggregatesFilter<"ForecastAuditLog"> | string | null
    actorRole?: StringWithAggregatesFilter<"ForecastAuditLog"> | string
    metadata?: JsonNullableWithAggregatesFilter<"ForecastAuditLog">
    createdAt?: DateTimeWithAggregatesFilter<"ForecastAuditLog"> | Date | string
  }

  export type CrmDealWhereInput = {
    AND?: CrmDealWhereInput | CrmDealWhereInput[]
    OR?: CrmDealWhereInput[]
    NOT?: CrmDealWhereInput | CrmDealWhereInput[]
    id?: StringFilter<"CrmDeal"> | string
    tenantId?: StringFilter<"CrmDeal"> | string
    dealName?: StringFilter<"CrmDeal"> | string
    stage?: StringFilter<"CrmDeal"> | string
    amount?: FloatFilter<"CrmDeal"> | number
    closeDate?: DateTimeFilter<"CrmDeal"> | Date | string
    probability?: FloatNullableFilter<"CrmDeal"> | number | null
    isClosedWon?: BoolFilter<"CrmDeal"> | boolean
    isClosedLost?: BoolFilter<"CrmDeal"> | boolean
    region?: StringNullableFilter<"CrmDeal"> | string | null
    lob?: StringNullableFilter<"CrmDeal"> | string | null
    repUserId?: StringNullableFilter<"CrmDeal"> | string | null
    hubspotId?: StringNullableFilter<"CrmDeal"> | string | null
    lastActivityDate?: DateTimeNullableFilter<"CrmDeal"> | Date | string | null
    riskReason?: StringNullableFilter<"CrmDeal"> | string | null
    source?: StringFilter<"CrmDeal"> | string
    createdBy?: StringFilter<"CrmDeal"> | string
    createdAt?: DateTimeFilter<"CrmDeal"> | Date | string
    updatedAt?: DateTimeFilter<"CrmDeal"> | Date | string
  }

  export type CrmDealOrderByWithRelationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    dealName?: SortOrder
    stage?: SortOrder
    amount?: SortOrder
    closeDate?: SortOrder
    probability?: SortOrderInput | SortOrder
    isClosedWon?: SortOrder
    isClosedLost?: SortOrder
    region?: SortOrderInput | SortOrder
    lob?: SortOrderInput | SortOrder
    repUserId?: SortOrderInput | SortOrder
    hubspotId?: SortOrderInput | SortOrder
    lastActivityDate?: SortOrderInput | SortOrder
    riskReason?: SortOrderInput | SortOrder
    source?: SortOrder
    createdBy?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CrmDealWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: CrmDealWhereInput | CrmDealWhereInput[]
    OR?: CrmDealWhereInput[]
    NOT?: CrmDealWhereInput | CrmDealWhereInput[]
    tenantId?: StringFilter<"CrmDeal"> | string
    dealName?: StringFilter<"CrmDeal"> | string
    stage?: StringFilter<"CrmDeal"> | string
    amount?: FloatFilter<"CrmDeal"> | number
    closeDate?: DateTimeFilter<"CrmDeal"> | Date | string
    probability?: FloatNullableFilter<"CrmDeal"> | number | null
    isClosedWon?: BoolFilter<"CrmDeal"> | boolean
    isClosedLost?: BoolFilter<"CrmDeal"> | boolean
    region?: StringNullableFilter<"CrmDeal"> | string | null
    lob?: StringNullableFilter<"CrmDeal"> | string | null
    repUserId?: StringNullableFilter<"CrmDeal"> | string | null
    hubspotId?: StringNullableFilter<"CrmDeal"> | string | null
    lastActivityDate?: DateTimeNullableFilter<"CrmDeal"> | Date | string | null
    riskReason?: StringNullableFilter<"CrmDeal"> | string | null
    source?: StringFilter<"CrmDeal"> | string
    createdBy?: StringFilter<"CrmDeal"> | string
    createdAt?: DateTimeFilter<"CrmDeal"> | Date | string
    updatedAt?: DateTimeFilter<"CrmDeal"> | Date | string
  }, "id">

  export type CrmDealOrderByWithAggregationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    dealName?: SortOrder
    stage?: SortOrder
    amount?: SortOrder
    closeDate?: SortOrder
    probability?: SortOrderInput | SortOrder
    isClosedWon?: SortOrder
    isClosedLost?: SortOrder
    region?: SortOrderInput | SortOrder
    lob?: SortOrderInput | SortOrder
    repUserId?: SortOrderInput | SortOrder
    hubspotId?: SortOrderInput | SortOrder
    lastActivityDate?: SortOrderInput | SortOrder
    riskReason?: SortOrderInput | SortOrder
    source?: SortOrder
    createdBy?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: CrmDealCountOrderByAggregateInput
    _avg?: CrmDealAvgOrderByAggregateInput
    _max?: CrmDealMaxOrderByAggregateInput
    _min?: CrmDealMinOrderByAggregateInput
    _sum?: CrmDealSumOrderByAggregateInput
  }

  export type CrmDealScalarWhereWithAggregatesInput = {
    AND?: CrmDealScalarWhereWithAggregatesInput | CrmDealScalarWhereWithAggregatesInput[]
    OR?: CrmDealScalarWhereWithAggregatesInput[]
    NOT?: CrmDealScalarWhereWithAggregatesInput | CrmDealScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"CrmDeal"> | string
    tenantId?: StringWithAggregatesFilter<"CrmDeal"> | string
    dealName?: StringWithAggregatesFilter<"CrmDeal"> | string
    stage?: StringWithAggregatesFilter<"CrmDeal"> | string
    amount?: FloatWithAggregatesFilter<"CrmDeal"> | number
    closeDate?: DateTimeWithAggregatesFilter<"CrmDeal"> | Date | string
    probability?: FloatNullableWithAggregatesFilter<"CrmDeal"> | number | null
    isClosedWon?: BoolWithAggregatesFilter<"CrmDeal"> | boolean
    isClosedLost?: BoolWithAggregatesFilter<"CrmDeal"> | boolean
    region?: StringNullableWithAggregatesFilter<"CrmDeal"> | string | null
    lob?: StringNullableWithAggregatesFilter<"CrmDeal"> | string | null
    repUserId?: StringNullableWithAggregatesFilter<"CrmDeal"> | string | null
    hubspotId?: StringNullableWithAggregatesFilter<"CrmDeal"> | string | null
    lastActivityDate?: DateTimeNullableWithAggregatesFilter<"CrmDeal"> | Date | string | null
    riskReason?: StringNullableWithAggregatesFilter<"CrmDeal"> | string | null
    source?: StringWithAggregatesFilter<"CrmDeal"> | string
    createdBy?: StringWithAggregatesFilter<"CrmDeal"> | string
    createdAt?: DateTimeWithAggregatesFilter<"CrmDeal"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"CrmDeal"> | Date | string
  }

  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: StringFilter<"User"> | string
    tenantId?: StringFilter<"User"> | string
    name?: StringFilter<"User"> | string
    email?: StringFilter<"User"> | string
    password?: StringFilter<"User"> | string
    role?: StringFilter<"User"> | string
    repId?: StringNullableFilter<"User"> | string | null
    managerId?: StringNullableFilter<"User"> | string | null
    region?: StringNullableFilter<"User"> | string | null
    teamName?: StringNullableFilter<"User"> | string | null
    createdAt?: DateTimeFilter<"User"> | Date | string
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    name?: SortOrder
    email?: SortOrder
    password?: SortOrder
    role?: SortOrder
    repId?: SortOrderInput | SortOrder
    managerId?: SortOrderInput | SortOrder
    region?: SortOrderInput | SortOrder
    teamName?: SortOrderInput | SortOrder
    createdAt?: SortOrder
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    email?: string
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    tenantId?: StringFilter<"User"> | string
    name?: StringFilter<"User"> | string
    password?: StringFilter<"User"> | string
    role?: StringFilter<"User"> | string
    repId?: StringNullableFilter<"User"> | string | null
    managerId?: StringNullableFilter<"User"> | string | null
    region?: StringNullableFilter<"User"> | string | null
    teamName?: StringNullableFilter<"User"> | string | null
    createdAt?: DateTimeFilter<"User"> | Date | string
  }, "id" | "email">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    name?: SortOrder
    email?: SortOrder
    password?: SortOrder
    role?: SortOrder
    repId?: SortOrderInput | SortOrder
    managerId?: SortOrderInput | SortOrder
    region?: SortOrderInput | SortOrder
    teamName?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: UserCountOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"User"> | string
    tenantId?: StringWithAggregatesFilter<"User"> | string
    name?: StringWithAggregatesFilter<"User"> | string
    email?: StringWithAggregatesFilter<"User"> | string
    password?: StringWithAggregatesFilter<"User"> | string
    role?: StringWithAggregatesFilter<"User"> | string
    repId?: StringNullableWithAggregatesFilter<"User"> | string | null
    managerId?: StringNullableWithAggregatesFilter<"User"> | string | null
    region?: StringNullableWithAggregatesFilter<"User"> | string | null
    teamName?: StringNullableWithAggregatesFilter<"User"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
  }

  export type QuotaWhereInput = {
    AND?: QuotaWhereInput | QuotaWhereInput[]
    OR?: QuotaWhereInput[]
    NOT?: QuotaWhereInput | QuotaWhereInput[]
    id?: StringFilter<"Quota"> | string
    tenantId?: StringFilter<"Quota"> | string
    periodId?: StringFilter<"Quota"> | string
    repUserId?: StringFilter<"Quota"> | string
    amount?: FloatFilter<"Quota"> | number
    createdAt?: DateTimeFilter<"Quota"> | Date | string
    updatedAt?: DateTimeFilter<"Quota"> | Date | string
  }

  export type QuotaOrderByWithRelationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    periodId?: SortOrder
    repUserId?: SortOrder
    amount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type QuotaWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    tenantId_periodId_repUserId?: QuotaTenantIdPeriodIdRepUserIdCompoundUniqueInput
    AND?: QuotaWhereInput | QuotaWhereInput[]
    OR?: QuotaWhereInput[]
    NOT?: QuotaWhereInput | QuotaWhereInput[]
    tenantId?: StringFilter<"Quota"> | string
    periodId?: StringFilter<"Quota"> | string
    repUserId?: StringFilter<"Quota"> | string
    amount?: FloatFilter<"Quota"> | number
    createdAt?: DateTimeFilter<"Quota"> | Date | string
    updatedAt?: DateTimeFilter<"Quota"> | Date | string
  }, "id" | "tenantId_periodId_repUserId">

  export type QuotaOrderByWithAggregationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    periodId?: SortOrder
    repUserId?: SortOrder
    amount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: QuotaCountOrderByAggregateInput
    _avg?: QuotaAvgOrderByAggregateInput
    _max?: QuotaMaxOrderByAggregateInput
    _min?: QuotaMinOrderByAggregateInput
    _sum?: QuotaSumOrderByAggregateInput
  }

  export type QuotaScalarWhereWithAggregatesInput = {
    AND?: QuotaScalarWhereWithAggregatesInput | QuotaScalarWhereWithAggregatesInput[]
    OR?: QuotaScalarWhereWithAggregatesInput[]
    NOT?: QuotaScalarWhereWithAggregatesInput | QuotaScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Quota"> | string
    tenantId?: StringWithAggregatesFilter<"Quota"> | string
    periodId?: StringWithAggregatesFilter<"Quota"> | string
    repUserId?: StringWithAggregatesFilter<"Quota"> | string
    amount?: FloatWithAggregatesFilter<"Quota"> | number
    createdAt?: DateTimeWithAggregatesFilter<"Quota"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Quota"> | Date | string
  }

  export type ForecastPeriodCreateInput = {
    id?: string
    tenantId: string
    name: string
    startDate: Date | string
    endDate: Date | string
    revenueTarget: number
    status: string
    isLocked?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    snapshots?: AiForecastSnapshotCreateNestedManyWithoutPeriodInput
    submissions?: ForecastSubmissionCreateNestedManyWithoutPeriodInput
  }

  export type ForecastPeriodUncheckedCreateInput = {
    id?: string
    tenantId: string
    name: string
    startDate: Date | string
    endDate: Date | string
    revenueTarget: number
    status: string
    isLocked?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    snapshots?: AiForecastSnapshotUncheckedCreateNestedManyWithoutPeriodInput
    submissions?: ForecastSubmissionUncheckedCreateNestedManyWithoutPeriodInput
  }

  export type ForecastPeriodUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    revenueTarget?: FloatFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    isLocked?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    snapshots?: AiForecastSnapshotUpdateManyWithoutPeriodNestedInput
    submissions?: ForecastSubmissionUpdateManyWithoutPeriodNestedInput
  }

  export type ForecastPeriodUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    revenueTarget?: FloatFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    isLocked?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    snapshots?: AiForecastSnapshotUncheckedUpdateManyWithoutPeriodNestedInput
    submissions?: ForecastSubmissionUncheckedUpdateManyWithoutPeriodNestedInput
  }

  export type ForecastPeriodCreateManyInput = {
    id?: string
    tenantId: string
    name: string
    startDate: Date | string
    endDate: Date | string
    revenueTarget: number
    status: string
    isLocked?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ForecastPeriodUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    revenueTarget?: FloatFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    isLocked?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ForecastPeriodUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    revenueTarget?: FloatFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    isLocked?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AiForecastSnapshotCreateInput = {
    snapshotId?: string
    tenantId: string
    predictedAmount: number
    confidenceRangeLow: number
    confidenceRangeHigh: number
    modelInputs: JsonNullValueInput | InputJsonValue
    inputPipelineValue?: number | null
    regionBreakdown?: NullableJsonNullValueInput | InputJsonValue
    computedAt?: Date | string
    idempotencyKey: string
    period: ForecastPeriodCreateNestedOneWithoutSnapshotsInput
  }

  export type AiForecastSnapshotUncheckedCreateInput = {
    snapshotId?: string
    tenantId: string
    periodId: string
    predictedAmount: number
    confidenceRangeLow: number
    confidenceRangeHigh: number
    modelInputs: JsonNullValueInput | InputJsonValue
    inputPipelineValue?: number | null
    regionBreakdown?: NullableJsonNullValueInput | InputJsonValue
    computedAt?: Date | string
    idempotencyKey: string
  }

  export type AiForecastSnapshotUpdateInput = {
    snapshotId?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    predictedAmount?: FloatFieldUpdateOperationsInput | number
    confidenceRangeLow?: FloatFieldUpdateOperationsInput | number
    confidenceRangeHigh?: FloatFieldUpdateOperationsInput | number
    modelInputs?: JsonNullValueInput | InputJsonValue
    inputPipelineValue?: NullableFloatFieldUpdateOperationsInput | number | null
    regionBreakdown?: NullableJsonNullValueInput | InputJsonValue
    computedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    idempotencyKey?: StringFieldUpdateOperationsInput | string
    period?: ForecastPeriodUpdateOneRequiredWithoutSnapshotsNestedInput
  }

  export type AiForecastSnapshotUncheckedUpdateInput = {
    snapshotId?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    periodId?: StringFieldUpdateOperationsInput | string
    predictedAmount?: FloatFieldUpdateOperationsInput | number
    confidenceRangeLow?: FloatFieldUpdateOperationsInput | number
    confidenceRangeHigh?: FloatFieldUpdateOperationsInput | number
    modelInputs?: JsonNullValueInput | InputJsonValue
    inputPipelineValue?: NullableFloatFieldUpdateOperationsInput | number | null
    regionBreakdown?: NullableJsonNullValueInput | InputJsonValue
    computedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    idempotencyKey?: StringFieldUpdateOperationsInput | string
  }

  export type AiForecastSnapshotCreateManyInput = {
    snapshotId?: string
    tenantId: string
    periodId: string
    predictedAmount: number
    confidenceRangeLow: number
    confidenceRangeHigh: number
    modelInputs: JsonNullValueInput | InputJsonValue
    inputPipelineValue?: number | null
    regionBreakdown?: NullableJsonNullValueInput | InputJsonValue
    computedAt?: Date | string
    idempotencyKey: string
  }

  export type AiForecastSnapshotUpdateManyMutationInput = {
    snapshotId?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    predictedAmount?: FloatFieldUpdateOperationsInput | number
    confidenceRangeLow?: FloatFieldUpdateOperationsInput | number
    confidenceRangeHigh?: FloatFieldUpdateOperationsInput | number
    modelInputs?: JsonNullValueInput | InputJsonValue
    inputPipelineValue?: NullableFloatFieldUpdateOperationsInput | number | null
    regionBreakdown?: NullableJsonNullValueInput | InputJsonValue
    computedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    idempotencyKey?: StringFieldUpdateOperationsInput | string
  }

  export type AiForecastSnapshotUncheckedUpdateManyInput = {
    snapshotId?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    periodId?: StringFieldUpdateOperationsInput | string
    predictedAmount?: FloatFieldUpdateOperationsInput | number
    confidenceRangeLow?: FloatFieldUpdateOperationsInput | number
    confidenceRangeHigh?: FloatFieldUpdateOperationsInput | number
    modelInputs?: JsonNullValueInput | InputJsonValue
    inputPipelineValue?: NullableFloatFieldUpdateOperationsInput | number | null
    regionBreakdown?: NullableJsonNullValueInput | InputJsonValue
    computedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    idempotencyKey?: StringFieldUpdateOperationsInput | string
  }

  export type PipelineCoverageMetricsCreateInput = {
    id?: string
    tenantId: string
    periodId: string
    openPipelineValue: number
    weightedPipelineValue: number
    closedWonAmount: number
    coverageRatio: number
    computedAt?: Date | string
  }

  export type PipelineCoverageMetricsUncheckedCreateInput = {
    id?: string
    tenantId: string
    periodId: string
    openPipelineValue: number
    weightedPipelineValue: number
    closedWonAmount: number
    coverageRatio: number
    computedAt?: Date | string
  }

  export type PipelineCoverageMetricsUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    periodId?: StringFieldUpdateOperationsInput | string
    openPipelineValue?: FloatFieldUpdateOperationsInput | number
    weightedPipelineValue?: FloatFieldUpdateOperationsInput | number
    closedWonAmount?: FloatFieldUpdateOperationsInput | number
    coverageRatio?: FloatFieldUpdateOperationsInput | number
    computedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PipelineCoverageMetricsUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    periodId?: StringFieldUpdateOperationsInput | string
    openPipelineValue?: FloatFieldUpdateOperationsInput | number
    weightedPipelineValue?: FloatFieldUpdateOperationsInput | number
    closedWonAmount?: FloatFieldUpdateOperationsInput | number
    coverageRatio?: FloatFieldUpdateOperationsInput | number
    computedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PipelineCoverageMetricsCreateManyInput = {
    id?: string
    tenantId: string
    periodId: string
    openPipelineValue: number
    weightedPipelineValue: number
    closedWonAmount: number
    coverageRatio: number
    computedAt?: Date | string
  }

  export type PipelineCoverageMetricsUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    periodId?: StringFieldUpdateOperationsInput | string
    openPipelineValue?: FloatFieldUpdateOperationsInput | number
    weightedPipelineValue?: FloatFieldUpdateOperationsInput | number
    closedWonAmount?: FloatFieldUpdateOperationsInput | number
    coverageRatio?: FloatFieldUpdateOperationsInput | number
    computedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PipelineCoverageMetricsUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    periodId?: StringFieldUpdateOperationsInput | string
    openPipelineValue?: FloatFieldUpdateOperationsInput | number
    weightedPipelineValue?: FloatFieldUpdateOperationsInput | number
    closedWonAmount?: FloatFieldUpdateOperationsInput | number
    coverageRatio?: FloatFieldUpdateOperationsInput | number
    computedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type HistoricalConversionRateCreateInput = {
    id?: string
    tenantId: string
    fromStage: string
    toStage: string
    conversionRate: number
    sampleSize: number
    computedFromPeriod: string
    periodName?: string | null
    computedAt?: Date | string
  }

  export type HistoricalConversionRateUncheckedCreateInput = {
    id?: string
    tenantId: string
    fromStage: string
    toStage: string
    conversionRate: number
    sampleSize: number
    computedFromPeriod: string
    periodName?: string | null
    computedAt?: Date | string
  }

  export type HistoricalConversionRateUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    fromStage?: StringFieldUpdateOperationsInput | string
    toStage?: StringFieldUpdateOperationsInput | string
    conversionRate?: FloatFieldUpdateOperationsInput | number
    sampleSize?: IntFieldUpdateOperationsInput | number
    computedFromPeriod?: StringFieldUpdateOperationsInput | string
    periodName?: NullableStringFieldUpdateOperationsInput | string | null
    computedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type HistoricalConversionRateUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    fromStage?: StringFieldUpdateOperationsInput | string
    toStage?: StringFieldUpdateOperationsInput | string
    conversionRate?: FloatFieldUpdateOperationsInput | number
    sampleSize?: IntFieldUpdateOperationsInput | number
    computedFromPeriod?: StringFieldUpdateOperationsInput | string
    periodName?: NullableStringFieldUpdateOperationsInput | string | null
    computedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type HistoricalConversionRateCreateManyInput = {
    id?: string
    tenantId: string
    fromStage: string
    toStage: string
    conversionRate: number
    sampleSize: number
    computedFromPeriod: string
    periodName?: string | null
    computedAt?: Date | string
  }

  export type HistoricalConversionRateUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    fromStage?: StringFieldUpdateOperationsInput | string
    toStage?: StringFieldUpdateOperationsInput | string
    conversionRate?: FloatFieldUpdateOperationsInput | number
    sampleSize?: IntFieldUpdateOperationsInput | number
    computedFromPeriod?: StringFieldUpdateOperationsInput | string
    periodName?: NullableStringFieldUpdateOperationsInput | string | null
    computedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type HistoricalConversionRateUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    fromStage?: StringFieldUpdateOperationsInput | string
    toStage?: StringFieldUpdateOperationsInput | string
    conversionRate?: FloatFieldUpdateOperationsInput | number
    sampleSize?: IntFieldUpdateOperationsInput | number
    computedFromPeriod?: StringFieldUpdateOperationsInput | string
    periodName?: NullableStringFieldUpdateOperationsInput | string | null
    computedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ForecastSubmissionCreateInput = {
    id?: string
    tenantId: string
    repUserId: string
    lob: string
    version?: number
    commitForecast: number
    bestCaseForecast?: number | null
    notes?: string | null
    status: string
    submittedAt?: Date | string | null
    managerOverride?: number | null
    managerComment?: string | null
    managerId?: string | null
    managerName?: string | null
    approvedAt?: Date | string | null
    reopenedAt?: Date | string | null
    overriddenAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    period: ForecastPeriodCreateNestedOneWithoutSubmissionsInput
  }

  export type ForecastSubmissionUncheckedCreateInput = {
    id?: string
    tenantId: string
    periodId: string
    repUserId: string
    lob: string
    version?: number
    commitForecast: number
    bestCaseForecast?: number | null
    notes?: string | null
    status: string
    submittedAt?: Date | string | null
    managerOverride?: number | null
    managerComment?: string | null
    managerId?: string | null
    managerName?: string | null
    approvedAt?: Date | string | null
    reopenedAt?: Date | string | null
    overriddenAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ForecastSubmissionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    repUserId?: StringFieldUpdateOperationsInput | string
    lob?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    commitForecast?: FloatFieldUpdateOperationsInput | number
    bestCaseForecast?: NullableFloatFieldUpdateOperationsInput | number | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    submittedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    managerOverride?: NullableFloatFieldUpdateOperationsInput | number | null
    managerComment?: NullableStringFieldUpdateOperationsInput | string | null
    managerId?: NullableStringFieldUpdateOperationsInput | string | null
    managerName?: NullableStringFieldUpdateOperationsInput | string | null
    approvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    reopenedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    overriddenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    period?: ForecastPeriodUpdateOneRequiredWithoutSubmissionsNestedInput
  }

  export type ForecastSubmissionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    periodId?: StringFieldUpdateOperationsInput | string
    repUserId?: StringFieldUpdateOperationsInput | string
    lob?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    commitForecast?: FloatFieldUpdateOperationsInput | number
    bestCaseForecast?: NullableFloatFieldUpdateOperationsInput | number | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    submittedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    managerOverride?: NullableFloatFieldUpdateOperationsInput | number | null
    managerComment?: NullableStringFieldUpdateOperationsInput | string | null
    managerId?: NullableStringFieldUpdateOperationsInput | string | null
    managerName?: NullableStringFieldUpdateOperationsInput | string | null
    approvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    reopenedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    overriddenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ForecastSubmissionCreateManyInput = {
    id?: string
    tenantId: string
    periodId: string
    repUserId: string
    lob: string
    version?: number
    commitForecast: number
    bestCaseForecast?: number | null
    notes?: string | null
    status: string
    submittedAt?: Date | string | null
    managerOverride?: number | null
    managerComment?: string | null
    managerId?: string | null
    managerName?: string | null
    approvedAt?: Date | string | null
    reopenedAt?: Date | string | null
    overriddenAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ForecastSubmissionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    repUserId?: StringFieldUpdateOperationsInput | string
    lob?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    commitForecast?: FloatFieldUpdateOperationsInput | number
    bestCaseForecast?: NullableFloatFieldUpdateOperationsInput | number | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    submittedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    managerOverride?: NullableFloatFieldUpdateOperationsInput | number | null
    managerComment?: NullableStringFieldUpdateOperationsInput | string | null
    managerId?: NullableStringFieldUpdateOperationsInput | string | null
    managerName?: NullableStringFieldUpdateOperationsInput | string | null
    approvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    reopenedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    overriddenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ForecastSubmissionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    periodId?: StringFieldUpdateOperationsInput | string
    repUserId?: StringFieldUpdateOperationsInput | string
    lob?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    commitForecast?: FloatFieldUpdateOperationsInput | number
    bestCaseForecast?: NullableFloatFieldUpdateOperationsInput | number | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    submittedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    managerOverride?: NullableFloatFieldUpdateOperationsInput | number | null
    managerComment?: NullableStringFieldUpdateOperationsInput | string | null
    managerId?: NullableStringFieldUpdateOperationsInput | string | null
    managerName?: NullableStringFieldUpdateOperationsInput | string | null
    approvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    reopenedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    overriddenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ForecastAuditLogCreateInput = {
    id?: string
    tenantId: string
    forecastSubmissionId: string
    action: string
    actorId: string
    actorName?: string | null
    actorRole: string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type ForecastAuditLogUncheckedCreateInput = {
    id?: string
    tenantId: string
    forecastSubmissionId: string
    action: string
    actorId: string
    actorName?: string | null
    actorRole: string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type ForecastAuditLogUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    forecastSubmissionId?: StringFieldUpdateOperationsInput | string
    action?: StringFieldUpdateOperationsInput | string
    actorId?: StringFieldUpdateOperationsInput | string
    actorName?: NullableStringFieldUpdateOperationsInput | string | null
    actorRole?: StringFieldUpdateOperationsInput | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ForecastAuditLogUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    forecastSubmissionId?: StringFieldUpdateOperationsInput | string
    action?: StringFieldUpdateOperationsInput | string
    actorId?: StringFieldUpdateOperationsInput | string
    actorName?: NullableStringFieldUpdateOperationsInput | string | null
    actorRole?: StringFieldUpdateOperationsInput | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ForecastAuditLogCreateManyInput = {
    id?: string
    tenantId: string
    forecastSubmissionId: string
    action: string
    actorId: string
    actorName?: string | null
    actorRole: string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type ForecastAuditLogUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    forecastSubmissionId?: StringFieldUpdateOperationsInput | string
    action?: StringFieldUpdateOperationsInput | string
    actorId?: StringFieldUpdateOperationsInput | string
    actorName?: NullableStringFieldUpdateOperationsInput | string | null
    actorRole?: StringFieldUpdateOperationsInput | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ForecastAuditLogUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    forecastSubmissionId?: StringFieldUpdateOperationsInput | string
    action?: StringFieldUpdateOperationsInput | string
    actorId?: StringFieldUpdateOperationsInput | string
    actorName?: NullableStringFieldUpdateOperationsInput | string | null
    actorRole?: StringFieldUpdateOperationsInput | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CrmDealCreateInput = {
    id?: string
    tenantId: string
    dealName: string
    stage: string
    amount: number
    closeDate: Date | string
    probability?: number | null
    isClosedWon?: boolean
    isClosedLost?: boolean
    region?: string | null
    lob?: string | null
    repUserId?: string | null
    hubspotId?: string | null
    lastActivityDate?: Date | string | null
    riskReason?: string | null
    source?: string
    createdBy?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CrmDealUncheckedCreateInput = {
    id?: string
    tenantId: string
    dealName: string
    stage: string
    amount: number
    closeDate: Date | string
    probability?: number | null
    isClosedWon?: boolean
    isClosedLost?: boolean
    region?: string | null
    lob?: string | null
    repUserId?: string | null
    hubspotId?: string | null
    lastActivityDate?: Date | string | null
    riskReason?: string | null
    source?: string
    createdBy?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CrmDealUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    dealName?: StringFieldUpdateOperationsInput | string
    stage?: StringFieldUpdateOperationsInput | string
    amount?: FloatFieldUpdateOperationsInput | number
    closeDate?: DateTimeFieldUpdateOperationsInput | Date | string
    probability?: NullableFloatFieldUpdateOperationsInput | number | null
    isClosedWon?: BoolFieldUpdateOperationsInput | boolean
    isClosedLost?: BoolFieldUpdateOperationsInput | boolean
    region?: NullableStringFieldUpdateOperationsInput | string | null
    lob?: NullableStringFieldUpdateOperationsInput | string | null
    repUserId?: NullableStringFieldUpdateOperationsInput | string | null
    hubspotId?: NullableStringFieldUpdateOperationsInput | string | null
    lastActivityDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    riskReason?: NullableStringFieldUpdateOperationsInput | string | null
    source?: StringFieldUpdateOperationsInput | string
    createdBy?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CrmDealUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    dealName?: StringFieldUpdateOperationsInput | string
    stage?: StringFieldUpdateOperationsInput | string
    amount?: FloatFieldUpdateOperationsInput | number
    closeDate?: DateTimeFieldUpdateOperationsInput | Date | string
    probability?: NullableFloatFieldUpdateOperationsInput | number | null
    isClosedWon?: BoolFieldUpdateOperationsInput | boolean
    isClosedLost?: BoolFieldUpdateOperationsInput | boolean
    region?: NullableStringFieldUpdateOperationsInput | string | null
    lob?: NullableStringFieldUpdateOperationsInput | string | null
    repUserId?: NullableStringFieldUpdateOperationsInput | string | null
    hubspotId?: NullableStringFieldUpdateOperationsInput | string | null
    lastActivityDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    riskReason?: NullableStringFieldUpdateOperationsInput | string | null
    source?: StringFieldUpdateOperationsInput | string
    createdBy?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CrmDealCreateManyInput = {
    id?: string
    tenantId: string
    dealName: string
    stage: string
    amount: number
    closeDate: Date | string
    probability?: number | null
    isClosedWon?: boolean
    isClosedLost?: boolean
    region?: string | null
    lob?: string | null
    repUserId?: string | null
    hubspotId?: string | null
    lastActivityDate?: Date | string | null
    riskReason?: string | null
    source?: string
    createdBy?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CrmDealUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    dealName?: StringFieldUpdateOperationsInput | string
    stage?: StringFieldUpdateOperationsInput | string
    amount?: FloatFieldUpdateOperationsInput | number
    closeDate?: DateTimeFieldUpdateOperationsInput | Date | string
    probability?: NullableFloatFieldUpdateOperationsInput | number | null
    isClosedWon?: BoolFieldUpdateOperationsInput | boolean
    isClosedLost?: BoolFieldUpdateOperationsInput | boolean
    region?: NullableStringFieldUpdateOperationsInput | string | null
    lob?: NullableStringFieldUpdateOperationsInput | string | null
    repUserId?: NullableStringFieldUpdateOperationsInput | string | null
    hubspotId?: NullableStringFieldUpdateOperationsInput | string | null
    lastActivityDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    riskReason?: NullableStringFieldUpdateOperationsInput | string | null
    source?: StringFieldUpdateOperationsInput | string
    createdBy?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CrmDealUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    dealName?: StringFieldUpdateOperationsInput | string
    stage?: StringFieldUpdateOperationsInput | string
    amount?: FloatFieldUpdateOperationsInput | number
    closeDate?: DateTimeFieldUpdateOperationsInput | Date | string
    probability?: NullableFloatFieldUpdateOperationsInput | number | null
    isClosedWon?: BoolFieldUpdateOperationsInput | boolean
    isClosedLost?: BoolFieldUpdateOperationsInput | boolean
    region?: NullableStringFieldUpdateOperationsInput | string | null
    lob?: NullableStringFieldUpdateOperationsInput | string | null
    repUserId?: NullableStringFieldUpdateOperationsInput | string | null
    hubspotId?: NullableStringFieldUpdateOperationsInput | string | null
    lastActivityDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    riskReason?: NullableStringFieldUpdateOperationsInput | string | null
    source?: StringFieldUpdateOperationsInput | string
    createdBy?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserCreateInput = {
    id?: string
    tenantId: string
    name: string
    email: string
    password: string
    role: string
    repId?: string | null
    managerId?: string | null
    region?: string | null
    teamName?: string | null
    createdAt?: Date | string
  }

  export type UserUncheckedCreateInput = {
    id?: string
    tenantId: string
    name: string
    email: string
    password: string
    role: string
    repId?: string | null
    managerId?: string | null
    region?: string | null
    teamName?: string | null
    createdAt?: Date | string
  }

  export type UserUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    repId?: NullableStringFieldUpdateOperationsInput | string | null
    managerId?: NullableStringFieldUpdateOperationsInput | string | null
    region?: NullableStringFieldUpdateOperationsInput | string | null
    teamName?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    repId?: NullableStringFieldUpdateOperationsInput | string | null
    managerId?: NullableStringFieldUpdateOperationsInput | string | null
    region?: NullableStringFieldUpdateOperationsInput | string | null
    teamName?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserCreateManyInput = {
    id?: string
    tenantId: string
    name: string
    email: string
    password: string
    role: string
    repId?: string | null
    managerId?: string | null
    region?: string | null
    teamName?: string | null
    createdAt?: Date | string
  }

  export type UserUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    repId?: NullableStringFieldUpdateOperationsInput | string | null
    managerId?: NullableStringFieldUpdateOperationsInput | string | null
    region?: NullableStringFieldUpdateOperationsInput | string | null
    teamName?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    repId?: NullableStringFieldUpdateOperationsInput | string | null
    managerId?: NullableStringFieldUpdateOperationsInput | string | null
    region?: NullableStringFieldUpdateOperationsInput | string | null
    teamName?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuotaCreateInput = {
    id?: string
    tenantId: string
    periodId: string
    repUserId: string
    amount: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type QuotaUncheckedCreateInput = {
    id?: string
    tenantId: string
    periodId: string
    repUserId: string
    amount: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type QuotaUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    periodId?: StringFieldUpdateOperationsInput | string
    repUserId?: StringFieldUpdateOperationsInput | string
    amount?: FloatFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuotaUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    periodId?: StringFieldUpdateOperationsInput | string
    repUserId?: StringFieldUpdateOperationsInput | string
    amount?: FloatFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuotaCreateManyInput = {
    id?: string
    tenantId: string
    periodId: string
    repUserId: string
    amount: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type QuotaUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    periodId?: StringFieldUpdateOperationsInput | string
    repUserId?: StringFieldUpdateOperationsInput | string
    amount?: FloatFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuotaUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    periodId?: StringFieldUpdateOperationsInput | string
    repUserId?: StringFieldUpdateOperationsInput | string
    amount?: FloatFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type FloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type AiForecastSnapshotListRelationFilter = {
    every?: AiForecastSnapshotWhereInput
    some?: AiForecastSnapshotWhereInput
    none?: AiForecastSnapshotWhereInput
  }

  export type ForecastSubmissionListRelationFilter = {
    every?: ForecastSubmissionWhereInput
    some?: ForecastSubmissionWhereInput
    none?: ForecastSubmissionWhereInput
  }

  export type AiForecastSnapshotOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ForecastSubmissionOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ForecastPeriodCountOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    name?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    revenueTarget?: SortOrder
    status?: SortOrder
    isLocked?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ForecastPeriodAvgOrderByAggregateInput = {
    revenueTarget?: SortOrder
  }

  export type ForecastPeriodMaxOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    name?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    revenueTarget?: SortOrder
    status?: SortOrder
    isLocked?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ForecastPeriodMinOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    name?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    revenueTarget?: SortOrder
    status?: SortOrder
    isLocked?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ForecastPeriodSumOrderByAggregateInput = {
    revenueTarget?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type FloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }
  export type JsonFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonFilterBase<$PrismaModel>>, 'path'>>

  export type JsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type FloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }
  export type JsonNullableFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type ForecastPeriodRelationFilter = {
    is?: ForecastPeriodWhereInput
    isNot?: ForecastPeriodWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type AiForecastSnapshotCountOrderByAggregateInput = {
    snapshotId?: SortOrder
    tenantId?: SortOrder
    periodId?: SortOrder
    predictedAmount?: SortOrder
    confidenceRangeLow?: SortOrder
    confidenceRangeHigh?: SortOrder
    modelInputs?: SortOrder
    inputPipelineValue?: SortOrder
    regionBreakdown?: SortOrder
    computedAt?: SortOrder
    idempotencyKey?: SortOrder
  }

  export type AiForecastSnapshotAvgOrderByAggregateInput = {
    predictedAmount?: SortOrder
    confidenceRangeLow?: SortOrder
    confidenceRangeHigh?: SortOrder
    inputPipelineValue?: SortOrder
  }

  export type AiForecastSnapshotMaxOrderByAggregateInput = {
    snapshotId?: SortOrder
    tenantId?: SortOrder
    periodId?: SortOrder
    predictedAmount?: SortOrder
    confidenceRangeLow?: SortOrder
    confidenceRangeHigh?: SortOrder
    inputPipelineValue?: SortOrder
    computedAt?: SortOrder
    idempotencyKey?: SortOrder
  }

  export type AiForecastSnapshotMinOrderByAggregateInput = {
    snapshotId?: SortOrder
    tenantId?: SortOrder
    periodId?: SortOrder
    predictedAmount?: SortOrder
    confidenceRangeLow?: SortOrder
    confidenceRangeHigh?: SortOrder
    inputPipelineValue?: SortOrder
    computedAt?: SortOrder
    idempotencyKey?: SortOrder
  }

  export type AiForecastSnapshotSumOrderByAggregateInput = {
    predictedAmount?: SortOrder
    confidenceRangeLow?: SortOrder
    confidenceRangeHigh?: SortOrder
    inputPipelineValue?: SortOrder
  }
  export type JsonWithAggregatesFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedJsonFilter<$PrismaModel>
    _max?: NestedJsonFilter<$PrismaModel>
  }

  export type FloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
  }
  export type JsonNullableWithAggregatesFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedJsonNullableFilter<$PrismaModel>
    _max?: NestedJsonNullableFilter<$PrismaModel>
  }

  export type PipelineCoverageMetricsCountOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    periodId?: SortOrder
    openPipelineValue?: SortOrder
    weightedPipelineValue?: SortOrder
    closedWonAmount?: SortOrder
    coverageRatio?: SortOrder
    computedAt?: SortOrder
  }

  export type PipelineCoverageMetricsAvgOrderByAggregateInput = {
    openPipelineValue?: SortOrder
    weightedPipelineValue?: SortOrder
    closedWonAmount?: SortOrder
    coverageRatio?: SortOrder
  }

  export type PipelineCoverageMetricsMaxOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    periodId?: SortOrder
    openPipelineValue?: SortOrder
    weightedPipelineValue?: SortOrder
    closedWonAmount?: SortOrder
    coverageRatio?: SortOrder
    computedAt?: SortOrder
  }

  export type PipelineCoverageMetricsMinOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    periodId?: SortOrder
    openPipelineValue?: SortOrder
    weightedPipelineValue?: SortOrder
    closedWonAmount?: SortOrder
    coverageRatio?: SortOrder
    computedAt?: SortOrder
  }

  export type PipelineCoverageMetricsSumOrderByAggregateInput = {
    openPipelineValue?: SortOrder
    weightedPipelineValue?: SortOrder
    closedWonAmount?: SortOrder
    coverageRatio?: SortOrder
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type HistoricalConversionRateCountOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    fromStage?: SortOrder
    toStage?: SortOrder
    conversionRate?: SortOrder
    sampleSize?: SortOrder
    computedFromPeriod?: SortOrder
    periodName?: SortOrder
    computedAt?: SortOrder
  }

  export type HistoricalConversionRateAvgOrderByAggregateInput = {
    conversionRate?: SortOrder
    sampleSize?: SortOrder
  }

  export type HistoricalConversionRateMaxOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    fromStage?: SortOrder
    toStage?: SortOrder
    conversionRate?: SortOrder
    sampleSize?: SortOrder
    computedFromPeriod?: SortOrder
    periodName?: SortOrder
    computedAt?: SortOrder
  }

  export type HistoricalConversionRateMinOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    fromStage?: SortOrder
    toStage?: SortOrder
    conversionRate?: SortOrder
    sampleSize?: SortOrder
    computedFromPeriod?: SortOrder
    periodName?: SortOrder
    computedAt?: SortOrder
  }

  export type HistoricalConversionRateSumOrderByAggregateInput = {
    conversionRate?: SortOrder
    sampleSize?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type ForecastSubmissionCountOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    periodId?: SortOrder
    repUserId?: SortOrder
    lob?: SortOrder
    version?: SortOrder
    commitForecast?: SortOrder
    bestCaseForecast?: SortOrder
    notes?: SortOrder
    status?: SortOrder
    submittedAt?: SortOrder
    managerOverride?: SortOrder
    managerComment?: SortOrder
    managerId?: SortOrder
    managerName?: SortOrder
    approvedAt?: SortOrder
    reopenedAt?: SortOrder
    overriddenAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ForecastSubmissionAvgOrderByAggregateInput = {
    version?: SortOrder
    commitForecast?: SortOrder
    bestCaseForecast?: SortOrder
    managerOverride?: SortOrder
  }

  export type ForecastSubmissionMaxOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    periodId?: SortOrder
    repUserId?: SortOrder
    lob?: SortOrder
    version?: SortOrder
    commitForecast?: SortOrder
    bestCaseForecast?: SortOrder
    notes?: SortOrder
    status?: SortOrder
    submittedAt?: SortOrder
    managerOverride?: SortOrder
    managerComment?: SortOrder
    managerId?: SortOrder
    managerName?: SortOrder
    approvedAt?: SortOrder
    reopenedAt?: SortOrder
    overriddenAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ForecastSubmissionMinOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    periodId?: SortOrder
    repUserId?: SortOrder
    lob?: SortOrder
    version?: SortOrder
    commitForecast?: SortOrder
    bestCaseForecast?: SortOrder
    notes?: SortOrder
    status?: SortOrder
    submittedAt?: SortOrder
    managerOverride?: SortOrder
    managerComment?: SortOrder
    managerId?: SortOrder
    managerName?: SortOrder
    approvedAt?: SortOrder
    reopenedAt?: SortOrder
    overriddenAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ForecastSubmissionSumOrderByAggregateInput = {
    version?: SortOrder
    commitForecast?: SortOrder
    bestCaseForecast?: SortOrder
    managerOverride?: SortOrder
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type ForecastAuditLogCountOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    forecastSubmissionId?: SortOrder
    action?: SortOrder
    actorId?: SortOrder
    actorName?: SortOrder
    actorRole?: SortOrder
    metadata?: SortOrder
    createdAt?: SortOrder
  }

  export type ForecastAuditLogMaxOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    forecastSubmissionId?: SortOrder
    action?: SortOrder
    actorId?: SortOrder
    actorName?: SortOrder
    actorRole?: SortOrder
    createdAt?: SortOrder
  }

  export type ForecastAuditLogMinOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    forecastSubmissionId?: SortOrder
    action?: SortOrder
    actorId?: SortOrder
    actorName?: SortOrder
    actorRole?: SortOrder
    createdAt?: SortOrder
  }

  export type CrmDealCountOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    dealName?: SortOrder
    stage?: SortOrder
    amount?: SortOrder
    closeDate?: SortOrder
    probability?: SortOrder
    isClosedWon?: SortOrder
    isClosedLost?: SortOrder
    region?: SortOrder
    lob?: SortOrder
    repUserId?: SortOrder
    hubspotId?: SortOrder
    lastActivityDate?: SortOrder
    riskReason?: SortOrder
    source?: SortOrder
    createdBy?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CrmDealAvgOrderByAggregateInput = {
    amount?: SortOrder
    probability?: SortOrder
  }

  export type CrmDealMaxOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    dealName?: SortOrder
    stage?: SortOrder
    amount?: SortOrder
    closeDate?: SortOrder
    probability?: SortOrder
    isClosedWon?: SortOrder
    isClosedLost?: SortOrder
    region?: SortOrder
    lob?: SortOrder
    repUserId?: SortOrder
    hubspotId?: SortOrder
    lastActivityDate?: SortOrder
    riskReason?: SortOrder
    source?: SortOrder
    createdBy?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CrmDealMinOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    dealName?: SortOrder
    stage?: SortOrder
    amount?: SortOrder
    closeDate?: SortOrder
    probability?: SortOrder
    isClosedWon?: SortOrder
    isClosedLost?: SortOrder
    region?: SortOrder
    lob?: SortOrder
    repUserId?: SortOrder
    hubspotId?: SortOrder
    lastActivityDate?: SortOrder
    riskReason?: SortOrder
    source?: SortOrder
    createdBy?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CrmDealSumOrderByAggregateInput = {
    amount?: SortOrder
    probability?: SortOrder
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    name?: SortOrder
    email?: SortOrder
    password?: SortOrder
    role?: SortOrder
    repId?: SortOrder
    managerId?: SortOrder
    region?: SortOrder
    teamName?: SortOrder
    createdAt?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    name?: SortOrder
    email?: SortOrder
    password?: SortOrder
    role?: SortOrder
    repId?: SortOrder
    managerId?: SortOrder
    region?: SortOrder
    teamName?: SortOrder
    createdAt?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    name?: SortOrder
    email?: SortOrder
    password?: SortOrder
    role?: SortOrder
    repId?: SortOrder
    managerId?: SortOrder
    region?: SortOrder
    teamName?: SortOrder
    createdAt?: SortOrder
  }

  export type QuotaTenantIdPeriodIdRepUserIdCompoundUniqueInput = {
    tenantId: string
    periodId: string
    repUserId: string
  }

  export type QuotaCountOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    periodId?: SortOrder
    repUserId?: SortOrder
    amount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type QuotaAvgOrderByAggregateInput = {
    amount?: SortOrder
  }

  export type QuotaMaxOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    periodId?: SortOrder
    repUserId?: SortOrder
    amount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type QuotaMinOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    periodId?: SortOrder
    repUserId?: SortOrder
    amount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type QuotaSumOrderByAggregateInput = {
    amount?: SortOrder
  }

  export type AiForecastSnapshotCreateNestedManyWithoutPeriodInput = {
    create?: XOR<AiForecastSnapshotCreateWithoutPeriodInput, AiForecastSnapshotUncheckedCreateWithoutPeriodInput> | AiForecastSnapshotCreateWithoutPeriodInput[] | AiForecastSnapshotUncheckedCreateWithoutPeriodInput[]
    connectOrCreate?: AiForecastSnapshotCreateOrConnectWithoutPeriodInput | AiForecastSnapshotCreateOrConnectWithoutPeriodInput[]
    createMany?: AiForecastSnapshotCreateManyPeriodInputEnvelope
    connect?: AiForecastSnapshotWhereUniqueInput | AiForecastSnapshotWhereUniqueInput[]
  }

  export type ForecastSubmissionCreateNestedManyWithoutPeriodInput = {
    create?: XOR<ForecastSubmissionCreateWithoutPeriodInput, ForecastSubmissionUncheckedCreateWithoutPeriodInput> | ForecastSubmissionCreateWithoutPeriodInput[] | ForecastSubmissionUncheckedCreateWithoutPeriodInput[]
    connectOrCreate?: ForecastSubmissionCreateOrConnectWithoutPeriodInput | ForecastSubmissionCreateOrConnectWithoutPeriodInput[]
    createMany?: ForecastSubmissionCreateManyPeriodInputEnvelope
    connect?: ForecastSubmissionWhereUniqueInput | ForecastSubmissionWhereUniqueInput[]
  }

  export type AiForecastSnapshotUncheckedCreateNestedManyWithoutPeriodInput = {
    create?: XOR<AiForecastSnapshotCreateWithoutPeriodInput, AiForecastSnapshotUncheckedCreateWithoutPeriodInput> | AiForecastSnapshotCreateWithoutPeriodInput[] | AiForecastSnapshotUncheckedCreateWithoutPeriodInput[]
    connectOrCreate?: AiForecastSnapshotCreateOrConnectWithoutPeriodInput | AiForecastSnapshotCreateOrConnectWithoutPeriodInput[]
    createMany?: AiForecastSnapshotCreateManyPeriodInputEnvelope
    connect?: AiForecastSnapshotWhereUniqueInput | AiForecastSnapshotWhereUniqueInput[]
  }

  export type ForecastSubmissionUncheckedCreateNestedManyWithoutPeriodInput = {
    create?: XOR<ForecastSubmissionCreateWithoutPeriodInput, ForecastSubmissionUncheckedCreateWithoutPeriodInput> | ForecastSubmissionCreateWithoutPeriodInput[] | ForecastSubmissionUncheckedCreateWithoutPeriodInput[]
    connectOrCreate?: ForecastSubmissionCreateOrConnectWithoutPeriodInput | ForecastSubmissionCreateOrConnectWithoutPeriodInput[]
    createMany?: ForecastSubmissionCreateManyPeriodInputEnvelope
    connect?: ForecastSubmissionWhereUniqueInput | ForecastSubmissionWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type FloatFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type AiForecastSnapshotUpdateManyWithoutPeriodNestedInput = {
    create?: XOR<AiForecastSnapshotCreateWithoutPeriodInput, AiForecastSnapshotUncheckedCreateWithoutPeriodInput> | AiForecastSnapshotCreateWithoutPeriodInput[] | AiForecastSnapshotUncheckedCreateWithoutPeriodInput[]
    connectOrCreate?: AiForecastSnapshotCreateOrConnectWithoutPeriodInput | AiForecastSnapshotCreateOrConnectWithoutPeriodInput[]
    upsert?: AiForecastSnapshotUpsertWithWhereUniqueWithoutPeriodInput | AiForecastSnapshotUpsertWithWhereUniqueWithoutPeriodInput[]
    createMany?: AiForecastSnapshotCreateManyPeriodInputEnvelope
    set?: AiForecastSnapshotWhereUniqueInput | AiForecastSnapshotWhereUniqueInput[]
    disconnect?: AiForecastSnapshotWhereUniqueInput | AiForecastSnapshotWhereUniqueInput[]
    delete?: AiForecastSnapshotWhereUniqueInput | AiForecastSnapshotWhereUniqueInput[]
    connect?: AiForecastSnapshotWhereUniqueInput | AiForecastSnapshotWhereUniqueInput[]
    update?: AiForecastSnapshotUpdateWithWhereUniqueWithoutPeriodInput | AiForecastSnapshotUpdateWithWhereUniqueWithoutPeriodInput[]
    updateMany?: AiForecastSnapshotUpdateManyWithWhereWithoutPeriodInput | AiForecastSnapshotUpdateManyWithWhereWithoutPeriodInput[]
    deleteMany?: AiForecastSnapshotScalarWhereInput | AiForecastSnapshotScalarWhereInput[]
  }

  export type ForecastSubmissionUpdateManyWithoutPeriodNestedInput = {
    create?: XOR<ForecastSubmissionCreateWithoutPeriodInput, ForecastSubmissionUncheckedCreateWithoutPeriodInput> | ForecastSubmissionCreateWithoutPeriodInput[] | ForecastSubmissionUncheckedCreateWithoutPeriodInput[]
    connectOrCreate?: ForecastSubmissionCreateOrConnectWithoutPeriodInput | ForecastSubmissionCreateOrConnectWithoutPeriodInput[]
    upsert?: ForecastSubmissionUpsertWithWhereUniqueWithoutPeriodInput | ForecastSubmissionUpsertWithWhereUniqueWithoutPeriodInput[]
    createMany?: ForecastSubmissionCreateManyPeriodInputEnvelope
    set?: ForecastSubmissionWhereUniqueInput | ForecastSubmissionWhereUniqueInput[]
    disconnect?: ForecastSubmissionWhereUniqueInput | ForecastSubmissionWhereUniqueInput[]
    delete?: ForecastSubmissionWhereUniqueInput | ForecastSubmissionWhereUniqueInput[]
    connect?: ForecastSubmissionWhereUniqueInput | ForecastSubmissionWhereUniqueInput[]
    update?: ForecastSubmissionUpdateWithWhereUniqueWithoutPeriodInput | ForecastSubmissionUpdateWithWhereUniqueWithoutPeriodInput[]
    updateMany?: ForecastSubmissionUpdateManyWithWhereWithoutPeriodInput | ForecastSubmissionUpdateManyWithWhereWithoutPeriodInput[]
    deleteMany?: ForecastSubmissionScalarWhereInput | ForecastSubmissionScalarWhereInput[]
  }

  export type AiForecastSnapshotUncheckedUpdateManyWithoutPeriodNestedInput = {
    create?: XOR<AiForecastSnapshotCreateWithoutPeriodInput, AiForecastSnapshotUncheckedCreateWithoutPeriodInput> | AiForecastSnapshotCreateWithoutPeriodInput[] | AiForecastSnapshotUncheckedCreateWithoutPeriodInput[]
    connectOrCreate?: AiForecastSnapshotCreateOrConnectWithoutPeriodInput | AiForecastSnapshotCreateOrConnectWithoutPeriodInput[]
    upsert?: AiForecastSnapshotUpsertWithWhereUniqueWithoutPeriodInput | AiForecastSnapshotUpsertWithWhereUniqueWithoutPeriodInput[]
    createMany?: AiForecastSnapshotCreateManyPeriodInputEnvelope
    set?: AiForecastSnapshotWhereUniqueInput | AiForecastSnapshotWhereUniqueInput[]
    disconnect?: AiForecastSnapshotWhereUniqueInput | AiForecastSnapshotWhereUniqueInput[]
    delete?: AiForecastSnapshotWhereUniqueInput | AiForecastSnapshotWhereUniqueInput[]
    connect?: AiForecastSnapshotWhereUniqueInput | AiForecastSnapshotWhereUniqueInput[]
    update?: AiForecastSnapshotUpdateWithWhereUniqueWithoutPeriodInput | AiForecastSnapshotUpdateWithWhereUniqueWithoutPeriodInput[]
    updateMany?: AiForecastSnapshotUpdateManyWithWhereWithoutPeriodInput | AiForecastSnapshotUpdateManyWithWhereWithoutPeriodInput[]
    deleteMany?: AiForecastSnapshotScalarWhereInput | AiForecastSnapshotScalarWhereInput[]
  }

  export type ForecastSubmissionUncheckedUpdateManyWithoutPeriodNestedInput = {
    create?: XOR<ForecastSubmissionCreateWithoutPeriodInput, ForecastSubmissionUncheckedCreateWithoutPeriodInput> | ForecastSubmissionCreateWithoutPeriodInput[] | ForecastSubmissionUncheckedCreateWithoutPeriodInput[]
    connectOrCreate?: ForecastSubmissionCreateOrConnectWithoutPeriodInput | ForecastSubmissionCreateOrConnectWithoutPeriodInput[]
    upsert?: ForecastSubmissionUpsertWithWhereUniqueWithoutPeriodInput | ForecastSubmissionUpsertWithWhereUniqueWithoutPeriodInput[]
    createMany?: ForecastSubmissionCreateManyPeriodInputEnvelope
    set?: ForecastSubmissionWhereUniqueInput | ForecastSubmissionWhereUniqueInput[]
    disconnect?: ForecastSubmissionWhereUniqueInput | ForecastSubmissionWhereUniqueInput[]
    delete?: ForecastSubmissionWhereUniqueInput | ForecastSubmissionWhereUniqueInput[]
    connect?: ForecastSubmissionWhereUniqueInput | ForecastSubmissionWhereUniqueInput[]
    update?: ForecastSubmissionUpdateWithWhereUniqueWithoutPeriodInput | ForecastSubmissionUpdateWithWhereUniqueWithoutPeriodInput[]
    updateMany?: ForecastSubmissionUpdateManyWithWhereWithoutPeriodInput | ForecastSubmissionUpdateManyWithWhereWithoutPeriodInput[]
    deleteMany?: ForecastSubmissionScalarWhereInput | ForecastSubmissionScalarWhereInput[]
  }

  export type ForecastPeriodCreateNestedOneWithoutSnapshotsInput = {
    create?: XOR<ForecastPeriodCreateWithoutSnapshotsInput, ForecastPeriodUncheckedCreateWithoutSnapshotsInput>
    connectOrCreate?: ForecastPeriodCreateOrConnectWithoutSnapshotsInput
    connect?: ForecastPeriodWhereUniqueInput
  }

  export type NullableFloatFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type ForecastPeriodUpdateOneRequiredWithoutSnapshotsNestedInput = {
    create?: XOR<ForecastPeriodCreateWithoutSnapshotsInput, ForecastPeriodUncheckedCreateWithoutSnapshotsInput>
    connectOrCreate?: ForecastPeriodCreateOrConnectWithoutSnapshotsInput
    upsert?: ForecastPeriodUpsertWithoutSnapshotsInput
    connect?: ForecastPeriodWhereUniqueInput
    update?: XOR<XOR<ForecastPeriodUpdateToOneWithWhereWithoutSnapshotsInput, ForecastPeriodUpdateWithoutSnapshotsInput>, ForecastPeriodUncheckedUpdateWithoutSnapshotsInput>
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type ForecastPeriodCreateNestedOneWithoutSubmissionsInput = {
    create?: XOR<ForecastPeriodCreateWithoutSubmissionsInput, ForecastPeriodUncheckedCreateWithoutSubmissionsInput>
    connectOrCreate?: ForecastPeriodCreateOrConnectWithoutSubmissionsInput
    connect?: ForecastPeriodWhereUniqueInput
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type ForecastPeriodUpdateOneRequiredWithoutSubmissionsNestedInput = {
    create?: XOR<ForecastPeriodCreateWithoutSubmissionsInput, ForecastPeriodUncheckedCreateWithoutSubmissionsInput>
    connectOrCreate?: ForecastPeriodCreateOrConnectWithoutSubmissionsInput
    upsert?: ForecastPeriodUpsertWithoutSubmissionsInput
    connect?: ForecastPeriodWhereUniqueInput
    update?: XOR<XOR<ForecastPeriodUpdateToOneWithWhereWithoutSubmissionsInput, ForecastPeriodUpdateWithoutSubmissionsInput>, ForecastPeriodUncheckedUpdateWithoutSubmissionsInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedFloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }
  export type NestedJsonFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<NestedJsonFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedFloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }
  export type NestedJsonNullableFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<NestedJsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type AiForecastSnapshotCreateWithoutPeriodInput = {
    snapshotId?: string
    tenantId: string
    predictedAmount: number
    confidenceRangeLow: number
    confidenceRangeHigh: number
    modelInputs: JsonNullValueInput | InputJsonValue
    inputPipelineValue?: number | null
    regionBreakdown?: NullableJsonNullValueInput | InputJsonValue
    computedAt?: Date | string
    idempotencyKey: string
  }

  export type AiForecastSnapshotUncheckedCreateWithoutPeriodInput = {
    snapshotId?: string
    tenantId: string
    predictedAmount: number
    confidenceRangeLow: number
    confidenceRangeHigh: number
    modelInputs: JsonNullValueInput | InputJsonValue
    inputPipelineValue?: number | null
    regionBreakdown?: NullableJsonNullValueInput | InputJsonValue
    computedAt?: Date | string
    idempotencyKey: string
  }

  export type AiForecastSnapshotCreateOrConnectWithoutPeriodInput = {
    where: AiForecastSnapshotWhereUniqueInput
    create: XOR<AiForecastSnapshotCreateWithoutPeriodInput, AiForecastSnapshotUncheckedCreateWithoutPeriodInput>
  }

  export type AiForecastSnapshotCreateManyPeriodInputEnvelope = {
    data: AiForecastSnapshotCreateManyPeriodInput | AiForecastSnapshotCreateManyPeriodInput[]
    skipDuplicates?: boolean
  }

  export type ForecastSubmissionCreateWithoutPeriodInput = {
    id?: string
    tenantId: string
    repUserId: string
    lob: string
    version?: number
    commitForecast: number
    bestCaseForecast?: number | null
    notes?: string | null
    status: string
    submittedAt?: Date | string | null
    managerOverride?: number | null
    managerComment?: string | null
    managerId?: string | null
    managerName?: string | null
    approvedAt?: Date | string | null
    reopenedAt?: Date | string | null
    overriddenAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ForecastSubmissionUncheckedCreateWithoutPeriodInput = {
    id?: string
    tenantId: string
    repUserId: string
    lob: string
    version?: number
    commitForecast: number
    bestCaseForecast?: number | null
    notes?: string | null
    status: string
    submittedAt?: Date | string | null
    managerOverride?: number | null
    managerComment?: string | null
    managerId?: string | null
    managerName?: string | null
    approvedAt?: Date | string | null
    reopenedAt?: Date | string | null
    overriddenAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ForecastSubmissionCreateOrConnectWithoutPeriodInput = {
    where: ForecastSubmissionWhereUniqueInput
    create: XOR<ForecastSubmissionCreateWithoutPeriodInput, ForecastSubmissionUncheckedCreateWithoutPeriodInput>
  }

  export type ForecastSubmissionCreateManyPeriodInputEnvelope = {
    data: ForecastSubmissionCreateManyPeriodInput | ForecastSubmissionCreateManyPeriodInput[]
    skipDuplicates?: boolean
  }

  export type AiForecastSnapshotUpsertWithWhereUniqueWithoutPeriodInput = {
    where: AiForecastSnapshotWhereUniqueInput
    update: XOR<AiForecastSnapshotUpdateWithoutPeriodInput, AiForecastSnapshotUncheckedUpdateWithoutPeriodInput>
    create: XOR<AiForecastSnapshotCreateWithoutPeriodInput, AiForecastSnapshotUncheckedCreateWithoutPeriodInput>
  }

  export type AiForecastSnapshotUpdateWithWhereUniqueWithoutPeriodInput = {
    where: AiForecastSnapshotWhereUniqueInput
    data: XOR<AiForecastSnapshotUpdateWithoutPeriodInput, AiForecastSnapshotUncheckedUpdateWithoutPeriodInput>
  }

  export type AiForecastSnapshotUpdateManyWithWhereWithoutPeriodInput = {
    where: AiForecastSnapshotScalarWhereInput
    data: XOR<AiForecastSnapshotUpdateManyMutationInput, AiForecastSnapshotUncheckedUpdateManyWithoutPeriodInput>
  }

  export type AiForecastSnapshotScalarWhereInput = {
    AND?: AiForecastSnapshotScalarWhereInput | AiForecastSnapshotScalarWhereInput[]
    OR?: AiForecastSnapshotScalarWhereInput[]
    NOT?: AiForecastSnapshotScalarWhereInput | AiForecastSnapshotScalarWhereInput[]
    snapshotId?: StringFilter<"AiForecastSnapshot"> | string
    tenantId?: StringFilter<"AiForecastSnapshot"> | string
    periodId?: StringFilter<"AiForecastSnapshot"> | string
    predictedAmount?: FloatFilter<"AiForecastSnapshot"> | number
    confidenceRangeLow?: FloatFilter<"AiForecastSnapshot"> | number
    confidenceRangeHigh?: FloatFilter<"AiForecastSnapshot"> | number
    modelInputs?: JsonFilter<"AiForecastSnapshot">
    inputPipelineValue?: FloatNullableFilter<"AiForecastSnapshot"> | number | null
    regionBreakdown?: JsonNullableFilter<"AiForecastSnapshot">
    computedAt?: DateTimeFilter<"AiForecastSnapshot"> | Date | string
    idempotencyKey?: StringFilter<"AiForecastSnapshot"> | string
  }

  export type ForecastSubmissionUpsertWithWhereUniqueWithoutPeriodInput = {
    where: ForecastSubmissionWhereUniqueInput
    update: XOR<ForecastSubmissionUpdateWithoutPeriodInput, ForecastSubmissionUncheckedUpdateWithoutPeriodInput>
    create: XOR<ForecastSubmissionCreateWithoutPeriodInput, ForecastSubmissionUncheckedCreateWithoutPeriodInput>
  }

  export type ForecastSubmissionUpdateWithWhereUniqueWithoutPeriodInput = {
    where: ForecastSubmissionWhereUniqueInput
    data: XOR<ForecastSubmissionUpdateWithoutPeriodInput, ForecastSubmissionUncheckedUpdateWithoutPeriodInput>
  }

  export type ForecastSubmissionUpdateManyWithWhereWithoutPeriodInput = {
    where: ForecastSubmissionScalarWhereInput
    data: XOR<ForecastSubmissionUpdateManyMutationInput, ForecastSubmissionUncheckedUpdateManyWithoutPeriodInput>
  }

  export type ForecastSubmissionScalarWhereInput = {
    AND?: ForecastSubmissionScalarWhereInput | ForecastSubmissionScalarWhereInput[]
    OR?: ForecastSubmissionScalarWhereInput[]
    NOT?: ForecastSubmissionScalarWhereInput | ForecastSubmissionScalarWhereInput[]
    id?: StringFilter<"ForecastSubmission"> | string
    tenantId?: StringFilter<"ForecastSubmission"> | string
    periodId?: StringFilter<"ForecastSubmission"> | string
    repUserId?: StringFilter<"ForecastSubmission"> | string
    lob?: StringFilter<"ForecastSubmission"> | string
    version?: IntFilter<"ForecastSubmission"> | number
    commitForecast?: FloatFilter<"ForecastSubmission"> | number
    bestCaseForecast?: FloatNullableFilter<"ForecastSubmission"> | number | null
    notes?: StringNullableFilter<"ForecastSubmission"> | string | null
    status?: StringFilter<"ForecastSubmission"> | string
    submittedAt?: DateTimeNullableFilter<"ForecastSubmission"> | Date | string | null
    managerOverride?: FloatNullableFilter<"ForecastSubmission"> | number | null
    managerComment?: StringNullableFilter<"ForecastSubmission"> | string | null
    managerId?: StringNullableFilter<"ForecastSubmission"> | string | null
    managerName?: StringNullableFilter<"ForecastSubmission"> | string | null
    approvedAt?: DateTimeNullableFilter<"ForecastSubmission"> | Date | string | null
    reopenedAt?: DateTimeNullableFilter<"ForecastSubmission"> | Date | string | null
    overriddenAt?: DateTimeNullableFilter<"ForecastSubmission"> | Date | string | null
    createdAt?: DateTimeFilter<"ForecastSubmission"> | Date | string
    updatedAt?: DateTimeFilter<"ForecastSubmission"> | Date | string
  }

  export type ForecastPeriodCreateWithoutSnapshotsInput = {
    id?: string
    tenantId: string
    name: string
    startDate: Date | string
    endDate: Date | string
    revenueTarget: number
    status: string
    isLocked?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    submissions?: ForecastSubmissionCreateNestedManyWithoutPeriodInput
  }

  export type ForecastPeriodUncheckedCreateWithoutSnapshotsInput = {
    id?: string
    tenantId: string
    name: string
    startDate: Date | string
    endDate: Date | string
    revenueTarget: number
    status: string
    isLocked?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    submissions?: ForecastSubmissionUncheckedCreateNestedManyWithoutPeriodInput
  }

  export type ForecastPeriodCreateOrConnectWithoutSnapshotsInput = {
    where: ForecastPeriodWhereUniqueInput
    create: XOR<ForecastPeriodCreateWithoutSnapshotsInput, ForecastPeriodUncheckedCreateWithoutSnapshotsInput>
  }

  export type ForecastPeriodUpsertWithoutSnapshotsInput = {
    update: XOR<ForecastPeriodUpdateWithoutSnapshotsInput, ForecastPeriodUncheckedUpdateWithoutSnapshotsInput>
    create: XOR<ForecastPeriodCreateWithoutSnapshotsInput, ForecastPeriodUncheckedCreateWithoutSnapshotsInput>
    where?: ForecastPeriodWhereInput
  }

  export type ForecastPeriodUpdateToOneWithWhereWithoutSnapshotsInput = {
    where?: ForecastPeriodWhereInput
    data: XOR<ForecastPeriodUpdateWithoutSnapshotsInput, ForecastPeriodUncheckedUpdateWithoutSnapshotsInput>
  }

  export type ForecastPeriodUpdateWithoutSnapshotsInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    revenueTarget?: FloatFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    isLocked?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    submissions?: ForecastSubmissionUpdateManyWithoutPeriodNestedInput
  }

  export type ForecastPeriodUncheckedUpdateWithoutSnapshotsInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    revenueTarget?: FloatFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    isLocked?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    submissions?: ForecastSubmissionUncheckedUpdateManyWithoutPeriodNestedInput
  }

  export type ForecastPeriodCreateWithoutSubmissionsInput = {
    id?: string
    tenantId: string
    name: string
    startDate: Date | string
    endDate: Date | string
    revenueTarget: number
    status: string
    isLocked?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    snapshots?: AiForecastSnapshotCreateNestedManyWithoutPeriodInput
  }

  export type ForecastPeriodUncheckedCreateWithoutSubmissionsInput = {
    id?: string
    tenantId: string
    name: string
    startDate: Date | string
    endDate: Date | string
    revenueTarget: number
    status: string
    isLocked?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    snapshots?: AiForecastSnapshotUncheckedCreateNestedManyWithoutPeriodInput
  }

  export type ForecastPeriodCreateOrConnectWithoutSubmissionsInput = {
    where: ForecastPeriodWhereUniqueInput
    create: XOR<ForecastPeriodCreateWithoutSubmissionsInput, ForecastPeriodUncheckedCreateWithoutSubmissionsInput>
  }

  export type ForecastPeriodUpsertWithoutSubmissionsInput = {
    update: XOR<ForecastPeriodUpdateWithoutSubmissionsInput, ForecastPeriodUncheckedUpdateWithoutSubmissionsInput>
    create: XOR<ForecastPeriodCreateWithoutSubmissionsInput, ForecastPeriodUncheckedCreateWithoutSubmissionsInput>
    where?: ForecastPeriodWhereInput
  }

  export type ForecastPeriodUpdateToOneWithWhereWithoutSubmissionsInput = {
    where?: ForecastPeriodWhereInput
    data: XOR<ForecastPeriodUpdateWithoutSubmissionsInput, ForecastPeriodUncheckedUpdateWithoutSubmissionsInput>
  }

  export type ForecastPeriodUpdateWithoutSubmissionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    revenueTarget?: FloatFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    isLocked?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    snapshots?: AiForecastSnapshotUpdateManyWithoutPeriodNestedInput
  }

  export type ForecastPeriodUncheckedUpdateWithoutSubmissionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    revenueTarget?: FloatFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    isLocked?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    snapshots?: AiForecastSnapshotUncheckedUpdateManyWithoutPeriodNestedInput
  }

  export type AiForecastSnapshotCreateManyPeriodInput = {
    snapshotId?: string
    tenantId: string
    predictedAmount: number
    confidenceRangeLow: number
    confidenceRangeHigh: number
    modelInputs: JsonNullValueInput | InputJsonValue
    inputPipelineValue?: number | null
    regionBreakdown?: NullableJsonNullValueInput | InputJsonValue
    computedAt?: Date | string
    idempotencyKey: string
  }

  export type ForecastSubmissionCreateManyPeriodInput = {
    id?: string
    tenantId: string
    repUserId: string
    lob: string
    version?: number
    commitForecast: number
    bestCaseForecast?: number | null
    notes?: string | null
    status: string
    submittedAt?: Date | string | null
    managerOverride?: number | null
    managerComment?: string | null
    managerId?: string | null
    managerName?: string | null
    approvedAt?: Date | string | null
    reopenedAt?: Date | string | null
    overriddenAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AiForecastSnapshotUpdateWithoutPeriodInput = {
    snapshotId?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    predictedAmount?: FloatFieldUpdateOperationsInput | number
    confidenceRangeLow?: FloatFieldUpdateOperationsInput | number
    confidenceRangeHigh?: FloatFieldUpdateOperationsInput | number
    modelInputs?: JsonNullValueInput | InputJsonValue
    inputPipelineValue?: NullableFloatFieldUpdateOperationsInput | number | null
    regionBreakdown?: NullableJsonNullValueInput | InputJsonValue
    computedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    idempotencyKey?: StringFieldUpdateOperationsInput | string
  }

  export type AiForecastSnapshotUncheckedUpdateWithoutPeriodInput = {
    snapshotId?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    predictedAmount?: FloatFieldUpdateOperationsInput | number
    confidenceRangeLow?: FloatFieldUpdateOperationsInput | number
    confidenceRangeHigh?: FloatFieldUpdateOperationsInput | number
    modelInputs?: JsonNullValueInput | InputJsonValue
    inputPipelineValue?: NullableFloatFieldUpdateOperationsInput | number | null
    regionBreakdown?: NullableJsonNullValueInput | InputJsonValue
    computedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    idempotencyKey?: StringFieldUpdateOperationsInput | string
  }

  export type AiForecastSnapshotUncheckedUpdateManyWithoutPeriodInput = {
    snapshotId?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    predictedAmount?: FloatFieldUpdateOperationsInput | number
    confidenceRangeLow?: FloatFieldUpdateOperationsInput | number
    confidenceRangeHigh?: FloatFieldUpdateOperationsInput | number
    modelInputs?: JsonNullValueInput | InputJsonValue
    inputPipelineValue?: NullableFloatFieldUpdateOperationsInput | number | null
    regionBreakdown?: NullableJsonNullValueInput | InputJsonValue
    computedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    idempotencyKey?: StringFieldUpdateOperationsInput | string
  }

  export type ForecastSubmissionUpdateWithoutPeriodInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    repUserId?: StringFieldUpdateOperationsInput | string
    lob?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    commitForecast?: FloatFieldUpdateOperationsInput | number
    bestCaseForecast?: NullableFloatFieldUpdateOperationsInput | number | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    submittedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    managerOverride?: NullableFloatFieldUpdateOperationsInput | number | null
    managerComment?: NullableStringFieldUpdateOperationsInput | string | null
    managerId?: NullableStringFieldUpdateOperationsInput | string | null
    managerName?: NullableStringFieldUpdateOperationsInput | string | null
    approvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    reopenedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    overriddenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ForecastSubmissionUncheckedUpdateWithoutPeriodInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    repUserId?: StringFieldUpdateOperationsInput | string
    lob?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    commitForecast?: FloatFieldUpdateOperationsInput | number
    bestCaseForecast?: NullableFloatFieldUpdateOperationsInput | number | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    submittedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    managerOverride?: NullableFloatFieldUpdateOperationsInput | number | null
    managerComment?: NullableStringFieldUpdateOperationsInput | string | null
    managerId?: NullableStringFieldUpdateOperationsInput | string | null
    managerName?: NullableStringFieldUpdateOperationsInput | string | null
    approvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    reopenedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    overriddenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ForecastSubmissionUncheckedUpdateManyWithoutPeriodInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    repUserId?: StringFieldUpdateOperationsInput | string
    lob?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    commitForecast?: FloatFieldUpdateOperationsInput | number
    bestCaseForecast?: NullableFloatFieldUpdateOperationsInput | number | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    submittedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    managerOverride?: NullableFloatFieldUpdateOperationsInput | number | null
    managerComment?: NullableStringFieldUpdateOperationsInput | string | null
    managerId?: NullableStringFieldUpdateOperationsInput | string | null
    managerName?: NullableStringFieldUpdateOperationsInput | string | null
    approvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    reopenedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    overriddenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Aliases for legacy arg types
   */
    /**
     * @deprecated Use ForecastPeriodCountOutputTypeDefaultArgs instead
     */
    export type ForecastPeriodCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ForecastPeriodCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use ForecastPeriodDefaultArgs instead
     */
    export type ForecastPeriodArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ForecastPeriodDefaultArgs<ExtArgs>
    /**
     * @deprecated Use AiForecastSnapshotDefaultArgs instead
     */
    export type AiForecastSnapshotArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = AiForecastSnapshotDefaultArgs<ExtArgs>
    /**
     * @deprecated Use PipelineCoverageMetricsDefaultArgs instead
     */
    export type PipelineCoverageMetricsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = PipelineCoverageMetricsDefaultArgs<ExtArgs>
    /**
     * @deprecated Use HistoricalConversionRateDefaultArgs instead
     */
    export type HistoricalConversionRateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = HistoricalConversionRateDefaultArgs<ExtArgs>
    /**
     * @deprecated Use ForecastSubmissionDefaultArgs instead
     */
    export type ForecastSubmissionArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ForecastSubmissionDefaultArgs<ExtArgs>
    /**
     * @deprecated Use ForecastAuditLogDefaultArgs instead
     */
    export type ForecastAuditLogArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ForecastAuditLogDefaultArgs<ExtArgs>
    /**
     * @deprecated Use CrmDealDefaultArgs instead
     */
    export type CrmDealArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = CrmDealDefaultArgs<ExtArgs>
    /**
     * @deprecated Use UserDefaultArgs instead
     */
    export type UserArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = UserDefaultArgs<ExtArgs>
    /**
     * @deprecated Use QuotaDefaultArgs instead
     */
    export type QuotaArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = QuotaDefaultArgs<ExtArgs>

  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}