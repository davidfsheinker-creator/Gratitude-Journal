import { motion } from "framer-motion";
import { Link } from "wouter";
import { useListEntries } from "@workspace/api-client-react";
import { MoodPill } from "@/components/mood-pill";
import { ChevronRight } from "lucide-react";

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function formatRelative(dateStr: string) {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  return null;
}

export function Journal() {
  const { data: entries, isLoading } = useListEntries();

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
          {entries?.length
            ? `${entries.length} entr${entries.length === 1 ? "y" : "ies"} written`
            : "Your entries will appear here"}
        </p>
      </div>

      {!entries || entries.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
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
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((entry, i) => {
            const relative = formatRelative(entry.date);
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link href={`/journal/${entry.date}`}>
                  <div className="group rounded-2xl bg-card border border-border/60 p-4 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        {relative && (
                          <p className="text-xs font-medium text-primary mb-0.5">{relative}</p>
                        )}
                        <p className="text-sm font-medium text-foreground">{formatDate(entry.date)}</p>
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
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
