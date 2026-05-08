CREATE TABLE "users"."password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "password_reset_tokens_token_hash_idx" ON "users"."password_reset_tokens" ("token_hash");--> statement-breakpoint
CREATE INDEX "password_reset_tokens_user_id_idx" ON "users"."password_reset_tokens" ("user_id");--> statement-breakpoint
ALTER TABLE "users"."password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "wellables" DROP CONSTRAINT "wellable_table_name", ADD CONSTRAINT "wellable_table_name" CHECK ("table_name" IN (NULL));