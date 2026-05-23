import { motion } from "framer-motion";
import { Link } from "wouter";
import { useGetFavorites } from "@workspace/api-client-react";
import { MoodPill } from "@/components/mood-pill";
import { ChevronRight, Star } from "lucide-react";

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });
}

export function Favorites() {
  const { data: entries, isLoading } = useGetFavorites();

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
        <h1 className="font-serif text-3xl font-semibold text-foreground">Favorites</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {entries?.length
            ? `${entries.length} starred entr${entries.length === 1 ? "y" : "ies"}`
            : "Entries you star will appear here"}
        </p>
      </div>

      {!entries || entries.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col items-center justify-center text-center py-16 px-4"
        >
          <Star className="w-10 h-10 text-muted-foreground/30 mb-4" />
          <p className="font-serif text-xl text-foreground mb-2">No favorites yet</p>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
            When an entry resonates, tap the star to save it here.
          </p>
          <Link href="/journal">
            <button className="mt-6 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
              Browse journal
            </button>
          </Link>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link href={`/journal/${entry.date}`}>
                <div className="group rounded-2xl bg-card border border-amber-200/40 dark:border-amber-800/20 p-4 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
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
                        <span className="text-amber-500/60 text-xs mt-0.5">–</span>
                        <span className="text-muted-foreground text-sm leading-relaxed line-clamp-1">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
