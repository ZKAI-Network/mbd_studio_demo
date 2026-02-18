"use client";

import { Activity } from "lucide-react";

interface Props {
  isPersonalized: boolean;
  marketCount: number;
  isLoading: boolean;
}

export default function Header({ isPersonalized, marketCount, isLoading }: Props) {
  return (
    <header className="flex items-center justify-between py-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-yes/15 flex items-center justify-center">
          <Activity size={16} className="text-yes" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-foreground">Polymarket Feed</h1>
          <p className="text-xs text-muted-foreground">
            Powered by Embed Studio
          </p>
        </div>
      </div>
      <div className="text-xs text-muted-foreground font-mono">
        {isLoading ? (
          <span className="animate-pulse">Loading...</span>
        ) : (
          <>
            {marketCount} markets
            {isPersonalized && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-yes/10 text-yes text-[10px]">
                Personalized
              </span>
            )}
          </>
        )}
      </div>
    </header>
  );
}
