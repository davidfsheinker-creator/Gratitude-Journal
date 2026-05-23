import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useListEntries, useUpdateEntry, getListEntriesQueryKey, getGetFavoritesQueryKey } from "@workspace/api-client-react";
import { MoodPill } from "@/components/mood-pill";
import { ChevronRight, Star, Search, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function formatRelative(dateStr: string) {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  return null;
}

const MOOD_FILTERS = [
  { value: "", label: "All moods" },
  { value: "great", label: "Great" },
  { value: "okay", label: "Okay" },
  { value: "tough", label: "Tough" },
];

export function Journal() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [moodFilter, setMoodFilter] = useState("");
  const { data: entries, isLoading } = useListEntries();
  const updateEntry = useUpdateEntry();

  function toggleStar(date: string, currentStarred: boolean) {
    updateEntry.mutate(
      { date, data: { starred: !currentStarred } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListEntriesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetFavoritesQueryKey() });
        },
      }
    );
  }

  const filtered = entries?.filter((e) => {
    if (moodFilter && e.mood !== moodFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const inItems = e.gratitudeItems.some((item) => item.toLowerCase().includes(q));
      const inReflection = e.reflection?.toLowerCase().includes(q);
      if (!inItems && !inReflection) return false;
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-5 py-2">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-foreground">Journal</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {entries?.length ? `${entries.length} entr${entries.length === 1 ? "y" : "ies"} written` : "Your entries will appear here"}
        </p>
      </div>

      {/* Search & filter */}
      {(entries?.length ?? 0) > 0 && (
        <div className="flex flex-col gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search entries..."
              className="w-full bg-card border border-border/60 rounded-xl pl-9 pr-9 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {MOOD_FILTERS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setMoodFilter(value)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  moodFilter === value
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "border-border text-muted-foreground hover:border-border/80"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {!entries || entries.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col items-center justify-center text-center py-16 px-4"
        >
          <div className="text-5xl mb-4">📖</div>
          <p className="font-serif text-xl text-foreground mb-2">Your journal is waiting</p>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
            Write your first entry today and begin a practice of noticing the good.
          </p>
          <Link href="/">
            <button className="mt-6 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
              Write today's entry
            </button>
          </Link>
        </motion.div>
      ) : filtered && filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
          <p className="text-muted-foreground text-sm">No entries match your search.</p>
          <button onClick={() => { setSearch(""); setMoodFilter(""); }} className="mt-3 text-sm text-primary hover:underline">Clear filters</button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {(filtered ?? []).map((entry, i) => {
            const relative = formatRelative(entry.date);
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="group rounded-2xl bg-card border border-border/60 hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <div className="flex items-stretch">
                  <Link href={`/journal/${entry.date}`} className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        {relative && <p className="text-xs font-medium text-primary mb-0.5">{relative}</p>}
                        <p className="text-sm font-medium text-foreground">{formatDate(entry.date)}</p>
                        {(entry.categories as string[])?.length > 0 && (
                          <div className="flex gap-1 flex-wrap mt-1">
                            {(entry.categories as string[]).slice(0, 2).map((cat) => (
                              <span key={cat} className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{cat}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {entry.mood && <MoodPill mood={entry.mood} />}
                        <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                      </div>
                    </div>
                    <ul className="flex flex-col gap-1">
                      {entry.gratitudeItems.slice(0, 3).map((item, j) => (
                        <li key={j} className="flex items-start gap-2">
                          <span className="text-amber-500/60 dark:text-amber-400/50 text-xs mt-0.5">–</span>
                          <span className="text-muted-foreground text-sm leading-relaxed line-clamp-1">{item}</span>
                        </li>
                      ))}
                    </ul>
                    {entry.reflection && (
                      <p className="text-muted-foreground/60 text-xs mt-2.5 pt-2.5 border-t border-border/40 line-clamp-2 leading-relaxed italic">
                        {entry.reflection}
                      </p>
                    )}
                  </Link>
                  <button
                    onClick={() => toggleStar(entry.date, entry.starred)}
                    className="px-3 flex items-start pt-4 text-muted-foreground/40 hover:text-amber-500 transition-colors"
                    title={entry.starred ? "Remove from favorites" : "Add to favorites"}
                  >
                    <Star className={`w-4 h-4 ${entry.starred ? "fill-amber-500 text-amber-500" : ""}`} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
