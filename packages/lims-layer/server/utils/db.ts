import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'

import type { PgTable, PgColumn } from 'drizzle-orm/pg-core'
import {users, userGroups, userGroupMemberships} from '../db/schema/user'
import {genes} from '../db/schema/gene'
import {usersRelations, userGroupsRelations, userGroupMembershipsRelations} from '../db/relations/relations'
import type {ZodObject} from 'zod'

// By checking whether useRuntimeConfig is defined, we support use outside the Nuxt lifecycle.
const config = typeof useRuntimeConfig == 'undefined' ? undefined : useRuntimeConfig()

export const schema = {
  // tables
  users,
  userGroups,
  userGroupMemberships,
  // relations
  usersRelations,
  userGroupsRelations,
  userGroupMembershipsRelations,

  genes,
}

const ssl = config?.ssl != null ? config.ssl
    : (process.env.NUXT_DB_SSL != null ? process.env.NUXT_DB_SSL.toLowerCase() == 'true' : false)
const pool = new pg.Pool({
  host: config?.dbHost || process.env.NUXT_DB_HOST || 'localhost',
  port: config?.dbPort || (process.env.NUXT_DB_PORT ? parseInt(process.env.NUXT_DB_PORT) : null) || 5432,
  database: config?.dbDatabaseName || process.env.NUXT_DB_DATABASE_NAME,
  user: config?.dbUsername || process.env.NUXT_DB_USERNAME || 'postgres',
  password: config?.dbPassword || process.env.NUXT_DB_PASSWORD || 'postgres',
  ssl: ssl ? {
    rejectUnauthorized: false
  } : false
})

// Add logger: true to options to get query logging.
export const db = drizzle(pool, {schema: schema})

export function useDrizzle() {
  return db
}

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
