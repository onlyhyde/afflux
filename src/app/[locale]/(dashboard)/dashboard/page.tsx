"use client";

import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc/client";
import { formatCompactNumber, formatCurrency } from "@/lib/i18n/config";

export default function DashboardPage() {
  const t = useTranslations();
  const locale = useLocale();
  const { data, isLoading } = trpc.analytics.getDashboardStats.useQuery();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold">{t("nav.dashboard")}</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">{t("nav.dashboard")}</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("creators.stats.totalCreators")}
          value={formatCompactNumber(data?.totalCreators ?? 0, locale)}
        />
        <StatCard
          title={t("dashboard.messagesSent")}
          value={formatCompactNumber(data?.messagesSent ?? 0, locale)}
          subtitle={`${data?.responseRate ?? 0}% ${t("dashboard.responseRate")}`}
        />
        <StatCard
          title={t("dashboard.activeCreators")}
          value={String(data?.activeCreators ?? 0)}
          subtitle={`${data?.totalCrmCreators ?? 0} ${t("dashboard.inCrm")}`}
        />
        <StatCard
          title={t("creators.stats.avgGmv")}
          value={formatCurrency(data?.totalGmv ?? 0, locale)}
          subtitle={t("dashboard.totalGmv")}
        />
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle?: string;
}) {
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
