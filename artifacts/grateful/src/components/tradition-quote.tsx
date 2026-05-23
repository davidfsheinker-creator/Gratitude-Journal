import { motion } from "framer-motion";

interface TraditionQuoteProps {
  quote: string;
  source: string;
  connection: string;
}

export function TraditionQuote({ quote, source, connection }: TraditionQuoteProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.6 }}
      className="flex flex-col gap-3"
    >
      <div className="w-12 h-px bg-border mx-auto" />
      <div className="text-center flex flex-col gap-2 px-2">
        <p className="font-serif italic text-lg text-foreground/90 leading-relaxed">
          &ldquo;{quote}&rdquo;
        </p>
        <p className="text-xs text-muted-foreground/60 tracking-wide">— {source}</p>
        <p className="text-xs text-muted-foreground/50 leading-relaxed max-w-xs mx-auto mt-1">
          {connection}
        </p>
      </div>
    </motion.div>
  );
}
