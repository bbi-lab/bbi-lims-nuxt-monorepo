import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'

import {users, userGroups, userGroupMemberships} from '../db/schema/user'
import {genes} from '../../shared/db/schema/gene'
import { plates } from '../../shared/db/schema/plate'
import { wellables, wellContents, wellContentSources, wells } from '../../shared/db/schema/well'
import { viewPlatesWithWellCounts } from '../../shared/db/schema/views'
import { relations } from '../db/relations/relations'

// By checking whether useRuntimeConfig is defined, we support use outside the Nuxt lifecycle.
const config = typeof useRuntimeConfig == 'undefined' ? undefined : useRuntimeConfig()

export const schema = {
  // tables
  users,
  userGroups,
  userGroupMemberships,

  genes,
  plates,
  wells,
  wellContents,
  wellables,
  wellContentSources,

  // views
  viewPlatesWithWellCounts,
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
export const db = drizzle({ client: pool, relations })

export function useDrizzle() {
  return db
}
