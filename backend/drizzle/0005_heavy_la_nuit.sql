CREATE TABLE "keywords" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"keyword" text NOT NULL,
	"source" text DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "cpf" varchar(14);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "technologies" text[] DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "level" varchar(50);--> statement-breakpoint
CREATE UNIQUE INDEX "keywords_keyword_unique" ON "keywords" USING btree ("keyword");