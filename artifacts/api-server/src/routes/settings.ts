import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";

const router = Router();

const VALID_TRADITIONS = [
  "Stoicism",
  "Buddhism",
  "Christianity",
  "Islam",
  "Judaism",
  "Hinduism",
  "Taoism",
  "Secular Humanism",
  "Existentialism",
  "No Preference",
];

router.get("/settings", requireAuth, async (req, res) => {
  const [user] = await db
    .select({ tradition: usersTable.tradition })
    .from(usersTable)
    .where(eq(usersTable.id, req.userId))
    .limit(1);

  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json({ tradition: user.tradition });
});

router.put("/settings", requireAuth, async (req, res) => {
  const { tradition } = req.body;

  if (!tradition || !VALID_TRADITIONS.includes(tradition)) {
    res.status(400).json({ error: "Invalid tradition" });
    return;
  }

  const [user] = await db
    .update(usersTable)
    .set({ tradition })
    .where(eq(usersTable.id, req.userId))
    .returning({ tradition: usersTable.tradition });

  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json({ tradition: user.tradition });
});

export default router;
