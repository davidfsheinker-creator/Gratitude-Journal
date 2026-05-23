import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  useGetDailyPrompt,
  useGetStreak,
  useGetEntryByDate,
  useCreateEntry,
  useUpdateEntry,
  getListEntriesQueryKey,
  getGetStreakQueryKey,
  getGetEntryByDateQueryKey,
} from "@workspace/api-client-react";
import { MoodPill, MOODS, type MoodKey } from "@/components/mood-pill";
import { Flame, Pencil, Check, X } from "lucide-react";

const TODAY = new Date().toISOString().split("T")[0];

const AFFIRMATIONS = [
  "You noticed the good today. That matters.",
  "Gratitude is a practice. You showed up.",
  "Small moments, big presence. Well done.",
  "You found the light today.",
  "A grateful heart sees more beauty.",
  "Today you chose to look for the good. Keep looking.",
  "Every entry is a gift to your future self.",
];

function StreakBadge({ streak }: { streak: number; todayLogged: boolean }) {
  return (
    <div className="flex items-center gap-1.5 text-sm font-medium text-amber-600 dark:text-amber-400">
      <span className="text-lg">🔥</span>
      <span>{streak} day{streak !== 1 ? "s" : ""}</span>
    </div>
  );
}

export function Home() {
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const [items, setItems] = useState(["", "", ""]);
  const [reflection, setReflection] = useState("");
  const [mood, setMood] = useState<MoodKey | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showAffirmation, setShowAffirmation] = useState(false);
  const [affirmation, setAffirmation] = useState("");

  const { data: prompt } = useGetDailyPrompt();
  const { data: streak } = useGetStreak();
  const { data: todayEntry, isLoading: entryLoading } = useGetEntryByDate(TODAY, {
    query: {
      queryKey: getGetEntryByDateQueryKey(TODAY),
      retry: false,
    },
  });

  const createEntry = useCreateEntry();
  const updateEntry = useUpdateEntry();

  const hasEntry = !!todayEntry;

  useEffect(() => {
    if (todayEntry && !isEditing) {
      setItems([...(todayEntry.gratitudeItems ?? [""]), "", ""].slice(0, 3));
      setReflection(todayEntry.reflection ?? "");
      setMood((todayEntry.mood as MoodKey) ?? null);
    }
  }, [todayEntry, isEditing]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const gratitudeItems = items.filter((i) => i.trim() !== "");
    if (gratitudeItems.length === 0) return;

    const affirmText = AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)];
    setAffirmation(affirmText);

    if (hasEntry && isEditing) {
      updateEntry.mutate(
        {
          date: TODAY,
          data: { gratitudeItems, reflection, mood: mood ?? null },
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetEntryByDateQueryKey(TODAY) });
            queryClient.invalidateQueries({ queryKey: getListEntriesQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetStreakQueryKey() });
            setIsEditing(false);
            setShowAffirmation(true);
            setTimeout(() => {
              setShowAffirmation(false);
              navigate("/journal");
            }, 2800);
          },
        }
      );
    } else {
      createEntry.mutate(
        {
          data: { date: TODAY, gratitudeItems, reflection, mood: mood ?? null },
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListEntriesQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetStreakQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetEntryByDateQueryKey(TODAY) });
            setShowAffirmation(true);
            setTimeout(() => {
              setShowAffirmation(false);
              navigate("/journal");
            }, 2800);
          },
        }
      );
    }
  }

  if (entryLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-6 py-2">
      <AnimatePresence>
        {showAffirmation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.6 }}
              className="text-center px-8 max-w-sm"
            >
              <div className="text-5xl mb-6">✨</div>
              <p className="font-serif text-2xl text-foreground leading-relaxed">{affirmation}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-foreground">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {hasEntry && !isEditing ? "Today's entry" : "What are you grateful for today?"}
          </p>
        </div>
        {streak && (
          <div className="flex flex-col items-end gap-1">
            <StreakBadge streak={streak.currentStreak} todayLogged={streak.todayLogged} />
            {streak.currentStreak > 0 && (
              <p className="text-xs text-muted-foreground">streak</p>
            )}
          </div>
        )}
      </div>

      {/* Daily Prompt */}
      {prompt && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/30 px-4 py-3"
        >
          <p className="text-xs uppercase tracking-widest text-amber-600/70 dark:text-amber-500/60 font-medium mb-1">Today's Prompt</p>
          <p className="text-sm text-amber-900/80 dark:text-amber-200/80 font-serif italic leading-relaxed">"{prompt.prompt}"</p>
        </motion.div>
      )}

      {/* Read-only view when entry exists and not editing */}
      {hasEntry && !isEditing ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4"
        >
          <div className="rounded-2xl bg-card border border-border/60 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Grateful for</p>
              {todayEntry.mood && <MoodPill mood={todayEntry.mood} />}
            </div>
            <ul className="flex flex-col gap-2">
              {todayEntry.gratitudeItems.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-xs text-muted-foreground mt-0.5 font-mono w-4">{i + 1}.</span>
                  <span className="text-foreground leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
            {todayEntry.reflection && (
              <div className="pt-3 border-t border-border/50">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-2">Reflection</p>
                <p className="text-foreground/80 leading-relaxed text-sm">{todayEntry.reflection}</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors self-start"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit today's entry
          </button>
        </motion.div>
      ) : (
        /* Entry form */
        <motion.form
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="flex flex-col gap-5"
        >
          {/* Gratitude Items */}
          <div className="rounded-2xl bg-card border border-border/60 p-5 flex flex-col gap-3">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">I'm grateful for...</p>
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground font-mono w-4 shrink-0">{i + 1}.</span>
                <input
                  type="text"
                  value={items[i]}
                  onChange={(e) => {
                    const next = [...items];
                    next[i] = e.target.value;
                    setItems(next);
                  }}
                  placeholder={
                    i === 0
                      ? "Something you noticed today..."
                      : i === 1
                      ? "Someone who showed up for you..."
                      : "A small joy or comfort..."
                  }
                  required={i === 0}
                  className="flex-1 bg-transparent border-b border-border/60 focus:border-primary/60 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors"
                />
              </div>
            ))}
          </div>

          {/* Reflection */}
          <div className="rounded-2xl bg-card border border-border/60 p-5 flex flex-col gap-3">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Reflection</p>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="How did today feel? What stood out to you?"
              rows={4}
              className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Mood picker */}
          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">How was today? (optional)</p>
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(MOODS) as MoodKey[]).map((key) => {
                const cfg = MOODS[key];
                const selected = mood === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setMood(selected ? null : key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all ${
                      selected
                        ? cfg.color + " ring-2 ring-offset-1 ring-primary/30"
                        : "border-border text-muted-foreground hover:border-border/80"
                    }`}
                  >
                    <span>{cfg.emoji}</span>
                    <span>{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={createEntry.isPending || updateEntry.isPending || !items[0].trim()}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl py-3 text-sm font-medium disabled:opacity-50 transition-opacity hover:opacity-90"
            >
              <Check className="w-4 h-4" />
              {createEntry.isPending || updateEntry.isPending
                ? "Saving..."
                : isEditing
                ? "Save changes"
                : "Save entry"}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-3 rounded-xl border border-border text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.form>
      )}
    </div>
  );
}
