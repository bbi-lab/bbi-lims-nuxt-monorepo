import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'

import {users, userGroups, userGroupMemberships} from '../db/schema/user'
import {genes} from '../../shared/db/schema/gene'
import { plates } from '../../shared/db/schema/plate'
import { plateTypes } from '../../shared/db/schema/plateTypes'
import { wellables, wellContents, wellContentSources, wells } from '../../shared/db/schema/well'
import { viewPlatesWithWellCounts } from '../../shared/db/schema/views'
import { relations } from '../db/relations/relations'
import fs from 'node:fs'

// By checking whether useRuntimeConfig is defined, we support use outside the Nuxt lifecycle.
const config = typeof useRuntimeConfig == 'undefined' ? undefined : useRuntimeConfig()

export const schema = {
  // tables
  users,
  userGroups,
  userGroupMemberships,

  genes,
  plates,
  plateTypes,
  wells,
  wellContents,
  wellables,
  wellContentSources,

  // views
  viewPlatesWithWellCounts,
}

const ssl = config?.dbSsl != null ? (config.dbSsl as boolean)
    : (process.env.NUXT_DB_SSL != null ? process.env.NUXT_DB_SSL.toLowerCase() === 'true' : false)
const sslCaFromConfig: string | undefined = (config?.dbSslCa as string | undefined) || process.env.NUXT_DB_SSL_CA
const sslCaPathFromConfig: string | undefined = (config?.dbSslCaPath as string | undefined) || process.env.NUXT_DB_SSL_CA_PATH

// SSL certificate validation must only be bypassed explicitly in development.
// Never disable it in production as it allows silent MITM interception of DB traffic.
let poolSslConfig: false | { ca: string, rejectUnauthorized: true } = false

let caCertificate
if (ssl && (sslCaFromConfig || sslCaPathFromConfig)) {
  if (sslCaFromConfig && sslCaPathFromConfig) {
    throw new Error('Both NUXT_DB_SSL_CA and NUXT_DB_SSL_CA_PATH are set. Please provide only one of these for the DB SSL CA certificate.')
  } else if (sslCaFromConfig) {
    caCertificate = sslCaFromConfig.replace(/\\n/g, '\n').trim()
  } else if (sslCaPathFromConfig) {
    try {
      caCertificate = fs.readFileSync(sslCaPathFromConfig, 'utf8').trim()
    } catch (error) {
      throw new Error(`Failed to read DB SSL CA certificate at "${sslCaPathFromConfig}": ${(error as Error).message}`)
    }
  }

  if (!caCertificate) {
    throw new Error('Database SSL is enabled, but no CA certificate was provided. Set NUXT_DB_SSL_CA or NUXT_DB_SSL_CA_PATH.')
  }

  poolSslConfig = {
    ca: caCertificate,
    rejectUnauthorized: true
  }
}

export const pool = new pg.Pool({
  host: config?.dbHost || process.env.NUXT_DB_HOST || 'localhost',
  port: config?.dbPort || (process.env.NUXT_DB_PORT ? parseInt(process.env.NUXT_DB_PORT) : null) || 5432,
  database: config?.dbDatabaseName || process.env.NUXT_DB_DATABASE_NAME,
  user: config?.dbUsername || process.env.NUXT_DB_USERNAME || 'postgres',
  password: config?.dbPassword || process.env.NUXT_DB_PASSWORD,
  ssl: poolSslConfig,
})

// Add logger: true to options to get query logging.
export const db = drizzle({ client: pool, relations })

export function useDrizzle() {
  return db
}
