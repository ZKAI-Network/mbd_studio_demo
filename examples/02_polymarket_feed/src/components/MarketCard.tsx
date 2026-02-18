"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Liveline } from "liveline";
import { ExternalLink, TrendingUp, TrendingDown, Clock, BarChart3, Droplets, ArrowUpDown } from "lucide-react";
import { Market, FeatureBet } from "@/types/market";
import { formatCurrency, formatCents, formatPercent, formatTimeRemaining, formatLabel } from "@/lib/format";
import { generateSparkline } from "@/lib/sparkline";
import { usePriceHistory } from "@/hooks/usePriceHistory";

interface Props {
  market: Market;
  bets: FeatureBet[] | null;
  index: number;
}

export default function MarketCard({ market, bets, index }: Props) {
  const noPrice = 1 - market.bestAsk;
  const change = formatPercent(market.priceChange24hr);
  const isPositive = market.priceChange24hr != null && market.priceChange24hr >= 0;
  const topBet = bets?.[0];
  const { data: priceHistory } = usePriceHistory(market.slug);
  const sparkline = useMemo(() => generateSparkline(market), [market]);
  const chartData = priceHistory?.length ? priceHistory : sparkline;

  // Derive chart color from the actual visible data trend, not priceChange24hr
  const chartTrendUp = useMemo(() => {
    if (chartData.length < 2) return isPositive;
    return chartData[chartData.length - 1].value >= chartData[0].value;
  }, [chartData, isPositive]);
  const chartColor = chartTrendUp ? "#00d4aa" : "#ff4d6a";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      className="group relative rounded-xl border border-border bg-card p-5 hover:border-ring/40 transition-colors"
    >
      {/* Header */}
      <div className="flex gap-3 mb-3">
        {market.image && (
          <img
            src={market.image}
            alt=""
            className="w-10 h-10 rounded-lg object-cover shrink-0"
          />
        )}
        <h3 className="text-sm font-medium text-foreground leading-snug line-clamp-2 flex-1">
          {market.question}
        </h3>
      </div>

      {/* Prices */}
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-yes/10 text-yes font-mono text-sm font-semibold">
          Yes {formatCents(market.bestAsk)}
        </span>
        <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-no/10 text-no font-mono text-sm font-semibold">
          No {formatCents(noPrice)}
        </span>
        {change && (
          <span className={`ml-auto flex items-center gap-1 text-xs font-mono ${isPositive ? "text-yes" : "text-no"}`}>
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {change}
          </span>
        )}
      </div>

      {/* Price chart */}
      <div className="h-16 mb-3 -mx-1">
        <Liveline
          data={chartData}
          value={market.bestAsk}
          color={chartColor}
          theme="dark"
          grid={false}
          badge={true}
          badgeVariant="minimal"
          badgeTail={false}
          pulse={false}
          fill={true}
          scrub={true}
          momentum={false}
          window={604800}
          formatValue={(v: number) => `${(v * 100).toFixed(1)}¢`}
          padding={{ top: 4, right: 50, bottom: 4, left: 4 }}
        />
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3 font-mono">
        <span className="flex items-center gap-1">
          <BarChart3 size={12} />
          {formatCurrency(market.volume24hr)}
        </span>
        <span className="flex items-center gap-1">
          <Droplets size={12} />
          {formatCurrency(market.liquidity)}
        </span>
        <span className="flex items-center gap-1">
          <ArrowUpDown size={12} />
          {(market.spread * 100).toFixed(1)}%
        </span>
        {market.endDate && (
          <span className="flex items-center gap-1 ml-auto">
            <Clock size={12} />
            {formatTimeRemaining(market.endDate)}
          </span>
        )}
      </div>

      {/* Tags + Labels */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {market.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-yes/8 text-yes/80 border border-yes/15"
          >
            {tag}
          </span>
        ))}
        {market.aiLabels.slice(0, 2).map((label) => (
          <span
            key={label}
            className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-foreground/5 text-muted-foreground border border-border"
          >
            {formatLabel(label)}
          </span>
        ))}
      </div>

      {/* Top trader bet */}
      {topBet && (
        <div className="text-[11px] text-muted-foreground border-t border-border pt-2 font-mono truncate">
          <span className="text-foreground/70">{topBet.user_pseudonym}</span>{" "}
          <span className={topBet.side === "BUY" ? "text-yes" : "text-no"}>
            {topBet.side}
          </span>{" "}
          {topBet.outcome} for ${topBet.usdc?.toFixed(0)}
        </div>
      )}

      {/* Deep link */}
      {market.slug && (
        <a
          href={`https://polymarket.com/event/${market.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-4 right-4 text-muted-foreground/40 hover:text-yes transition-colors"
        >
          <ExternalLink size={14} />
        </a>
      )}
    </motion.div>
  );
}
