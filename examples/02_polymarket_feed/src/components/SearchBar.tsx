"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";

const TOPICS = [
  { value: "Sports", label: "Sports" },
  { value: "Crypto", label: "Crypto" },
  { value: "Politics", label: "Politics" },
  { value: "Games", label: "Games" },
  { value: "Esports", label: "Esports" },
  { value: "Finance", label: "Finance" },
  { value: "Weather", label: "Weather" },
  { value: "Culture", label: "Culture" },
];

const SORT_OPTIONS = [
  { value: "volume_24hr", label: "24h Volume" },
  { value: "liquidity_num", label: "Liquidity" },
  { value: "one_day_price_change", label: "Price Change" },
  { value: "created_at", label: "Newest" },
  { value: "end_date", label: "Ending Soon" },
];

interface Props {
  query: string;
  onQueryChange: (q: string) => void;
  topics: string[];
  onTopicsChange: (t: string[]) => void;
  sortField: string;
  onSortChange: (s: string) => void;
}

export default function SearchBar({
  query, onQueryChange,
  topics, onTopicsChange,
  sortField, onSortChange,
}: Props) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && !focused) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [focused]);

  const toggleTopic = (topic: string) => {
    onTopicsChange(
      topics.includes(topic)
        ? topics.filter((t) => t !== topic)
        : [...topics, topic]
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <div
          className={`flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl border bg-card transition-colors ${
            focused ? "border-ring" : "border-border"
          }`}
        >
          <Search size={16} className="text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder='Search markets... (press "/")'
            className="bg-transparent flex-1 text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          {query && (
            <button onClick={() => onQueryChange("")} className="text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          )}
        </div>

        <select
          value={sortField}
          onChange={(e) => onSortChange(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground outline-none cursor-pointer"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        {TOPICS.map((topic) => {
          const active = topics.includes(topic.value);
          return (
            <button
              key={topic.value}
              onClick={() => toggleTopic(topic.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                active
                  ? "bg-yes/15 text-yes border-yes/30"
                  : "bg-card text-muted-foreground border-border hover:border-muted-foreground/40"
              }`}
            >
              {topic.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
