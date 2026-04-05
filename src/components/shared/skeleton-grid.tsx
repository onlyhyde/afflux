"use client";

import { Skeleton } from "@/components/ui/skeleton";

interface SkeletonGridProps {
  count: number;
  height?: string;
  columns?: number;
}

export function SkeletonGrid({ count, height = "h-28", columns = 4 }: SkeletonGridProps) {
  const gridClass =
    columns === 2
      ? "grid gap-4 md:grid-cols-2"
      : columns === 3
        ? "grid gap-4 md:grid-cols-3"
        : columns === 5
          ? "grid gap-4 md:grid-cols-5"
          : "grid gap-4 md:grid-cols-4";

  return (
    <div className={gridClass}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={height} />
      ))}
    </div>
  );
}

export function SkeletonList({ count, height = "h-16" }: { count: number; height?: string }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={height} />
      ))}
    </div>
  );
}
