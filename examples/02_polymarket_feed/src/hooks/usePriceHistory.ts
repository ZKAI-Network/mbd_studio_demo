"use client";

import { useQuery } from "@tanstack/react-query";

interface PricePoint {
  time: number;
  value: number;
}

export function usePriceHistory(slug: string | undefined) {
  return useQuery<PricePoint[]>({
    queryKey: ["price-history", slug],
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 min
    queryFn: async () => {
      const res = await fetch(`/api/price-history?slug=${encodeURIComponent(slug!)}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.history ?? [];
    },
  });
}
