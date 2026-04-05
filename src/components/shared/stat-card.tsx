"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  compact?: boolean;
}

export function StatCard({ title, value, subtitle, compact }: StatCardProps) {
  if (compact) {
    return (
      <Card>
        <CardContent className="pt-4 pb-4">
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="text-xl font-bold font-mono mt-1">{value}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-mono">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
