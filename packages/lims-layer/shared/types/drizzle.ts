import type { BuildQueryResult, DBQueryConfig, ExtractTablesWithRelations } from 'drizzle-orm'
import {schema} from '../../server/utils/db'
// import type { Exact } from 'type-fest'

type Schema = typeof schema
type TSchema = ExtractTablesWithRelations<Schema>

export type TableNames = keyof TSchema

export type IncludeRelation<TableName extends TableNames> = DBQueryConfig<
  'one' | 'many',
  boolean,
  TSchema,
  TSchema[TableName]
>['with']

export type IncludeColumns<TableName extends TableNames> = DBQueryConfig<
  'one' | 'many',
  boolean,
  TSchema,
  TSchema[TableName]
>['columns']

export type InferResultType<
  TableName extends keyof TSchema,
  With extends IncludeRelation<TableName> | undefined = undefined,
  Columns extends IncludeColumns<TableName> | undefined = undefined,
> = BuildQueryResult<
  TSchema,
  TSchema[TableName],
  {
    with: With,
    columns: Columns
  }
>

type QueryConfig<TableName extends keyof TSchema> = DBQueryConfig<
  'one' | 'many',
  boolean,
  TSchema,
  TSchema[TableName]
>

// export type InferQueryModel<
//   TableName extends keyof TSchema,
//   QBConfig extends Exact<QueryConfig<TableName>, QBConfig> = {} // <-- notice Exact here to prevent invalid keys
// > = BuildQueryResult<TSchema, TSchema[TableName], QBConfig>

// types here can be refined further based on JsonSchema, but this is a good starting point
interface SchemaItems {
  properties?: Record<string, { default?: any }>
  type?: string
  enum?: string[]
  oneOf?: Record<string, SchemaItems>[]
  anyOf?: Record<string, SchemaItems>
  items?: SchemaItems
}
export interface FormSchema {
  properties: Record<string, SchemaItems>
}
