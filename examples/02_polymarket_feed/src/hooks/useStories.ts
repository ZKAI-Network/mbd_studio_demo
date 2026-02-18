"use client";

import { useQuery } from "@tanstack/react-query";
import { Story } from "@/types/market";

export function useStories(wallet: string | undefined) {
  return useQuery<Story[]>({
    queryKey: ["stories", wallet],
    queryFn: async () => {
      const res = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet }),
      });
      if (!res.ok) throw new Error(`Stories failed: ${res.status}`);
      const data = await res.json();
      return data.stories ?? data.data?.stories ?? data ?? [];
    },
    enabled: !!wallet && /^0x[a-fA-F0-9]{40}$/.test(wallet),
    staleTime: 60_000,
  });
}
