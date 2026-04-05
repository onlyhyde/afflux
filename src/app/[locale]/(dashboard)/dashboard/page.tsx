"use client";

import { useTranslations, useLocale } from "next-intl";
import { trpc } from "@/lib/trpc/client";
import { formatCompactNumber, formatCurrency } from "@/lib/i18n/config";
import { StatCard, SkeletonGrid } from "@/components/shared";

export default function DashboardPage() {
  const t = useTranslations();
  const locale = useLocale();
  const { data, isLoading } = trpc.analytics.getDashboardStats.useQuery();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold">{t("nav.dashboard")}</h1>
        <SkeletonGrid count={4} height="h-32" />
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
