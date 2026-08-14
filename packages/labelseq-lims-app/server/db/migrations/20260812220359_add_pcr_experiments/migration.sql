CREATE TABLE "pcr_experiments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL UNIQUE,
	"started_on" timestamp DEFAULT now(),
	"pcr_type" text NOT NULL,
	"plate_id" uuid
);
--> statement-breakpoint
ALTER TABLE "pcr_experiments" ADD CONSTRAINT "pcr_experiments_plate_id_plates_id_fkey" FOREIGN KEY ("plate_id") REFERENCES "plates"("id");