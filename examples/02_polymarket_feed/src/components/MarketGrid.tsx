"use client";

import { useRef, useEffect } from "react";
import { Market, FeatureBet } from "@/types/market";
import MarketCard from "./MarketCard";
import SkeletonCard from "./SkeletonCard";

interface Props {
  markets: Market[];
  bets: Record<string, FeatureBet[]> | null;
  isLoading: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export default function MarketGrid({ markets, bets, isLoading, onLoadMore, hasMore }: Props) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!onLoadMore || !hasMore || !sentinelRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onLoadMore();
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [onLoadMore, hasMore]);

  if (isLoading && markets.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (!isLoading && markets.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p className="text-lg mb-2">No markets found</p>
        <p className="text-sm">Try adjusting your filters or search query</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {markets.map((market, i) => (
          <MarketCard
            key={market.id}
            market={market}
            bets={bets?.[market.id] ?? null}
            index={i}
          />
        ))}
      </div>
      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
        </div>
      )}
    </>
  );
}
