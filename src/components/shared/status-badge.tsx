"use client";

import { Badge } from "@/components/ui/badge";

const STATUS_STYLES: Record<string, string> = {
  // Campaign / general
  draft: "bg-muted text-muted-foreground",
  running: "bg-green-600/20 text-green-400",
  active: "bg-green-500/15 text-green-500 border-green-500/20",
  completed: "bg-blue-600/20 text-blue-400",
  paused: "bg-yellow-600/20 text-yellow-400",
  // Outreach messages
  sent: "bg-muted text-muted-foreground",
  delivered: "bg-green-600/20 text-green-400",
  opened: "bg-blue-600/20 text-blue-400",
  replied: "bg-purple-600/20 text-purple-400",
  failed: "bg-red-600/20 text-red-400",
  // Samples
  approved: "bg-green-500/15 text-green-500 border-green-500/20",
  rejected: "bg-red-500/15 text-red-500 border-red-500/20",
  pending: "bg-yellow-500/15 text-yellow-500 border-yellow-500/20",
  // Spark codes
  requested: "bg-yellow-500/15 text-yellow-500 border-yellow-500/20",
  received: "bg-blue-500/15 text-blue-500 border-blue-500/20",
  expired: "bg-gray-500/15 text-gray-500 border-gray-500/20",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? "";
  return (
    <Badge variant="outline" className={`${style} ${className ?? ""}`}>
      {status}
    </Badge>
  );
}
