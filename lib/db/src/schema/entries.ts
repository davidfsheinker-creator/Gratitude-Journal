import { pgTable, serial, text, timestamp, integer, boolean, unique } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const entriesTable = pgTable("entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  gratitudeItems: text("gratitude_items").notNull(),
  reflection: text("reflection").notNull().default(""),
  mood: text("mood"),
  starred: boolean("starred").notNull().default(false),
  categories: text("categories").notNull().default("[]"),
  photoPath: text("photo_path"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  unique("entries_user_date_unique").on(t.userId, t.date),
]);

export type Entry = typeof entriesTable.$inferSelect;
