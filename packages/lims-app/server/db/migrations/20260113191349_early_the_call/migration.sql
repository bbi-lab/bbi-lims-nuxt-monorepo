CREATE TABLE "plates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"size_x" smallint DEFAULT 12 NOT NULL,
	"size_y" smallint DEFAULT 8 NOT NULL,
	"plate_type" varchar NOT NULL,
	"discarded" boolean DEFAULT false,
	"processed" boolean DEFAULT false,
	CONSTRAINT "plates_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "well_content_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"well_content_id" uuid NOT NULL,
	"source_well_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	CONSTRAINT "unique_well_content_id_source_well_id" UNIQUE("well_content_id","source_well_id")
);
--> statement-breakpoint
CREATE TABLE "well_contents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"well_id" uuid NOT NULL,
	"wellable_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wellables" (
	"id" uuid PRIMARY KEY NOT NULL,
	"table_name" varchar NOT NULL,
	CONSTRAINT "wellable_table_name" CHECK ("wellables"."table_name" IN (NULL))
);
--> statement-breakpoint
CREATE TABLE "wells" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plate_id" uuid NOT NULL,
	"x" smallint NOT NULL,
	"y" smallint NOT NULL,
	CONSTRAINT "unique_plate_coord" UNIQUE("plate_id","x","y")
);
--> statement-breakpoint
ALTER TABLE "well_content_sources" ADD CONSTRAINT "well_content_sources_well_content_id_well_contents_id_fk" FOREIGN KEY ("well_content_id") REFERENCES "public"."well_contents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "well_content_sources" ADD CONSTRAINT "well_content_sources_source_well_id_wells_id_fk" FOREIGN KEY ("source_well_id") REFERENCES "public"."wells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "well_content_sources" ADD CONSTRAINT "well_content_sources_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "well_contents" ADD CONSTRAINT "well_contents_well_id_wells_id_fk" FOREIGN KEY ("well_id") REFERENCES "public"."wells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "well_contents" ADD CONSTRAINT "well_contents_wellable_id_wellables_id_fk" FOREIGN KEY ("wellable_id") REFERENCES "public"."wellables"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wells" ADD CONSTRAINT "wells_plate_id_plates_id_fk" FOREIGN KEY ("plate_id") REFERENCES "public"."plates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE VIEW "public"."view_plates_with_well_counts" AS (with plate_types(plate_type_value, plate_type_label, plate_type_desc) AS (VALUES ('mock-plate-type-1', 'Mock Plate Type 1', 'Mock Plate Type 1'), ('mock-plate-type-2', 'Mock Plate Type 2', 'Mock Plate Type 2')) select
    "plates"."id",
    "plates"."name",
    "plates"."size_x",
    "plates"."size_y",
    "plates"."plate_type",
    "plates"."discarded",
    "plates"."processed",
    (select distinct on (plate_type_value) plate_type_label from plate_types where plate_type_value = "plates"."plate_type") as plate_type_label,
    count(distinct("wells"."id")) as wells_count,
    count(distinct("well_contents"."well_id")) as wells_with_content_count,
    count(distinct("well_content_sources"."source_well_id")) as wells_processed_count
    from "plates"
    join "wells" on "plates"."id" = "wells"."plate_id"
    left join "well_content_sources" on "wells"."id" = "well_content_sources"."source_well_id"
    left join "well_contents" on "wells"."id" = "well_contents"."well_id"
    group by "plates"."id");