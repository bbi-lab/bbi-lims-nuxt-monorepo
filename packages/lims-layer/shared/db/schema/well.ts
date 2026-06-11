import { sql } from 'drizzle-orm/sql'
import { pgTable, uuid, smallint, varchar, unique, check, timestamp} from 'drizzle-orm/pg-core'
import { plates } from './plate'
import { users } from '../../../server/db/schema/user'
import _ from 'lodash'

export const wells = pgTable('wells', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  plateId: uuid('plate_id').references(() => plates.id).notNull(),
  x: smallint().notNull(),
  y: smallint().notNull(),
}, (t) => [
  unique('unique_plate_coord').on(t.plateId, t.x, t.y),
])

export const wellContents = pgTable('well_contents', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  wellId: uuid('well_id').references(() => wells.id).notNull(),
  wellableId: uuid('wellable_id').references(() => wellables.id).notNull(),
})

// "wellables" table contains PKs and table name for all records that can be stored in wells.
// Each table listed in the "wellable_table_name" check constraint below should have a BEFORE INSERT and BEFORE DELETE
// trigger to automatically update this table. These need to be defined independently of drizzle.
//
// Function to call BEFORE INSERT on each sample table:
//    CREATE OR REPLACE FUNCTION "wellables_insert"()
//      RETURNS TRIGGER AS $$
//      BEGIN
//          INSERT INTO "wellables" (id, table_name) VALUES (NEW.id, TG_TABLE_NAME::regclass::text);
//          RETURN NEW;
//      END;
//    $$ LANGUAGE plpgsql;--> statement-breakpoint
//
// Function to call BEFORE DELETE on each sample table:
//    CREATE OR REPLACE FUNCTION "wellables_delete"()
//      RETURNS TRIGGER AS $$
//      BEGIN
//          DELETE FROM "wellables" WHERE id = OLD.id AND table_name = TG_TABLE_NAME::regclass::text;
//          RETURN OLD;
//      END;
//    $$ LANGUAGE plpgsql;--> statement-breakpoint

const wellableTableNames = (process.env.NUXT_WELLABLE_TABLE_NAMES ?? "").split(",").filter(Boolean)

export const wellables = pgTable('wellables', {
  id: uuid('id').notNull().primaryKey(),
  tableName: varchar('table_name').notNull()
}, (t) => [
   check('wellable_table_name',
    sql`${t.tableName} IN (${wellableTableNames?.length > 0 ? sql.raw(_.map(wellableTableNames, (val) => `'${val}'`).join(', ')) : sql.raw('NULL')})`)
])

export const wellContentSources = pgTable('well_content_sources', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  wellContentId: uuid('well_content_id').references(() => wellContents.id).notNull(),
  sourceWellId: uuid('source_well_id').references(() => wells.id).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  createdBy: uuid('created_by').references(() => users.id),
}, (t) => [
  unique('unique_well_content_id_source_well_id').on(t.wellContentId, t.sourceWellId),
])
