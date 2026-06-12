import { type InferSelectModel } from 'drizzle-orm/table'
import { sql } from 'drizzle-orm/sql'
import { pgTable, uuid, smallint, varchar, unique, check, timestamp} from 'drizzle-orm/pg-core'
import { createSelectSchema } from 'drizzle-orm/zod'
import _ from 'lodash'
import { z, ZodObject } from 'zod'
import { plates } from './plate'
import { users } from 'lims-layer/server/db/schema/user'

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

export const wellables = pgTable('wellables', {
  id: uuid('id').notNull().primaryKey(),
  tableName: varchar('table_name').notNull()
}, (t) => [
   check('wellable_table_name',
    sql`${t.tableName} IN (
      'amplification_primers',
      'linearization_primers',
      'homology_arm_primers',
      'homology_arm_puc19_primers',
      'preseq_1_primers',
      'preseq_2_primers',
      'rna_rt_primers',
      'rna_preseq_1_primers',
      'rna_preseq_2_primers',
      'index_primers',
      'dna',
      'rna',
      'pellets',
      'sg_rna_plasmids',
      'snv_lib_plasmids',
      'sg_rna_oligos',
      'external_samples',
      'ha_pcr_products',
      'ha_puc19_pcr_products',
      'ha_puc19_gibson_products',
      'ha_puc19_plasmids',
      'snv_lib_amp_products',
      'snv_lib_lin_products',
      'snv_lib_gibson_products',
      'snv_lib_plasmids',
      'snv_lib_clonal_dna_products',
      'snv_lib_golden_gate_products',
      'clonal_has'
    )`
  )
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

const selectWellSchema = createSelectSchema(wells)
const insertWellSchema = z.object({})

export const schemas: Record<string, ZodObject<any>> = {
    selectWellSchema,
    insertWellSchema
}

const insertWellContentSchema =  createSelectSchema(wellContents).omit({id: true})

export type Well = InferSelectModel<typeof wells>
export type NewWell = z.infer<typeof insertWellSchema>

export type WellContent = InferSelectModel<typeof wellContents>
export type NewWellContent = z.infer<typeof insertWellContentSchema>
