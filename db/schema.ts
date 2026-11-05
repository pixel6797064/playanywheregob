import { pgTable, text, bigint, boolean, primaryKey, index } from "drizzle-orm/pg-core";

export const games = pgTable(
  "games",
  {
    userId: text("user_id").notNull(),
    id: text().notNull(),
    title: text().notNull(),
    host: text().notNull(),
    url: text(),
    local: boolean().notNull().default(false),
    added: bigint({ mode: "number" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.id] }), index("games_user_added_idx").on(t.userId, t.added)],
);
