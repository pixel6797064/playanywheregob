CREATE TABLE "games" (
	"user_id" text,
	"id" text,
	"title" text NOT NULL,
	"host" text NOT NULL,
	"url" text,
	"local" boolean DEFAULT false NOT NULL,
	"added" bigint NOT NULL,
	CONSTRAINT "games_pkey" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE INDEX "games_user_added_idx" ON "games" ("user_id","added");