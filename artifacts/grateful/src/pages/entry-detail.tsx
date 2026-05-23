import { motion } from "framer-motion";
import { Link } from "wouter";
import { useGetEntryByDate, getGetEntryByDateQueryKey } from "@workspace/api-client-react";
import { MoodPill } from "@/components/mood-pill";
import { ArrowLeft } from "lucide-react";

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

export function EntryDetail({ params }: { params?: { date?: string } }) {
  const date = params?.date ?? "";

  const { data: entry, isLoading, isError } = useGetEntryByDate(date, {
    query: {
      queryKey: getGetEntryByDateQueryKey(date),
      enabled: !!date,
      retry: false,
    },
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (isError || !entry) {
    return (
      <div className="flex-1 flex flex-col gap-5 py-2">
        <Link href="/journal">
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to journal
          </button>
        </Link>
        <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
          <div className="text-4xl mb-3">🌿</div>
          <p className="font-serif text-xl text-foreground mb-1">Entry not found</p>
          <p className="text-muted-foreground text-sm">No entry was written on this date.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-5 py-2">
      <Link href="/journal">
        <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to journal
        </button>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-5"
      >
        <div className="flex items-start justify-between gap-3">
          <h1 className="font-serif text-2xl font-semibold text-foreground leading-snug">
            {formatDate(entry.date)}
          </h1>
          {entry.mood && <MoodPill mood={entry.mood} />}
        </div>

        {/* Gratitude items */}
        <div className="rounded-2xl bg-card border border-border/60 p-5 flex flex-col gap-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Grateful for</p>
          <ul className="flex flex-col gap-3">
            {entry.gratitudeItems.map((item, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                className="flex items-start gap-3"
              >
                <span className="text-xs text-amber-500/70 dark:text-amber-400/60 mt-0.5 font-mono w-4 shrink-0">{i + 1}.</span>
                <span className="text-foreground leading-relaxed">{item}</span>
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Reflection */}
        {entry.reflection && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-2xl bg-card border border-border/60 p-5 flex flex-col gap-3"
          >
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Reflection</p>
            <p className="text-foreground/80 leading-relaxed font-serif">{entry.reflection}</p>
          </motion.div>
        )}

        {/* Meta */}
        <p className="text-xs text-muted-foreground/50 text-right">
          Written {new Date(entry.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
        </p>
      </motion.div>
    </div>
  );
}
