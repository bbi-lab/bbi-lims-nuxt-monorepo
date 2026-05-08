CREATE SCHEMA "users";
--> statement-breakpoint
CREATE TABLE "users"."pre_verified_users" (
	"email" text NOT NULL,
	CONSTRAINT "pre_verified_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "users"."user_group_memberships" (
	"user_id" uuid NOT NULL,
	"user_group_id" integer NOT NULL,
	CONSTRAINT "user_group_memberships_user_id_user_group_id_pk" PRIMARY KEY("user_id","user_group_id")
);
--> statement-breakpoint
CREATE TABLE "users"."user_groups" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users"."user_groups_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users"."users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" text NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"password" text NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"code" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "users"."user_group_memberships" ADD CONSTRAINT "user_group_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users"."user_group_memberships" ADD CONSTRAINT "user_group_memberships_user_group_id_user_groups_id_fk" FOREIGN KEY ("user_group_id") REFERENCES "users"."user_groups"("id") ON DELETE no action ON UPDATE no action;