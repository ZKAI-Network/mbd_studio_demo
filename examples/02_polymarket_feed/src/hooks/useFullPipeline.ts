"use client";

import { useQuery } from "@tanstack/react-query";
import { PipelineResponse, SearchParams } from "@/types/market";

export function useFullPipeline(params: SearchParams) {
  return useQuery<PipelineResponse>({
    queryKey: ["pipeline", params],
    queryFn: async () => {
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error(`Pipeline failed: ${res.status}`);
      return res.json();
    },
    staleTime: 30_000,
  });
}
