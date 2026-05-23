export const MOODS = {
  great: {
    label: "Great",
    emoji: "😊",
    color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800/50"
  },
  okay: {
    label: "Okay",
    emoji: "😐",
    color: "bg-[#E6ECE5] text-[#4A544A] dark:bg-[#4A544A]/30 dark:text-[#A5B5A3] border-[#D1DDD0] dark:border-[#4A544A]/50"
  },
  tough: {
    label: "Tough",
    emoji: "😔",
    color: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 dark:border-rose-800/50"
  }
} as const;

export type MoodKey = keyof typeof MOODS;

export function MoodPill({ mood }: { mood: string | null | undefined }) {
  if (!mood || !(mood in MOODS)) return null;
  const config = MOODS[mood as MoodKey];
  
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
      <span>{config.emoji}</span>
      <span>{config.label}</span>
    </div>
  );
}
