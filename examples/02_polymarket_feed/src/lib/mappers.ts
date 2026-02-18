import { Market } from "@/types/market";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function transformHit(hit: any): Market {
  const s = hit._source ?? {};
  return {
    id: hit._id,
    question: s.question ?? "",
    description: s.description ?? "",
    active: s.active ?? false,
    liquidity: s.liquidity ?? s.liquidity_num ?? 0,
    volume24hr: s.volume_24hr ?? 0,
    spread: s.spread ?? 0,
    bestAsk: s.best_ask ?? 0,
    lastTradePrice: s.last_trade_price ?? 0,
    endDate: s.end_date ?? "",
    priceChange1hr: s.one_hour_price_change ?? null,
    priceChange24hr: s.one_day_price_change ?? null,
    priceChange7d: s.one_week_price_change ?? null,
    priceChange30d: s.one_month_price_change ?? null,
    aiLabels: s.ai_labels_med ?? [],
    image: s.image ?? "",
    slug: s.slug ?? "",
    outcomes: s.outcomes ?? [],
    outcomePrices: s.outcome_prices ?? [],
    tags: s.tags ?? [],
  };
}
