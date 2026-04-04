"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc/client";

export default function AdminQueuesPage() {
  const { data, isLoading } = trpc.admin.getQueueStats.useQuery();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Queue Monitor</h1>
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">{Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {(data?.queues ?? []).map((q) => (
            <Card key={q.name}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono">{q.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Waiting: </span>
                    <span className="font-mono">{q.waiting}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Active: </span>
                    <span className="font-mono">{q.active}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Done: </span>
                    <span className="font-mono">{q.completed}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Failed: </span>
                    <span className="font-mono text-destructive">{q.failed}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
