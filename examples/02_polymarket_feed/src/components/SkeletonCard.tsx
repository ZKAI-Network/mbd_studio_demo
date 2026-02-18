"use client";

export default function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="h-5 w-3/4 rounded animate-shimmer" />
      <div className="h-4 w-1/2 rounded animate-shimmer" />
      <div className="flex gap-3">
        <div className="h-8 w-16 rounded-lg animate-shimmer" />
        <div className="h-8 w-16 rounded-lg animate-shimmer" />
      </div>
      <div className="flex gap-2">
        <div className="h-4 w-12 rounded animate-shimmer" />
        <div className="h-4 w-12 rounded animate-shimmer" />
        <div className="h-4 w-12 rounded animate-shimmer" />
      </div>
    </div>
  );
}
