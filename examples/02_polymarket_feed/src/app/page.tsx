"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useFullPipeline } from "@/hooks/useFullPipeline";
import Header from "@/components/Header";
import SearchBar, { getSortOrder } from "@/components/SearchBar";
import WalletInput from "@/components/WalletInput";
import MarketGrid from "@/components/MarketGrid";

export default function Home() {
  const { wallet, setWallet, isValid, clearWallet } = useWallet();
  const [query, setQuery] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [sortField, setSortField] = useState("volume_24hr");
  const [visibleCount, setVisibleCount] = useState(25);

  const sortOrder = getSortOrder(sortField);

  const searchParams = useMemo(
    () => ({
      wallet: isValid ? wallet : undefined,
      query: query || undefined,
      topics: topics.length ? topics : undefined,
      sortField,
      sortOrder,
    }),
    [wallet, isValid, query, topics, sortField, sortOrder]
  );

  // Reset visible count when search params change
  useEffect(() => {
    setVisibleCount(25);
  }, [searchParams]);

  const { data, isLoading, error } = useFullPipeline(searchParams);

  const allMarkets = data?.markets ?? [];
  const bets = data?.bets ?? null;
  const isPersonalized = data?.isPersonalized ?? false;

  const markets = allMarkets.slice(0, visibleCount);
  const hasMore = visibleCount < allMarkets.length;

  const onLoadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + 25, allMarkets.length));
  }, [allMarkets.length]);

  return (
    <div className="min-h-screen px-4 md:px-8 max-w-[1400px] mx-auto">
      <Header
        isPersonalized={isPersonalized}
        marketCount={allMarkets.length}
        isLoading={isLoading}
      />

      <div className="space-y-4 mb-6">
        <WalletInput
          wallet={wallet}
          isValid={isValid}
          onChange={setWallet}
          onClear={clearWallet}
        />
        <SearchBar
          query={query}
          onQueryChange={setQuery}
          topics={topics}
          onTopicsChange={setTopics}
          sortField={sortField}
          onSortChange={setSortField}
          showSort={!isPersonalized && !query}
        />
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-xl border border-no/30 bg-no/5 text-sm text-no">
          Failed to load markets. Please try again.
        </div>
      )}

      <MarketGrid
        markets={markets}
        bets={bets}
        isLoading={isLoading}
        onLoadMore={onLoadMore}
        hasMore={hasMore}
      />
    </div>
  );
}
