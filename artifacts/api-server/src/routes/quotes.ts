import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { db, entriesTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";

const router = Router();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

router.post("/entries/:date/quote", requireAuth, async (req, res) => {
  const date = String(req.params.date);

  const [entry] = await db
    .select()
    .from(entriesTable)
    .where(and(eq(entriesTable.userId, req.userId), eq(entriesTable.date, date)))
    .limit(1);

  if (!entry) { res.status(404).json({ error: "Entry not found" }); return; }

  const [user] = await db
    .select({ tradition: usersTable.tradition })
    .from(usersTable)
    .where(eq(usersTable.id, req.userId))
    .limit(1);

  const tradition = user?.tradition ?? "No Preference";

  const gratitudeItems: string[] = (() => {
    try { return JSON.parse(entry.gratitudeItems); } catch { return []; }
  })();

  const traditionLabel = tradition === "No Preference" ? "universal wisdom" : tradition;

  const prompt = `The user practices ${traditionLabel}. Today they wrote they are grateful for: ${gratitudeItems.join(", ")}. Their reflection: ${entry.reflection ?? ""}. Return a single meaningful quote from the ${traditionLabel} tradition that resonates with what they shared. Respond only in JSON: { "quote": string, "source": string, "connection": string }`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      res.status(500).json({ error: "No response from AI" });
      return;
    }

    const raw = textBlock.text.trim().replace(/^```json\s*|^```\s*|```$/gm, "").trim();
    const parsed = JSON.parse(raw) as { quote: string; source: string; connection: string };

    if (!parsed.quote || !parsed.source || !parsed.connection) {
      res.status(500).json({ error: "Invalid AI response format" });
      return;
    }

    res.json({ quote: parsed.quote, source: parsed.source, connection: parsed.connection });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Quote generation failed";
    res.status(500).json({ error: message });
  }
});

export default router;
