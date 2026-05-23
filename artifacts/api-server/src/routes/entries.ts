import { Router } from "express";
import { db, entriesTable } from "@workspace/db";
import { eq, desc, gte, lte, and } from "drizzle-orm";
import {
  CreateEntryBody,
  UpdateEntryBody,
  GetEntryByDateParams,
  UpdateEntryParams,
  GetWeeklySummaryParams,
} from "@workspace/api-zod";

const router = Router();

function parseEntry(row: typeof entriesTable.$inferSelect) {
  return {
    id: row.id,
    date: row.date,
    gratitudeItems: JSON.parse(row.gratitudeItems) as string[],
    reflection: row.reflection,
    mood: row.mood,
    createdAt: row.createdAt.toISOString(),
  };
}

router.get("/entries", async (_req, res) => {
  const rows = await db
    .select()
    .from(entriesTable)
    .orderBy(desc(entriesTable.date));
  res.json(rows.map(parseEntry));
});

router.post("/entries", async (req, res) => {
  const parsed = CreateEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { date, gratitudeItems, reflection, mood } = parsed.data;

  const existing = await db
    .select()
    .from(entriesTable)
    .where(eq(entriesTable.date, date))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "An entry for this date already exists" });
    return;
  }

  const [row] = await db
    .insert(entriesTable)
    .values({
      date,
      gratitudeItems: JSON.stringify(gratitudeItems),
      reflection: reflection ?? "",
      mood: mood ?? null,
    })
    .returning();

  res.status(201).json(parseEntry(row));
});

router.get("/entries/week/:startDate", async (req, res) => {
  const parsed = GetWeeklySummaryParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid date" });
    return;
  }

  const { startDate } = parsed.data;
  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  const endDate = end.toISOString().split("T")[0];

  const rows = await db
    .select()
    .from(entriesTable)
    .where(
      and(
        gte(entriesTable.date, startDate),
        lte(entriesTable.date, endDate)
      )
    )
    .orderBy(desc(entriesTable.date));

  const entries = rows.map(parseEntry);

  const moodBreakdown = { great: 0, okay: 0, tough: 0, untagged: 0 };
  const allGratitudeItems: string[] = [];

  for (const e of entries) {
    if (e.mood === "great") moodBreakdown.great++;
    else if (e.mood === "okay") moodBreakdown.okay++;
    else if (e.mood === "tough") moodBreakdown.tough++;
    else moodBreakdown.untagged++;

    allGratitudeItems.push(...e.gratitudeItems);
  }

  res.json({
    startDate,
    endDate,
    entries,
    totalEntries: entries.length,
    moodBreakdown,
    allGratitudeItems,
  });
});

router.get("/entries/:date", async (req, res) => {
  const parsed = GetEntryByDateParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid date" });
    return;
  }

  const { date } = parsed.data;
  const [row] = await db
    .select()
    .from(entriesTable)
    .where(eq(entriesTable.date, date))
    .limit(1);

  if (!row) {
    res.status(404).json({ error: "Entry not found" });
    return;
  }

  res.json(parseEntry(row));
});

router.put("/entries/:date", async (req, res) => {
  const paramsParsed = UpdateEntryParams.safeParse(req.params);
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid date" });
    return;
  }

  const bodyParsed = UpdateEntryBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { date } = paramsParsed.data;
  const { gratitudeItems, reflection, mood } = bodyParsed.data;

  const updateData: Partial<typeof entriesTable.$inferInsert> = {};
  if (gratitudeItems !== undefined) {
    updateData.gratitudeItems = JSON.stringify(gratitudeItems);
  }
  if (reflection !== undefined) {
    updateData.reflection = reflection;
  }
  if (mood !== undefined) {
    updateData.mood = mood ?? null;
  }

  const [row] = await db
    .update(entriesTable)
    .set(updateData)
    .where(eq(entriesTable.date, date))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Entry not found" });
    return;
  }

  res.json(parseEntry(row));
});

export default router;
