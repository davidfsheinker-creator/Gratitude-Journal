import { Router } from "express";
import { db, entriesTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/streak", requireAuth, async (req, res) => {
  const rows = await db
    .select({ date: entriesTable.date })
    .from(entriesTable)
    .where(eq(entriesTable.userId, req.userId))
    .orderBy(desc(entriesTable.date));

  const today = new Date().toISOString().split("T")[0];
  const dates = new Set(rows.map((r) => r.date));

  let currentStreak = 0;
  const cursor = new Date();

  if (dates.has(today)) {
    while (true) {
      const d = cursor.toISOString().split("T")[0];
      if (dates.has(d)) {
        currentStreak++;
        cursor.setDate(cursor.getDate() - 1);
      } else break;
    }
  } else {
    cursor.setDate(cursor.getDate() - 1);
    while (true) {
      const d = cursor.toISOString().split("T")[0];
      if (dates.has(d)) {
        currentStreak++;
        cursor.setDate(cursor.getDate() - 1);
      } else break;
    }
  }

  let longestStreak = 0;
  let tempStreak = 0;
  const sortedDates = [...dates].sort();
  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prev = new Date(sortedDates[i - 1]);
      const curr = new Date(sortedDates[i]);
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      tempStreak = diff === 1 ? tempStreak + 1 : 1;
    }
    if (tempStreak > longestStreak) longestStreak = tempStreak;
  }

  res.json({ currentStreak, longestStreak, todayLogged: dates.has(today) });
});

export default router;
