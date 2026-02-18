"use client";

import { motion } from "framer-motion";
import { Story } from "@/types/market";

const TYPE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  new_market: { bg: "bg-blue-500/10", text: "text-blue-400", label: "New" },
  bet: { bg: "bg-yes/10", text: "text-yes", label: "Bet" },
  user_markets_bets: { bg: "bg-yes/10", text: "text-yes", label: "Your Bets" },
  relevant_markets_bets: { bg: "bg-purple-500/10", text: "text-purple-400", label: "Related" },
  price_change: { bg: "bg-orange-500/10", text: "text-orange-400", label: "Price Move" },
  relevant_market: { bg: "bg-purple-500/10", text: "text-purple-400", label: "Related" },
};

export default function StoryCard({ story, index }: { story: Story; index: number }) {
  const style = TYPE_STYLES[story.type] ?? { bg: "bg-foreground/5", text: "text-muted-foreground", label: story.type };

  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      className="p-3 rounded-lg border border-border bg-card/50 hover:border-ring/30 transition-colors"
    >
      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold mb-1.5 ${style.bg} ${style.text}`}>
        {style.label}
      </span>
      <p className="text-xs text-foreground leading-relaxed line-clamp-3">
        {story.title || story.body}
      </p>
      {story.question && (
        <p className="text-[11px] text-muted-foreground mt-1 truncate">{story.question}</p>
      )}
    </motion.div>
  );
}
