import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  useGetDailyPrompt,
  useGetStreak,
  useGetEntryByDate,
  useCreateEntry,
  useUpdateEntry,
  useUploadEntryPhoto,
  useGetOnThisDay,
  useGenerateQuote,
  getListEntriesQueryKey,
  getGetStreakQueryKey,
  getGetEntryByDateQueryKey,
  getGetFavoritesQueryKey,
  getGetOnThisDayQueryKey,
} from "@workspace/api-client-react";
import { MoodPill, MOODS, type MoodKey } from "@/components/mood-pill";
import { TraditionQuote } from "@/components/tradition-quote";
import { Pencil, Check, X, ImageIcon } from "lucide-react";

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

const CATEGORIES = ["Family", "Health", "Work", "Nature", "Simple Pleasures", "Growth", "Relationships", "Other"];

function formatRelativeDate(dateStr: string) {
  const today = new Date();
  const [y, m, d] = dateStr.split("-").map(Number);
  const target = new Date(y, m - 1, d);
  const diffMs = today.getTime() - target.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 7) return "One week ago";
  if (diffDays >= 28 && diffDays <= 32) return "One month ago";
  if (diffDays >= 363 && diffDays <= 367) return "One year ago";
  const options: Intl.DateTimeFormatOptions = { month: "long", day: "numeric" };
  if (target.getFullYear() !== today.getFullYear()) options.year = "numeric";
  return target.toLocaleDateString("en-US", options);
}

export function Home() {
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const [items, setItems] = useState(["", "", ""]);
  const [reflection, setReflection] = useState("");
  const [mood, setMood] = useState<MoodKey | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showAffirmation, setShowAffirmation] = useState(false);
  const [affirmation, setAffirmation] = useState("");
  const [quote, setQuote] = useState<{ quote: string; source: string; connection: string } | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const MAX_CATEGORIES = 4;
  const photoInputRef = useRef<HTMLInputElement>(null);

  const { data: prompt } = useGetDailyPrompt();
  const { data: streak } = useGetStreak();
  const { data: onThisDay } = useGetOnThisDay({
    query: { queryKey: getGetOnThisDayQueryKey() }
  });
  const { data: todayEntry, isLoading: entryLoading } = useGetEntryByDate(TODAY, {
    query: { queryKey: getGetEntryByDateQueryKey(TODAY), retry: false },
  });

  const createEntry = useCreateEntry();
  const updateEntry = useUpdateEntry();
  const uploadPhoto = useUploadEntryPhoto();
  const generateQuote = useGenerateQuote();
  const hasEntry = !!todayEntry;

  useEffect(() => {
    if (todayEntry && !isEditing) {
      const gi = todayEntry.gratitudeItems ?? [];
      setItems([gi[0] ?? "", gi[1] ?? "", gi[2] ?? ""]);
      setReflection(todayEntry.reflection ?? "");
      setMood((todayEntry.mood as MoodKey) ?? null);
      setSelectedCategories((todayEntry.categories as string[]) ?? []);
    }
  }, [todayEntry, isEditing]);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
  }

  function toggleCategory(cat: string) {
    setSelectedCategories((prev) => {
      if (prev.includes(cat)) return prev.filter((c) => c !== cat);
      if (prev.length >= MAX_CATEGORIES) return prev;
      return [...prev, cat];
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const gratitudeItems = items.filter((i) => i.trim() !== "");
    if (gratitudeItems.length === 0) return;

    const affirmText = AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)];
    setAffirmation(affirmText);

    const invalidateAll = () => {
      queryClient.invalidateQueries({ queryKey: getGetEntryByDateQueryKey(TODAY) });
      queryClient.invalidateQueries({ queryKey: getListEntriesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetStreakQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetFavoritesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetOnThisDayQueryKey() });
    };

    async function doPhotoUpload() {
      if (photoFile) {
        await uploadPhoto.mutateAsync({ date: TODAY, data: { photo: photoFile } });
      }
    }

    async function fetchQuote() {
      setQuoteLoading(true);
      try {
        const q = await generateQuote.mutateAsync({ date: TODAY });
        setQuote(q);
      } catch {
        setQuote(null);
      } finally {
        setQuoteLoading(false);
      }
    }

    const onSaved = async () => {
      await doPhotoUpload();
      invalidateAll();
      setShowAffirmation(true);
      fetchQuote();
      setTimeout(() => {
        setShowAffirmation(false);
        setQuote(null);
        navigate("/journal");
      }, 5000);
    };

    if (hasEntry && isEditing) {
      updateEntry.mutate(
        { date: TODAY, data: { gratitudeItems, reflection, mood: mood ?? null, categories: selectedCategories } },
        { onSuccess: async () => { await onSaved(); setIsEditing(false); } }
      );
    } else {
      createEntry.mutate(
        { data: { date: TODAY, gratitudeItems, reflection, mood: mood ?? null, categories: selectedCategories } },
        { onSuccess: onSaved }
      );
    }
  }

  const onThisDayEntries = [
    { label: "One week ago", entry: onThisDay?.oneWeekAgo },
    { label: "One month ago", entry: onThisDay?.oneMonthAgo },
    { label: "One year ago", entry: onThisDay?.oneYearAgo },
  ].filter(({ entry }) => !!entry);

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
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm overflow-y-auto"
          >
            <motion.div
              initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.6 }}
              className="text-center px-8 max-w-sm w-full flex flex-col gap-6 py-12"
            >
              <div>
                <div className="text-5xl mb-6">✨</div>
                <p className="font-serif text-2xl text-foreground leading-relaxed">{affirmation}</p>
              </div>

              {quoteLoading && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-2 mt-2"
                >
                  <div className="w-px h-8 bg-border" />
                  <div className="w-5 h-5 rounded-full border-2 border-primary/40 border-t-primary animate-spin" />
                  <p className="text-xs text-muted-foreground/50">Finding a quote for you…</p>
                </motion.div>
              )}

              {quote && !quoteLoading && (
                <TraditionQuote
                  quote={quote.quote}
                  source={quote.source}
                  connection={quote.connection}
                />
              )}
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
          <div className="flex flex-col items-end gap-0.5">
            <div className="flex items-center gap-1.5 text-sm font-medium text-amber-600 dark:text-amber-400">
              <span className="text-lg">🔥</span>
              <span>{streak.currentStreak} day{streak.currentStreak !== 1 ? "s" : ""}</span>
            </div>
            <p className="text-xs text-muted-foreground">streak</p>
          </div>
        )}
      </div>

      {/* Daily Prompt */}
      {prompt && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/30 px-4 py-3"
        >
          <p className="text-xs uppercase tracking-widest text-amber-600/70 dark:text-amber-500/60 font-medium mb-1">Today's Prompt</p>
          <p className="text-sm text-amber-900/80 dark:text-amber-200/80 font-serif italic leading-relaxed">"{prompt.prompt}"</p>
        </motion.div>
      )}

      {/* Read-only view */}
      {hasEntry && !isEditing ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
          <div className="rounded-2xl bg-card border border-border/60 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Grateful for</p>
              <div className="flex items-center gap-2 flex-wrap">
                {(todayEntry.categories as string[])?.map((cat) => (
                  <span key={cat} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/50">{cat}</span>
                ))}
                {todayEntry.mood && <MoodPill mood={todayEntry.mood} />}
              </div>
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
            {todayEntry.photoPath && (
              <img
                src={todayEntry.photoPath}
                alt="Entry photo"
                className="rounded-xl w-full object-cover max-h-48 mt-1"
              />
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
        <motion.form initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Gratitude Items */}
          <div className="rounded-2xl bg-card border border-border/60 p-5 flex flex-col gap-3">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">I'm grateful for...</p>
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground font-mono w-4 shrink-0">{i + 1}.</span>
                <input
                  type="text"
                  value={items[i]}
                  onChange={(e) => { const n = [...items]; n[i] = e.target.value; setItems(n); }}
                  placeholder={i === 0 ? "Something you noticed today..." : i === 1 ? "Someone who showed up for you..." : "A small joy or comfort..."}
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
                    key={key} type="button"
                    onClick={() => setMood(selected ? null : key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all ${selected ? cfg.color + " ring-2 ring-offset-1 ring-primary/30" : "border-border text-muted-foreground hover:border-border/80"}`}
                  >
                    <span>{cfg.emoji}</span><span>{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Categories */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Categories (optional)</p>
              {selectedCategories.length >= MAX_CATEGORIES && (
                <p className="text-xs text-muted-foreground/60">Max {MAX_CATEGORIES} selected</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const active = selectedCategories.includes(cat);
                const disabled = !active && selectedCategories.length >= MAX_CATEGORIES;
                return (
                  <button
                    key={cat} type="button"
                    onClick={() => toggleCategory(cat)}
                    disabled={disabled}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${active ? "bg-secondary text-secondary-foreground border-secondary" : disabled ? "border-border/40 text-muted-foreground/30 cursor-not-allowed" : "border-border text-muted-foreground hover:border-border/80"}`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Photo */}
          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Photo (optional)</p>
            <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
            {photoPreview ? (
              <div className="relative">
                <img src={photoPreview} alt="Preview" className="rounded-xl w-full object-cover max-h-48" />
                <button
                  type="button"
                  onClick={() => { setPhotoFile(null); setPhotoPreview(null); if (photoInputRef.current) photoInputRef.current.value = ""; }}
                  className="absolute top-2 right-2 bg-background/80 rounded-full p-1 text-foreground hover:bg-background transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="flex items-center gap-2 text-sm text-muted-foreground border border-dashed border-border rounded-xl px-4 py-3 hover:border-primary/40 hover:text-foreground transition-colors"
              >
                <ImageIcon className="w-4 h-4" />
                Attach a photo
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={createEntry.isPending || updateEntry.isPending || !items[0].trim()}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl py-3 text-sm font-medium disabled:opacity-50 transition-opacity hover:opacity-90"
            >
              <Check className="w-4 h-4" />
              {createEntry.isPending || updateEntry.isPending ? "Saving..." : isEditing ? "Save changes" : "Save entry"}
            </button>
            {isEditing && (
              <button type="button" onClick={() => setIsEditing(false)} className="p-3 rounded-xl border border-border text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.form>
      )}

      {/* On This Day */}
      {onThisDayEntries.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">On This Day</p>
          {onThisDayEntries.map(({ label, entry }) => {
            if (!entry) return null;
            return (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/40 dark:border-amber-800/20 p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-amber-600/70 dark:text-amber-500/60 font-medium">{label}</p>
                  {entry.mood && <MoodPill mood={entry.mood} />}
                </div>
                <p className="text-sm text-foreground/80 line-clamp-2 leading-relaxed">
                  {entry.gratitudeItems[0]}
                  {entry.gratitudeItems[1] ? `, ${entry.gratitudeItems[1]}` : ""}
                </p>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
