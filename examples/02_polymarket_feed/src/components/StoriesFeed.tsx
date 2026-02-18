"use client";

import { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { Story } from "@/types/market";
import StoryCard from "./StoryCard";

interface Props {
  stories: Story[];
  isLoading: boolean;
  hasWallet: boolean;
}

export default function StoriesFeed({ stories, isLoading, hasWallet }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  if (!hasWallet) {
    return (
      <div className="border border-border rounded-xl p-6 text-center">
        <BookOpen size={24} className="mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Enter a wallet address to see personalized stories</p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-3 bg-card hover:bg-card/80 transition-colors"
      >
        <span className="text-sm font-medium text-foreground flex items-center gap-2">
          <BookOpen size={14} />
          Stories
          {stories.length > 0 && (
            <span className="text-[10px] text-muted-foreground bg-foreground/5 px-1.5 py-0.5 rounded-full">
              {stories.length}
            </span>
          )}
        </span>
        {collapsed ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronUp size={14} className="text-muted-foreground" />}
      </button>
      {!collapsed && (
        <div className="p-3 space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 rounded-lg animate-shimmer" />
              ))}
            </div>
          ) : stories.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No stories yet</p>
          ) : (
            stories.map((story, i) => (
              <StoryCard key={i} story={story} index={i} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
