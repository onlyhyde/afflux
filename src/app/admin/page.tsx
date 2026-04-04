"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc/client";

export default function AdminDashboard() {
  const { data: health, isLoading: healthLoading } =
    trpc.admin.getSystemHealth.useQuery();
  const { data: creatorStats, isLoading: creatorsLoading } =
    trpc.admin.getCreatorDbStats.useQuery();
  const { data: queueStats, isLoading: queuesLoading } =
    trpc.admin.getQueueStats.useQuery();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      {/* System Health */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Database
            </CardTitle>
          </CardHeader>
          <CardContent>
            {healthLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="flex items-center gap-2">
                <Badge
                  className={
                    health?.database?.status === "ok"
                      ? "bg-green-600/20 text-green-400"
                      : "bg-red-600/20 text-red-400"
                  }
                >
                  {health?.database?.status ?? "unknown"}
                </Badge>
                {health?.database?.latency && (
                  <span className="text-sm font-mono text-muted-foreground">
                    {health.database.latency}ms
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Creator DB
            </CardTitle>
          </CardHeader>
          <CardContent>
            {creatorsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-bold font-mono">
                  {creatorStats?.total ?? 0}
                </span>
                <span className="text-xs text-muted-foreground">
                  {creatorStats?.tiktokShop ?? 0} TikTok Shop ·{" "}
                  {creatorStats?.activeRecent ?? 0} active (30d)
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Queues
            </CardTitle>
          </CardHeader>
          <CardContent>
            {queuesLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-bold font-mono">
                  {queueStats?.queues.length ?? 0} queues
                </span>
                <span className="text-xs text-muted-foreground">
                  All operational
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
