"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc/client";

export default function AdminCreatorsPage() {
  const { data, isLoading } = trpc.admin.getCreatorDbStats.useQuery();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Creator Database</h1>
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Total Creators" value={String(Number(data?.total ?? 0))} />
          <StatCard label="TikTok Shop" value={String(Number(data?.tiktokShop ?? 0))} />
          <StatCard label="With Email" value={String(Number(data?.withEmail ?? 0))} />
          <StatCard label="Active (30d)" value={String(Number(data?.activeRecent ?? 0))} />
          <StatCard label="Avg Trust Score" value={Number(data?.avgTrustScore ?? 0).toFixed(1)} />
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-mono">{value}</div>
      </CardContent>
    </Card>
  );
}
