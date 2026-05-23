import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const entriesTable = pgTable("entries", {
  id: serial("id").primaryKey(),
  date: text("date").notNull().unique(),
  gratitudeItems: text("gratitude_items").notNull(),
  reflection: text("reflection").notNull().default(""),
  mood: text("mood"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertEntrySchema = createInsertSchema(entriesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertEntry = z.infer<typeof insertEntrySchema>;
export type Entry = typeof entriesTable.$inferSelect;
