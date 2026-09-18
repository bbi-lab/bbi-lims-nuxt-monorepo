CREATE TABLE "general_plasmids" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"full_name" text NOT NULL UNIQUE,
	"short_name" text NOT NULL UNIQUE,
	"benchling_name" text,
	"benchling_link" text,
	"quant" double precision,
	"volume" double precision,
	CONSTRAINT "benchling_link_check" CHECK ("benchling_link" ~* '^https?://.+$')
);
