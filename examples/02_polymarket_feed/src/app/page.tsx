"use client";

import { useState, useMemo } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useFullPipeline } from "@/hooks/useFullPipeline";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import WalletInput from "@/components/WalletInput";
import MarketGrid from "@/components/MarketGrid";

export default function Home() {
  const { wallet, setWallet, isValid, clearWallet } = useWallet();
  const [query, setQuery] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [sortField, setSortField] = useState("volume_24hr");

  const searchParams = useMemo(
    () => ({
      wallet: isValid ? wallet : undefined,
      query: query || undefined,
      topics: topics.length ? topics : undefined,
      sortField,
      sortOrder: "desc" as const,
      size: 25,
    }),
    [wallet, isValid, query, topics, sortField]
  );

  const { data, isLoading, error } = useFullPipeline(searchParams);

  const markets = data?.markets ?? [];
  const bets = data?.bets ?? null;
  const isPersonalized = data?.isPersonalized ?? false;

  return (
    <div className="min-h-screen px-4 md:px-8 max-w-[1400px] mx-auto">
      <Header
        isPersonalized={isPersonalized}
        marketCount={markets.length}
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
      />
    </div>
  );
}
