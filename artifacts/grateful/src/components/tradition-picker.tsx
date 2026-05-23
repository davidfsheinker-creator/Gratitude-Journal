import { TRADITIONS } from "@/pages/settings";
import { Check } from "lucide-react";

interface TraditionPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function TraditionPicker({ value, onChange }: TraditionPickerProps) {
  return (
    <div className="grid grid-cols-1 gap-2">
      {TRADITIONS.map((t) => {
        const active = value === t.value;
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(t.value)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
              active
                ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                : "border-border/60 hover:border-border hover:bg-muted/30"
            }`}
          >
            <span className="text-lg shrink-0">{t.symbol}</span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium leading-tight ${active ? "text-foreground" : "text-foreground/80"}`}>
                {t.value}
              </p>
              <p className="text-xs text-muted-foreground/60 truncate">{t.description}</p>
            </div>
            {active && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
          </button>
        );
      })}
    </div>
  );
}
