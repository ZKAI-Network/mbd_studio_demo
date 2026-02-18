import type { Market } from "@/types/market";

export interface SparklinePoint {
  time: number;
  value: number;
}

/**
 * Generate a synthetic sparkline from price change anchors.
 * Uses 30d → 7d → 24h → 1h → now as anchor points,
 * with light jitter between them for a natural look.
 */
export function generateSparkline(market: Market): SparklinePoint[] {
  const now = Date.now() / 1000;
  const current = market.bestAsk;

  // Build anchor points from available price changes (working backwards)
  const anchors: { secsAgo: number; price: number }[] = [];

  if (market.priceChange30d != null) {
    anchors.push({ secsAgo: 30 * 86400, price: current - market.priceChange30d });
  }
  if (market.priceChange7d != null) {
    anchors.push({ secsAgo: 7 * 86400, price: current - market.priceChange7d });
  }
  if (market.priceChange24hr != null) {
    anchors.push({ secsAgo: 86400, price: current - market.priceChange24hr });
  }
  if (market.priceChange1hr != null) {
    anchors.push({ secsAgo: 3600, price: current - market.priceChange1hr });
  }

  // Always end with current price
  anchors.push({ secsAgo: 0, price: current });

  // Need at least 2 anchors for a line
  if (anchors.length < 2) {
    const fallback = current - 0.01;
    anchors.unshift({ secsAgo: 86400, price: fallback });
  }

  // Interpolate between anchors with ~4 jittered points per segment
  const points: SparklinePoint[] = [];
  const seed = hashCode(market.id);

  for (let i = 0; i < anchors.length - 1; i++) {
    const from = anchors[i];
    const to = anchors[i + 1];
    const steps = 4;

    for (let s = 0; s <= steps; s++) {
      // Skip first point of subsequent segments to avoid duplicates
      if (i > 0 && s === 0) continue;

      const t = s / steps;
      const basePrice = from.price + (to.price - from.price) * t;
      const secsAgo = from.secsAgo + (to.secsAgo - from.secsAgo) * t;

      // Deterministic jitter based on market id + segment
      const jitter = pseudoRandom(seed + i * 100 + s) * 0.02 - 0.01;
      const price = Math.max(0.01, Math.min(0.99, basePrice + jitter));

      points.push({ time: now - secsAgo, value: price });
    }
  }

  return points;
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}
