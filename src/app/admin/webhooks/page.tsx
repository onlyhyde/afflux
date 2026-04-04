"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc/client";

export default function AdminWebhooksPage() {
  const { data, isLoading } = trpc.admin.listWebhookEvents.useQuery({ page: 1, pageSize: 50 });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Webhook Events</h1>
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex flex-col gap-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : (data ?? []).length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">No webhook events received yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data ?? []).map((event) => (
                  <TableRow key={event.id}>
                    <TableCell><Badge variant="outline">{event.source}</Badge></TableCell>
                    <TableCell className="font-mono text-xs">{event.eventType}</TableCell>
                    <TableCell>
                      <Badge className={
                        event.status === "processed" ? "bg-green-600/20 text-green-400" :
                        event.status === "failed" ? "bg-red-600/20 text-red-400" :
                        "bg-yellow-600/20 text-yellow-400"
                      }>{event.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(event.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
