
import type { PgTable, PgColumn } from 'drizzle-orm/pg-core'
import type { ZodObject } from 'zod'

export interface RelationsConfig {
  one?: {
    [relationName: string]: {
      fields:  [PgColumn, ...PgColumn[]],
      referenceTable: PgTable,
      references: [PgColumn, ...PgColumn[]],
      relationName?: string,
    }
  },
  many?: {
    [relationName: string]: {
      table: PgTable,
      schema: ZodObject,
      fields: [PgColumn, ...PgColumn[]],
      relationsConfig?: RelationsConfig,
      relationName?: string,
    }
  },
  oneToOne?: {
    [relationName: string]: {
      table: PgTable<never>,
    }
  },
}
