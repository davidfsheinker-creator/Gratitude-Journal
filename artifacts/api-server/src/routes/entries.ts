import { Router } from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { db, entriesTable } from "@workspace/db";
import { eq, desc, gte, lte, and } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";

const router = Router();

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = MIME_TO_EXT[file.mimetype] ?? ".bin";
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

function imageOnly(
  _req: import("express").Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) {
  if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (JPEG, PNG, GIF, WEBP) are allowed"));
  }
}

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: imageOnly,
});

function parseEntry(row: typeof entriesTable.$inferSelect) {
  return {
    id: row.id,
    date: row.date,
    gratitudeItems: JSON.parse(row.gratitudeItems) as string[],
    reflection: row.reflection,
    mood: row.mood,
    starred: row.starred,
    categories: (() => { try { return JSON.parse(row.categories); } catch { return []; } })(),
    photoPath: row.photoPath ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

router.get("/entries", requireAuth, async (req, res) => {
  const rows = await db
    .select()
    .from(entriesTable)
    .where(eq(entriesTable.userId, req.userId))
    .orderBy(desc(entriesTable.date));
  res.json(rows.map(parseEntry));
});

router.post("/entries", requireAuth, async (req, res) => {
  const { date, gratitudeItems, reflection, mood, categories } = req.body;

  if (!date || !Array.isArray(gratitudeItems) || gratitudeItems.length === 0) {
    res.status(400).json({ error: "date and at least one gratitude item are required" });
    return;
  }

  if (Array.isArray(categories) && categories.length > 4) {
    res.status(400).json({ error: "A maximum of 4 categories is allowed" });
    return;
  }

  const existing = await db
    .select()
    .from(entriesTable)
    .where(and(eq(entriesTable.userId, req.userId), eq(entriesTable.date, date)))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "An entry for this date already exists" });
    return;
  }

  const [row] = await db
    .insert(entriesTable)
    .values({
      userId: req.userId,
      date,
      gratitudeItems: JSON.stringify(gratitudeItems),
      reflection: reflection ?? "",
      mood: mood ?? null,
      categories: JSON.stringify(Array.isArray(categories) ? categories : []),
      starred: false,
    })
    .returning();

  res.status(201).json(parseEntry(row));
});

router.get("/entries/favorites", requireAuth, async (req, res) => {
  const rows = await db
    .select()
    .from(entriesTable)
    .where(and(eq(entriesTable.userId, req.userId), eq(entriesTable.starred, true)))
    .orderBy(desc(entriesTable.date));
  res.json(rows.map(parseEntry));
});

router.get("/entries/onthisday", requireAuth, async (req, res) => {
  const today = new Date();

  const oneWeekAgoDate = new Date(today);
  oneWeekAgoDate.setDate(oneWeekAgoDate.getDate() - 7);

  const oneMonthAgoDate = new Date(today);
  oneMonthAgoDate.setMonth(oneMonthAgoDate.getMonth() - 1);

  const oneYearAgoDate = new Date(today);
  oneYearAgoDate.setFullYear(oneYearAgoDate.getFullYear() - 1);

  const toDate = (d: Date) => d.toISOString().split("T")[0];

  async function findEntry(date: string) {
    const [row] = await db
      .select()
      .from(entriesTable)
      .where(and(eq(entriesTable.userId, req.userId), eq(entriesTable.date, date)))
      .limit(1);
    return row ? parseEntry(row) : null;
  }

  const [oneWeekAgo, oneMonthAgo, oneYearAgo] = await Promise.all([
    findEntry(toDate(oneWeekAgoDate)),
    findEntry(toDate(oneMonthAgoDate)),
    findEntry(toDate(oneYearAgoDate)),
  ]);

  res.json({ oneWeekAgo, oneMonthAgo, oneYearAgo });
});

router.get("/entries/week/:startDate", requireAuth, async (req, res) => {
  const startDate = String(req.params.startDate);
  if (!startDate) { res.status(400).json({ error: "Invalid date" }); return; }

  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const endDate = end.toISOString().split("T")[0];

  const rows = await db
    .select()
    .from(entriesTable)
    .where(
      and(
        eq(entriesTable.userId, req.userId),
        gte(entriesTable.date, startDate),
        lte(entriesTable.date, endDate),
      )
    )
    .orderBy(desc(entriesTable.date));

  const entries = rows.map(parseEntry);
  const moodBreakdown = { great: 0, okay: 0, tough: 0, untagged: 0 };
  const allGratitudeItems: string[] = [];
  const categoryBreakdown: Record<string, number> = {};

  for (const e of entries) {
    if (e.mood === "great") moodBreakdown.great++;
    else if (e.mood === "okay") moodBreakdown.okay++;
    else if (e.mood === "tough") moodBreakdown.tough++;
    else moodBreakdown.untagged++;

    allGratitudeItems.push(...e.gratitudeItems);

    for (const cat of e.categories as string[]) {
      categoryBreakdown[cat] = (categoryBreakdown[cat] ?? 0) + 1;
    }
  }

  res.json({ startDate, endDate, entries, totalEntries: entries.length, moodBreakdown, allGratitudeItems, categoryBreakdown });
});

router.get("/entries/:date", requireAuth, async (req, res) => {
  const date = String(req.params.date);
  const [row] = await db
    .select()
    .from(entriesTable)
    .where(and(eq(entriesTable.userId, req.userId), eq(entriesTable.date, date)))
    .limit(1);

  if (!row) { res.status(404).json({ error: "Entry not found" }); return; }
  res.json(parseEntry(row));
});

router.put("/entries/:date", requireAuth, async (req, res) => {
  const date = String(req.params.date);
  const { gratitudeItems, reflection, mood, starred, categories } = req.body;

  if (categories !== undefined && Array.isArray(categories) && categories.length > 4) {
    res.status(400).json({ error: "A maximum of 4 categories is allowed" });
    return;
  }

  const updateData: Partial<typeof entriesTable.$inferInsert> = {};
  if (gratitudeItems !== undefined) updateData.gratitudeItems = JSON.stringify(gratitudeItems);
  if (reflection !== undefined) updateData.reflection = reflection;
  if (mood !== undefined) updateData.mood = mood ?? null;
  if (starred !== undefined) updateData.starred = starred;
  if (categories !== undefined) updateData.categories = JSON.stringify(categories);

  const [row] = await db
    .update(entriesTable)
    .set(updateData)
    .where(and(eq(entriesTable.userId, req.userId), eq(entriesTable.date, date)))
    .returning();

  if (!row) { res.status(404).json({ error: "Entry not found" }); return; }
  res.json(parseEntry(row));
});

router.post(
  "/entries/:date/photo",
  requireAuth,
  (req, res, next) => {
    upload.single("photo")(req, res, (err) => {
      if (err) {
        res.status(400).json({ error: err instanceof Error ? err.message : "Upload failed" });
        return;
      }
      next();
    });
  },
  async (req, res) => {
    const date = String(req.params.date);

    if (!req.file) { res.status(400).json({ error: "No photo uploaded" }); return; }

    const photoPath = `/uploads/${req.file.filename}`;

    const [row] = await db
      .update(entriesTable)
      .set({ photoPath })
      .where(and(eq(entriesTable.userId, req.userId), eq(entriesTable.date, date)))
      .returning();

    if (!row) {
      fs.unlink(req.file.path, () => {});
      res.status(404).json({ error: "Entry not found" });
      return;
    }
    res.json({ photoPath });
  },
);

export default router;
