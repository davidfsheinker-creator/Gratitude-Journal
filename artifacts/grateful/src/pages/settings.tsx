import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useGetSettings, useUpdateSettings } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export const TRADITIONS = [
  { value: "Stoicism", symbol: "⚖️", description: "Virtue, reason, and resilience" },
  { value: "Buddhism", symbol: "☸️", description: "Mindfulness, compassion, and impermanence" },
  { value: "Christianity", symbol: "✝️", description: "Grace, love, and renewal" },
  { value: "Islam", symbol: "☪️", description: "Gratitude, surrender, and mercy" },
  { value: "Judaism", symbol: "✡️", description: "Covenant, justice, and sanctity" },
  { value: "Hinduism", symbol: "🕉️", description: "Dharma, devotion, and interconnection" },
  { value: "Taoism", symbol: "☯️", description: "Flow, balance, and naturalness" },
  { value: "Secular Humanism", symbol: "🌍", description: "Reason, dignity, and humanity" },
  { value: "Existentialism", symbol: "🔍", description: "Authenticity, freedom, and meaning" },
  { value: "No Preference", symbol: "✨", description: "Open to all wisdom traditions" },
];

export function Settings() {
  const { data: settings, isLoading } = useGetSettings();
  const updateSettings = useUpdateSettings();
  const { toast } = useToast();
  const [selected, setSelected] = useState<string>("No Preference");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings?.tradition) setSelected(settings.tradition);
  }, [settings]);

  async function handleSave() {
    try {
      await updateSettings.mutateAsync({ data: { tradition: selected } });
      setSaved(true);
      toast({ title: "Saved", description: "Your tradition preference has been updated." });
      setTimeout(() => setSaved(false), 2000);
    } catch {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-6 py-2">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-serif text-3xl font-semibold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Personalize your gratitude practice.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-2xl bg-card border border-border/60 p-5 flex flex-col gap-4"
      >
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">My Tradition</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            We'll surface quotes from this tradition after each entry.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {TRADITIONS.map((t) => {
            const active = selected === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setSelected(t.value)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                  active
                    ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                    : "border-border/60 hover:border-border hover:bg-muted/30"
                }`}
              >
                <span className="text-xl shrink-0">{t.symbol}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${active ? "text-foreground" : "text-foreground/80"}`}>
                    {t.value}
                  </p>
                  <p className="text-xs text-muted-foreground/60 truncate">{t.description}</p>
                </div>
                {active && <Check className="w-4 h-4 text-primary shrink-0" />}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleSave}
          disabled={updateSettings.isPending || saved}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl py-3 text-sm font-medium disabled:opacity-50 transition-all hover:opacity-90 mt-1"
        >
          {saved ? (
            <><Check className="w-4 h-4" /> Saved</>
          ) : updateSettings.isPending ? (
            "Saving..."
          ) : (
            "Save preferences"
          )}
        </button>
      </motion.div>
    </div>
  );
}
