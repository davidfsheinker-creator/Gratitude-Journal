import { useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useListEntries } from "@workspace/api-client-react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MOOD_COLORS: Record<string, string> = {
  great: "bg-amber-400/80 dark:bg-amber-500/60 text-amber-900 dark:text-amber-100",
  okay: "bg-[#86A884]/70 dark:bg-[#86A884]/50 text-white",
  tough: "bg-rose-300/80 dark:bg-rose-500/50 text-rose-900 dark:text-rose-100",
};

const MOOD_DOT: Record<string, string> = {
  great: "bg-amber-400 dark:bg-amber-500",
  okay: "bg-[#86A884]",
  tough: "bg-rose-400 dark:bg-rose-500",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function Calendar() {
  const [, navigate] = useLocation();
  const [offset, setOffset] = useState(0);
  const { data: entries } = useListEntries();

  const now = new Date();
  const displayDate = new Date(now.getFullYear(), now.getMonth() - offset, 1);
  const year = displayDate.getFullYear();
  const month = displayDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const entryMap = new Map<string, string>();
  if (entries) {
    for (const e of entries) {
      if (e.mood) entryMap.set(e.date, e.mood);
      else entryMap.set(e.date, "logged");
    }
  }

  function toDateStr(d: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  const today = new Date().toISOString().split("T")[0];

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const monthLabel = displayDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const moodCounts = { great: 0, okay: 0, tough: 0 };
  for (let d = 1; d <= daysInMonth; d++) {
    const mood = entryMap.get(toDateStr(d));
    if (mood === "great") moodCounts.great++;
    else if (mood === "okay") moodCounts.okay++;
    else if (mood === "tough") moodCounts.tough++;
  }

  return (
    <div className="flex-1 flex flex-col gap-5 py-2">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-semibold text-foreground">Calendar</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setOffset((o) => o + 1)}
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setOffset((o) => Math.max(0, o - 1))}
            disabled={offset === 0}
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className="font-serif text-lg text-foreground -mt-3">{monthLabel}</p>

      <motion.div
        key={`${year}-${month}`}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-card border border-border/60 p-4"
      >
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-xs text-muted-foreground/60 font-medium py-1">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} />;
            const dateStr = toDateStr(day);
            const mood = entryMap.get(dateStr);
            const isToday = dateStr === today;

            return (
              <button
                key={dateStr}
                onClick={() => mood && navigate(`/journal/${dateStr}`)}
                className={`
                  aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-medium transition-all
                  ${mood && mood !== "logged" ? MOOD_COLORS[mood] : ""}
                  ${mood === "logged" ? "bg-muted text-muted-foreground" : ""}
                  ${!mood ? "text-muted-foreground hover:bg-muted/50" : "hover:opacity-80 cursor-pointer"}
                  ${isToday && !mood ? "ring-2 ring-primary/40 text-primary font-semibold" : ""}
                  ${isToday && mood ? "ring-2 ring-primary/60" : ""}
                `}
              >
                {day}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        {[
          { label: "Great", key: "great" },
          { label: "Okay", key: "okay" },
          { label: "Tough", key: "tough" },
        ].map(({ label, key }) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-full ${MOOD_DOT[key]}`} />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-muted" />
          <span className="text-xs text-muted-foreground">Logged</span>
        </div>
      </div>

      {/* Month summary */}
      {(moodCounts.great + moodCounts.okay + moodCounts.tough) > 0 && (
        <div className="rounded-2xl bg-card border border-border/60 p-4 flex gap-4">
          {moodCounts.great > 0 && (
            <div className="flex flex-col items-center gap-0.5">
              <span className="font-serif text-2xl font-semibold text-foreground">{moodCounts.great}</span>
              <span className="text-xs text-muted-foreground">Great days</span>
            </div>
          )}
          {moodCounts.okay > 0 && (
            <div className="flex flex-col items-center gap-0.5">
              <span className="font-serif text-2xl font-semibold text-foreground">{moodCounts.okay}</span>
              <span className="text-xs text-muted-foreground">Okay days</span>
            </div>
          )}
          {moodCounts.tough > 0 && (
            <div className="flex flex-col items-center gap-0.5">
              <span className="font-serif text-2xl font-semibold text-foreground">{moodCounts.tough}</span>
              <span className="text-xs text-muted-foreground">Tough days</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
