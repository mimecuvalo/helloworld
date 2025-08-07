
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
 * Model User
 * 
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model UserRemote
 * 
 */
export type UserRemote = $Result.DefaultSelection<Prisma.$UserRemotePayload>
/**
 * Model Content
 * 
 */
export type Content = $Result.DefaultSelection<Prisma.$ContentPayload>
/**
 * Model ContentRemote
 * 
 */
export type ContentRemote = $Result.DefaultSelection<Prisma.$ContentRemotePayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Users
 * const users = await prisma.user.findMany()
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
   * // Fetch zero or more Users
   * const users = await prisma.user.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

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


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.userRemote`: Exposes CRUD operations for the **UserRemote** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more UserRemotes
    * const userRemotes = await prisma.userRemote.findMany()
    * ```
    */
  get userRemote(): Prisma.UserRemoteDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.content`: Exposes CRUD operations for the **Content** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Contents
    * const contents = await prisma.content.findMany()
    * ```
    */
  get content(): Prisma.ContentDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.contentRemote`: Exposes CRUD operations for the **ContentRemote** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ContentRemotes
    * const contentRemotes = await prisma.contentRemote.findMany()
    * ```
    */
  get contentRemote(): Prisma.ContentRemoteDelegate<ExtArgs, ClientOptions>;
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
   * Prisma Client JS version: 6.11.1
   * Query Engine version: f40f79ec31188888a2e33acda0ecc8fd10a853a9
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
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
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
    User: 'User',
    UserRemote: 'UserRemote',
    Content: 'Content',
    ContentRemote: 'ContentRemote'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "user" | "userRemote" | "content" | "contentRemote"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
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
          updateManyAndReturn: {
            args: Prisma.UserUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
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
      UserRemote: {
        payload: Prisma.$UserRemotePayload<ExtArgs>
        fields: Prisma.UserRemoteFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserRemoteFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserRemotePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserRemoteFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserRemotePayload>
          }
          findFirst: {
            args: Prisma.UserRemoteFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserRemotePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserRemoteFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserRemotePayload>
          }
          findMany: {
            args: Prisma.UserRemoteFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserRemotePayload>[]
          }
          create: {
            args: Prisma.UserRemoteCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserRemotePayload>
          }
          createMany: {
            args: Prisma.UserRemoteCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserRemoteCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserRemotePayload>[]
          }
          delete: {
            args: Prisma.UserRemoteDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserRemotePayload>
          }
          update: {
            args: Prisma.UserRemoteUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserRemotePayload>
          }
          deleteMany: {
            args: Prisma.UserRemoteDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserRemoteUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.UserRemoteUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserRemotePayload>[]
          }
          upsert: {
            args: Prisma.UserRemoteUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserRemotePayload>
          }
          aggregate: {
            args: Prisma.UserRemoteAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUserRemote>
          }
          groupBy: {
            args: Prisma.UserRemoteGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserRemoteGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserRemoteCountArgs<ExtArgs>
            result: $Utils.Optional<UserRemoteCountAggregateOutputType> | number
          }
        }
      }
      Content: {
        payload: Prisma.$ContentPayload<ExtArgs>
        fields: Prisma.ContentFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ContentFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContentPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ContentFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContentPayload>
          }
          findFirst: {
            args: Prisma.ContentFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContentPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ContentFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContentPayload>
          }
          findMany: {
            args: Prisma.ContentFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContentPayload>[]
          }
          create: {
            args: Prisma.ContentCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContentPayload>
          }
          createMany: {
            args: Prisma.ContentCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ContentCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContentPayload>[]
          }
          delete: {
            args: Prisma.ContentDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContentPayload>
          }
          update: {
            args: Prisma.ContentUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContentPayload>
          }
          deleteMany: {
            args: Prisma.ContentDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ContentUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ContentUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContentPayload>[]
          }
          upsert: {
            args: Prisma.ContentUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContentPayload>
          }
          aggregate: {
            args: Prisma.ContentAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateContent>
          }
          groupBy: {
            args: Prisma.ContentGroupByArgs<ExtArgs>
            result: $Utils.Optional<ContentGroupByOutputType>[]
          }
          count: {
            args: Prisma.ContentCountArgs<ExtArgs>
            result: $Utils.Optional<ContentCountAggregateOutputType> | number
          }
        }
      }
      ContentRemote: {
        payload: Prisma.$ContentRemotePayload<ExtArgs>
        fields: Prisma.ContentRemoteFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ContentRemoteFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContentRemotePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ContentRemoteFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContentRemotePayload>
          }
          findFirst: {
            args: Prisma.ContentRemoteFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContentRemotePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ContentRemoteFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContentRemotePayload>
          }
          findMany: {
            args: Prisma.ContentRemoteFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContentRemotePayload>[]
          }
          create: {
            args: Prisma.ContentRemoteCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContentRemotePayload>
          }
          createMany: {
            args: Prisma.ContentRemoteCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ContentRemoteCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContentRemotePayload>[]
          }
          delete: {
            args: Prisma.ContentRemoteDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContentRemotePayload>
          }
          update: {
            args: Prisma.ContentRemoteUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContentRemotePayload>
          }
          deleteMany: {
            args: Prisma.ContentRemoteDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ContentRemoteUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ContentRemoteUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContentRemotePayload>[]
          }
          upsert: {
            args: Prisma.ContentRemoteUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContentRemotePayload>
          }
          aggregate: {
            args: Prisma.ContentRemoteAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateContentRemote>
          }
          groupBy: {
            args: Prisma.ContentRemoteGroupByArgs<ExtArgs>
            result: $Utils.Optional<ContentRemoteGroupByOutputType>[]
          }
          count: {
            args: Prisma.ContentRemoteCountArgs<ExtArgs>
            result: $Utils.Optional<ContentRemoteCountAggregateOutputType> | number
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
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    user?: UserOmit
    userRemote?: UserRemoteOmit
    content?: ContentOmit
    contentRemote?: ContentRemoteOmit
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
    | 'updateManyAndReturn'
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
   * Count Type UserCountOutputType
   */

  export type UserCountOutputType = {
    Content: number
    ContentRemote: number
  }

  export type UserCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    Content?: boolean | UserCountOutputTypeCountContentArgs
    ContentRemote?: boolean | UserCountOutputTypeCountContentRemoteArgs
  }

  // Custom InputTypes
  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserCountOutputType
     */
    select?: UserCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountContentArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ContentWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountContentRemoteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ContentRemoteWhereInput
  }


  /**
   * Models
   */

  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _avg: UserAvgAggregateOutputType | null
    _sum: UserSumAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserAvgAggregateOutputType = {
    id: number | null
  }

  export type UserSumAggregateOutputType = {
    id: number | null
  }

  export type UserMinAggregateOutputType = {
    id: number | null
    createdAt: Date | null
    updatedAt: Date | null
    username: string | null
    name: string | null
    email: string | null
    superuser: boolean | null
    title: string | null
    description: string | null
    hostname: string | null
    license: string | null
    googleAnalytics: string | null
    favicon: string | null
    logo: string | null
    viewport: string | null
    sidebarHtml: string | null
    theme: string | null
    magicKey: string | null
    privateKey: string | null
  }

  export type UserMaxAggregateOutputType = {
    id: number | null
    createdAt: Date | null
    updatedAt: Date | null
    username: string | null
    name: string | null
    email: string | null
    superuser: boolean | null
    title: string | null
    description: string | null
    hostname: string | null
    license: string | null
    googleAnalytics: string | null
    favicon: string | null
    logo: string | null
    viewport: string | null
    sidebarHtml: string | null
    theme: string | null
    magicKey: string | null
    privateKey: string | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    createdAt: number
    updatedAt: number
    username: number
    name: number
    email: number
    superuser: number
    title: number
    description: number
    hostname: number
    license: number
    googleAnalytics: number
    favicon: number
    logo: number
    viewport: number
    sidebarHtml: number
    theme: number
    magicKey: number
    privateKey: number
    _all: number
  }


  export type UserAvgAggregateInputType = {
    id?: true
  }

  export type UserSumAggregateInputType = {
    id?: true
  }

  export type UserMinAggregateInputType = {
    id?: true
    createdAt?: true
    updatedAt?: true
    username?: true
    name?: true
    email?: true
    superuser?: true
    title?: true
    description?: true
    hostname?: true
    license?: true
    googleAnalytics?: true
    favicon?: true
    logo?: true
    viewport?: true
    sidebarHtml?: true
    theme?: true
    magicKey?: true
    privateKey?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    createdAt?: true
    updatedAt?: true
    username?: true
    name?: true
    email?: true
    superuser?: true
    title?: true
    description?: true
    hostname?: true
    license?: true
    googleAnalytics?: true
    favicon?: true
    logo?: true
    viewport?: true
    sidebarHtml?: true
    theme?: true
    magicKey?: true
    privateKey?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    createdAt?: true
    updatedAt?: true
    username?: true
    name?: true
    email?: true
    superuser?: true
    title?: true
    description?: true
    hostname?: true
    license?: true
    googleAnalytics?: true
    favicon?: true
    logo?: true
    viewport?: true
    sidebarHtml?: true
    theme?: true
    magicKey?: true
    privateKey?: true
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
     * Select which fields to average
    **/
    _avg?: UserAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: UserSumAggregateInputType
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
    _avg?: UserAvgAggregateInputType
    _sum?: UserSumAggregateInputType
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: number
    createdAt: Date | null
    updatedAt: Date | null
    username: string
    name: string
    email: string
    superuser: boolean
    title: string
    description: string | null
    hostname: string | null
    license: string | null
    googleAnalytics: string | null
    favicon: string | null
    logo: string | null
    viewport: string | null
    sidebarHtml: string | null
    theme: string
    magicKey: string
    privateKey: string
    _count: UserCountAggregateOutputType | null
    _avg: UserAvgAggregateOutputType | null
    _sum: UserSumAggregateOutputType | null
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
    createdAt?: boolean
    updatedAt?: boolean
    username?: boolean
    name?: boolean
    email?: boolean
    superuser?: boolean
    title?: boolean
    description?: boolean
    hostname?: boolean
    license?: boolean
    googleAnalytics?: boolean
    favicon?: boolean
    logo?: boolean
    viewport?: boolean
    sidebarHtml?: boolean
    theme?: boolean
    magicKey?: boolean
    privateKey?: boolean
    Content?: boolean | User$ContentArgs<ExtArgs>
    ContentRemote?: boolean | User$ContentRemoteArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type UserSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    username?: boolean
    name?: boolean
    email?: boolean
    superuser?: boolean
    title?: boolean
    description?: boolean
    hostname?: boolean
    license?: boolean
    googleAnalytics?: boolean
    favicon?: boolean
    logo?: boolean
    viewport?: boolean
    sidebarHtml?: boolean
    theme?: boolean
    magicKey?: boolean
    privateKey?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    username?: boolean
    name?: boolean
    email?: boolean
    superuser?: boolean
    title?: boolean
    description?: boolean
    hostname?: boolean
    license?: boolean
    googleAnalytics?: boolean
    favicon?: boolean
    logo?: boolean
    viewport?: boolean
    sidebarHtml?: boolean
    theme?: boolean
    magicKey?: boolean
    privateKey?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectScalar = {
    id?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    username?: boolean
    name?: boolean
    email?: boolean
    superuser?: boolean
    title?: boolean
    description?: boolean
    hostname?: boolean
    license?: boolean
    googleAnalytics?: boolean
    favicon?: boolean
    logo?: boolean
    viewport?: boolean
    sidebarHtml?: boolean
    theme?: boolean
    magicKey?: boolean
    privateKey?: boolean
  }

  export type UserOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "createdAt" | "updatedAt" | "username" | "name" | "email" | "superuser" | "title" | "description" | "hostname" | "license" | "googleAnalytics" | "favicon" | "logo" | "viewport" | "sidebarHtml" | "theme" | "magicKey" | "privateKey", ExtArgs["result"]["user"]>
  export type UserInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    Content?: boolean | User$ContentArgs<ExtArgs>
    ContentRemote?: boolean | User$ContentRemoteArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type UserIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type UserIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {
      Content: Prisma.$ContentPayload<ExtArgs>[]
      ContentRemote: Prisma.$ContentRemotePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      createdAt: Date | null
      updatedAt: Date | null
      username: string
      name: string
      email: string
      superuser: boolean
      title: string
      description: string | null
      hostname: string | null
      license: string | null
      googleAnalytics: string | null
      favicon: string | null
      logo: string | null
      viewport: string | null
      sidebarHtml: string | null
      theme: string
      magicKey: string
      privateKey: string
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<UserFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
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
    findUnique<T extends UserFindUniqueArgs>(args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

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
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

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
    findFirst<T extends UserFindFirstArgs>(args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

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
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

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
    findMany<T extends UserFindManyArgs>(args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

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
    create<T extends UserCreateArgs>(args: SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

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
    createManyAndReturn<T extends UserCreateManyAndReturnArgs>(args?: SelectSubset<T, UserCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

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
    delete<T extends UserDeleteArgs>(args: SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

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
    update<T extends UserUpdateArgs>(args: SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

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
     * Update zero or more Users and returns the data updated in the database.
     * @param {UserUpdateManyAndReturnArgs} args - Arguments to update many Users.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Users and only return the `id`
     * const userWithIdOnly = await prisma.user.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends UserUpdateManyAndReturnArgs>(args: SelectSubset<T, UserUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

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
    upsert<T extends UserUpsertArgs>(args: SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


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
  export interface Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    Content<T extends User$ContentArgs<ExtArgs> = {}>(args?: Subset<T, User$ContentArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ContentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    ContentRemote<T extends User$ContentRemoteArgs<ExtArgs> = {}>(args?: Subset<T, User$ContentRemoteArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ContentRemotePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
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
    readonly id: FieldRef<"User", 'Int'>
    readonly createdAt: FieldRef<"User", 'DateTime'>
    readonly updatedAt: FieldRef<"User", 'DateTime'>
    readonly username: FieldRef<"User", 'String'>
    readonly name: FieldRef<"User", 'String'>
    readonly email: FieldRef<"User", 'String'>
    readonly superuser: FieldRef<"User", 'Boolean'>
    readonly title: FieldRef<"User", 'String'>
    readonly description: FieldRef<"User", 'String'>
    readonly hostname: FieldRef<"User", 'String'>
    readonly license: FieldRef<"User", 'String'>
    readonly googleAnalytics: FieldRef<"User", 'String'>
    readonly favicon: FieldRef<"User", 'String'>
    readonly logo: FieldRef<"User", 'String'>
    readonly viewport: FieldRef<"User", 'String'>
    readonly sidebarHtml: FieldRef<"User", 'String'>
    readonly theme: FieldRef<"User", 'String'>
    readonly magicKey: FieldRef<"User", 'String'>
    readonly privateKey: FieldRef<"User", 'String'>
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
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
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
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
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
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
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
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
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
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
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
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
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
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
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
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
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
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User updateManyAndReturn
   */
  export type UserUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
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
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
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
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
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
    /**
     * Limit how many Users to delete.
     */
    limit?: number
  }

  /**
   * User.Content
   */
  export type User$ContentArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Content
     */
    select?: ContentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Content
     */
    omit?: ContentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContentInclude<ExtArgs> | null
    where?: ContentWhereInput
    orderBy?: ContentOrderByWithRelationInput | ContentOrderByWithRelationInput[]
    cursor?: ContentWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ContentScalarFieldEnum | ContentScalarFieldEnum[]
  }

  /**
   * User.ContentRemote
   */
  export type User$ContentRemoteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContentRemote
     */
    select?: ContentRemoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ContentRemote
     */
    omit?: ContentRemoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContentRemoteInclude<ExtArgs> | null
    where?: ContentRemoteWhereInput
    orderBy?: ContentRemoteOrderByWithRelationInput | ContentRemoteOrderByWithRelationInput[]
    cursor?: ContentRemoteWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ContentRemoteScalarFieldEnum | ContentRemoteScalarFieldEnum[]
  }

  /**
   * User without action
   */
  export type UserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
  }


  /**
   * Model UserRemote
   */

  export type AggregateUserRemote = {
    _count: UserRemoteCountAggregateOutputType | null
    _avg: UserRemoteAvgAggregateOutputType | null
    _sum: UserRemoteSumAggregateOutputType | null
    _min: UserRemoteMinAggregateOutputType | null
    _max: UserRemoteMaxAggregateOutputType | null
  }

  export type UserRemoteAvgAggregateOutputType = {
    id: number | null
    order: number | null
  }

  export type UserRemoteSumAggregateOutputType = {
    id: number | null
    order: number | null
  }

  export type UserRemoteMinAggregateOutputType = {
    id: number | null
    createdAt: Date | null
    updatedAt: Date | null
    localUsername: string | null
    username: string | null
    name: string | null
    profileUrl: string | null
    feedUrl: string | null
    magicKey: string | null
    salmonUrl: string | null
    activityPubActorUrl: string | null
    activityPubInboxUrl: string | null
    webmentionUrl: string | null
    hubUrl: string | null
    follower: boolean | null
    following: boolean | null
    avatar: string | null
    favicon: string | null
    order: number | null
    sortType: string | null
  }

  export type UserRemoteMaxAggregateOutputType = {
    id: number | null
    createdAt: Date | null
    updatedAt: Date | null
    localUsername: string | null
    username: string | null
    name: string | null
    profileUrl: string | null
    feedUrl: string | null
    magicKey: string | null
    salmonUrl: string | null
    activityPubActorUrl: string | null
    activityPubInboxUrl: string | null
    webmentionUrl: string | null
    hubUrl: string | null
    follower: boolean | null
    following: boolean | null
    avatar: string | null
    favicon: string | null
    order: number | null
    sortType: string | null
  }

  export type UserRemoteCountAggregateOutputType = {
    id: number
    createdAt: number
    updatedAt: number
    localUsername: number
    username: number
    name: number
    profileUrl: number
    feedUrl: number
    magicKey: number
    salmonUrl: number
    activityPubActorUrl: number
    activityPubInboxUrl: number
    webmentionUrl: number
    hubUrl: number
    follower: number
    following: number
    avatar: number
    favicon: number
    order: number
    sortType: number
    _all: number
  }


  export type UserRemoteAvgAggregateInputType = {
    id?: true
    order?: true
  }

  export type UserRemoteSumAggregateInputType = {
    id?: true
    order?: true
  }

  export type UserRemoteMinAggregateInputType = {
    id?: true
    createdAt?: true
    updatedAt?: true
    localUsername?: true
    username?: true
    name?: true
    profileUrl?: true
    feedUrl?: true
    magicKey?: true
    salmonUrl?: true
    activityPubActorUrl?: true
    activityPubInboxUrl?: true
    webmentionUrl?: true
    hubUrl?: true
    follower?: true
    following?: true
    avatar?: true
    favicon?: true
    order?: true
    sortType?: true
  }

  export type UserRemoteMaxAggregateInputType = {
    id?: true
    createdAt?: true
    updatedAt?: true
    localUsername?: true
    username?: true
    name?: true
    profileUrl?: true
    feedUrl?: true
    magicKey?: true
    salmonUrl?: true
    activityPubActorUrl?: true
    activityPubInboxUrl?: true
    webmentionUrl?: true
    hubUrl?: true
    follower?: true
    following?: true
    avatar?: true
    favicon?: true
    order?: true
    sortType?: true
  }

  export type UserRemoteCountAggregateInputType = {
    id?: true
    createdAt?: true
    updatedAt?: true
    localUsername?: true
    username?: true
    name?: true
    profileUrl?: true
    feedUrl?: true
    magicKey?: true
    salmonUrl?: true
    activityPubActorUrl?: true
    activityPubInboxUrl?: true
    webmentionUrl?: true
    hubUrl?: true
    follower?: true
    following?: true
    avatar?: true
    favicon?: true
    order?: true
    sortType?: true
    _all?: true
  }

  export type UserRemoteAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which UserRemote to aggregate.
     */
    where?: UserRemoteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UserRemotes to fetch.
     */
    orderBy?: UserRemoteOrderByWithRelationInput | UserRemoteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserRemoteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UserRemotes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UserRemotes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned UserRemotes
    **/
    _count?: true | UserRemoteCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: UserRemoteAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: UserRemoteSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserRemoteMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserRemoteMaxAggregateInputType
  }

  export type GetUserRemoteAggregateType<T extends UserRemoteAggregateArgs> = {
        [P in keyof T & keyof AggregateUserRemote]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUserRemote[P]>
      : GetScalarType<T[P], AggregateUserRemote[P]>
  }




  export type UserRemoteGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserRemoteWhereInput
    orderBy?: UserRemoteOrderByWithAggregationInput | UserRemoteOrderByWithAggregationInput[]
    by: UserRemoteScalarFieldEnum[] | UserRemoteScalarFieldEnum
    having?: UserRemoteScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserRemoteCountAggregateInputType | true
    _avg?: UserRemoteAvgAggregateInputType
    _sum?: UserRemoteSumAggregateInputType
    _min?: UserRemoteMinAggregateInputType
    _max?: UserRemoteMaxAggregateInputType
  }

  export type UserRemoteGroupByOutputType = {
    id: number
    createdAt: Date | null
    updatedAt: Date | null
    localUsername: string
    username: string
    name: string
    profileUrl: string
    feedUrl: string
    magicKey: string | null
    salmonUrl: string | null
    activityPubActorUrl: string | null
    activityPubInboxUrl: string | null
    webmentionUrl: string | null
    hubUrl: string | null
    follower: boolean
    following: boolean
    avatar: string
    favicon: string | null
    order: number
    sortType: string | null
    _count: UserRemoteCountAggregateOutputType | null
    _avg: UserRemoteAvgAggregateOutputType | null
    _sum: UserRemoteSumAggregateOutputType | null
    _min: UserRemoteMinAggregateOutputType | null
    _max: UserRemoteMaxAggregateOutputType | null
  }

  type GetUserRemoteGroupByPayload<T extends UserRemoteGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserRemoteGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserRemoteGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserRemoteGroupByOutputType[P]>
            : GetScalarType<T[P], UserRemoteGroupByOutputType[P]>
        }
      >
    >


  export type UserRemoteSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    localUsername?: boolean
    username?: boolean
    name?: boolean
    profileUrl?: boolean
    feedUrl?: boolean
    magicKey?: boolean
    salmonUrl?: boolean
    activityPubActorUrl?: boolean
    activityPubInboxUrl?: boolean
    webmentionUrl?: boolean
    hubUrl?: boolean
    follower?: boolean
    following?: boolean
    avatar?: boolean
    favicon?: boolean
    order?: boolean
    sortType?: boolean
  }, ExtArgs["result"]["userRemote"]>

  export type UserRemoteSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    localUsername?: boolean
    username?: boolean
    name?: boolean
    profileUrl?: boolean
    feedUrl?: boolean
    magicKey?: boolean
    salmonUrl?: boolean
    activityPubActorUrl?: boolean
    activityPubInboxUrl?: boolean
    webmentionUrl?: boolean
    hubUrl?: boolean
    follower?: boolean
    following?: boolean
    avatar?: boolean
    favicon?: boolean
    order?: boolean
    sortType?: boolean
  }, ExtArgs["result"]["userRemote"]>

  export type UserRemoteSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    localUsername?: boolean
    username?: boolean
    name?: boolean
    profileUrl?: boolean
    feedUrl?: boolean
    magicKey?: boolean
    salmonUrl?: boolean
    activityPubActorUrl?: boolean
    activityPubInboxUrl?: boolean
    webmentionUrl?: boolean
    hubUrl?: boolean
    follower?: boolean
    following?: boolean
    avatar?: boolean
    favicon?: boolean
    order?: boolean
    sortType?: boolean
  }, ExtArgs["result"]["userRemote"]>

  export type UserRemoteSelectScalar = {
    id?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    localUsername?: boolean
    username?: boolean
    name?: boolean
    profileUrl?: boolean
    feedUrl?: boolean
    magicKey?: boolean
    salmonUrl?: boolean
    activityPubActorUrl?: boolean
    activityPubInboxUrl?: boolean
    webmentionUrl?: boolean
    hubUrl?: boolean
    follower?: boolean
    following?: boolean
    avatar?: boolean
    favicon?: boolean
    order?: boolean
    sortType?: boolean
  }

  export type UserRemoteOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "createdAt" | "updatedAt" | "localUsername" | "username" | "name" | "profileUrl" | "feedUrl" | "magicKey" | "salmonUrl" | "activityPubActorUrl" | "activityPubInboxUrl" | "webmentionUrl" | "hubUrl" | "follower" | "following" | "avatar" | "favicon" | "order" | "sortType", ExtArgs["result"]["userRemote"]>

  export type $UserRemotePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "UserRemote"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: number
      createdAt: Date | null
      updatedAt: Date | null
      localUsername: string
      username: string
      name: string
      profileUrl: string
      feedUrl: string
      magicKey: string | null
      salmonUrl: string | null
      activityPubActorUrl: string | null
      activityPubInboxUrl: string | null
      webmentionUrl: string | null
      hubUrl: string | null
      follower: boolean
      following: boolean
      avatar: string
      favicon: string | null
      order: number
      sortType: string | null
    }, ExtArgs["result"]["userRemote"]>
    composites: {}
  }

  type UserRemoteGetPayload<S extends boolean | null | undefined | UserRemoteDefaultArgs> = $Result.GetResult<Prisma.$UserRemotePayload, S>

  type UserRemoteCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<UserRemoteFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: UserRemoteCountAggregateInputType | true
    }

  export interface UserRemoteDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['UserRemote'], meta: { name: 'UserRemote' } }
    /**
     * Find zero or one UserRemote that matches the filter.
     * @param {UserRemoteFindUniqueArgs} args - Arguments to find a UserRemote
     * @example
     * // Get one UserRemote
     * const userRemote = await prisma.userRemote.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserRemoteFindUniqueArgs>(args: SelectSubset<T, UserRemoteFindUniqueArgs<ExtArgs>>): Prisma__UserRemoteClient<$Result.GetResult<Prisma.$UserRemotePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one UserRemote that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UserRemoteFindUniqueOrThrowArgs} args - Arguments to find a UserRemote
     * @example
     * // Get one UserRemote
     * const userRemote = await prisma.userRemote.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserRemoteFindUniqueOrThrowArgs>(args: SelectSubset<T, UserRemoteFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserRemoteClient<$Result.GetResult<Prisma.$UserRemotePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first UserRemote that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserRemoteFindFirstArgs} args - Arguments to find a UserRemote
     * @example
     * // Get one UserRemote
     * const userRemote = await prisma.userRemote.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserRemoteFindFirstArgs>(args?: SelectSubset<T, UserRemoteFindFirstArgs<ExtArgs>>): Prisma__UserRemoteClient<$Result.GetResult<Prisma.$UserRemotePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first UserRemote that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserRemoteFindFirstOrThrowArgs} args - Arguments to find a UserRemote
     * @example
     * // Get one UserRemote
     * const userRemote = await prisma.userRemote.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserRemoteFindFirstOrThrowArgs>(args?: SelectSubset<T, UserRemoteFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserRemoteClient<$Result.GetResult<Prisma.$UserRemotePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more UserRemotes that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserRemoteFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all UserRemotes
     * const userRemotes = await prisma.userRemote.findMany()
     * 
     * // Get first 10 UserRemotes
     * const userRemotes = await prisma.userRemote.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userRemoteWithIdOnly = await prisma.userRemote.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserRemoteFindManyArgs>(args?: SelectSubset<T, UserRemoteFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserRemotePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a UserRemote.
     * @param {UserRemoteCreateArgs} args - Arguments to create a UserRemote.
     * @example
     * // Create one UserRemote
     * const UserRemote = await prisma.userRemote.create({
     *   data: {
     *     // ... data to create a UserRemote
     *   }
     * })
     * 
     */
    create<T extends UserRemoteCreateArgs>(args: SelectSubset<T, UserRemoteCreateArgs<ExtArgs>>): Prisma__UserRemoteClient<$Result.GetResult<Prisma.$UserRemotePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many UserRemotes.
     * @param {UserRemoteCreateManyArgs} args - Arguments to create many UserRemotes.
     * @example
     * // Create many UserRemotes
     * const userRemote = await prisma.userRemote.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserRemoteCreateManyArgs>(args?: SelectSubset<T, UserRemoteCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many UserRemotes and returns the data saved in the database.
     * @param {UserRemoteCreateManyAndReturnArgs} args - Arguments to create many UserRemotes.
     * @example
     * // Create many UserRemotes
     * const userRemote = await prisma.userRemote.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many UserRemotes and only return the `id`
     * const userRemoteWithIdOnly = await prisma.userRemote.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UserRemoteCreateManyAndReturnArgs>(args?: SelectSubset<T, UserRemoteCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserRemotePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a UserRemote.
     * @param {UserRemoteDeleteArgs} args - Arguments to delete one UserRemote.
     * @example
     * // Delete one UserRemote
     * const UserRemote = await prisma.userRemote.delete({
     *   where: {
     *     // ... filter to delete one UserRemote
     *   }
     * })
     * 
     */
    delete<T extends UserRemoteDeleteArgs>(args: SelectSubset<T, UserRemoteDeleteArgs<ExtArgs>>): Prisma__UserRemoteClient<$Result.GetResult<Prisma.$UserRemotePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one UserRemote.
     * @param {UserRemoteUpdateArgs} args - Arguments to update one UserRemote.
     * @example
     * // Update one UserRemote
     * const userRemote = await prisma.userRemote.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserRemoteUpdateArgs>(args: SelectSubset<T, UserRemoteUpdateArgs<ExtArgs>>): Prisma__UserRemoteClient<$Result.GetResult<Prisma.$UserRemotePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more UserRemotes.
     * @param {UserRemoteDeleteManyArgs} args - Arguments to filter UserRemotes to delete.
     * @example
     * // Delete a few UserRemotes
     * const { count } = await prisma.userRemote.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserRemoteDeleteManyArgs>(args?: SelectSubset<T, UserRemoteDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more UserRemotes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserRemoteUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many UserRemotes
     * const userRemote = await prisma.userRemote.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserRemoteUpdateManyArgs>(args: SelectSubset<T, UserRemoteUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more UserRemotes and returns the data updated in the database.
     * @param {UserRemoteUpdateManyAndReturnArgs} args - Arguments to update many UserRemotes.
     * @example
     * // Update many UserRemotes
     * const userRemote = await prisma.userRemote.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more UserRemotes and only return the `id`
     * const userRemoteWithIdOnly = await prisma.userRemote.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends UserRemoteUpdateManyAndReturnArgs>(args: SelectSubset<T, UserRemoteUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserRemotePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one UserRemote.
     * @param {UserRemoteUpsertArgs} args - Arguments to update or create a UserRemote.
     * @example
     * // Update or create a UserRemote
     * const userRemote = await prisma.userRemote.upsert({
     *   create: {
     *     // ... data to create a UserRemote
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the UserRemote we want to update
     *   }
     * })
     */
    upsert<T extends UserRemoteUpsertArgs>(args: SelectSubset<T, UserRemoteUpsertArgs<ExtArgs>>): Prisma__UserRemoteClient<$Result.GetResult<Prisma.$UserRemotePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of UserRemotes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserRemoteCountArgs} args - Arguments to filter UserRemotes to count.
     * @example
     * // Count the number of UserRemotes
     * const count = await prisma.userRemote.count({
     *   where: {
     *     // ... the filter for the UserRemotes we want to count
     *   }
     * })
    **/
    count<T extends UserRemoteCountArgs>(
      args?: Subset<T, UserRemoteCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserRemoteCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a UserRemote.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserRemoteAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends UserRemoteAggregateArgs>(args: Subset<T, UserRemoteAggregateArgs>): Prisma.PrismaPromise<GetUserRemoteAggregateType<T>>

    /**
     * Group by UserRemote.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserRemoteGroupByArgs} args - Group by arguments.
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
      T extends UserRemoteGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserRemoteGroupByArgs['orderBy'] }
        : { orderBy?: UserRemoteGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, UserRemoteGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserRemoteGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the UserRemote model
   */
  readonly fields: UserRemoteFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for UserRemote.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserRemoteClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
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
   * Fields of the UserRemote model
   */
  interface UserRemoteFieldRefs {
    readonly id: FieldRef<"UserRemote", 'Int'>
    readonly createdAt: FieldRef<"UserRemote", 'DateTime'>
    readonly updatedAt: FieldRef<"UserRemote", 'DateTime'>
    readonly localUsername: FieldRef<"UserRemote", 'String'>
    readonly username: FieldRef<"UserRemote", 'String'>
    readonly name: FieldRef<"UserRemote", 'String'>
    readonly profileUrl: FieldRef<"UserRemote", 'String'>
    readonly feedUrl: FieldRef<"UserRemote", 'String'>
    readonly magicKey: FieldRef<"UserRemote", 'String'>
    readonly salmonUrl: FieldRef<"UserRemote", 'String'>
    readonly activityPubActorUrl: FieldRef<"UserRemote", 'String'>
    readonly activityPubInboxUrl: FieldRef<"UserRemote", 'String'>
    readonly webmentionUrl: FieldRef<"UserRemote", 'String'>
    readonly hubUrl: FieldRef<"UserRemote", 'String'>
    readonly follower: FieldRef<"UserRemote", 'Boolean'>
    readonly following: FieldRef<"UserRemote", 'Boolean'>
    readonly avatar: FieldRef<"UserRemote", 'String'>
    readonly favicon: FieldRef<"UserRemote", 'String'>
    readonly order: FieldRef<"UserRemote", 'Int'>
    readonly sortType: FieldRef<"UserRemote", 'String'>
  }
    

  // Custom InputTypes
  /**
   * UserRemote findUnique
   */
  export type UserRemoteFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserRemote
     */
    select?: UserRemoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserRemote
     */
    omit?: UserRemoteOmit<ExtArgs> | null
    /**
     * Filter, which UserRemote to fetch.
     */
    where: UserRemoteWhereUniqueInput
  }

  /**
   * UserRemote findUniqueOrThrow
   */
  export type UserRemoteFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserRemote
     */
    select?: UserRemoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserRemote
     */
    omit?: UserRemoteOmit<ExtArgs> | null
    /**
     * Filter, which UserRemote to fetch.
     */
    where: UserRemoteWhereUniqueInput
  }

  /**
   * UserRemote findFirst
   */
  export type UserRemoteFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserRemote
     */
    select?: UserRemoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserRemote
     */
    omit?: UserRemoteOmit<ExtArgs> | null
    /**
     * Filter, which UserRemote to fetch.
     */
    where?: UserRemoteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UserRemotes to fetch.
     */
    orderBy?: UserRemoteOrderByWithRelationInput | UserRemoteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for UserRemotes.
     */
    cursor?: UserRemoteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UserRemotes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UserRemotes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of UserRemotes.
     */
    distinct?: UserRemoteScalarFieldEnum | UserRemoteScalarFieldEnum[]
  }

  /**
   * UserRemote findFirstOrThrow
   */
  export type UserRemoteFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserRemote
     */
    select?: UserRemoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserRemote
     */
    omit?: UserRemoteOmit<ExtArgs> | null
    /**
     * Filter, which UserRemote to fetch.
     */
    where?: UserRemoteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UserRemotes to fetch.
     */
    orderBy?: UserRemoteOrderByWithRelationInput | UserRemoteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for UserRemotes.
     */
    cursor?: UserRemoteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UserRemotes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UserRemotes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of UserRemotes.
     */
    distinct?: UserRemoteScalarFieldEnum | UserRemoteScalarFieldEnum[]
  }

  /**
   * UserRemote findMany
   */
  export type UserRemoteFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserRemote
     */
    select?: UserRemoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserRemote
     */
    omit?: UserRemoteOmit<ExtArgs> | null
    /**
     * Filter, which UserRemotes to fetch.
     */
    where?: UserRemoteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UserRemotes to fetch.
     */
    orderBy?: UserRemoteOrderByWithRelationInput | UserRemoteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing UserRemotes.
     */
    cursor?: UserRemoteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UserRemotes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UserRemotes.
     */
    skip?: number
    distinct?: UserRemoteScalarFieldEnum | UserRemoteScalarFieldEnum[]
  }

  /**
   * UserRemote create
   */
  export type UserRemoteCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserRemote
     */
    select?: UserRemoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserRemote
     */
    omit?: UserRemoteOmit<ExtArgs> | null
    /**
     * The data needed to create a UserRemote.
     */
    data: XOR<UserRemoteCreateInput, UserRemoteUncheckedCreateInput>
  }

  /**
   * UserRemote createMany
   */
  export type UserRemoteCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many UserRemotes.
     */
    data: UserRemoteCreateManyInput | UserRemoteCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * UserRemote createManyAndReturn
   */
  export type UserRemoteCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserRemote
     */
    select?: UserRemoteSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the UserRemote
     */
    omit?: UserRemoteOmit<ExtArgs> | null
    /**
     * The data used to create many UserRemotes.
     */
    data: UserRemoteCreateManyInput | UserRemoteCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * UserRemote update
   */
  export type UserRemoteUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserRemote
     */
    select?: UserRemoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserRemote
     */
    omit?: UserRemoteOmit<ExtArgs> | null
    /**
     * The data needed to update a UserRemote.
     */
    data: XOR<UserRemoteUpdateInput, UserRemoteUncheckedUpdateInput>
    /**
     * Choose, which UserRemote to update.
     */
    where: UserRemoteWhereUniqueInput
  }

  /**
   * UserRemote updateMany
   */
  export type UserRemoteUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update UserRemotes.
     */
    data: XOR<UserRemoteUpdateManyMutationInput, UserRemoteUncheckedUpdateManyInput>
    /**
     * Filter which UserRemotes to update
     */
    where?: UserRemoteWhereInput
    /**
     * Limit how many UserRemotes to update.
     */
    limit?: number
  }

  /**
   * UserRemote updateManyAndReturn
   */
  export type UserRemoteUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserRemote
     */
    select?: UserRemoteSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the UserRemote
     */
    omit?: UserRemoteOmit<ExtArgs> | null
    /**
     * The data used to update UserRemotes.
     */
    data: XOR<UserRemoteUpdateManyMutationInput, UserRemoteUncheckedUpdateManyInput>
    /**
     * Filter which UserRemotes to update
     */
    where?: UserRemoteWhereInput
    /**
     * Limit how many UserRemotes to update.
     */
    limit?: number
  }

  /**
   * UserRemote upsert
   */
  export type UserRemoteUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserRemote
     */
    select?: UserRemoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserRemote
     */
    omit?: UserRemoteOmit<ExtArgs> | null
    /**
     * The filter to search for the UserRemote to update in case it exists.
     */
    where: UserRemoteWhereUniqueInput
    /**
     * In case the UserRemote found by the `where` argument doesn't exist, create a new UserRemote with this data.
     */
    create: XOR<UserRemoteCreateInput, UserRemoteUncheckedCreateInput>
    /**
     * In case the UserRemote was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserRemoteUpdateInput, UserRemoteUncheckedUpdateInput>
  }

  /**
   * UserRemote delete
   */
  export type UserRemoteDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserRemote
     */
    select?: UserRemoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserRemote
     */
    omit?: UserRemoteOmit<ExtArgs> | null
    /**
     * Filter which UserRemote to delete.
     */
    where: UserRemoteWhereUniqueInput
  }

  /**
   * UserRemote deleteMany
   */
  export type UserRemoteDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which UserRemotes to delete
     */
    where?: UserRemoteWhereInput
    /**
     * Limit how many UserRemotes to delete.
     */
    limit?: number
  }

  /**
   * UserRemote without action
   */
  export type UserRemoteDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserRemote
     */
    select?: UserRemoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserRemote
     */
    omit?: UserRemoteOmit<ExtArgs> | null
  }


  /**
   * Model Content
   */

  export type AggregateContent = {
    _count: ContentCountAggregateOutputType | null
    _avg: ContentAvgAggregateOutputType | null
    _sum: ContentSumAggregateOutputType | null
    _min: ContentMinAggregateOutputType | null
    _max: ContentMaxAggregateOutputType | null
  }

  export type ContentAvgAggregateOutputType = {
    id: number | null
    redirect: number | null
    order: number | null
    count: number | null
    countRobot: number | null
    commentsCount: number | null
    favoritesCount: number | null
  }

  export type ContentSumAggregateOutputType = {
    id: number | null
    redirect: number | null
    order: number | null
    count: number | null
    countRobot: number | null
    commentsCount: number | null
    favoritesCount: number | null
  }

  export type ContentMinAggregateOutputType = {
    id: number | null
    createdAt: Date | null
    updatedAt: Date | null
    username: string | null
    section: string | null
    album: string | null
    name: string | null
    template: string | null
    sortType: string | null
    redirect: number | null
    hidden: boolean | null
    title: string | null
    thumb: string | null
    order: number | null
    count: number | null
    countRobot: number | null
    commentsCount: number | null
    commentsUpdated: Date | null
    favoritesCount: number | null
    thread: string | null
    threadUser: string | null
    avatar: string | null
    style: string | null
    code: string | null
    view: string | null
    content: string | null
  }

  export type ContentMaxAggregateOutputType = {
    id: number | null
    createdAt: Date | null
    updatedAt: Date | null
    username: string | null
    section: string | null
    album: string | null
    name: string | null
    template: string | null
    sortType: string | null
    redirect: number | null
    hidden: boolean | null
    title: string | null
    thumb: string | null
    order: number | null
    count: number | null
    countRobot: number | null
    commentsCount: number | null
    commentsUpdated: Date | null
    favoritesCount: number | null
    thread: string | null
    threadUser: string | null
    avatar: string | null
    style: string | null
    code: string | null
    view: string | null
    content: string | null
  }

  export type ContentCountAggregateOutputType = {
    id: number
    createdAt: number
    updatedAt: number
    username: number
    section: number
    album: number
    name: number
    template: number
    sortType: number
    redirect: number
    hidden: number
    title: number
    thumb: number
    order: number
    count: number
    countRobot: number
    commentsCount: number
    commentsUpdated: number
    favoritesCount: number
    thread: number
    threadUser: number
    avatar: number
    style: number
    code: number
    view: number
    content: number
    _all: number
  }


  export type ContentAvgAggregateInputType = {
    id?: true
    redirect?: true
    order?: true
    count?: true
    countRobot?: true
    commentsCount?: true
    favoritesCount?: true
  }

  export type ContentSumAggregateInputType = {
    id?: true
    redirect?: true
    order?: true
    count?: true
    countRobot?: true
    commentsCount?: true
    favoritesCount?: true
  }

  export type ContentMinAggregateInputType = {
    id?: true
    createdAt?: true
    updatedAt?: true
    username?: true
    section?: true
    album?: true
    name?: true
    template?: true
    sortType?: true
    redirect?: true
    hidden?: true
    title?: true
    thumb?: true
    order?: true
    count?: true
    countRobot?: true
    commentsCount?: true
    commentsUpdated?: true
    favoritesCount?: true
    thread?: true
    threadUser?: true
    avatar?: true
    style?: true
    code?: true
    view?: true
    content?: true
  }

  export type ContentMaxAggregateInputType = {
    id?: true
    createdAt?: true
    updatedAt?: true
    username?: true
    section?: true
    album?: true
    name?: true
    template?: true
    sortType?: true
    redirect?: true
    hidden?: true
    title?: true
    thumb?: true
    order?: true
    count?: true
    countRobot?: true
    commentsCount?: true
    commentsUpdated?: true
    favoritesCount?: true
    thread?: true
    threadUser?: true
    avatar?: true
    style?: true
    code?: true
    view?: true
    content?: true
  }

  export type ContentCountAggregateInputType = {
    id?: true
    createdAt?: true
    updatedAt?: true
    username?: true
    section?: true
    album?: true
    name?: true
    template?: true
    sortType?: true
    redirect?: true
    hidden?: true
    title?: true
    thumb?: true
    order?: true
    count?: true
    countRobot?: true
    commentsCount?: true
    commentsUpdated?: true
    favoritesCount?: true
    thread?: true
    threadUser?: true
    avatar?: true
    style?: true
    code?: true
    view?: true
    content?: true
    _all?: true
  }

  export type ContentAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Content to aggregate.
     */
    where?: ContentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Contents to fetch.
     */
    orderBy?: ContentOrderByWithRelationInput | ContentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ContentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Contents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Contents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Contents
    **/
    _count?: true | ContentCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ContentAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ContentSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ContentMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ContentMaxAggregateInputType
  }

  export type GetContentAggregateType<T extends ContentAggregateArgs> = {
        [P in keyof T & keyof AggregateContent]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateContent[P]>
      : GetScalarType<T[P], AggregateContent[P]>
  }




  export type ContentGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ContentWhereInput
    orderBy?: ContentOrderByWithAggregationInput | ContentOrderByWithAggregationInput[]
    by: ContentScalarFieldEnum[] | ContentScalarFieldEnum
    having?: ContentScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ContentCountAggregateInputType | true
    _avg?: ContentAvgAggregateInputType
    _sum?: ContentSumAggregateInputType
    _min?: ContentMinAggregateInputType
    _max?: ContentMaxAggregateInputType
  }

  export type ContentGroupByOutputType = {
    id: number
    createdAt: Date | null
    updatedAt: Date | null
    username: string
    section: string
    album: string
    name: string
    template: string | null
    sortType: string | null
    redirect: number | null
    hidden: boolean
    title: string
    thumb: string
    order: number
    count: number
    countRobot: number
    commentsCount: number
    commentsUpdated: Date | null
    favoritesCount: number
    thread: string | null
    threadUser: string | null
    avatar: string | null
    style: string
    code: string
    view: string
    content: string | null
    _count: ContentCountAggregateOutputType | null
    _avg: ContentAvgAggregateOutputType | null
    _sum: ContentSumAggregateOutputType | null
    _min: ContentMinAggregateOutputType | null
    _max: ContentMaxAggregateOutputType | null
  }

  type GetContentGroupByPayload<T extends ContentGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ContentGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ContentGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ContentGroupByOutputType[P]>
            : GetScalarType<T[P], ContentGroupByOutputType[P]>
        }
      >
    >


  export type ContentSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    username?: boolean
    section?: boolean
    album?: boolean
    name?: boolean
    template?: boolean
    sortType?: boolean
    redirect?: boolean
    hidden?: boolean
    title?: boolean
    thumb?: boolean
    order?: boolean
    count?: boolean
    countRobot?: boolean
    commentsCount?: boolean
    commentsUpdated?: boolean
    favoritesCount?: boolean
    thread?: boolean
    threadUser?: boolean
    avatar?: boolean
    style?: boolean
    code?: boolean
    view?: boolean
    content?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["content"]>

  export type ContentSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    username?: boolean
    section?: boolean
    album?: boolean
    name?: boolean
    template?: boolean
    sortType?: boolean
    redirect?: boolean
    hidden?: boolean
    title?: boolean
    thumb?: boolean
    order?: boolean
    count?: boolean
    countRobot?: boolean
    commentsCount?: boolean
    commentsUpdated?: boolean
    favoritesCount?: boolean
    thread?: boolean
    threadUser?: boolean
    avatar?: boolean
    style?: boolean
    code?: boolean
    view?: boolean
    content?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["content"]>

  export type ContentSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    username?: boolean
    section?: boolean
    album?: boolean
    name?: boolean
    template?: boolean
    sortType?: boolean
    redirect?: boolean
    hidden?: boolean
    title?: boolean
    thumb?: boolean
    order?: boolean
    count?: boolean
    countRobot?: boolean
    commentsCount?: boolean
    commentsUpdated?: boolean
    favoritesCount?: boolean
    thread?: boolean
    threadUser?: boolean
    avatar?: boolean
    style?: boolean
    code?: boolean
    view?: boolean
    content?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["content"]>

  export type ContentSelectScalar = {
    id?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    username?: boolean
    section?: boolean
    album?: boolean
    name?: boolean
    template?: boolean
    sortType?: boolean
    redirect?: boolean
    hidden?: boolean
    title?: boolean
    thumb?: boolean
    order?: boolean
    count?: boolean
    countRobot?: boolean
    commentsCount?: boolean
    commentsUpdated?: boolean
    favoritesCount?: boolean
    thread?: boolean
    threadUser?: boolean
    avatar?: boolean
    style?: boolean
    code?: boolean
    view?: boolean
    content?: boolean
  }

  export type ContentOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "createdAt" | "updatedAt" | "username" | "section" | "album" | "name" | "template" | "sortType" | "redirect" | "hidden" | "title" | "thumb" | "order" | "count" | "countRobot" | "commentsCount" | "commentsUpdated" | "favoritesCount" | "thread" | "threadUser" | "avatar" | "style" | "code" | "view" | "content", ExtArgs["result"]["content"]>
  export type ContentInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type ContentIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type ContentIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $ContentPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Content"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      createdAt: Date | null
      updatedAt: Date | null
      username: string
      section: string
      album: string
      name: string
      template: string | null
      sortType: string | null
      redirect: number | null
      hidden: boolean
      title: string
      thumb: string
      order: number
      count: number
      countRobot: number
      commentsCount: number
      commentsUpdated: Date | null
      favoritesCount: number
      thread: string | null
      threadUser: string | null
      avatar: string | null
      style: string
      code: string
      view: string
      content: string | null
    }, ExtArgs["result"]["content"]>
    composites: {}
  }

  type ContentGetPayload<S extends boolean | null | undefined | ContentDefaultArgs> = $Result.GetResult<Prisma.$ContentPayload, S>

  type ContentCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ContentFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ContentCountAggregateInputType | true
    }

  export interface ContentDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Content'], meta: { name: 'Content' } }
    /**
     * Find zero or one Content that matches the filter.
     * @param {ContentFindUniqueArgs} args - Arguments to find a Content
     * @example
     * // Get one Content
     * const content = await prisma.content.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ContentFindUniqueArgs>(args: SelectSubset<T, ContentFindUniqueArgs<ExtArgs>>): Prisma__ContentClient<$Result.GetResult<Prisma.$ContentPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Content that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ContentFindUniqueOrThrowArgs} args - Arguments to find a Content
     * @example
     * // Get one Content
     * const content = await prisma.content.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ContentFindUniqueOrThrowArgs>(args: SelectSubset<T, ContentFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ContentClient<$Result.GetResult<Prisma.$ContentPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Content that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContentFindFirstArgs} args - Arguments to find a Content
     * @example
     * // Get one Content
     * const content = await prisma.content.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ContentFindFirstArgs>(args?: SelectSubset<T, ContentFindFirstArgs<ExtArgs>>): Prisma__ContentClient<$Result.GetResult<Prisma.$ContentPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Content that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContentFindFirstOrThrowArgs} args - Arguments to find a Content
     * @example
     * // Get one Content
     * const content = await prisma.content.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ContentFindFirstOrThrowArgs>(args?: SelectSubset<T, ContentFindFirstOrThrowArgs<ExtArgs>>): Prisma__ContentClient<$Result.GetResult<Prisma.$ContentPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Contents that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContentFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Contents
     * const contents = await prisma.content.findMany()
     * 
     * // Get first 10 Contents
     * const contents = await prisma.content.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const contentWithIdOnly = await prisma.content.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ContentFindManyArgs>(args?: SelectSubset<T, ContentFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ContentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Content.
     * @param {ContentCreateArgs} args - Arguments to create a Content.
     * @example
     * // Create one Content
     * const Content = await prisma.content.create({
     *   data: {
     *     // ... data to create a Content
     *   }
     * })
     * 
     */
    create<T extends ContentCreateArgs>(args: SelectSubset<T, ContentCreateArgs<ExtArgs>>): Prisma__ContentClient<$Result.GetResult<Prisma.$ContentPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Contents.
     * @param {ContentCreateManyArgs} args - Arguments to create many Contents.
     * @example
     * // Create many Contents
     * const content = await prisma.content.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ContentCreateManyArgs>(args?: SelectSubset<T, ContentCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Contents and returns the data saved in the database.
     * @param {ContentCreateManyAndReturnArgs} args - Arguments to create many Contents.
     * @example
     * // Create many Contents
     * const content = await prisma.content.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Contents and only return the `id`
     * const contentWithIdOnly = await prisma.content.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ContentCreateManyAndReturnArgs>(args?: SelectSubset<T, ContentCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ContentPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Content.
     * @param {ContentDeleteArgs} args - Arguments to delete one Content.
     * @example
     * // Delete one Content
     * const Content = await prisma.content.delete({
     *   where: {
     *     // ... filter to delete one Content
     *   }
     * })
     * 
     */
    delete<T extends ContentDeleteArgs>(args: SelectSubset<T, ContentDeleteArgs<ExtArgs>>): Prisma__ContentClient<$Result.GetResult<Prisma.$ContentPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Content.
     * @param {ContentUpdateArgs} args - Arguments to update one Content.
     * @example
     * // Update one Content
     * const content = await prisma.content.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ContentUpdateArgs>(args: SelectSubset<T, ContentUpdateArgs<ExtArgs>>): Prisma__ContentClient<$Result.GetResult<Prisma.$ContentPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Contents.
     * @param {ContentDeleteManyArgs} args - Arguments to filter Contents to delete.
     * @example
     * // Delete a few Contents
     * const { count } = await prisma.content.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ContentDeleteManyArgs>(args?: SelectSubset<T, ContentDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Contents.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContentUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Contents
     * const content = await prisma.content.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ContentUpdateManyArgs>(args: SelectSubset<T, ContentUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Contents and returns the data updated in the database.
     * @param {ContentUpdateManyAndReturnArgs} args - Arguments to update many Contents.
     * @example
     * // Update many Contents
     * const content = await prisma.content.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Contents and only return the `id`
     * const contentWithIdOnly = await prisma.content.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ContentUpdateManyAndReturnArgs>(args: SelectSubset<T, ContentUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ContentPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Content.
     * @param {ContentUpsertArgs} args - Arguments to update or create a Content.
     * @example
     * // Update or create a Content
     * const content = await prisma.content.upsert({
     *   create: {
     *     // ... data to create a Content
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Content we want to update
     *   }
     * })
     */
    upsert<T extends ContentUpsertArgs>(args: SelectSubset<T, ContentUpsertArgs<ExtArgs>>): Prisma__ContentClient<$Result.GetResult<Prisma.$ContentPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Contents.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContentCountArgs} args - Arguments to filter Contents to count.
     * @example
     * // Count the number of Contents
     * const count = await prisma.content.count({
     *   where: {
     *     // ... the filter for the Contents we want to count
     *   }
     * })
    **/
    count<T extends ContentCountArgs>(
      args?: Subset<T, ContentCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ContentCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Content.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContentAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends ContentAggregateArgs>(args: Subset<T, ContentAggregateArgs>): Prisma.PrismaPromise<GetContentAggregateType<T>>

    /**
     * Group by Content.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContentGroupByArgs} args - Group by arguments.
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
      T extends ContentGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ContentGroupByArgs['orderBy'] }
        : { orderBy?: ContentGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, ContentGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetContentGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Content model
   */
  readonly fields: ContentFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Content.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ContentClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
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
   * Fields of the Content model
   */
  interface ContentFieldRefs {
    readonly id: FieldRef<"Content", 'Int'>
    readonly createdAt: FieldRef<"Content", 'DateTime'>
    readonly updatedAt: FieldRef<"Content", 'DateTime'>
    readonly username: FieldRef<"Content", 'String'>
    readonly section: FieldRef<"Content", 'String'>
    readonly album: FieldRef<"Content", 'String'>
    readonly name: FieldRef<"Content", 'String'>
    readonly template: FieldRef<"Content", 'String'>
    readonly sortType: FieldRef<"Content", 'String'>
    readonly redirect: FieldRef<"Content", 'Int'>
    readonly hidden: FieldRef<"Content", 'Boolean'>
    readonly title: FieldRef<"Content", 'String'>
    readonly thumb: FieldRef<"Content", 'String'>
    readonly order: FieldRef<"Content", 'Int'>
    readonly count: FieldRef<"Content", 'Int'>
    readonly countRobot: FieldRef<"Content", 'Int'>
    readonly commentsCount: FieldRef<"Content", 'Int'>
    readonly commentsUpdated: FieldRef<"Content", 'DateTime'>
    readonly favoritesCount: FieldRef<"Content", 'Int'>
    readonly thread: FieldRef<"Content", 'String'>
    readonly threadUser: FieldRef<"Content", 'String'>
    readonly avatar: FieldRef<"Content", 'String'>
    readonly style: FieldRef<"Content", 'String'>
    readonly code: FieldRef<"Content", 'String'>
    readonly view: FieldRef<"Content", 'String'>
    readonly content: FieldRef<"Content", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Content findUnique
   */
  export type ContentFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Content
     */
    select?: ContentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Content
     */
    omit?: ContentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContentInclude<ExtArgs> | null
    /**
     * Filter, which Content to fetch.
     */
    where: ContentWhereUniqueInput
  }

  /**
   * Content findUniqueOrThrow
   */
  export type ContentFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Content
     */
    select?: ContentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Content
     */
    omit?: ContentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContentInclude<ExtArgs> | null
    /**
     * Filter, which Content to fetch.
     */
    where: ContentWhereUniqueInput
  }

  /**
   * Content findFirst
   */
  export type ContentFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Content
     */
    select?: ContentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Content
     */
    omit?: ContentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContentInclude<ExtArgs> | null
    /**
     * Filter, which Content to fetch.
     */
    where?: ContentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Contents to fetch.
     */
    orderBy?: ContentOrderByWithRelationInput | ContentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Contents.
     */
    cursor?: ContentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Contents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Contents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Contents.
     */
    distinct?: ContentScalarFieldEnum | ContentScalarFieldEnum[]
  }

  /**
   * Content findFirstOrThrow
   */
  export type ContentFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Content
     */
    select?: ContentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Content
     */
    omit?: ContentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContentInclude<ExtArgs> | null
    /**
     * Filter, which Content to fetch.
     */
    where?: ContentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Contents to fetch.
     */
    orderBy?: ContentOrderByWithRelationInput | ContentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Contents.
     */
    cursor?: ContentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Contents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Contents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Contents.
     */
    distinct?: ContentScalarFieldEnum | ContentScalarFieldEnum[]
  }

  /**
   * Content findMany
   */
  export type ContentFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Content
     */
    select?: ContentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Content
     */
    omit?: ContentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContentInclude<ExtArgs> | null
    /**
     * Filter, which Contents to fetch.
     */
    where?: ContentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Contents to fetch.
     */
    orderBy?: ContentOrderByWithRelationInput | ContentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Contents.
     */
    cursor?: ContentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Contents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Contents.
     */
    skip?: number
    distinct?: ContentScalarFieldEnum | ContentScalarFieldEnum[]
  }

  /**
   * Content create
   */
  export type ContentCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Content
     */
    select?: ContentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Content
     */
    omit?: ContentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContentInclude<ExtArgs> | null
    /**
     * The data needed to create a Content.
     */
    data: XOR<ContentCreateInput, ContentUncheckedCreateInput>
  }

  /**
   * Content createMany
   */
  export type ContentCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Contents.
     */
    data: ContentCreateManyInput | ContentCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Content createManyAndReturn
   */
  export type ContentCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Content
     */
    select?: ContentSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Content
     */
    omit?: ContentOmit<ExtArgs> | null
    /**
     * The data used to create many Contents.
     */
    data: ContentCreateManyInput | ContentCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContentIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Content update
   */
  export type ContentUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Content
     */
    select?: ContentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Content
     */
    omit?: ContentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContentInclude<ExtArgs> | null
    /**
     * The data needed to update a Content.
     */
    data: XOR<ContentUpdateInput, ContentUncheckedUpdateInput>
    /**
     * Choose, which Content to update.
     */
    where: ContentWhereUniqueInput
  }

  /**
   * Content updateMany
   */
  export type ContentUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Contents.
     */
    data: XOR<ContentUpdateManyMutationInput, ContentUncheckedUpdateManyInput>
    /**
     * Filter which Contents to update
     */
    where?: ContentWhereInput
    /**
     * Limit how many Contents to update.
     */
    limit?: number
  }

  /**
   * Content updateManyAndReturn
   */
  export type ContentUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Content
     */
    select?: ContentSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Content
     */
    omit?: ContentOmit<ExtArgs> | null
    /**
     * The data used to update Contents.
     */
    data: XOR<ContentUpdateManyMutationInput, ContentUncheckedUpdateManyInput>
    /**
     * Filter which Contents to update
     */
    where?: ContentWhereInput
    /**
     * Limit how many Contents to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContentIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Content upsert
   */
  export type ContentUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Content
     */
    select?: ContentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Content
     */
    omit?: ContentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContentInclude<ExtArgs> | null
    /**
     * The filter to search for the Content to update in case it exists.
     */
    where: ContentWhereUniqueInput
    /**
     * In case the Content found by the `where` argument doesn't exist, create a new Content with this data.
     */
    create: XOR<ContentCreateInput, ContentUncheckedCreateInput>
    /**
     * In case the Content was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ContentUpdateInput, ContentUncheckedUpdateInput>
  }

  /**
   * Content delete
   */
  export type ContentDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Content
     */
    select?: ContentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Content
     */
    omit?: ContentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContentInclude<ExtArgs> | null
    /**
     * Filter which Content to delete.
     */
    where: ContentWhereUniqueInput
  }

  /**
   * Content deleteMany
   */
  export type ContentDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Contents to delete
     */
    where?: ContentWhereInput
    /**
     * Limit how many Contents to delete.
     */
    limit?: number
  }

  /**
   * Content without action
   */
  export type ContentDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Content
     */
    select?: ContentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Content
     */
    omit?: ContentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContentInclude<ExtArgs> | null
  }


  /**
   * Model ContentRemote
   */

  export type AggregateContentRemote = {
    _count: ContentRemoteCountAggregateOutputType | null
    _avg: ContentRemoteAvgAggregateOutputType | null
    _sum: ContentRemoteSumAggregateOutputType | null
    _min: ContentRemoteMinAggregateOutputType | null
    _max: ContentRemoteMaxAggregateOutputType | null
  }

  export type ContentRemoteAvgAggregateOutputType = {
    id: number | null
    commentsCount: number | null
  }

  export type ContentRemoteSumAggregateOutputType = {
    id: number | null
    commentsCount: number | null
  }

  export type ContentRemoteMinAggregateOutputType = {
    id: number | null
    createdAt: Date | null
    updatedAt: Date | null
    toUsername: string | null
    localContentName: string | null
    fromUsername: string | null
    fromUserRemoteId: string | null
    commentUser: string | null
    username: string | null
    creator: string | null
    avatar: string | null
    title: string | null
    postId: string | null
    link: string | null
    commentsUpdated: Date | null
    commentsCount: number | null
    thread: string | null
    type: string | null
    favorited: boolean | null
    read: boolean | null
    isSpam: boolean | null
    deleted: boolean | null
    view: string | null
    content: string | null
  }

  export type ContentRemoteMaxAggregateOutputType = {
    id: number | null
    createdAt: Date | null
    updatedAt: Date | null
    toUsername: string | null
    localContentName: string | null
    fromUsername: string | null
    fromUserRemoteId: string | null
    commentUser: string | null
    username: string | null
    creator: string | null
    avatar: string | null
    title: string | null
    postId: string | null
    link: string | null
    commentsUpdated: Date | null
    commentsCount: number | null
    thread: string | null
    type: string | null
    favorited: boolean | null
    read: boolean | null
    isSpam: boolean | null
    deleted: boolean | null
    view: string | null
    content: string | null
  }

  export type ContentRemoteCountAggregateOutputType = {
    id: number
    createdAt: number
    updatedAt: number
    toUsername: number
    localContentName: number
    fromUsername: number
    fromUserRemoteId: number
    commentUser: number
    username: number
    creator: number
    avatar: number
    title: number
    postId: number
    link: number
    commentsUpdated: number
    commentsCount: number
    thread: number
    type: number
    favorited: number
    read: number
    isSpam: number
    deleted: number
    view: number
    content: number
    _all: number
  }


  export type ContentRemoteAvgAggregateInputType = {
    id?: true
    commentsCount?: true
  }

  export type ContentRemoteSumAggregateInputType = {
    id?: true
    commentsCount?: true
  }

  export type ContentRemoteMinAggregateInputType = {
    id?: true
    createdAt?: true
    updatedAt?: true
    toUsername?: true
    localContentName?: true
    fromUsername?: true
    fromUserRemoteId?: true
    commentUser?: true
    username?: true
    creator?: true
    avatar?: true
    title?: true
    postId?: true
    link?: true
    commentsUpdated?: true
    commentsCount?: true
    thread?: true
    type?: true
    favorited?: true
    read?: true
    isSpam?: true
    deleted?: true
    view?: true
    content?: true
  }

  export type ContentRemoteMaxAggregateInputType = {
    id?: true
    createdAt?: true
    updatedAt?: true
    toUsername?: true
    localContentName?: true
    fromUsername?: true
    fromUserRemoteId?: true
    commentUser?: true
    username?: true
    creator?: true
    avatar?: true
    title?: true
    postId?: true
    link?: true
    commentsUpdated?: true
    commentsCount?: true
    thread?: true
    type?: true
    favorited?: true
    read?: true
    isSpam?: true
    deleted?: true
    view?: true
    content?: true
  }

  export type ContentRemoteCountAggregateInputType = {
    id?: true
    createdAt?: true
    updatedAt?: true
    toUsername?: true
    localContentName?: true
    fromUsername?: true
    fromUserRemoteId?: true
    commentUser?: true
    username?: true
    creator?: true
    avatar?: true
    title?: true
    postId?: true
    link?: true
    commentsUpdated?: true
    commentsCount?: true
    thread?: true
    type?: true
    favorited?: true
    read?: true
    isSpam?: true
    deleted?: true
    view?: true
    content?: true
    _all?: true
  }

  export type ContentRemoteAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ContentRemote to aggregate.
     */
    where?: ContentRemoteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ContentRemotes to fetch.
     */
    orderBy?: ContentRemoteOrderByWithRelationInput | ContentRemoteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ContentRemoteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ContentRemotes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ContentRemotes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ContentRemotes
    **/
    _count?: true | ContentRemoteCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ContentRemoteAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ContentRemoteSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ContentRemoteMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ContentRemoteMaxAggregateInputType
  }

  export type GetContentRemoteAggregateType<T extends ContentRemoteAggregateArgs> = {
        [P in keyof T & keyof AggregateContentRemote]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateContentRemote[P]>
      : GetScalarType<T[P], AggregateContentRemote[P]>
  }




  export type ContentRemoteGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ContentRemoteWhereInput
    orderBy?: ContentRemoteOrderByWithAggregationInput | ContentRemoteOrderByWithAggregationInput[]
    by: ContentRemoteScalarFieldEnum[] | ContentRemoteScalarFieldEnum
    having?: ContentRemoteScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ContentRemoteCountAggregateInputType | true
    _avg?: ContentRemoteAvgAggregateInputType
    _sum?: ContentRemoteSumAggregateInputType
    _min?: ContentRemoteMinAggregateInputType
    _max?: ContentRemoteMaxAggregateInputType
  }

  export type ContentRemoteGroupByOutputType = {
    id: number
    createdAt: Date | null
    updatedAt: Date | null
    toUsername: string
    localContentName: string | null
    fromUsername: string | null
    fromUserRemoteId: string | null
    commentUser: string | null
    username: string
    creator: string | null
    avatar: string | null
    title: string
    postId: string
    link: string
    commentsUpdated: Date | null
    commentsCount: number
    thread: string | null
    type: string
    favorited: boolean
    read: boolean
    isSpam: boolean
    deleted: boolean
    view: string
    content: string | null
    _count: ContentRemoteCountAggregateOutputType | null
    _avg: ContentRemoteAvgAggregateOutputType | null
    _sum: ContentRemoteSumAggregateOutputType | null
    _min: ContentRemoteMinAggregateOutputType | null
    _max: ContentRemoteMaxAggregateOutputType | null
  }

  type GetContentRemoteGroupByPayload<T extends ContentRemoteGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ContentRemoteGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ContentRemoteGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ContentRemoteGroupByOutputType[P]>
            : GetScalarType<T[P], ContentRemoteGroupByOutputType[P]>
        }
      >
    >


  export type ContentRemoteSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    toUsername?: boolean
    localContentName?: boolean
    fromUsername?: boolean
    fromUserRemoteId?: boolean
    commentUser?: boolean
    username?: boolean
    creator?: boolean
    avatar?: boolean
    title?: boolean
    postId?: boolean
    link?: boolean
    commentsUpdated?: boolean
    commentsCount?: boolean
    thread?: boolean
    type?: boolean
    favorited?: boolean
    read?: boolean
    isSpam?: boolean
    deleted?: boolean
    view?: boolean
    content?: boolean
    toUser?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["contentRemote"]>

  export type ContentRemoteSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    toUsername?: boolean
    localContentName?: boolean
    fromUsername?: boolean
    fromUserRemoteId?: boolean
    commentUser?: boolean
    username?: boolean
    creator?: boolean
    avatar?: boolean
    title?: boolean
    postId?: boolean
    link?: boolean
    commentsUpdated?: boolean
    commentsCount?: boolean
    thread?: boolean
    type?: boolean
    favorited?: boolean
    read?: boolean
    isSpam?: boolean
    deleted?: boolean
    view?: boolean
    content?: boolean
    toUser?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["contentRemote"]>

  export type ContentRemoteSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    toUsername?: boolean
    localContentName?: boolean
    fromUsername?: boolean
    fromUserRemoteId?: boolean
    commentUser?: boolean
    username?: boolean
    creator?: boolean
    avatar?: boolean
    title?: boolean
    postId?: boolean
    link?: boolean
    commentsUpdated?: boolean
    commentsCount?: boolean
    thread?: boolean
    type?: boolean
    favorited?: boolean
    read?: boolean
    isSpam?: boolean
    deleted?: boolean
    view?: boolean
    content?: boolean
    toUser?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["contentRemote"]>

  export type ContentRemoteSelectScalar = {
    id?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    toUsername?: boolean
    localContentName?: boolean
    fromUsername?: boolean
    fromUserRemoteId?: boolean
    commentUser?: boolean
    username?: boolean
    creator?: boolean
    avatar?: boolean
    title?: boolean
    postId?: boolean
    link?: boolean
    commentsUpdated?: boolean
    commentsCount?: boolean
    thread?: boolean
    type?: boolean
    favorited?: boolean
    read?: boolean
    isSpam?: boolean
    deleted?: boolean
    view?: boolean
    content?: boolean
  }

  export type ContentRemoteOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "createdAt" | "updatedAt" | "toUsername" | "localContentName" | "fromUsername" | "fromUserRemoteId" | "commentUser" | "username" | "creator" | "avatar" | "title" | "postId" | "link" | "commentsUpdated" | "commentsCount" | "thread" | "type" | "favorited" | "read" | "isSpam" | "deleted" | "view" | "content", ExtArgs["result"]["contentRemote"]>
  export type ContentRemoteInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    toUser?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type ContentRemoteIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    toUser?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type ContentRemoteIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    toUser?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $ContentRemotePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ContentRemote"
    objects: {
      toUser: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      createdAt: Date | null
      updatedAt: Date | null
      toUsername: string
      localContentName: string | null
      fromUsername: string | null
      fromUserRemoteId: string | null
      commentUser: string | null
      username: string
      creator: string | null
      avatar: string | null
      title: string
      postId: string
      link: string
      commentsUpdated: Date | null
      commentsCount: number
      thread: string | null
      type: string
      favorited: boolean
      read: boolean
      isSpam: boolean
      deleted: boolean
      view: string
      content: string | null
    }, ExtArgs["result"]["contentRemote"]>
    composites: {}
  }

  type ContentRemoteGetPayload<S extends boolean | null | undefined | ContentRemoteDefaultArgs> = $Result.GetResult<Prisma.$ContentRemotePayload, S>

  type ContentRemoteCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ContentRemoteFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ContentRemoteCountAggregateInputType | true
    }

  export interface ContentRemoteDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ContentRemote'], meta: { name: 'ContentRemote' } }
    /**
     * Find zero or one ContentRemote that matches the filter.
     * @param {ContentRemoteFindUniqueArgs} args - Arguments to find a ContentRemote
     * @example
     * // Get one ContentRemote
     * const contentRemote = await prisma.contentRemote.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ContentRemoteFindUniqueArgs>(args: SelectSubset<T, ContentRemoteFindUniqueArgs<ExtArgs>>): Prisma__ContentRemoteClient<$Result.GetResult<Prisma.$ContentRemotePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ContentRemote that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ContentRemoteFindUniqueOrThrowArgs} args - Arguments to find a ContentRemote
     * @example
     * // Get one ContentRemote
     * const contentRemote = await prisma.contentRemote.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ContentRemoteFindUniqueOrThrowArgs>(args: SelectSubset<T, ContentRemoteFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ContentRemoteClient<$Result.GetResult<Prisma.$ContentRemotePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ContentRemote that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContentRemoteFindFirstArgs} args - Arguments to find a ContentRemote
     * @example
     * // Get one ContentRemote
     * const contentRemote = await prisma.contentRemote.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ContentRemoteFindFirstArgs>(args?: SelectSubset<T, ContentRemoteFindFirstArgs<ExtArgs>>): Prisma__ContentRemoteClient<$Result.GetResult<Prisma.$ContentRemotePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ContentRemote that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContentRemoteFindFirstOrThrowArgs} args - Arguments to find a ContentRemote
     * @example
     * // Get one ContentRemote
     * const contentRemote = await prisma.contentRemote.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ContentRemoteFindFirstOrThrowArgs>(args?: SelectSubset<T, ContentRemoteFindFirstOrThrowArgs<ExtArgs>>): Prisma__ContentRemoteClient<$Result.GetResult<Prisma.$ContentRemotePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ContentRemotes that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContentRemoteFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ContentRemotes
     * const contentRemotes = await prisma.contentRemote.findMany()
     * 
     * // Get first 10 ContentRemotes
     * const contentRemotes = await prisma.contentRemote.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const contentRemoteWithIdOnly = await prisma.contentRemote.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ContentRemoteFindManyArgs>(args?: SelectSubset<T, ContentRemoteFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ContentRemotePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ContentRemote.
     * @param {ContentRemoteCreateArgs} args - Arguments to create a ContentRemote.
     * @example
     * // Create one ContentRemote
     * const ContentRemote = await prisma.contentRemote.create({
     *   data: {
     *     // ... data to create a ContentRemote
     *   }
     * })
     * 
     */
    create<T extends ContentRemoteCreateArgs>(args: SelectSubset<T, ContentRemoteCreateArgs<ExtArgs>>): Prisma__ContentRemoteClient<$Result.GetResult<Prisma.$ContentRemotePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ContentRemotes.
     * @param {ContentRemoteCreateManyArgs} args - Arguments to create many ContentRemotes.
     * @example
     * // Create many ContentRemotes
     * const contentRemote = await prisma.contentRemote.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ContentRemoteCreateManyArgs>(args?: SelectSubset<T, ContentRemoteCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ContentRemotes and returns the data saved in the database.
     * @param {ContentRemoteCreateManyAndReturnArgs} args - Arguments to create many ContentRemotes.
     * @example
     * // Create many ContentRemotes
     * const contentRemote = await prisma.contentRemote.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ContentRemotes and only return the `id`
     * const contentRemoteWithIdOnly = await prisma.contentRemote.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ContentRemoteCreateManyAndReturnArgs>(args?: SelectSubset<T, ContentRemoteCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ContentRemotePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ContentRemote.
     * @param {ContentRemoteDeleteArgs} args - Arguments to delete one ContentRemote.
     * @example
     * // Delete one ContentRemote
     * const ContentRemote = await prisma.contentRemote.delete({
     *   where: {
     *     // ... filter to delete one ContentRemote
     *   }
     * })
     * 
     */
    delete<T extends ContentRemoteDeleteArgs>(args: SelectSubset<T, ContentRemoteDeleteArgs<ExtArgs>>): Prisma__ContentRemoteClient<$Result.GetResult<Prisma.$ContentRemotePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ContentRemote.
     * @param {ContentRemoteUpdateArgs} args - Arguments to update one ContentRemote.
     * @example
     * // Update one ContentRemote
     * const contentRemote = await prisma.contentRemote.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ContentRemoteUpdateArgs>(args: SelectSubset<T, ContentRemoteUpdateArgs<ExtArgs>>): Prisma__ContentRemoteClient<$Result.GetResult<Prisma.$ContentRemotePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ContentRemotes.
     * @param {ContentRemoteDeleteManyArgs} args - Arguments to filter ContentRemotes to delete.
     * @example
     * // Delete a few ContentRemotes
     * const { count } = await prisma.contentRemote.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ContentRemoteDeleteManyArgs>(args?: SelectSubset<T, ContentRemoteDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ContentRemotes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContentRemoteUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ContentRemotes
     * const contentRemote = await prisma.contentRemote.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ContentRemoteUpdateManyArgs>(args: SelectSubset<T, ContentRemoteUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ContentRemotes and returns the data updated in the database.
     * @param {ContentRemoteUpdateManyAndReturnArgs} args - Arguments to update many ContentRemotes.
     * @example
     * // Update many ContentRemotes
     * const contentRemote = await prisma.contentRemote.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ContentRemotes and only return the `id`
     * const contentRemoteWithIdOnly = await prisma.contentRemote.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ContentRemoteUpdateManyAndReturnArgs>(args: SelectSubset<T, ContentRemoteUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ContentRemotePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ContentRemote.
     * @param {ContentRemoteUpsertArgs} args - Arguments to update or create a ContentRemote.
     * @example
     * // Update or create a ContentRemote
     * const contentRemote = await prisma.contentRemote.upsert({
     *   create: {
     *     // ... data to create a ContentRemote
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ContentRemote we want to update
     *   }
     * })
     */
    upsert<T extends ContentRemoteUpsertArgs>(args: SelectSubset<T, ContentRemoteUpsertArgs<ExtArgs>>): Prisma__ContentRemoteClient<$Result.GetResult<Prisma.$ContentRemotePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ContentRemotes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContentRemoteCountArgs} args - Arguments to filter ContentRemotes to count.
     * @example
     * // Count the number of ContentRemotes
     * const count = await prisma.contentRemote.count({
     *   where: {
     *     // ... the filter for the ContentRemotes we want to count
     *   }
     * })
    **/
    count<T extends ContentRemoteCountArgs>(
      args?: Subset<T, ContentRemoteCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ContentRemoteCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ContentRemote.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContentRemoteAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends ContentRemoteAggregateArgs>(args: Subset<T, ContentRemoteAggregateArgs>): Prisma.PrismaPromise<GetContentRemoteAggregateType<T>>

    /**
     * Group by ContentRemote.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContentRemoteGroupByArgs} args - Group by arguments.
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
      T extends ContentRemoteGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ContentRemoteGroupByArgs['orderBy'] }
        : { orderBy?: ContentRemoteGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, ContentRemoteGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetContentRemoteGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ContentRemote model
   */
  readonly fields: ContentRemoteFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ContentRemote.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ContentRemoteClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    toUser<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
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
   * Fields of the ContentRemote model
   */
  interface ContentRemoteFieldRefs {
    readonly id: FieldRef<"ContentRemote", 'Int'>
    readonly createdAt: FieldRef<"ContentRemote", 'DateTime'>
    readonly updatedAt: FieldRef<"ContentRemote", 'DateTime'>
    readonly toUsername: FieldRef<"ContentRemote", 'String'>
    readonly localContentName: FieldRef<"ContentRemote", 'String'>
    readonly fromUsername: FieldRef<"ContentRemote", 'String'>
    readonly fromUserRemoteId: FieldRef<"ContentRemote", 'String'>
    readonly commentUser: FieldRef<"ContentRemote", 'String'>
    readonly username: FieldRef<"ContentRemote", 'String'>
    readonly creator: FieldRef<"ContentRemote", 'String'>
    readonly avatar: FieldRef<"ContentRemote", 'String'>
    readonly title: FieldRef<"ContentRemote", 'String'>
    readonly postId: FieldRef<"ContentRemote", 'String'>
    readonly link: FieldRef<"ContentRemote", 'String'>
    readonly commentsUpdated: FieldRef<"ContentRemote", 'DateTime'>
    readonly commentsCount: FieldRef<"ContentRemote", 'Int'>
    readonly thread: FieldRef<"ContentRemote", 'String'>
    readonly type: FieldRef<"ContentRemote", 'String'>
    readonly favorited: FieldRef<"ContentRemote", 'Boolean'>
    readonly read: FieldRef<"ContentRemote", 'Boolean'>
    readonly isSpam: FieldRef<"ContentRemote", 'Boolean'>
    readonly deleted: FieldRef<"ContentRemote", 'Boolean'>
    readonly view: FieldRef<"ContentRemote", 'String'>
    readonly content: FieldRef<"ContentRemote", 'String'>
  }
    

  // Custom InputTypes
  /**
   * ContentRemote findUnique
   */
  export type ContentRemoteFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContentRemote
     */
    select?: ContentRemoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ContentRemote
     */
    omit?: ContentRemoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContentRemoteInclude<ExtArgs> | null
    /**
     * Filter, which ContentRemote to fetch.
     */
    where: ContentRemoteWhereUniqueInput
  }

  /**
   * ContentRemote findUniqueOrThrow
   */
  export type ContentRemoteFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContentRemote
     */
    select?: ContentRemoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ContentRemote
     */
    omit?: ContentRemoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContentRemoteInclude<ExtArgs> | null
    /**
     * Filter, which ContentRemote to fetch.
     */
    where: ContentRemoteWhereUniqueInput
  }

  /**
   * ContentRemote findFirst
   */
  export type ContentRemoteFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContentRemote
     */
    select?: ContentRemoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ContentRemote
     */
    omit?: ContentRemoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContentRemoteInclude<ExtArgs> | null
    /**
     * Filter, which ContentRemote to fetch.
     */
    where?: ContentRemoteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ContentRemotes to fetch.
     */
    orderBy?: ContentRemoteOrderByWithRelationInput | ContentRemoteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ContentRemotes.
     */
    cursor?: ContentRemoteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ContentRemotes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ContentRemotes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ContentRemotes.
     */
    distinct?: ContentRemoteScalarFieldEnum | ContentRemoteScalarFieldEnum[]
  }

  /**
   * ContentRemote findFirstOrThrow
   */
  export type ContentRemoteFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContentRemote
     */
    select?: ContentRemoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ContentRemote
     */
    omit?: ContentRemoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContentRemoteInclude<ExtArgs> | null
    /**
     * Filter, which ContentRemote to fetch.
     */
    where?: ContentRemoteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ContentRemotes to fetch.
     */
    orderBy?: ContentRemoteOrderByWithRelationInput | ContentRemoteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ContentRemotes.
     */
    cursor?: ContentRemoteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ContentRemotes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ContentRemotes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ContentRemotes.
     */
    distinct?: ContentRemoteScalarFieldEnum | ContentRemoteScalarFieldEnum[]
  }

  /**
   * ContentRemote findMany
   */
  export type ContentRemoteFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContentRemote
     */
    select?: ContentRemoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ContentRemote
     */
    omit?: ContentRemoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContentRemoteInclude<ExtArgs> | null
    /**
     * Filter, which ContentRemotes to fetch.
     */
    where?: ContentRemoteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ContentRemotes to fetch.
     */
    orderBy?: ContentRemoteOrderByWithRelationInput | ContentRemoteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ContentRemotes.
     */
    cursor?: ContentRemoteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ContentRemotes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ContentRemotes.
     */
    skip?: number
    distinct?: ContentRemoteScalarFieldEnum | ContentRemoteScalarFieldEnum[]
  }

  /**
   * ContentRemote create
   */
  export type ContentRemoteCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContentRemote
     */
    select?: ContentRemoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ContentRemote
     */
    omit?: ContentRemoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContentRemoteInclude<ExtArgs> | null
    /**
     * The data needed to create a ContentRemote.
     */
    data: XOR<ContentRemoteCreateInput, ContentRemoteUncheckedCreateInput>
  }

  /**
   * ContentRemote createMany
   */
  export type ContentRemoteCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ContentRemotes.
     */
    data: ContentRemoteCreateManyInput | ContentRemoteCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ContentRemote createManyAndReturn
   */
  export type ContentRemoteCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContentRemote
     */
    select?: ContentRemoteSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ContentRemote
     */
    omit?: ContentRemoteOmit<ExtArgs> | null
    /**
     * The data used to create many ContentRemotes.
     */
    data: ContentRemoteCreateManyInput | ContentRemoteCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContentRemoteIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * ContentRemote update
   */
  export type ContentRemoteUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContentRemote
     */
    select?: ContentRemoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ContentRemote
     */
    omit?: ContentRemoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContentRemoteInclude<ExtArgs> | null
    /**
     * The data needed to update a ContentRemote.
     */
    data: XOR<ContentRemoteUpdateInput, ContentRemoteUncheckedUpdateInput>
    /**
     * Choose, which ContentRemote to update.
     */
    where: ContentRemoteWhereUniqueInput
  }

  /**
   * ContentRemote updateMany
   */
  export type ContentRemoteUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ContentRemotes.
     */
    data: XOR<ContentRemoteUpdateManyMutationInput, ContentRemoteUncheckedUpdateManyInput>
    /**
     * Filter which ContentRemotes to update
     */
    where?: ContentRemoteWhereInput
    /**
     * Limit how many ContentRemotes to update.
     */
    limit?: number
  }

  /**
   * ContentRemote updateManyAndReturn
   */
  export type ContentRemoteUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContentRemote
     */
    select?: ContentRemoteSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ContentRemote
     */
    omit?: ContentRemoteOmit<ExtArgs> | null
    /**
     * The data used to update ContentRemotes.
     */
    data: XOR<ContentRemoteUpdateManyMutationInput, ContentRemoteUncheckedUpdateManyInput>
    /**
     * Filter which ContentRemotes to update
     */
    where?: ContentRemoteWhereInput
    /**
     * Limit how many ContentRemotes to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContentRemoteIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * ContentRemote upsert
   */
  export type ContentRemoteUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContentRemote
     */
    select?: ContentRemoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ContentRemote
     */
    omit?: ContentRemoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContentRemoteInclude<ExtArgs> | null
    /**
     * The filter to search for the ContentRemote to update in case it exists.
     */
    where: ContentRemoteWhereUniqueInput
    /**
     * In case the ContentRemote found by the `where` argument doesn't exist, create a new ContentRemote with this data.
     */
    create: XOR<ContentRemoteCreateInput, ContentRemoteUncheckedCreateInput>
    /**
     * In case the ContentRemote was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ContentRemoteUpdateInput, ContentRemoteUncheckedUpdateInput>
  }

  /**
   * ContentRemote delete
   */
  export type ContentRemoteDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContentRemote
     */
    select?: ContentRemoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ContentRemote
     */
    omit?: ContentRemoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContentRemoteInclude<ExtArgs> | null
    /**
     * Filter which ContentRemote to delete.
     */
    where: ContentRemoteWhereUniqueInput
  }

  /**
   * ContentRemote deleteMany
   */
  export type ContentRemoteDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ContentRemotes to delete
     */
    where?: ContentRemoteWhereInput
    /**
     * Limit how many ContentRemotes to delete.
     */
    limit?: number
  }

  /**
   * ContentRemote without action
   */
  export type ContentRemoteDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContentRemote
     */
    select?: ContentRemoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ContentRemote
     */
    omit?: ContentRemoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContentRemoteInclude<ExtArgs> | null
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


  export const UserScalarFieldEnum: {
    id: 'id',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    username: 'username',
    name: 'name',
    email: 'email',
    superuser: 'superuser',
    title: 'title',
    description: 'description',
    hostname: 'hostname',
    license: 'license',
    googleAnalytics: 'googleAnalytics',
    favicon: 'favicon',
    logo: 'logo',
    viewport: 'viewport',
    sidebarHtml: 'sidebarHtml',
    theme: 'theme',
    magicKey: 'magicKey',
    privateKey: 'privateKey'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const UserRemoteScalarFieldEnum: {
    id: 'id',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    localUsername: 'localUsername',
    username: 'username',
    name: 'name',
    profileUrl: 'profileUrl',
    feedUrl: 'feedUrl',
    magicKey: 'magicKey',
    salmonUrl: 'salmonUrl',
    activityPubActorUrl: 'activityPubActorUrl',
    activityPubInboxUrl: 'activityPubInboxUrl',
    webmentionUrl: 'webmentionUrl',
    hubUrl: 'hubUrl',
    follower: 'follower',
    following: 'following',
    avatar: 'avatar',
    favicon: 'favicon',
    order: 'order',
    sortType: 'sortType'
  };

  export type UserRemoteScalarFieldEnum = (typeof UserRemoteScalarFieldEnum)[keyof typeof UserRemoteScalarFieldEnum]


  export const ContentScalarFieldEnum: {
    id: 'id',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    username: 'username',
    section: 'section',
    album: 'album',
    name: 'name',
    template: 'template',
    sortType: 'sortType',
    redirect: 'redirect',
    hidden: 'hidden',
    title: 'title',
    thumb: 'thumb',
    order: 'order',
    count: 'count',
    countRobot: 'countRobot',
    commentsCount: 'commentsCount',
    commentsUpdated: 'commentsUpdated',
    favoritesCount: 'favoritesCount',
    thread: 'thread',
    threadUser: 'threadUser',
    avatar: 'avatar',
    style: 'style',
    code: 'code',
    view: 'view',
    content: 'content'
  };

  export type ContentScalarFieldEnum = (typeof ContentScalarFieldEnum)[keyof typeof ContentScalarFieldEnum]


  export const ContentRemoteScalarFieldEnum: {
    id: 'id',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    toUsername: 'toUsername',
    localContentName: 'localContentName',
    fromUsername: 'fromUsername',
    fromUserRemoteId: 'fromUserRemoteId',
    commentUser: 'commentUser',
    username: 'username',
    creator: 'creator',
    avatar: 'avatar',
    title: 'title',
    postId: 'postId',
    link: 'link',
    commentsUpdated: 'commentsUpdated',
    commentsCount: 'commentsCount',
    thread: 'thread',
    type: 'type',
    favorited: 'favorited',
    read: 'read',
    isSpam: 'isSpam',
    deleted: 'deleted',
    view: 'view',
    content: 'content'
  };

  export type ContentRemoteScalarFieldEnum = (typeof ContentRemoteScalarFieldEnum)[keyof typeof ContentRemoteScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: IntFilter<"User"> | number
    createdAt?: DateTimeNullableFilter<"User"> | Date | string | null
    updatedAt?: DateTimeNullableFilter<"User"> | Date | string | null
    username?: StringFilter<"User"> | string
    name?: StringFilter<"User"> | string
    email?: StringFilter<"User"> | string
    superuser?: BoolFilter<"User"> | boolean
    title?: StringFilter<"User"> | string
    description?: StringNullableFilter<"User"> | string | null
    hostname?: StringNullableFilter<"User"> | string | null
    license?: StringNullableFilter<"User"> | string | null
    googleAnalytics?: StringNullableFilter<"User"> | string | null
    favicon?: StringNullableFilter<"User"> | string | null
    logo?: StringNullableFilter<"User"> | string | null
    viewport?: StringNullableFilter<"User"> | string | null
    sidebarHtml?: StringNullableFilter<"User"> | string | null
    theme?: StringFilter<"User"> | string
    magicKey?: StringFilter<"User"> | string
    privateKey?: StringFilter<"User"> | string
    Content?: ContentListRelationFilter
    ContentRemote?: ContentRemoteListRelationFilter
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    createdAt?: SortOrderInput | SortOrder
    updatedAt?: SortOrderInput | SortOrder
    username?: SortOrder
    name?: SortOrder
    email?: SortOrder
    superuser?: SortOrder
    title?: SortOrder
    description?: SortOrderInput | SortOrder
    hostname?: SortOrderInput | SortOrder
    license?: SortOrderInput | SortOrder
    googleAnalytics?: SortOrderInput | SortOrder
    favicon?: SortOrderInput | SortOrder
    logo?: SortOrderInput | SortOrder
    viewport?: SortOrderInput | SortOrder
    sidebarHtml?: SortOrderInput | SortOrder
    theme?: SortOrder
    magicKey?: SortOrder
    privateKey?: SortOrder
    Content?: ContentOrderByRelationAggregateInput
    ContentRemote?: ContentRemoteOrderByRelationAggregateInput
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    username?: string
    email?: string
    hostname?: string
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    createdAt?: DateTimeNullableFilter<"User"> | Date | string | null
    updatedAt?: DateTimeNullableFilter<"User"> | Date | string | null
    name?: StringFilter<"User"> | string
    superuser?: BoolFilter<"User"> | boolean
    title?: StringFilter<"User"> | string
    description?: StringNullableFilter<"User"> | string | null
    license?: StringNullableFilter<"User"> | string | null
    googleAnalytics?: StringNullableFilter<"User"> | string | null
    favicon?: StringNullableFilter<"User"> | string | null
    logo?: StringNullableFilter<"User"> | string | null
    viewport?: StringNullableFilter<"User"> | string | null
    sidebarHtml?: StringNullableFilter<"User"> | string | null
    theme?: StringFilter<"User"> | string
    magicKey?: StringFilter<"User"> | string
    privateKey?: StringFilter<"User"> | string
    Content?: ContentListRelationFilter
    ContentRemote?: ContentRemoteListRelationFilter
  }, "id" | "username" | "email" | "hostname">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    createdAt?: SortOrderInput | SortOrder
    updatedAt?: SortOrderInput | SortOrder
    username?: SortOrder
    name?: SortOrder
    email?: SortOrder
    superuser?: SortOrder
    title?: SortOrder
    description?: SortOrderInput | SortOrder
    hostname?: SortOrderInput | SortOrder
    license?: SortOrderInput | SortOrder
    googleAnalytics?: SortOrderInput | SortOrder
    favicon?: SortOrderInput | SortOrder
    logo?: SortOrderInput | SortOrder
    viewport?: SortOrderInput | SortOrder
    sidebarHtml?: SortOrderInput | SortOrder
    theme?: SortOrder
    magicKey?: SortOrder
    privateKey?: SortOrder
    _count?: UserCountOrderByAggregateInput
    _avg?: UserAvgOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
    _sum?: UserSumOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"User"> | number
    createdAt?: DateTimeNullableWithAggregatesFilter<"User"> | Date | string | null
    updatedAt?: DateTimeNullableWithAggregatesFilter<"User"> | Date | string | null
    username?: StringWithAggregatesFilter<"User"> | string
    name?: StringWithAggregatesFilter<"User"> | string
    email?: StringWithAggregatesFilter<"User"> | string
    superuser?: BoolWithAggregatesFilter<"User"> | boolean
    title?: StringWithAggregatesFilter<"User"> | string
    description?: StringNullableWithAggregatesFilter<"User"> | string | null
    hostname?: StringNullableWithAggregatesFilter<"User"> | string | null
    license?: StringNullableWithAggregatesFilter<"User"> | string | null
    googleAnalytics?: StringNullableWithAggregatesFilter<"User"> | string | null
    favicon?: StringNullableWithAggregatesFilter<"User"> | string | null
    logo?: StringNullableWithAggregatesFilter<"User"> | string | null
    viewport?: StringNullableWithAggregatesFilter<"User"> | string | null
    sidebarHtml?: StringNullableWithAggregatesFilter<"User"> | string | null
    theme?: StringWithAggregatesFilter<"User"> | string
    magicKey?: StringWithAggregatesFilter<"User"> | string
    privateKey?: StringWithAggregatesFilter<"User"> | string
  }

  export type UserRemoteWhereInput = {
    AND?: UserRemoteWhereInput | UserRemoteWhereInput[]
    OR?: UserRemoteWhereInput[]
    NOT?: UserRemoteWhereInput | UserRemoteWhereInput[]
    id?: IntFilter<"UserRemote"> | number
    createdAt?: DateTimeNullableFilter<"UserRemote"> | Date | string | null
    updatedAt?: DateTimeNullableFilter<"UserRemote"> | Date | string | null
    localUsername?: StringFilter<"UserRemote"> | string
    username?: StringFilter<"UserRemote"> | string
    name?: StringFilter<"UserRemote"> | string
    profileUrl?: StringFilter<"UserRemote"> | string
    feedUrl?: StringFilter<"UserRemote"> | string
    magicKey?: StringNullableFilter<"UserRemote"> | string | null
    salmonUrl?: StringNullableFilter<"UserRemote"> | string | null
    activityPubActorUrl?: StringNullableFilter<"UserRemote"> | string | null
    activityPubInboxUrl?: StringNullableFilter<"UserRemote"> | string | null
    webmentionUrl?: StringNullableFilter<"UserRemote"> | string | null
    hubUrl?: StringNullableFilter<"UserRemote"> | string | null
    follower?: BoolFilter<"UserRemote"> | boolean
    following?: BoolFilter<"UserRemote"> | boolean
    avatar?: StringFilter<"UserRemote"> | string
    favicon?: StringNullableFilter<"UserRemote"> | string | null
    order?: IntFilter<"UserRemote"> | number
    sortType?: StringNullableFilter<"UserRemote"> | string | null
  }

  export type UserRemoteOrderByWithRelationInput = {
    id?: SortOrder
    createdAt?: SortOrderInput | SortOrder
    updatedAt?: SortOrderInput | SortOrder
    localUsername?: SortOrder
    username?: SortOrder
    name?: SortOrder
    profileUrl?: SortOrder
    feedUrl?: SortOrder
    magicKey?: SortOrderInput | SortOrder
    salmonUrl?: SortOrderInput | SortOrder
    activityPubActorUrl?: SortOrderInput | SortOrder
    activityPubInboxUrl?: SortOrderInput | SortOrder
    webmentionUrl?: SortOrderInput | SortOrder
    hubUrl?: SortOrderInput | SortOrder
    follower?: SortOrder
    following?: SortOrder
    avatar?: SortOrder
    favicon?: SortOrderInput | SortOrder
    order?: SortOrder
    sortType?: SortOrderInput | SortOrder
  }

  export type UserRemoteWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    localUsername_profileUrl?: UserRemoteLocalUsernameProfileUrlCompoundUniqueInput
    localUsername_activityPubActorUrl?: UserRemoteLocalUsernameActivityPubActorUrlCompoundUniqueInput
    AND?: UserRemoteWhereInput | UserRemoteWhereInput[]
    OR?: UserRemoteWhereInput[]
    NOT?: UserRemoteWhereInput | UserRemoteWhereInput[]
    createdAt?: DateTimeNullableFilter<"UserRemote"> | Date | string | null
    updatedAt?: DateTimeNullableFilter<"UserRemote"> | Date | string | null
    localUsername?: StringFilter<"UserRemote"> | string
    username?: StringFilter<"UserRemote"> | string
    name?: StringFilter<"UserRemote"> | string
    profileUrl?: StringFilter<"UserRemote"> | string
    feedUrl?: StringFilter<"UserRemote"> | string
    magicKey?: StringNullableFilter<"UserRemote"> | string | null
    salmonUrl?: StringNullableFilter<"UserRemote"> | string | null
    activityPubActorUrl?: StringNullableFilter<"UserRemote"> | string | null
    activityPubInboxUrl?: StringNullableFilter<"UserRemote"> | string | null
    webmentionUrl?: StringNullableFilter<"UserRemote"> | string | null
    hubUrl?: StringNullableFilter<"UserRemote"> | string | null
    follower?: BoolFilter<"UserRemote"> | boolean
    following?: BoolFilter<"UserRemote"> | boolean
    avatar?: StringFilter<"UserRemote"> | string
    favicon?: StringNullableFilter<"UserRemote"> | string | null
    order?: IntFilter<"UserRemote"> | number
    sortType?: StringNullableFilter<"UserRemote"> | string | null
  }, "id" | "localUsername_profileUrl" | "localUsername_activityPubActorUrl">

  export type UserRemoteOrderByWithAggregationInput = {
    id?: SortOrder
    createdAt?: SortOrderInput | SortOrder
    updatedAt?: SortOrderInput | SortOrder
    localUsername?: SortOrder
    username?: SortOrder
    name?: SortOrder
    profileUrl?: SortOrder
    feedUrl?: SortOrder
    magicKey?: SortOrderInput | SortOrder
    salmonUrl?: SortOrderInput | SortOrder
    activityPubActorUrl?: SortOrderInput | SortOrder
    activityPubInboxUrl?: SortOrderInput | SortOrder
    webmentionUrl?: SortOrderInput | SortOrder
    hubUrl?: SortOrderInput | SortOrder
    follower?: SortOrder
    following?: SortOrder
    avatar?: SortOrder
    favicon?: SortOrderInput | SortOrder
    order?: SortOrder
    sortType?: SortOrderInput | SortOrder
    _count?: UserRemoteCountOrderByAggregateInput
    _avg?: UserRemoteAvgOrderByAggregateInput
    _max?: UserRemoteMaxOrderByAggregateInput
    _min?: UserRemoteMinOrderByAggregateInput
    _sum?: UserRemoteSumOrderByAggregateInput
  }

  export type UserRemoteScalarWhereWithAggregatesInput = {
    AND?: UserRemoteScalarWhereWithAggregatesInput | UserRemoteScalarWhereWithAggregatesInput[]
    OR?: UserRemoteScalarWhereWithAggregatesInput[]
    NOT?: UserRemoteScalarWhereWithAggregatesInput | UserRemoteScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"UserRemote"> | number
    createdAt?: DateTimeNullableWithAggregatesFilter<"UserRemote"> | Date | string | null
    updatedAt?: DateTimeNullableWithAggregatesFilter<"UserRemote"> | Date | string | null
    localUsername?: StringWithAggregatesFilter<"UserRemote"> | string
    username?: StringWithAggregatesFilter<"UserRemote"> | string
    name?: StringWithAggregatesFilter<"UserRemote"> | string
    profileUrl?: StringWithAggregatesFilter<"UserRemote"> | string
    feedUrl?: StringWithAggregatesFilter<"UserRemote"> | string
    magicKey?: StringNullableWithAggregatesFilter<"UserRemote"> | string | null
    salmonUrl?: StringNullableWithAggregatesFilter<"UserRemote"> | string | null
    activityPubActorUrl?: StringNullableWithAggregatesFilter<"UserRemote"> | string | null
    activityPubInboxUrl?: StringNullableWithAggregatesFilter<"UserRemote"> | string | null
    webmentionUrl?: StringNullableWithAggregatesFilter<"UserRemote"> | string | null
    hubUrl?: StringNullableWithAggregatesFilter<"UserRemote"> | string | null
    follower?: BoolWithAggregatesFilter<"UserRemote"> | boolean
    following?: BoolWithAggregatesFilter<"UserRemote"> | boolean
    avatar?: StringWithAggregatesFilter<"UserRemote"> | string
    favicon?: StringNullableWithAggregatesFilter<"UserRemote"> | string | null
    order?: IntWithAggregatesFilter<"UserRemote"> | number
    sortType?: StringNullableWithAggregatesFilter<"UserRemote"> | string | null
  }

  export type ContentWhereInput = {
    AND?: ContentWhereInput | ContentWhereInput[]
    OR?: ContentWhereInput[]
    NOT?: ContentWhereInput | ContentWhereInput[]
    id?: IntFilter<"Content"> | number
    createdAt?: DateTimeNullableFilter<"Content"> | Date | string | null
    updatedAt?: DateTimeNullableFilter<"Content"> | Date | string | null
    username?: StringFilter<"Content"> | string
    section?: StringFilter<"Content"> | string
    album?: StringFilter<"Content"> | string
    name?: StringFilter<"Content"> | string
    template?: StringNullableFilter<"Content"> | string | null
    sortType?: StringNullableFilter<"Content"> | string | null
    redirect?: IntNullableFilter<"Content"> | number | null
    hidden?: BoolFilter<"Content"> | boolean
    title?: StringFilter<"Content"> | string
    thumb?: StringFilter<"Content"> | string
    order?: IntFilter<"Content"> | number
    count?: IntFilter<"Content"> | number
    countRobot?: IntFilter<"Content"> | number
    commentsCount?: IntFilter<"Content"> | number
    commentsUpdated?: DateTimeNullableFilter<"Content"> | Date | string | null
    favoritesCount?: IntFilter<"Content"> | number
    thread?: StringNullableFilter<"Content"> | string | null
    threadUser?: StringNullableFilter<"Content"> | string | null
    avatar?: StringNullableFilter<"Content"> | string | null
    style?: StringFilter<"Content"> | string
    code?: StringFilter<"Content"> | string
    view?: StringFilter<"Content"> | string
    content?: StringNullableFilter<"Content"> | string | null
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type ContentOrderByWithRelationInput = {
    id?: SortOrder
    createdAt?: SortOrderInput | SortOrder
    updatedAt?: SortOrderInput | SortOrder
    username?: SortOrder
    section?: SortOrder
    album?: SortOrder
    name?: SortOrder
    template?: SortOrderInput | SortOrder
    sortType?: SortOrderInput | SortOrder
    redirect?: SortOrderInput | SortOrder
    hidden?: SortOrder
    title?: SortOrder
    thumb?: SortOrder
    order?: SortOrder
    count?: SortOrder
    countRobot?: SortOrder
    commentsCount?: SortOrder
    commentsUpdated?: SortOrderInput | SortOrder
    favoritesCount?: SortOrder
    thread?: SortOrderInput | SortOrder
    threadUser?: SortOrderInput | SortOrder
    avatar?: SortOrderInput | SortOrder
    style?: SortOrder
    code?: SortOrder
    view?: SortOrder
    content?: SortOrderInput | SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type ContentWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    username_name?: ContentUsernameNameCompoundUniqueInput
    AND?: ContentWhereInput | ContentWhereInput[]
    OR?: ContentWhereInput[]
    NOT?: ContentWhereInput | ContentWhereInput[]
    createdAt?: DateTimeNullableFilter<"Content"> | Date | string | null
    updatedAt?: DateTimeNullableFilter<"Content"> | Date | string | null
    username?: StringFilter<"Content"> | string
    section?: StringFilter<"Content"> | string
    album?: StringFilter<"Content"> | string
    name?: StringFilter<"Content"> | string
    template?: StringNullableFilter<"Content"> | string | null
    sortType?: StringNullableFilter<"Content"> | string | null
    redirect?: IntNullableFilter<"Content"> | number | null
    hidden?: BoolFilter<"Content"> | boolean
    title?: StringFilter<"Content"> | string
    thumb?: StringFilter<"Content"> | string
    order?: IntFilter<"Content"> | number
    count?: IntFilter<"Content"> | number
    countRobot?: IntFilter<"Content"> | number
    commentsCount?: IntFilter<"Content"> | number
    commentsUpdated?: DateTimeNullableFilter<"Content"> | Date | string | null
    favoritesCount?: IntFilter<"Content"> | number
    thread?: StringNullableFilter<"Content"> | string | null
    threadUser?: StringNullableFilter<"Content"> | string | null
    avatar?: StringNullableFilter<"Content"> | string | null
    style?: StringFilter<"Content"> | string
    code?: StringFilter<"Content"> | string
    view?: StringFilter<"Content"> | string
    content?: StringNullableFilter<"Content"> | string | null
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id" | "username_name">

  export type ContentOrderByWithAggregationInput = {
    id?: SortOrder
    createdAt?: SortOrderInput | SortOrder
    updatedAt?: SortOrderInput | SortOrder
    username?: SortOrder
    section?: SortOrder
    album?: SortOrder
    name?: SortOrder
    template?: SortOrderInput | SortOrder
    sortType?: SortOrderInput | SortOrder
    redirect?: SortOrderInput | SortOrder
    hidden?: SortOrder
    title?: SortOrder
    thumb?: SortOrder
    order?: SortOrder
    count?: SortOrder
    countRobot?: SortOrder
    commentsCount?: SortOrder
    commentsUpdated?: SortOrderInput | SortOrder
    favoritesCount?: SortOrder
    thread?: SortOrderInput | SortOrder
    threadUser?: SortOrderInput | SortOrder
    avatar?: SortOrderInput | SortOrder
    style?: SortOrder
    code?: SortOrder
    view?: SortOrder
    content?: SortOrderInput | SortOrder
    _count?: ContentCountOrderByAggregateInput
    _avg?: ContentAvgOrderByAggregateInput
    _max?: ContentMaxOrderByAggregateInput
    _min?: ContentMinOrderByAggregateInput
    _sum?: ContentSumOrderByAggregateInput
  }

  export type ContentScalarWhereWithAggregatesInput = {
    AND?: ContentScalarWhereWithAggregatesInput | ContentScalarWhereWithAggregatesInput[]
    OR?: ContentScalarWhereWithAggregatesInput[]
    NOT?: ContentScalarWhereWithAggregatesInput | ContentScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Content"> | number
    createdAt?: DateTimeNullableWithAggregatesFilter<"Content"> | Date | string | null
    updatedAt?: DateTimeNullableWithAggregatesFilter<"Content"> | Date | string | null
    username?: StringWithAggregatesFilter<"Content"> | string
    section?: StringWithAggregatesFilter<"Content"> | string
    album?: StringWithAggregatesFilter<"Content"> | string
    name?: StringWithAggregatesFilter<"Content"> | string
    template?: StringNullableWithAggregatesFilter<"Content"> | string | null
    sortType?: StringNullableWithAggregatesFilter<"Content"> | string | null
    redirect?: IntNullableWithAggregatesFilter<"Content"> | number | null
    hidden?: BoolWithAggregatesFilter<"Content"> | boolean
    title?: StringWithAggregatesFilter<"Content"> | string
    thumb?: StringWithAggregatesFilter<"Content"> | string
    order?: IntWithAggregatesFilter<"Content"> | number
    count?: IntWithAggregatesFilter<"Content"> | number
    countRobot?: IntWithAggregatesFilter<"Content"> | number
    commentsCount?: IntWithAggregatesFilter<"Content"> | number
    commentsUpdated?: DateTimeNullableWithAggregatesFilter<"Content"> | Date | string | null
    favoritesCount?: IntWithAggregatesFilter<"Content"> | number
    thread?: StringNullableWithAggregatesFilter<"Content"> | string | null
    threadUser?: StringNullableWithAggregatesFilter<"Content"> | string | null
    avatar?: StringNullableWithAggregatesFilter<"Content"> | string | null
    style?: StringWithAggregatesFilter<"Content"> | string
    code?: StringWithAggregatesFilter<"Content"> | string
    view?: StringWithAggregatesFilter<"Content"> | string
    content?: StringNullableWithAggregatesFilter<"Content"> | string | null
  }

  export type ContentRemoteWhereInput = {
    AND?: ContentRemoteWhereInput | ContentRemoteWhereInput[]
    OR?: ContentRemoteWhereInput[]
    NOT?: ContentRemoteWhereInput | ContentRemoteWhereInput[]
    id?: IntFilter<"ContentRemote"> | number
    createdAt?: DateTimeNullableFilter<"ContentRemote"> | Date | string | null
    updatedAt?: DateTimeNullableFilter<"ContentRemote"> | Date | string | null
    toUsername?: StringFilter<"ContentRemote"> | string
    localContentName?: StringNullableFilter<"ContentRemote"> | string | null
    fromUsername?: StringNullableFilter<"ContentRemote"> | string | null
    fromUserRemoteId?: StringNullableFilter<"ContentRemote"> | string | null
    commentUser?: StringNullableFilter<"ContentRemote"> | string | null
    username?: StringFilter<"ContentRemote"> | string
    creator?: StringNullableFilter<"ContentRemote"> | string | null
    avatar?: StringNullableFilter<"ContentRemote"> | string | null
    title?: StringFilter<"ContentRemote"> | string
    postId?: StringFilter<"ContentRemote"> | string
    link?: StringFilter<"ContentRemote"> | string
    commentsUpdated?: DateTimeNullableFilter<"ContentRemote"> | Date | string | null
    commentsCount?: IntFilter<"ContentRemote"> | number
    thread?: StringNullableFilter<"ContentRemote"> | string | null
    type?: StringFilter<"ContentRemote"> | string
    favorited?: BoolFilter<"ContentRemote"> | boolean
    read?: BoolFilter<"ContentRemote"> | boolean
    isSpam?: BoolFilter<"ContentRemote"> | boolean
    deleted?: BoolFilter<"ContentRemote"> | boolean
    view?: StringFilter<"ContentRemote"> | string
    content?: StringNullableFilter<"ContentRemote"> | string | null
    toUser?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type ContentRemoteOrderByWithRelationInput = {
    id?: SortOrder
    createdAt?: SortOrderInput | SortOrder
    updatedAt?: SortOrderInput | SortOrder
    toUsername?: SortOrder
    localContentName?: SortOrderInput | SortOrder
    fromUsername?: SortOrderInput | SortOrder
    fromUserRemoteId?: SortOrderInput | SortOrder
    commentUser?: SortOrderInput | SortOrder
    username?: SortOrder
    creator?: SortOrderInput | SortOrder
    avatar?: SortOrderInput | SortOrder
    title?: SortOrder
    postId?: SortOrder
    link?: SortOrder
    commentsUpdated?: SortOrderInput | SortOrder
    commentsCount?: SortOrder
    thread?: SortOrderInput | SortOrder
    type?: SortOrder
    favorited?: SortOrder
    read?: SortOrder
    isSpam?: SortOrder
    deleted?: SortOrder
    view?: SortOrder
    content?: SortOrderInput | SortOrder
    toUser?: UserOrderByWithRelationInput
  }

  export type ContentRemoteWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    toUsername_fromUsername_postId?: ContentRemoteToUsernameFromUsernamePostIdCompoundUniqueInput
    AND?: ContentRemoteWhereInput | ContentRemoteWhereInput[]
    OR?: ContentRemoteWhereInput[]
    NOT?: ContentRemoteWhereInput | ContentRemoteWhereInput[]
    createdAt?: DateTimeNullableFilter<"ContentRemote"> | Date | string | null
    updatedAt?: DateTimeNullableFilter<"ContentRemote"> | Date | string | null
    toUsername?: StringFilter<"ContentRemote"> | string
    localContentName?: StringNullableFilter<"ContentRemote"> | string | null
    fromUsername?: StringNullableFilter<"ContentRemote"> | string | null
    fromUserRemoteId?: StringNullableFilter<"ContentRemote"> | string | null
    commentUser?: StringNullableFilter<"ContentRemote"> | string | null
    username?: StringFilter<"ContentRemote"> | string
    creator?: StringNullableFilter<"ContentRemote"> | string | null
    avatar?: StringNullableFilter<"ContentRemote"> | string | null
    title?: StringFilter<"ContentRemote"> | string
    postId?: StringFilter<"ContentRemote"> | string
    link?: StringFilter<"ContentRemote"> | string
    commentsUpdated?: DateTimeNullableFilter<"ContentRemote"> | Date | string | null
    commentsCount?: IntFilter<"ContentRemote"> | number
    thread?: StringNullableFilter<"ContentRemote"> | string | null
    type?: StringFilter<"ContentRemote"> | string
    favorited?: BoolFilter<"ContentRemote"> | boolean
    read?: BoolFilter<"ContentRemote"> | boolean
    isSpam?: BoolFilter<"ContentRemote"> | boolean
    deleted?: BoolFilter<"ContentRemote"> | boolean
    view?: StringFilter<"ContentRemote"> | string
    content?: StringNullableFilter<"ContentRemote"> | string | null
    toUser?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id" | "toUsername_fromUsername_postId">

  export type ContentRemoteOrderByWithAggregationInput = {
    id?: SortOrder
    createdAt?: SortOrderInput | SortOrder
    updatedAt?: SortOrderInput | SortOrder
    toUsername?: SortOrder
    localContentName?: SortOrderInput | SortOrder
    fromUsername?: SortOrderInput | SortOrder
    fromUserRemoteId?: SortOrderInput | SortOrder
    commentUser?: SortOrderInput | SortOrder
    username?: SortOrder
    creator?: SortOrderInput | SortOrder
    avatar?: SortOrderInput | SortOrder
    title?: SortOrder
    postId?: SortOrder
    link?: SortOrder
    commentsUpdated?: SortOrderInput | SortOrder
    commentsCount?: SortOrder
    thread?: SortOrderInput | SortOrder
    type?: SortOrder
    favorited?: SortOrder
    read?: SortOrder
    isSpam?: SortOrder
    deleted?: SortOrder
    view?: SortOrder
    content?: SortOrderInput | SortOrder
    _count?: ContentRemoteCountOrderByAggregateInput
    _avg?: ContentRemoteAvgOrderByAggregateInput
    _max?: ContentRemoteMaxOrderByAggregateInput
    _min?: ContentRemoteMinOrderByAggregateInput
    _sum?: ContentRemoteSumOrderByAggregateInput
  }

  export type ContentRemoteScalarWhereWithAggregatesInput = {
    AND?: ContentRemoteScalarWhereWithAggregatesInput | ContentRemoteScalarWhereWithAggregatesInput[]
    OR?: ContentRemoteScalarWhereWithAggregatesInput[]
    NOT?: ContentRemoteScalarWhereWithAggregatesInput | ContentRemoteScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"ContentRemote"> | number
    createdAt?: DateTimeNullableWithAggregatesFilter<"ContentRemote"> | Date | string | null
    updatedAt?: DateTimeNullableWithAggregatesFilter<"ContentRemote"> | Date | string | null
    toUsername?: StringWithAggregatesFilter<"ContentRemote"> | string
    localContentName?: StringNullableWithAggregatesFilter<"ContentRemote"> | string | null
    fromUsername?: StringNullableWithAggregatesFilter<"ContentRemote"> | string | null
    fromUserRemoteId?: StringNullableWithAggregatesFilter<"ContentRemote"> | string | null
    commentUser?: StringNullableWithAggregatesFilter<"ContentRemote"> | string | null
    username?: StringWithAggregatesFilter<"ContentRemote"> | string
    creator?: StringNullableWithAggregatesFilter<"ContentRemote"> | string | null
    avatar?: StringNullableWithAggregatesFilter<"ContentRemote"> | string | null
    title?: StringWithAggregatesFilter<"ContentRemote"> | string
    postId?: StringWithAggregatesFilter<"ContentRemote"> | string
    link?: StringWithAggregatesFilter<"ContentRemote"> | string
    commentsUpdated?: DateTimeNullableWithAggregatesFilter<"ContentRemote"> | Date | string | null
    commentsCount?: IntWithAggregatesFilter<"ContentRemote"> | number
    thread?: StringNullableWithAggregatesFilter<"ContentRemote"> | string | null
    type?: StringWithAggregatesFilter<"ContentRemote"> | string
    favorited?: BoolWithAggregatesFilter<"ContentRemote"> | boolean
    read?: BoolWithAggregatesFilter<"ContentRemote"> | boolean
    isSpam?: BoolWithAggregatesFilter<"ContentRemote"> | boolean
    deleted?: BoolWithAggregatesFilter<"ContentRemote"> | boolean
    view?: StringWithAggregatesFilter<"ContentRemote"> | string
    content?: StringNullableWithAggregatesFilter<"ContentRemote"> | string | null
  }

  export type UserCreateInput = {
    createdAt?: Date | string | null
    updatedAt?: Date | string | null
    username: string
    name: string
    email: string
    superuser?: boolean
    title: string
    description?: string | null
    hostname?: string | null
    license?: string | null
    googleAnalytics?: string | null
    favicon?: string | null
    logo?: string | null
    viewport?: string | null
    sidebarHtml?: string | null
    theme: string
    magicKey: string
    privateKey: string
    Content?: ContentCreateNestedManyWithoutUserInput
    ContentRemote?: ContentRemoteCreateNestedManyWithoutToUserInput
  }

  export type UserUncheckedCreateInput = {
    id?: number
    createdAt?: Date | string | null
    updatedAt?: Date | string | null
    username: string
    name: string
    email: string
    superuser?: boolean
    title: string
    description?: string | null
    hostname?: string | null
    license?: string | null
    googleAnalytics?: string | null
    favicon?: string | null
    logo?: string | null
    viewport?: string | null
    sidebarHtml?: string | null
    theme: string
    magicKey: string
    privateKey: string
    Content?: ContentUncheckedCreateNestedManyWithoutUserInput
    ContentRemote?: ContentRemoteUncheckedCreateNestedManyWithoutToUserInput
  }

  export type UserUpdateInput = {
    createdAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    updatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    username?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    superuser?: BoolFieldUpdateOperationsInput | boolean
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    hostname?: NullableStringFieldUpdateOperationsInput | string | null
    license?: NullableStringFieldUpdateOperationsInput | string | null
    googleAnalytics?: NullableStringFieldUpdateOperationsInput | string | null
    favicon?: NullableStringFieldUpdateOperationsInput | string | null
    logo?: NullableStringFieldUpdateOperationsInput | string | null
    viewport?: NullableStringFieldUpdateOperationsInput | string | null
    sidebarHtml?: NullableStringFieldUpdateOperationsInput | string | null
    theme?: StringFieldUpdateOperationsInput | string
    magicKey?: StringFieldUpdateOperationsInput | string
    privateKey?: StringFieldUpdateOperationsInput | string
    Content?: ContentUpdateManyWithoutUserNestedInput
    ContentRemote?: ContentRemoteUpdateManyWithoutToUserNestedInput
  }

  export type UserUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    createdAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    updatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    username?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    superuser?: BoolFieldUpdateOperationsInput | boolean
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    hostname?: NullableStringFieldUpdateOperationsInput | string | null
    license?: NullableStringFieldUpdateOperationsInput | string | null
    googleAnalytics?: NullableStringFieldUpdateOperationsInput | string | null
    favicon?: NullableStringFieldUpdateOperationsInput | string | null
    logo?: NullableStringFieldUpdateOperationsInput | string | null
    viewport?: NullableStringFieldUpdateOperationsInput | string | null
    sidebarHtml?: NullableStringFieldUpdateOperationsInput | string | null
    theme?: StringFieldUpdateOperationsInput | string
    magicKey?: StringFieldUpdateOperationsInput | string
    privateKey?: StringFieldUpdateOperationsInput | string
    Content?: ContentUncheckedUpdateManyWithoutUserNestedInput
    ContentRemote?: ContentRemoteUncheckedUpdateManyWithoutToUserNestedInput
  }

  export type UserCreateManyInput = {
    id?: number
    createdAt?: Date | string | null
    updatedAt?: Date | string | null
    username: string
    name: string
    email: string
    superuser?: boolean
    title: string
    description?: string | null
    hostname?: string | null
    license?: string | null
    googleAnalytics?: string | null
    favicon?: string | null
    logo?: string | null
    viewport?: string | null
    sidebarHtml?: string | null
    theme: string
    magicKey: string
    privateKey: string
  }

  export type UserUpdateManyMutationInput = {
    createdAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    updatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    username?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    superuser?: BoolFieldUpdateOperationsInput | boolean
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    hostname?: NullableStringFieldUpdateOperationsInput | string | null
    license?: NullableStringFieldUpdateOperationsInput | string | null
    googleAnalytics?: NullableStringFieldUpdateOperationsInput | string | null
    favicon?: NullableStringFieldUpdateOperationsInput | string | null
    logo?: NullableStringFieldUpdateOperationsInput | string | null
    viewport?: NullableStringFieldUpdateOperationsInput | string | null
    sidebarHtml?: NullableStringFieldUpdateOperationsInput | string | null
    theme?: StringFieldUpdateOperationsInput | string
    magicKey?: StringFieldUpdateOperationsInput | string
    privateKey?: StringFieldUpdateOperationsInput | string
  }

  export type UserUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    createdAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    updatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    username?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    superuser?: BoolFieldUpdateOperationsInput | boolean
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    hostname?: NullableStringFieldUpdateOperationsInput | string | null
    license?: NullableStringFieldUpdateOperationsInput | string | null
    googleAnalytics?: NullableStringFieldUpdateOperationsInput | string | null
    favicon?: NullableStringFieldUpdateOperationsInput | string | null
    logo?: NullableStringFieldUpdateOperationsInput | string | null
    viewport?: NullableStringFieldUpdateOperationsInput | string | null
    sidebarHtml?: NullableStringFieldUpdateOperationsInput | string | null
    theme?: StringFieldUpdateOperationsInput | string
    magicKey?: StringFieldUpdateOperationsInput | string
    privateKey?: StringFieldUpdateOperationsInput | string
  }

  export type UserRemoteCreateInput = {
    createdAt?: Date | string | null
    updatedAt?: Date | string | null
    localUsername: string
    username: string
    name: string
    profileUrl: string
    feedUrl: string
    magicKey?: string | null
    salmonUrl?: string | null
    activityPubActorUrl?: string | null
    activityPubInboxUrl?: string | null
    webmentionUrl?: string | null
    hubUrl?: string | null
    follower?: boolean
    following?: boolean
    avatar: string
    favicon?: string | null
    order?: number
    sortType?: string | null
  }

  export type UserRemoteUncheckedCreateInput = {
    id?: number
    createdAt?: Date | string | null
    updatedAt?: Date | string | null
    localUsername: string
    username: string
    name: string
    profileUrl: string
    feedUrl: string
    magicKey?: string | null
    salmonUrl?: string | null
    activityPubActorUrl?: string | null
    activityPubInboxUrl?: string | null
    webmentionUrl?: string | null
    hubUrl?: string | null
    follower?: boolean
    following?: boolean
    avatar: string
    favicon?: string | null
    order?: number
    sortType?: string | null
  }

  export type UserRemoteUpdateInput = {
    createdAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    updatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    localUsername?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    profileUrl?: StringFieldUpdateOperationsInput | string
    feedUrl?: StringFieldUpdateOperationsInput | string
    magicKey?: NullableStringFieldUpdateOperationsInput | string | null
    salmonUrl?: NullableStringFieldUpdateOperationsInput | string | null
    activityPubActorUrl?: NullableStringFieldUpdateOperationsInput | string | null
    activityPubInboxUrl?: NullableStringFieldUpdateOperationsInput | string | null
    webmentionUrl?: NullableStringFieldUpdateOperationsInput | string | null
    hubUrl?: NullableStringFieldUpdateOperationsInput | string | null
    follower?: BoolFieldUpdateOperationsInput | boolean
    following?: BoolFieldUpdateOperationsInput | boolean
    avatar?: StringFieldUpdateOperationsInput | string
    favicon?: NullableStringFieldUpdateOperationsInput | string | null
    order?: IntFieldUpdateOperationsInput | number
    sortType?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type UserRemoteUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    createdAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    updatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    localUsername?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    profileUrl?: StringFieldUpdateOperationsInput | string
    feedUrl?: StringFieldUpdateOperationsInput | string
    magicKey?: NullableStringFieldUpdateOperationsInput | string | null
    salmonUrl?: NullableStringFieldUpdateOperationsInput | string | null
    activityPubActorUrl?: NullableStringFieldUpdateOperationsInput | string | null
    activityPubInboxUrl?: NullableStringFieldUpdateOperationsInput | string | null
    webmentionUrl?: NullableStringFieldUpdateOperationsInput | string | null
    hubUrl?: NullableStringFieldUpdateOperationsInput | string | null
    follower?: BoolFieldUpdateOperationsInput | boolean
    following?: BoolFieldUpdateOperationsInput | boolean
    avatar?: StringFieldUpdateOperationsInput | string
    favicon?: NullableStringFieldUpdateOperationsInput | string | null
    order?: IntFieldUpdateOperationsInput | number
    sortType?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type UserRemoteCreateManyInput = {
    id?: number
    createdAt?: Date | string | null
    updatedAt?: Date | string | null
    localUsername: string
    username: string
    name: string
    profileUrl: string
    feedUrl: string
    magicKey?: string | null
    salmonUrl?: string | null
    activityPubActorUrl?: string | null
    activityPubInboxUrl?: string | null
    webmentionUrl?: string | null
    hubUrl?: string | null
    follower?: boolean
    following?: boolean
    avatar: string
    favicon?: string | null
    order?: number
    sortType?: string | null
  }

  export type UserRemoteUpdateManyMutationInput = {
    createdAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    updatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    localUsername?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    profileUrl?: StringFieldUpdateOperationsInput | string
    feedUrl?: StringFieldUpdateOperationsInput | string
    magicKey?: NullableStringFieldUpdateOperationsInput | string | null
    salmonUrl?: NullableStringFieldUpdateOperationsInput | string | null
    activityPubActorUrl?: NullableStringFieldUpdateOperationsInput | string | null
    activityPubInboxUrl?: NullableStringFieldUpdateOperationsInput | string | null
    webmentionUrl?: NullableStringFieldUpdateOperationsInput | string | null
    hubUrl?: NullableStringFieldUpdateOperationsInput | string | null
    follower?: BoolFieldUpdateOperationsInput | boolean
    following?: BoolFieldUpdateOperationsInput | boolean
    avatar?: StringFieldUpdateOperationsInput | string
    favicon?: NullableStringFieldUpdateOperationsInput | string | null
    order?: IntFieldUpdateOperationsInput | number
    sortType?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type UserRemoteUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    createdAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    updatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    localUsername?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    profileUrl?: StringFieldUpdateOperationsInput | string
    feedUrl?: StringFieldUpdateOperationsInput | string
    magicKey?: NullableStringFieldUpdateOperationsInput | string | null
    salmonUrl?: NullableStringFieldUpdateOperationsInput | string | null
    activityPubActorUrl?: NullableStringFieldUpdateOperationsInput | string | null
    activityPubInboxUrl?: NullableStringFieldUpdateOperationsInput | string | null
    webmentionUrl?: NullableStringFieldUpdateOperationsInput | string | null
    hubUrl?: NullableStringFieldUpdateOperationsInput | string | null
    follower?: BoolFieldUpdateOperationsInput | boolean
    following?: BoolFieldUpdateOperationsInput | boolean
    avatar?: StringFieldUpdateOperationsInput | string
    favicon?: NullableStringFieldUpdateOperationsInput | string | null
    order?: IntFieldUpdateOperationsInput | number
    sortType?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ContentCreateInput = {
    createdAt?: Date | string | null
    updatedAt?: Date | string | null
    section: string
    album: string
    name: string
    template?: string | null
    sortType?: string | null
    redirect?: number | null
    hidden?: boolean
    title: string
    thumb: string
    order?: number
    count?: number
    countRobot?: number
    commentsCount?: number
    commentsUpdated?: Date | string | null
    favoritesCount?: number
    thread?: string | null
    threadUser?: string | null
    avatar?: string | null
    style: string
    code: string
    view: string
    content?: string | null
    user: UserCreateNestedOneWithoutContentInput
  }

  export type ContentUncheckedCreateInput = {
    id?: number
    createdAt?: Date | string | null
    updatedAt?: Date | string | null
    username: string
    section: string
    album: string
    name: string
    template?: string | null
    sortType?: string | null
    redirect?: number | null
    hidden?: boolean
    title: string
    thumb: string
    order?: number
    count?: number
    countRobot?: number
    commentsCount?: number
    commentsUpdated?: Date | string | null
    favoritesCount?: number
    thread?: string | null
    threadUser?: string | null
    avatar?: string | null
    style: string
    code: string
    view: string
    content?: string | null
  }

  export type ContentUpdateInput = {
    createdAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    updatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    section?: StringFieldUpdateOperationsInput | string
    album?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    template?: NullableStringFieldUpdateOperationsInput | string | null
    sortType?: NullableStringFieldUpdateOperationsInput | string | null
    redirect?: NullableIntFieldUpdateOperationsInput | number | null
    hidden?: BoolFieldUpdateOperationsInput | boolean
    title?: StringFieldUpdateOperationsInput | string
    thumb?: StringFieldUpdateOperationsInput | string
    order?: IntFieldUpdateOperationsInput | number
    count?: IntFieldUpdateOperationsInput | number
    countRobot?: IntFieldUpdateOperationsInput | number
    commentsCount?: IntFieldUpdateOperationsInput | number
    commentsUpdated?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    favoritesCount?: IntFieldUpdateOperationsInput | number
    thread?: NullableStringFieldUpdateOperationsInput | string | null
    threadUser?: NullableStringFieldUpdateOperationsInput | string | null
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    style?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    view?: StringFieldUpdateOperationsInput | string
    content?: NullableStringFieldUpdateOperationsInput | string | null
    user?: UserUpdateOneRequiredWithoutContentNestedInput
  }

  export type ContentUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    createdAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    updatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    username?: StringFieldUpdateOperationsInput | string
    section?: StringFieldUpdateOperationsInput | string
    album?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    template?: NullableStringFieldUpdateOperationsInput | string | null
    sortType?: NullableStringFieldUpdateOperationsInput | string | null
    redirect?: NullableIntFieldUpdateOperationsInput | number | null
    hidden?: BoolFieldUpdateOperationsInput | boolean
    title?: StringFieldUpdateOperationsInput | string
    thumb?: StringFieldUpdateOperationsInput | string
    order?: IntFieldUpdateOperationsInput | number
    count?: IntFieldUpdateOperationsInput | number
    countRobot?: IntFieldUpdateOperationsInput | number
    commentsCount?: IntFieldUpdateOperationsInput | number
    commentsUpdated?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    favoritesCount?: IntFieldUpdateOperationsInput | number
    thread?: NullableStringFieldUpdateOperationsInput | string | null
    threadUser?: NullableStringFieldUpdateOperationsInput | string | null
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    style?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    view?: StringFieldUpdateOperationsInput | string
    content?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ContentCreateManyInput = {
    id?: number
    createdAt?: Date | string | null
    updatedAt?: Date | string | null
    username: string
    section: string
    album: string
    name: string
    template?: string | null
    sortType?: string | null
    redirect?: number | null
    hidden?: boolean
    title: string
    thumb: string
    order?: number
    count?: number
    countRobot?: number
    commentsCount?: number
    commentsUpdated?: Date | string | null
    favoritesCount?: number
    thread?: string | null
    threadUser?: string | null
    avatar?: string | null
    style: string
    code: string
    view: string
    content?: string | null
  }

  export type ContentUpdateManyMutationInput = {
    createdAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    updatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    section?: StringFieldUpdateOperationsInput | string
    album?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    template?: NullableStringFieldUpdateOperationsInput | string | null
    sortType?: NullableStringFieldUpdateOperationsInput | string | null
    redirect?: NullableIntFieldUpdateOperationsInput | number | null
    hidden?: BoolFieldUpdateOperationsInput | boolean
    title?: StringFieldUpdateOperationsInput | string
    thumb?: StringFieldUpdateOperationsInput | string
    order?: IntFieldUpdateOperationsInput | number
    count?: IntFieldUpdateOperationsInput | number
    countRobot?: IntFieldUpdateOperationsInput | number
    commentsCount?: IntFieldUpdateOperationsInput | number
    commentsUpdated?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    favoritesCount?: IntFieldUpdateOperationsInput | number
    thread?: NullableStringFieldUpdateOperationsInput | string | null
    threadUser?: NullableStringFieldUpdateOperationsInput | string | null
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    style?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    view?: StringFieldUpdateOperationsInput | string
    content?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ContentUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    createdAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    updatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    username?: StringFieldUpdateOperationsInput | string
    section?: StringFieldUpdateOperationsInput | string
    album?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    template?: NullableStringFieldUpdateOperationsInput | string | null
    sortType?: NullableStringFieldUpdateOperationsInput | string | null
    redirect?: NullableIntFieldUpdateOperationsInput | number | null
    hidden?: BoolFieldUpdateOperationsInput | boolean
    title?: StringFieldUpdateOperationsInput | string
    thumb?: StringFieldUpdateOperationsInput | string
    order?: IntFieldUpdateOperationsInput | number
    count?: IntFieldUpdateOperationsInput | number
    countRobot?: IntFieldUpdateOperationsInput | number
    commentsCount?: IntFieldUpdateOperationsInput | number
    commentsUpdated?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    favoritesCount?: IntFieldUpdateOperationsInput | number
    thread?: NullableStringFieldUpdateOperationsInput | string | null
    threadUser?: NullableStringFieldUpdateOperationsInput | string | null
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    style?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    view?: StringFieldUpdateOperationsInput | string
    content?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ContentRemoteCreateInput = {
    createdAt?: Date | string | null
    updatedAt?: Date | string | null
    localContentName?: string | null
    fromUsername?: string | null
    fromUserRemoteId?: string | null
    commentUser?: string | null
    username: string
    creator?: string | null
    avatar?: string | null
    title: string
    postId: string
    link: string
    commentsUpdated?: Date | string | null
    commentsCount?: number
    thread?: string | null
    type: string
    favorited?: boolean
    read?: boolean
    isSpam?: boolean
    deleted?: boolean
    view: string
    content?: string | null
    toUser: UserCreateNestedOneWithoutContentRemoteInput
  }

  export type ContentRemoteUncheckedCreateInput = {
    id?: number
    createdAt?: Date | string | null
    updatedAt?: Date | string | null
    toUsername: string
    localContentName?: string | null
    fromUsername?: string | null
    fromUserRemoteId?: string | null
    commentUser?: string | null
    username: string
    creator?: string | null
    avatar?: string | null
    title: string
    postId: string
    link: string
    commentsUpdated?: Date | string | null
    commentsCount?: number
    thread?: string | null
    type: string
    favorited?: boolean
    read?: boolean
    isSpam?: boolean
    deleted?: boolean
    view: string
    content?: string | null
  }

  export type ContentRemoteUpdateInput = {
    createdAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    updatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    localContentName?: NullableStringFieldUpdateOperationsInput | string | null
    fromUsername?: NullableStringFieldUpdateOperationsInput | string | null
    fromUserRemoteId?: NullableStringFieldUpdateOperationsInput | string | null
    commentUser?: NullableStringFieldUpdateOperationsInput | string | null
    username?: StringFieldUpdateOperationsInput | string
    creator?: NullableStringFieldUpdateOperationsInput | string | null
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    postId?: StringFieldUpdateOperationsInput | string
    link?: StringFieldUpdateOperationsInput | string
    commentsUpdated?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    commentsCount?: IntFieldUpdateOperationsInput | number
    thread?: NullableStringFieldUpdateOperationsInput | string | null
    type?: StringFieldUpdateOperationsInput | string
    favorited?: BoolFieldUpdateOperationsInput | boolean
    read?: BoolFieldUpdateOperationsInput | boolean
    isSpam?: BoolFieldUpdateOperationsInput | boolean
    deleted?: BoolFieldUpdateOperationsInput | boolean
    view?: StringFieldUpdateOperationsInput | string
    content?: NullableStringFieldUpdateOperationsInput | string | null
    toUser?: UserUpdateOneRequiredWithoutContentRemoteNestedInput
  }

  export type ContentRemoteUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    createdAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    updatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    toUsername?: StringFieldUpdateOperationsInput | string
    localContentName?: NullableStringFieldUpdateOperationsInput | string | null
    fromUsername?: NullableStringFieldUpdateOperationsInput | string | null
    fromUserRemoteId?: NullableStringFieldUpdateOperationsInput | string | null
    commentUser?: NullableStringFieldUpdateOperationsInput | string | null
    username?: StringFieldUpdateOperationsInput | string
    creator?: NullableStringFieldUpdateOperationsInput | string | null
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    postId?: StringFieldUpdateOperationsInput | string
    link?: StringFieldUpdateOperationsInput | string
    commentsUpdated?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    commentsCount?: IntFieldUpdateOperationsInput | number
    thread?: NullableStringFieldUpdateOperationsInput | string | null
    type?: StringFieldUpdateOperationsInput | string
    favorited?: BoolFieldUpdateOperationsInput | boolean
    read?: BoolFieldUpdateOperationsInput | boolean
    isSpam?: BoolFieldUpdateOperationsInput | boolean
    deleted?: BoolFieldUpdateOperationsInput | boolean
    view?: StringFieldUpdateOperationsInput | string
    content?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ContentRemoteCreateManyInput = {
    id?: number
    createdAt?: Date | string | null
    updatedAt?: Date | string | null
    toUsername: string
    localContentName?: string | null
    fromUsername?: string | null
    fromUserRemoteId?: string | null
    commentUser?: string | null
    username: string
    creator?: string | null
    avatar?: string | null
    title: string
    postId: string
    link: string
    commentsUpdated?: Date | string | null
    commentsCount?: number
    thread?: string | null
    type: string
    favorited?: boolean
    read?: boolean
    isSpam?: boolean
    deleted?: boolean
    view: string
    content?: string | null
  }

  export type ContentRemoteUpdateManyMutationInput = {
    createdAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    updatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    localContentName?: NullableStringFieldUpdateOperationsInput | string | null
    fromUsername?: NullableStringFieldUpdateOperationsInput | string | null
    fromUserRemoteId?: NullableStringFieldUpdateOperationsInput | string | null
    commentUser?: NullableStringFieldUpdateOperationsInput | string | null
    username?: StringFieldUpdateOperationsInput | string
    creator?: NullableStringFieldUpdateOperationsInput | string | null
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    postId?: StringFieldUpdateOperationsInput | string
    link?: StringFieldUpdateOperationsInput | string
    commentsUpdated?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    commentsCount?: IntFieldUpdateOperationsInput | number
    thread?: NullableStringFieldUpdateOperationsInput | string | null
    type?: StringFieldUpdateOperationsInput | string
    favorited?: BoolFieldUpdateOperationsInput | boolean
    read?: BoolFieldUpdateOperationsInput | boolean
    isSpam?: BoolFieldUpdateOperationsInput | boolean
    deleted?: BoolFieldUpdateOperationsInput | boolean
    view?: StringFieldUpdateOperationsInput | string
    content?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ContentRemoteUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    createdAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    updatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    toUsername?: StringFieldUpdateOperationsInput | string
    localContentName?: NullableStringFieldUpdateOperationsInput | string | null
    fromUsername?: NullableStringFieldUpdateOperationsInput | string | null
    fromUserRemoteId?: NullableStringFieldUpdateOperationsInput | string | null
    commentUser?: NullableStringFieldUpdateOperationsInput | string | null
    username?: StringFieldUpdateOperationsInput | string
    creator?: NullableStringFieldUpdateOperationsInput | string | null
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    postId?: StringFieldUpdateOperationsInput | string
    link?: StringFieldUpdateOperationsInput | string
    commentsUpdated?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    commentsCount?: IntFieldUpdateOperationsInput | number
    thread?: NullableStringFieldUpdateOperationsInput | string | null
    type?: StringFieldUpdateOperationsInput | string
    favorited?: BoolFieldUpdateOperationsInput | boolean
    read?: BoolFieldUpdateOperationsInput | boolean
    isSpam?: BoolFieldUpdateOperationsInput | boolean
    deleted?: BoolFieldUpdateOperationsInput | boolean
    view?: StringFieldUpdateOperationsInput | string
    content?: NullableStringFieldUpdateOperationsInput | string | null
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

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
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

  export type ContentListRelationFilter = {
    every?: ContentWhereInput
    some?: ContentWhereInput
    none?: ContentWhereInput
  }

  export type ContentRemoteListRelationFilter = {
    every?: ContentRemoteWhereInput
    some?: ContentRemoteWhereInput
    none?: ContentRemoteWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type ContentOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ContentRemoteOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    username?: SortOrder
    name?: SortOrder
    email?: SortOrder
    superuser?: SortOrder
    title?: SortOrder
    description?: SortOrder
    hostname?: SortOrder
    license?: SortOrder
    googleAnalytics?: SortOrder
    favicon?: SortOrder
    logo?: SortOrder
    viewport?: SortOrder
    sidebarHtml?: SortOrder
    theme?: SortOrder
    magicKey?: SortOrder
    privateKey?: SortOrder
  }

  export type UserAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    username?: SortOrder
    name?: SortOrder
    email?: SortOrder
    superuser?: SortOrder
    title?: SortOrder
    description?: SortOrder
    hostname?: SortOrder
    license?: SortOrder
    googleAnalytics?: SortOrder
    favicon?: SortOrder
    logo?: SortOrder
    viewport?: SortOrder
    sidebarHtml?: SortOrder
    theme?: SortOrder
    magicKey?: SortOrder
    privateKey?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    username?: SortOrder
    name?: SortOrder
    email?: SortOrder
    superuser?: SortOrder
    title?: SortOrder
    description?: SortOrder
    hostname?: SortOrder
    license?: SortOrder
    googleAnalytics?: SortOrder
    favicon?: SortOrder
    logo?: SortOrder
    viewport?: SortOrder
    sidebarHtml?: SortOrder
    theme?: SortOrder
    magicKey?: SortOrder
    privateKey?: SortOrder
  }

  export type UserSumOrderByAggregateInput = {
    id?: SortOrder
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

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
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

  export type UserRemoteLocalUsernameProfileUrlCompoundUniqueInput = {
    localUsername: string
    profileUrl: string
  }

  export type UserRemoteLocalUsernameActivityPubActorUrlCompoundUniqueInput = {
    localUsername: string
    activityPubActorUrl: string
  }

  export type UserRemoteCountOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    localUsername?: SortOrder
    username?: SortOrder
    name?: SortOrder
    profileUrl?: SortOrder
    feedUrl?: SortOrder
    magicKey?: SortOrder
    salmonUrl?: SortOrder
    activityPubActorUrl?: SortOrder
    activityPubInboxUrl?: SortOrder
    webmentionUrl?: SortOrder
    hubUrl?: SortOrder
    follower?: SortOrder
    following?: SortOrder
    avatar?: SortOrder
    favicon?: SortOrder
    order?: SortOrder
    sortType?: SortOrder
  }

  export type UserRemoteAvgOrderByAggregateInput = {
    id?: SortOrder
    order?: SortOrder
  }

  export type UserRemoteMaxOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    localUsername?: SortOrder
    username?: SortOrder
    name?: SortOrder
    profileUrl?: SortOrder
    feedUrl?: SortOrder
    magicKey?: SortOrder
    salmonUrl?: SortOrder
    activityPubActorUrl?: SortOrder
    activityPubInboxUrl?: SortOrder
    webmentionUrl?: SortOrder
    hubUrl?: SortOrder
    follower?: SortOrder
    following?: SortOrder
    avatar?: SortOrder
    favicon?: SortOrder
    order?: SortOrder
    sortType?: SortOrder
  }

  export type UserRemoteMinOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    localUsername?: SortOrder
    username?: SortOrder
    name?: SortOrder
    profileUrl?: SortOrder
    feedUrl?: SortOrder
    magicKey?: SortOrder
    salmonUrl?: SortOrder
    activityPubActorUrl?: SortOrder
    activityPubInboxUrl?: SortOrder
    webmentionUrl?: SortOrder
    hubUrl?: SortOrder
    follower?: SortOrder
    following?: SortOrder
    avatar?: SortOrder
    favicon?: SortOrder
    order?: SortOrder
    sortType?: SortOrder
  }

  export type UserRemoteSumOrderByAggregateInput = {
    id?: SortOrder
    order?: SortOrder
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type UserScalarRelationFilter = {
    is?: UserWhereInput
    isNot?: UserWhereInput
  }

  export type ContentUsernameNameCompoundUniqueInput = {
    username: string
    name: string
  }

  export type ContentCountOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    username?: SortOrder
    section?: SortOrder
    album?: SortOrder
    name?: SortOrder
    template?: SortOrder
    sortType?: SortOrder
    redirect?: SortOrder
    hidden?: SortOrder
    title?: SortOrder
    thumb?: SortOrder
    order?: SortOrder
    count?: SortOrder
    countRobot?: SortOrder
    commentsCount?: SortOrder
    commentsUpdated?: SortOrder
    favoritesCount?: SortOrder
    thread?: SortOrder
    threadUser?: SortOrder
    avatar?: SortOrder
    style?: SortOrder
    code?: SortOrder
    view?: SortOrder
    content?: SortOrder
  }

  export type ContentAvgOrderByAggregateInput = {
    id?: SortOrder
    redirect?: SortOrder
    order?: SortOrder
    count?: SortOrder
    countRobot?: SortOrder
    commentsCount?: SortOrder
    favoritesCount?: SortOrder
  }

  export type ContentMaxOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    username?: SortOrder
    section?: SortOrder
    album?: SortOrder
    name?: SortOrder
    template?: SortOrder
    sortType?: SortOrder
    redirect?: SortOrder
    hidden?: SortOrder
    title?: SortOrder
    thumb?: SortOrder
    order?: SortOrder
    count?: SortOrder
    countRobot?: SortOrder
    commentsCount?: SortOrder
    commentsUpdated?: SortOrder
    favoritesCount?: SortOrder
    thread?: SortOrder
    threadUser?: SortOrder
    avatar?: SortOrder
    style?: SortOrder
    code?: SortOrder
    view?: SortOrder
    content?: SortOrder
  }

  export type ContentMinOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    username?: SortOrder
    section?: SortOrder
    album?: SortOrder
    name?: SortOrder
    template?: SortOrder
    sortType?: SortOrder
    redirect?: SortOrder
    hidden?: SortOrder
    title?: SortOrder
    thumb?: SortOrder
    order?: SortOrder
    count?: SortOrder
    countRobot?: SortOrder
    commentsCount?: SortOrder
    commentsUpdated?: SortOrder
    favoritesCount?: SortOrder
    thread?: SortOrder
    threadUser?: SortOrder
    avatar?: SortOrder
    style?: SortOrder
    code?: SortOrder
    view?: SortOrder
    content?: SortOrder
  }

  export type ContentSumOrderByAggregateInput = {
    id?: SortOrder
    redirect?: SortOrder
    order?: SortOrder
    count?: SortOrder
    countRobot?: SortOrder
    commentsCount?: SortOrder
    favoritesCount?: SortOrder
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type ContentRemoteToUsernameFromUsernamePostIdCompoundUniqueInput = {
    toUsername: string
    fromUsername: string
    postId: string
  }

  export type ContentRemoteCountOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    toUsername?: SortOrder
    localContentName?: SortOrder
    fromUsername?: SortOrder
    fromUserRemoteId?: SortOrder
    commentUser?: SortOrder
    username?: SortOrder
    creator?: SortOrder
    avatar?: SortOrder
    title?: SortOrder
    postId?: SortOrder
    link?: SortOrder
    commentsUpdated?: SortOrder
    commentsCount?: SortOrder
    thread?: SortOrder
    type?: SortOrder
    favorited?: SortOrder
    read?: SortOrder
    isSpam?: SortOrder
    deleted?: SortOrder
    view?: SortOrder
    content?: SortOrder
  }

  export type ContentRemoteAvgOrderByAggregateInput = {
    id?: SortOrder
    commentsCount?: SortOrder
  }

  export type ContentRemoteMaxOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    toUsername?: SortOrder
    localContentName?: SortOrder
    fromUsername?: SortOrder
    fromUserRemoteId?: SortOrder
    commentUser?: SortOrder
    username?: SortOrder
    creator?: SortOrder
    avatar?: SortOrder
    title?: SortOrder
    postId?: SortOrder
    link?: SortOrder
    commentsUpdated?: SortOrder
    commentsCount?: SortOrder
    thread?: SortOrder
    type?: SortOrder
    favorited?: SortOrder
    read?: SortOrder
    isSpam?: SortOrder
    deleted?: SortOrder
    view?: SortOrder
    content?: SortOrder
  }

  export type ContentRemoteMinOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    toUsername?: SortOrder
    localContentName?: SortOrder
    fromUsername?: SortOrder
    fromUserRemoteId?: SortOrder
    commentUser?: SortOrder
    username?: SortOrder
    creator?: SortOrder
    avatar?: SortOrder
    title?: SortOrder
    postId?: SortOrder
    link?: SortOrder
    commentsUpdated?: SortOrder
    commentsCount?: SortOrder
    thread?: SortOrder
    type?: SortOrder
    favorited?: SortOrder
    read?: SortOrder
    isSpam?: SortOrder
    deleted?: SortOrder
    view?: SortOrder
    content?: SortOrder
  }

  export type ContentRemoteSumOrderByAggregateInput = {
    id?: SortOrder
    commentsCount?: SortOrder
  }

  export type ContentCreateNestedManyWithoutUserInput = {
    create?: XOR<ContentCreateWithoutUserInput, ContentUncheckedCreateWithoutUserInput> | ContentCreateWithoutUserInput[] | ContentUncheckedCreateWithoutUserInput[]
    connectOrCreate?: ContentCreateOrConnectWithoutUserInput | ContentCreateOrConnectWithoutUserInput[]
    createMany?: ContentCreateManyUserInputEnvelope
    connect?: ContentWhereUniqueInput | ContentWhereUniqueInput[]
  }

  export type ContentRemoteCreateNestedManyWithoutToUserInput = {
    create?: XOR<ContentRemoteCreateWithoutToUserInput, ContentRemoteUncheckedCreateWithoutToUserInput> | ContentRemoteCreateWithoutToUserInput[] | ContentRemoteUncheckedCreateWithoutToUserInput[]
    connectOrCreate?: ContentRemoteCreateOrConnectWithoutToUserInput | ContentRemoteCreateOrConnectWithoutToUserInput[]
    createMany?: ContentRemoteCreateManyToUserInputEnvelope
    connect?: ContentRemoteWhereUniqueInput | ContentRemoteWhereUniqueInput[]
  }

  export type ContentUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<ContentCreateWithoutUserInput, ContentUncheckedCreateWithoutUserInput> | ContentCreateWithoutUserInput[] | ContentUncheckedCreateWithoutUserInput[]
    connectOrCreate?: ContentCreateOrConnectWithoutUserInput | ContentCreateOrConnectWithoutUserInput[]
    createMany?: ContentCreateManyUserInputEnvelope
    connect?: ContentWhereUniqueInput | ContentWhereUniqueInput[]
  }

  export type ContentRemoteUncheckedCreateNestedManyWithoutToUserInput = {
    create?: XOR<ContentRemoteCreateWithoutToUserInput, ContentRemoteUncheckedCreateWithoutToUserInput> | ContentRemoteCreateWithoutToUserInput[] | ContentRemoteUncheckedCreateWithoutToUserInput[]
    connectOrCreate?: ContentRemoteCreateOrConnectWithoutToUserInput | ContentRemoteCreateOrConnectWithoutToUserInput[]
    createMany?: ContentRemoteCreateManyToUserInputEnvelope
    connect?: ContentRemoteWhereUniqueInput | ContentRemoteWhereUniqueInput[]
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type ContentUpdateManyWithoutUserNestedInput = {
    create?: XOR<ContentCreateWithoutUserInput, ContentUncheckedCreateWithoutUserInput> | ContentCreateWithoutUserInput[] | ContentUncheckedCreateWithoutUserInput[]
    connectOrCreate?: ContentCreateOrConnectWithoutUserInput | ContentCreateOrConnectWithoutUserInput[]
    upsert?: ContentUpsertWithWhereUniqueWithoutUserInput | ContentUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: ContentCreateManyUserInputEnvelope
    set?: ContentWhereUniqueInput | ContentWhereUniqueInput[]
    disconnect?: ContentWhereUniqueInput | ContentWhereUniqueInput[]
    delete?: ContentWhereUniqueInput | ContentWhereUniqueInput[]
    connect?: ContentWhereUniqueInput | ContentWhereUniqueInput[]
    update?: ContentUpdateWithWhereUniqueWithoutUserInput | ContentUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: ContentUpdateManyWithWhereWithoutUserInput | ContentUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: ContentScalarWhereInput | ContentScalarWhereInput[]
  }

  export type ContentRemoteUpdateManyWithoutToUserNestedInput = {
    create?: XOR<ContentRemoteCreateWithoutToUserInput, ContentRemoteUncheckedCreateWithoutToUserInput> | ContentRemoteCreateWithoutToUserInput[] | ContentRemoteUncheckedCreateWithoutToUserInput[]
    connectOrCreate?: ContentRemoteCreateOrConnectWithoutToUserInput | ContentRemoteCreateOrConnectWithoutToUserInput[]
    upsert?: ContentRemoteUpsertWithWhereUniqueWithoutToUserInput | ContentRemoteUpsertWithWhereUniqueWithoutToUserInput[]
    createMany?: ContentRemoteCreateManyToUserInputEnvelope
    set?: ContentRemoteWhereUniqueInput | ContentRemoteWhereUniqueInput[]
    disconnect?: ContentRemoteWhereUniqueInput | ContentRemoteWhereUniqueInput[]
    delete?: ContentRemoteWhereUniqueInput | ContentRemoteWhereUniqueInput[]
    connect?: ContentRemoteWhereUniqueInput | ContentRemoteWhereUniqueInput[]
    update?: ContentRemoteUpdateWithWhereUniqueWithoutToUserInput | ContentRemoteUpdateWithWhereUniqueWithoutToUserInput[]
    updateMany?: ContentRemoteUpdateManyWithWhereWithoutToUserInput | ContentRemoteUpdateManyWithWhereWithoutToUserInput[]
    deleteMany?: ContentRemoteScalarWhereInput | ContentRemoteScalarWhereInput[]
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type ContentUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<ContentCreateWithoutUserInput, ContentUncheckedCreateWithoutUserInput> | ContentCreateWithoutUserInput[] | ContentUncheckedCreateWithoutUserInput[]
    connectOrCreate?: ContentCreateOrConnectWithoutUserInput | ContentCreateOrConnectWithoutUserInput[]
    upsert?: ContentUpsertWithWhereUniqueWithoutUserInput | ContentUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: ContentCreateManyUserInputEnvelope
    set?: ContentWhereUniqueInput | ContentWhereUniqueInput[]
    disconnect?: ContentWhereUniqueInput | ContentWhereUniqueInput[]
    delete?: ContentWhereUniqueInput | ContentWhereUniqueInput[]
    connect?: ContentWhereUniqueInput | ContentWhereUniqueInput[]
    update?: ContentUpdateWithWhereUniqueWithoutUserInput | ContentUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: ContentUpdateManyWithWhereWithoutUserInput | ContentUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: ContentScalarWhereInput | ContentScalarWhereInput[]
  }

  export type ContentRemoteUncheckedUpdateManyWithoutToUserNestedInput = {
    create?: XOR<ContentRemoteCreateWithoutToUserInput, ContentRemoteUncheckedCreateWithoutToUserInput> | ContentRemoteCreateWithoutToUserInput[] | ContentRemoteUncheckedCreateWithoutToUserInput[]
    connectOrCreate?: ContentRemoteCreateOrConnectWithoutToUserInput | ContentRemoteCreateOrConnectWithoutToUserInput[]
    upsert?: ContentRemoteUpsertWithWhereUniqueWithoutToUserInput | ContentRemoteUpsertWithWhereUniqueWithoutToUserInput[]
    createMany?: ContentRemoteCreateManyToUserInputEnvelope
    set?: ContentRemoteWhereUniqueInput | ContentRemoteWhereUniqueInput[]
    disconnect?: ContentRemoteWhereUniqueInput | ContentRemoteWhereUniqueInput[]
    delete?: ContentRemoteWhereUniqueInput | ContentRemoteWhereUniqueInput[]
    connect?: ContentRemoteWhereUniqueInput | ContentRemoteWhereUniqueInput[]
    update?: ContentRemoteUpdateWithWhereUniqueWithoutToUserInput | ContentRemoteUpdateWithWhereUniqueWithoutToUserInput[]
    updateMany?: ContentRemoteUpdateManyWithWhereWithoutToUserInput | ContentRemoteUpdateManyWithWhereWithoutToUserInput[]
    deleteMany?: ContentRemoteScalarWhereInput | ContentRemoteScalarWhereInput[]
  }

  export type UserCreateNestedOneWithoutContentInput = {
    create?: XOR<UserCreateWithoutContentInput, UserUncheckedCreateWithoutContentInput>
    connectOrCreate?: UserCreateOrConnectWithoutContentInput
    connect?: UserWhereUniqueInput
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type UserUpdateOneRequiredWithoutContentNestedInput = {
    create?: XOR<UserCreateWithoutContentInput, UserUncheckedCreateWithoutContentInput>
    connectOrCreate?: UserCreateOrConnectWithoutContentInput
    upsert?: UserUpsertWithoutContentInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutContentInput, UserUpdateWithoutContentInput>, UserUncheckedUpdateWithoutContentInput>
  }

  export type UserCreateNestedOneWithoutContentRemoteInput = {
    create?: XOR<UserCreateWithoutContentRemoteInput, UserUncheckedCreateWithoutContentRemoteInput>
    connectOrCreate?: UserCreateOrConnectWithoutContentRemoteInput
    connect?: UserWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutContentRemoteNestedInput = {
    create?: XOR<UserCreateWithoutContentRemoteInput, UserUncheckedCreateWithoutContentRemoteInput>
    connectOrCreate?: UserCreateOrConnectWithoutContentRemoteInput
    upsert?: UserUpsertWithoutContentRemoteInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutContentRemoteInput, UserUpdateWithoutContentRemoteInput>, UserUncheckedUpdateWithoutContentRemoteInput>
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

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
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

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
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

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
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

  export type ContentCreateWithoutUserInput = {
    createdAt?: Date | string | null
    updatedAt?: Date | string | null
    section: string
    album: string
    name: string
    template?: string | null
    sortType?: string | null
    redirect?: number | null
    hidden?: boolean
    title: string
    thumb: string
    order?: number
    count?: number
    countRobot?: number
    commentsCount?: number
    commentsUpdated?: Date | string | null
    favoritesCount?: number
    thread?: string | null
    threadUser?: string | null
    avatar?: string | null
    style: string
    code: string
    view: string
    content?: string | null
  }

  export type ContentUncheckedCreateWithoutUserInput = {
    id?: number
    createdAt?: Date | string | null
    updatedAt?: Date | string | null
    section: string
    album: string
    name: string
    template?: string | null
    sortType?: string | null
    redirect?: number | null
    hidden?: boolean
    title: string
    thumb: string
    order?: number
    count?: number
    countRobot?: number
    commentsCount?: number
    commentsUpdated?: Date | string | null
    favoritesCount?: number
    thread?: string | null
    threadUser?: string | null
    avatar?: string | null
    style: string
    code: string
    view: string
    content?: string | null
  }

  export type ContentCreateOrConnectWithoutUserInput = {
    where: ContentWhereUniqueInput
    create: XOR<ContentCreateWithoutUserInput, ContentUncheckedCreateWithoutUserInput>
  }

  export type ContentCreateManyUserInputEnvelope = {
    data: ContentCreateManyUserInput | ContentCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type ContentRemoteCreateWithoutToUserInput = {
    createdAt?: Date | string | null
    updatedAt?: Date | string | null
    localContentName?: string | null
    fromUsername?: string | null
    fromUserRemoteId?: string | null
    commentUser?: string | null
    username: string
    creator?: string | null
    avatar?: string | null
    title: string
    postId: string
    link: string
    commentsUpdated?: Date | string | null
    commentsCount?: number
    thread?: string | null
    type: string
    favorited?: boolean
    read?: boolean
    isSpam?: boolean
    deleted?: boolean
    view: string
    content?: string | null
  }

  export type ContentRemoteUncheckedCreateWithoutToUserInput = {
    id?: number
    createdAt?: Date | string | null
    updatedAt?: Date | string | null
    localContentName?: string | null
    fromUsername?: string | null
    fromUserRemoteId?: string | null
    commentUser?: string | null
    username: string
    creator?: string | null
    avatar?: string | null
    title: string
    postId: string
    link: string
    commentsUpdated?: Date | string | null
    commentsCount?: number
    thread?: string | null
    type: string
    favorited?: boolean
    read?: boolean
    isSpam?: boolean
    deleted?: boolean
    view: string
    content?: string | null
  }

  export type ContentRemoteCreateOrConnectWithoutToUserInput = {
    where: ContentRemoteWhereUniqueInput
    create: XOR<ContentRemoteCreateWithoutToUserInput, ContentRemoteUncheckedCreateWithoutToUserInput>
  }

  export type ContentRemoteCreateManyToUserInputEnvelope = {
    data: ContentRemoteCreateManyToUserInput | ContentRemoteCreateManyToUserInput[]
    skipDuplicates?: boolean
  }

  export type ContentUpsertWithWhereUniqueWithoutUserInput = {
    where: ContentWhereUniqueInput
    update: XOR<ContentUpdateWithoutUserInput, ContentUncheckedUpdateWithoutUserInput>
    create: XOR<ContentCreateWithoutUserInput, ContentUncheckedCreateWithoutUserInput>
  }

  export type ContentUpdateWithWhereUniqueWithoutUserInput = {
    where: ContentWhereUniqueInput
    data: XOR<ContentUpdateWithoutUserInput, ContentUncheckedUpdateWithoutUserInput>
  }

  export type ContentUpdateManyWithWhereWithoutUserInput = {
    where: ContentScalarWhereInput
    data: XOR<ContentUpdateManyMutationInput, ContentUncheckedUpdateManyWithoutUserInput>
  }

  export type ContentScalarWhereInput = {
    AND?: ContentScalarWhereInput | ContentScalarWhereInput[]
    OR?: ContentScalarWhereInput[]
    NOT?: ContentScalarWhereInput | ContentScalarWhereInput[]
    id?: IntFilter<"Content"> | number
    createdAt?: DateTimeNullableFilter<"Content"> | Date | string | null
    updatedAt?: DateTimeNullableFilter<"Content"> | Date | string | null
    username?: StringFilter<"Content"> | string
    section?: StringFilter<"Content"> | string
    album?: StringFilter<"Content"> | string
    name?: StringFilter<"Content"> | string
    template?: StringNullableFilter<"Content"> | string | null
    sortType?: StringNullableFilter<"Content"> | string | null
    redirect?: IntNullableFilter<"Content"> | number | null
    hidden?: BoolFilter<"Content"> | boolean
    title?: StringFilter<"Content"> | string
    thumb?: StringFilter<"Content"> | string
    order?: IntFilter<"Content"> | number
    count?: IntFilter<"Content"> | number
    countRobot?: IntFilter<"Content"> | number
    commentsCount?: IntFilter<"Content"> | number
    commentsUpdated?: DateTimeNullableFilter<"Content"> | Date | string | null
    favoritesCount?: IntFilter<"Content"> | number
    thread?: StringNullableFilter<"Content"> | string | null
    threadUser?: StringNullableFilter<"Content"> | string | null
    avatar?: StringNullableFilter<"Content"> | string | null
    style?: StringFilter<"Content"> | string
    code?: StringFilter<"Content"> | string
    view?: StringFilter<"Content"> | string
    content?: StringNullableFilter<"Content"> | string | null
  }

  export type ContentRemoteUpsertWithWhereUniqueWithoutToUserInput = {
    where: ContentRemoteWhereUniqueInput
    update: XOR<ContentRemoteUpdateWithoutToUserInput, ContentRemoteUncheckedUpdateWithoutToUserInput>
    create: XOR<ContentRemoteCreateWithoutToUserInput, ContentRemoteUncheckedCreateWithoutToUserInput>
  }

  export type ContentRemoteUpdateWithWhereUniqueWithoutToUserInput = {
    where: ContentRemoteWhereUniqueInput
    data: XOR<ContentRemoteUpdateWithoutToUserInput, ContentRemoteUncheckedUpdateWithoutToUserInput>
  }

  export type ContentRemoteUpdateManyWithWhereWithoutToUserInput = {
    where: ContentRemoteScalarWhereInput
    data: XOR<ContentRemoteUpdateManyMutationInput, ContentRemoteUncheckedUpdateManyWithoutToUserInput>
  }

  export type ContentRemoteScalarWhereInput = {
    AND?: ContentRemoteScalarWhereInput | ContentRemoteScalarWhereInput[]
    OR?: ContentRemoteScalarWhereInput[]
    NOT?: ContentRemoteScalarWhereInput | ContentRemoteScalarWhereInput[]
    id?: IntFilter<"ContentRemote"> | number
    createdAt?: DateTimeNullableFilter<"ContentRemote"> | Date | string | null
    updatedAt?: DateTimeNullableFilter<"ContentRemote"> | Date | string | null
    toUsername?: StringFilter<"ContentRemote"> | string
    localContentName?: StringNullableFilter<"ContentRemote"> | string | null
    fromUsername?: StringNullableFilter<"ContentRemote"> | string | null
    fromUserRemoteId?: StringNullableFilter<"ContentRemote"> | string | null
    commentUser?: StringNullableFilter<"ContentRemote"> | string | null
    username?: StringFilter<"ContentRemote"> | string
    creator?: StringNullableFilter<"ContentRemote"> | string | null
    avatar?: StringNullableFilter<"ContentRemote"> | string | null
    title?: StringFilter<"ContentRemote"> | string
    postId?: StringFilter<"ContentRemote"> | string
    link?: StringFilter<"ContentRemote"> | string
    commentsUpdated?: DateTimeNullableFilter<"ContentRemote"> | Date | string | null
    commentsCount?: IntFilter<"ContentRemote"> | number
    thread?: StringNullableFilter<"ContentRemote"> | string | null
    type?: StringFilter<"ContentRemote"> | string
    favorited?: BoolFilter<"ContentRemote"> | boolean
    read?: BoolFilter<"ContentRemote"> | boolean
    isSpam?: BoolFilter<"ContentRemote"> | boolean
    deleted?: BoolFilter<"ContentRemote"> | boolean
    view?: StringFilter<"ContentRemote"> | string
    content?: StringNullableFilter<"ContentRemote"> | string | null
  }

  export type UserCreateWithoutContentInput = {
    createdAt?: Date | string | null
    updatedAt?: Date | string | null
    username: string
    name: string
    email: string
    superuser?: boolean
    title: string
    description?: string | null
    hostname?: string | null
    license?: string | null
    googleAnalytics?: string | null
    favicon?: string | null
    logo?: string | null
    viewport?: string | null
    sidebarHtml?: string | null
    theme: string
    magicKey: string
    privateKey: string
    ContentRemote?: ContentRemoteCreateNestedManyWithoutToUserInput
  }

  export type UserUncheckedCreateWithoutContentInput = {
    id?: number
    createdAt?: Date | string | null
    updatedAt?: Date | string | null
    username: string
    name: string
    email: string
    superuser?: boolean
    title: string
    description?: string | null
    hostname?: string | null
    license?: string | null
    googleAnalytics?: string | null
    favicon?: string | null
    logo?: string | null
    viewport?: string | null
    sidebarHtml?: string | null
    theme: string
    magicKey: string
    privateKey: string
    ContentRemote?: ContentRemoteUncheckedCreateNestedManyWithoutToUserInput
  }

  export type UserCreateOrConnectWithoutContentInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutContentInput, UserUncheckedCreateWithoutContentInput>
  }

  export type UserUpsertWithoutContentInput = {
    update: XOR<UserUpdateWithoutContentInput, UserUncheckedUpdateWithoutContentInput>
    create: XOR<UserCreateWithoutContentInput, UserUncheckedCreateWithoutContentInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutContentInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutContentInput, UserUncheckedUpdateWithoutContentInput>
  }

  export type UserUpdateWithoutContentInput = {
    createdAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    updatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    username?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    superuser?: BoolFieldUpdateOperationsInput | boolean
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    hostname?: NullableStringFieldUpdateOperationsInput | string | null
    license?: NullableStringFieldUpdateOperationsInput | string | null
    googleAnalytics?: NullableStringFieldUpdateOperationsInput | string | null
    favicon?: NullableStringFieldUpdateOperationsInput | string | null
    logo?: NullableStringFieldUpdateOperationsInput | string | null
    viewport?: NullableStringFieldUpdateOperationsInput | string | null
    sidebarHtml?: NullableStringFieldUpdateOperationsInput | string | null
    theme?: StringFieldUpdateOperationsInput | string
    magicKey?: StringFieldUpdateOperationsInput | string
    privateKey?: StringFieldUpdateOperationsInput | string
    ContentRemote?: ContentRemoteUpdateManyWithoutToUserNestedInput
  }

  export type UserUncheckedUpdateWithoutContentInput = {
    id?: IntFieldUpdateOperationsInput | number
    createdAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    updatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    username?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    superuser?: BoolFieldUpdateOperationsInput | boolean
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    hostname?: NullableStringFieldUpdateOperationsInput | string | null
    license?: NullableStringFieldUpdateOperationsInput | string | null
    googleAnalytics?: NullableStringFieldUpdateOperationsInput | string | null
    favicon?: NullableStringFieldUpdateOperationsInput | string | null
    logo?: NullableStringFieldUpdateOperationsInput | string | null
    viewport?: NullableStringFieldUpdateOperationsInput | string | null
    sidebarHtml?: NullableStringFieldUpdateOperationsInput | string | null
    theme?: StringFieldUpdateOperationsInput | string
    magicKey?: StringFieldUpdateOperationsInput | string
    privateKey?: StringFieldUpdateOperationsInput | string
    ContentRemote?: ContentRemoteUncheckedUpdateManyWithoutToUserNestedInput
  }

  export type UserCreateWithoutContentRemoteInput = {
    createdAt?: Date | string | null
    updatedAt?: Date | string | null
    username: string
    name: string
    email: string
    superuser?: boolean
    title: string
    description?: string | null
    hostname?: string | null
    license?: string | null
    googleAnalytics?: string | null
    favicon?: string | null
    logo?: string | null
    viewport?: string | null
    sidebarHtml?: string | null
    theme: string
    magicKey: string
    privateKey: string
    Content?: ContentCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutContentRemoteInput = {
    id?: number
    createdAt?: Date | string | null
    updatedAt?: Date | string | null
    username: string
    name: string
    email: string
    superuser?: boolean
    title: string
    description?: string | null
    hostname?: string | null
    license?: string | null
    googleAnalytics?: string | null
    favicon?: string | null
    logo?: string | null
    viewport?: string | null
    sidebarHtml?: string | null
    theme: string
    magicKey: string
    privateKey: string
    Content?: ContentUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutContentRemoteInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutContentRemoteInput, UserUncheckedCreateWithoutContentRemoteInput>
  }

  export type UserUpsertWithoutContentRemoteInput = {
    update: XOR<UserUpdateWithoutContentRemoteInput, UserUncheckedUpdateWithoutContentRemoteInput>
    create: XOR<UserCreateWithoutContentRemoteInput, UserUncheckedCreateWithoutContentRemoteInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutContentRemoteInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutContentRemoteInput, UserUncheckedUpdateWithoutContentRemoteInput>
  }

  export type UserUpdateWithoutContentRemoteInput = {
    createdAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    updatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    username?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    superuser?: BoolFieldUpdateOperationsInput | boolean
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    hostname?: NullableStringFieldUpdateOperationsInput | string | null
    license?: NullableStringFieldUpdateOperationsInput | string | null
    googleAnalytics?: NullableStringFieldUpdateOperationsInput | string | null
    favicon?: NullableStringFieldUpdateOperationsInput | string | null
    logo?: NullableStringFieldUpdateOperationsInput | string | null
    viewport?: NullableStringFieldUpdateOperationsInput | string | null
    sidebarHtml?: NullableStringFieldUpdateOperationsInput | string | null
    theme?: StringFieldUpdateOperationsInput | string
    magicKey?: StringFieldUpdateOperationsInput | string
    privateKey?: StringFieldUpdateOperationsInput | string
    Content?: ContentUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutContentRemoteInput = {
    id?: IntFieldUpdateOperationsInput | number
    createdAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    updatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    username?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    superuser?: BoolFieldUpdateOperationsInput | boolean
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    hostname?: NullableStringFieldUpdateOperationsInput | string | null
    license?: NullableStringFieldUpdateOperationsInput | string | null
    googleAnalytics?: NullableStringFieldUpdateOperationsInput | string | null
    favicon?: NullableStringFieldUpdateOperationsInput | string | null
    logo?: NullableStringFieldUpdateOperationsInput | string | null
    viewport?: NullableStringFieldUpdateOperationsInput | string | null
    sidebarHtml?: NullableStringFieldUpdateOperationsInput | string | null
    theme?: StringFieldUpdateOperationsInput | string
    magicKey?: StringFieldUpdateOperationsInput | string
    privateKey?: StringFieldUpdateOperationsInput | string
    Content?: ContentUncheckedUpdateManyWithoutUserNestedInput
  }

  export type ContentCreateManyUserInput = {
    id?: number
    createdAt?: Date | string | null
    updatedAt?: Date | string | null
    section: string
    album: string
    name: string
    template?: string | null
    sortType?: string | null
    redirect?: number | null
    hidden?: boolean
    title: string
    thumb: string
    order?: number
    count?: number
    countRobot?: number
    commentsCount?: number
    commentsUpdated?: Date | string | null
    favoritesCount?: number
    thread?: string | null
    threadUser?: string | null
    avatar?: string | null
    style: string
    code: string
    view: string
    content?: string | null
  }

  export type ContentRemoteCreateManyToUserInput = {
    id?: number
    createdAt?: Date | string | null
    updatedAt?: Date | string | null
    localContentName?: string | null
    fromUsername?: string | null
    fromUserRemoteId?: string | null
    commentUser?: string | null
    username: string
    creator?: string | null
    avatar?: string | null
    title: string
    postId: string
    link: string
    commentsUpdated?: Date | string | null
    commentsCount?: number
    thread?: string | null
    type: string
    favorited?: boolean
    read?: boolean
    isSpam?: boolean
    deleted?: boolean
    view: string
    content?: string | null
  }

  export type ContentUpdateWithoutUserInput = {
    createdAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    updatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    section?: StringFieldUpdateOperationsInput | string
    album?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    template?: NullableStringFieldUpdateOperationsInput | string | null
    sortType?: NullableStringFieldUpdateOperationsInput | string | null
    redirect?: NullableIntFieldUpdateOperationsInput | number | null
    hidden?: BoolFieldUpdateOperationsInput | boolean
    title?: StringFieldUpdateOperationsInput | string
    thumb?: StringFieldUpdateOperationsInput | string
    order?: IntFieldUpdateOperationsInput | number
    count?: IntFieldUpdateOperationsInput | number
    countRobot?: IntFieldUpdateOperationsInput | number
    commentsCount?: IntFieldUpdateOperationsInput | number
    commentsUpdated?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    favoritesCount?: IntFieldUpdateOperationsInput | number
    thread?: NullableStringFieldUpdateOperationsInput | string | null
    threadUser?: NullableStringFieldUpdateOperationsInput | string | null
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    style?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    view?: StringFieldUpdateOperationsInput | string
    content?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ContentUncheckedUpdateWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    createdAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    updatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    section?: StringFieldUpdateOperationsInput | string
    album?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    template?: NullableStringFieldUpdateOperationsInput | string | null
    sortType?: NullableStringFieldUpdateOperationsInput | string | null
    redirect?: NullableIntFieldUpdateOperationsInput | number | null
    hidden?: BoolFieldUpdateOperationsInput | boolean
    title?: StringFieldUpdateOperationsInput | string
    thumb?: StringFieldUpdateOperationsInput | string
    order?: IntFieldUpdateOperationsInput | number
    count?: IntFieldUpdateOperationsInput | number
    countRobot?: IntFieldUpdateOperationsInput | number
    commentsCount?: IntFieldUpdateOperationsInput | number
    commentsUpdated?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    favoritesCount?: IntFieldUpdateOperationsInput | number
    thread?: NullableStringFieldUpdateOperationsInput | string | null
    threadUser?: NullableStringFieldUpdateOperationsInput | string | null
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    style?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    view?: StringFieldUpdateOperationsInput | string
    content?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ContentUncheckedUpdateManyWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    createdAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    updatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    section?: StringFieldUpdateOperationsInput | string
    album?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    template?: NullableStringFieldUpdateOperationsInput | string | null
    sortType?: NullableStringFieldUpdateOperationsInput | string | null
    redirect?: NullableIntFieldUpdateOperationsInput | number | null
    hidden?: BoolFieldUpdateOperationsInput | boolean
    title?: StringFieldUpdateOperationsInput | string
    thumb?: StringFieldUpdateOperationsInput | string
    order?: IntFieldUpdateOperationsInput | number
    count?: IntFieldUpdateOperationsInput | number
    countRobot?: IntFieldUpdateOperationsInput | number
    commentsCount?: IntFieldUpdateOperationsInput | number
    commentsUpdated?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    favoritesCount?: IntFieldUpdateOperationsInput | number
    thread?: NullableStringFieldUpdateOperationsInput | string | null
    threadUser?: NullableStringFieldUpdateOperationsInput | string | null
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    style?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    view?: StringFieldUpdateOperationsInput | string
    content?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ContentRemoteUpdateWithoutToUserInput = {
    createdAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    updatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    localContentName?: NullableStringFieldUpdateOperationsInput | string | null
    fromUsername?: NullableStringFieldUpdateOperationsInput | string | null
    fromUserRemoteId?: NullableStringFieldUpdateOperationsInput | string | null
    commentUser?: NullableStringFieldUpdateOperationsInput | string | null
    username?: StringFieldUpdateOperationsInput | string
    creator?: NullableStringFieldUpdateOperationsInput | string | null
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    postId?: StringFieldUpdateOperationsInput | string
    link?: StringFieldUpdateOperationsInput | string
    commentsUpdated?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    commentsCount?: IntFieldUpdateOperationsInput | number
    thread?: NullableStringFieldUpdateOperationsInput | string | null
    type?: StringFieldUpdateOperationsInput | string
    favorited?: BoolFieldUpdateOperationsInput | boolean
    read?: BoolFieldUpdateOperationsInput | boolean
    isSpam?: BoolFieldUpdateOperationsInput | boolean
    deleted?: BoolFieldUpdateOperationsInput | boolean
    view?: StringFieldUpdateOperationsInput | string
    content?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ContentRemoteUncheckedUpdateWithoutToUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    createdAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    updatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    localContentName?: NullableStringFieldUpdateOperationsInput | string | null
    fromUsername?: NullableStringFieldUpdateOperationsInput | string | null
    fromUserRemoteId?: NullableStringFieldUpdateOperationsInput | string | null
    commentUser?: NullableStringFieldUpdateOperationsInput | string | null
    username?: StringFieldUpdateOperationsInput | string
    creator?: NullableStringFieldUpdateOperationsInput | string | null
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    postId?: StringFieldUpdateOperationsInput | string
    link?: StringFieldUpdateOperationsInput | string
    commentsUpdated?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    commentsCount?: IntFieldUpdateOperationsInput | number
    thread?: NullableStringFieldUpdateOperationsInput | string | null
    type?: StringFieldUpdateOperationsInput | string
    favorited?: BoolFieldUpdateOperationsInput | boolean
    read?: BoolFieldUpdateOperationsInput | boolean
    isSpam?: BoolFieldUpdateOperationsInput | boolean
    deleted?: BoolFieldUpdateOperationsInput | boolean
    view?: StringFieldUpdateOperationsInput | string
    content?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ContentRemoteUncheckedUpdateManyWithoutToUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    createdAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    updatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    localContentName?: NullableStringFieldUpdateOperationsInput | string | null
    fromUsername?: NullableStringFieldUpdateOperationsInput | string | null
    fromUserRemoteId?: NullableStringFieldUpdateOperationsInput | string | null
    commentUser?: NullableStringFieldUpdateOperationsInput | string | null
    username?: StringFieldUpdateOperationsInput | string
    creator?: NullableStringFieldUpdateOperationsInput | string | null
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    postId?: StringFieldUpdateOperationsInput | string
    link?: StringFieldUpdateOperationsInput | string
    commentsUpdated?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    commentsCount?: IntFieldUpdateOperationsInput | number
    thread?: NullableStringFieldUpdateOperationsInput | string | null
    type?: StringFieldUpdateOperationsInput | string
    favorited?: BoolFieldUpdateOperationsInput | boolean
    read?: BoolFieldUpdateOperationsInput | boolean
    isSpam?: BoolFieldUpdateOperationsInput | boolean
    deleted?: BoolFieldUpdateOperationsInput | boolean
    view?: StringFieldUpdateOperationsInput | string
    content?: NullableStringFieldUpdateOperationsInput | string | null
  }



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