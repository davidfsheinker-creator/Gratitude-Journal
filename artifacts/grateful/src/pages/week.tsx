import { useState } from "react";
import { motion } from "framer-motion";
import { useGetWeeklySummary, getGetWeeklySummaryQueryKey } from "@workspace/api-client-react";
import { MoodPill } from "@/components/mood-pill";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

function getSundayOf(date: Date): string {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split("T")[0];
}

function formatWeekRange(startDate: string, endDate: string) {
  const [sy, sm, sd] = startDate.split("-").map(Number);
  const [ey, em, ed] = endDate.split("-").map(Number);
  const start = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);
  const sLabel = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const eLabel = end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${sLabel} – ${eLabel}`;
}

const CATEGORY_COLORS = [
  "#D4956A", "#86A884", "#C97B7B", "#7B9EC9", "#B59ECC", "#C9B07B", "#7BC9B0", "#A0A0A0"
];

export function Week() {
  const [weekOffset, setWeekOffset] = useState(0);

  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - weekOffset * 7);
  const startDate = getSundayOf(baseDate);

  const { data: summary, isLoading } = useGetWeeklySummary(startDate, {
    query: { queryKey: getGetWeeklySummaryQueryKey(startDate), enabled: !!startDate },
  });

  const isCurrentWeek = weekOffset === 0;

  const categoryData = summary?.categoryBreakdown
    ? Object.entries(summary.categoryBreakdown as Record<string, number>)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count], i) => ({ name, count, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }))
    : [];

  return (
    <div className="flex-1 flex flex-col gap-5 py-2">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-foreground">Weekly View</h1>
          {summary && (
            <p className="text-muted-foreground text-sm mt-0.5">
              {formatWeekRange(summary.startDate, summary.endDate)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setWeekOffset((o) => o + 1)} className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setWeekOffset((o) => Math.max(0, o - 1))}
            disabled={isCurrentWeek}
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : !summary || summary.totalEntries === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col items-center justify-center text-center py-16 px-4"
        >
          <div className="text-5xl mb-4">🌙</div>
          <p className="font-serif text-xl text-foreground mb-2">No entries this week</p>
          <p className="text-muted-foreground text-sm">
            {isCurrentWeek ? "Start writing today — your week's story is still being written." : "No entries were recorded during this week."}
          </p>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-card border border-border/60 p-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-1">Entries</p>
              <p className="font-serif text-3xl font-semibold text-foreground">{summary.totalEntries}</p>
              <p className="text-xs text-muted-foreground">of 7 days</p>
            </div>
            <div className="rounded-2xl bg-card border border-border/60 p-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-1">Gratitudes</p>
              <p className="font-serif text-3xl font-semibold text-foreground">{summary.allGratitudeItems.length}</p>
              <p className="text-xs text-muted-foreground">moments noticed</p>
            </div>
          </div>

          {/* Mood breakdown */}
          {(summary.moodBreakdown.great + summary.moodBreakdown.okay + summary.moodBreakdown.tough) > 0 && (
            <div className="rounded-2xl bg-card border border-border/60 p-4 flex flex-col gap-3">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Moods This Week</p>
              <div className="flex flex-wrap gap-2">
                {summary.moodBreakdown.great > 0 && <div className="flex items-center gap-1.5"><MoodPill mood="great" /><span className="text-sm text-muted-foreground font-medium">×{summary.moodBreakdown.great}</span></div>}
                {summary.moodBreakdown.okay > 0 && <div className="flex items-center gap-1.5"><MoodPill mood="okay" /><span className="text-sm text-muted-foreground font-medium">×{summary.moodBreakdown.okay}</span></div>}
                {summary.moodBreakdown.tough > 0 && <div className="flex items-center gap-1.5"><MoodPill mood="tough" /><span className="text-sm text-muted-foreground font-medium">×{summary.moodBreakdown.tough}</span></div>}
              </div>
              {(() => {
                const total = summary.moodBreakdown.great + summary.moodBreakdown.okay + summary.moodBreakdown.tough;
                return total > 0 ? (
                  <div className="flex rounded-full overflow-hidden h-2 gap-0.5">
                    {summary.moodBreakdown.great > 0 && <div className="bg-amber-400/70" style={{ width: `${(summary.moodBreakdown.great / total) * 100}%` }} />}
                    {summary.moodBreakdown.okay > 0 && <div className="bg-[#86A884]/60" style={{ width: `${(summary.moodBreakdown.okay / total) * 100}%` }} />}
                    {summary.moodBreakdown.tough > 0 && <div className="bg-rose-300/70" style={{ width: `${(summary.moodBreakdown.tough / total) * 100}%` }} />}
                  </div>
                ) : null;
              })()}
            </div>
          )}

          {/* Category breakdown chart */}
          {categoryData.length > 0 && (
            <div className="rounded-2xl bg-card border border-border/60 p-4 flex flex-col gap-3">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Categories</p>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={categoryData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "0.75rem", fontSize: 12 }}
                    cursor={false}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} opacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Day-by-day entries */}
          <div className="flex flex-col gap-3">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Entries</p>
            {summary.entries.map((entry, i) => {
              const [ey, em, ed] = entry.date.split("-").map(Number);
              const d = new Date(ey, em - 1, ed);
              return (
                <motion.div
                  key={entry.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-2xl bg-card border border-border/60 p-4 flex flex-col gap-2.5"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">
                      {d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                    </p>
                    {entry.mood && <MoodPill mood={entry.mood} />}
                  </div>
                  <ul className="flex flex-col gap-1">
                    {entry.gratitudeItems.map((item, j) => (
                      <li key={j} className="flex items-start gap-2">
                        <span className="text-amber-500/50 text-xs mt-0.5">–</span>
                        <span className="text-muted-foreground text-sm leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>

          {/* All gratitude items */}
          {summary.allGratitudeItems.length > 0 && (
            <div className="rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/20 p-4 flex flex-col gap-3">
              <p className="text-xs uppercase tracking-widest text-amber-700/60 dark:text-amber-500/60 font-medium">All Gratitudes This Week</p>
              <div className="flex flex-wrap gap-1.5">
                {summary.allGratitudeItems.map((item, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-amber-100/80 dark:bg-amber-900/20 text-amber-800/80 dark:text-amber-300/70 border border-amber-200/40 dark:border-amber-800/20">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
