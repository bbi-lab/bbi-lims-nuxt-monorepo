CREATE SCHEMA "users";
--> statement-breakpoint
CREATE TABLE "users"."password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users"."pre_verified_users" (
	"email" text NOT NULL CONSTRAINT "pre_verified_users_email_unique" UNIQUE
);
--> statement-breakpoint
CREATE TABLE "users"."user_group_memberships" (
	"user_id" uuid,
	"user_group_id" integer,
	CONSTRAINT "user_group_memberships_pkey" PRIMARY KEY("user_id","user_group_id")
);
--> statement-breakpoint
CREATE TABLE "users"."user_groups" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users"."user_groups_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users"."users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL,
	"email" text NOT NULL CONSTRAINT "users_email_unique" UNIQUE,
	"is_admin" boolean DEFAULT false NOT NULL,
	"password" text NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"code" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "password_reset_tokens_token_hash_idx" ON "users"."password_reset_tokens" ("token_hash");--> statement-breakpoint
CREATE INDEX "password_reset_tokens_user_id_idx" ON "users"."password_reset_tokens" ("user_id");--> statement-breakpoint
ALTER TABLE "users"."password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "users"."user_group_memberships" ADD CONSTRAINT "user_group_memberships_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id");--> statement-breakpoint
ALTER TABLE "users"."user_group_memberships" ADD CONSTRAINT "user_group_memberships_user_group_id_user_groups_id_fkey" FOREIGN KEY ("user_group_id") REFERENCES "users"."user_groups"("id");