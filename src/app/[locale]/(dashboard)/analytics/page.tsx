"use client";

import { useTranslations, useLocale } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc/client";
import { formatCurrency, formatCompactNumber } from "@/lib/i18n/config";
import { StatCard, SkeletonGrid, EmptyState } from "@/components/shared";

export default function AnalyticsPage() {
  const t = useTranslations();
  const locale = useLocale();

  const { data: gmv, isLoading: gmvLoading } = trpc.analytics.getGmvSummary.useQuery({});
  const { data: topCreators, isLoading: creatorsLoading } =
    trpc.analytics.getCreatorPerformance.useQuery({ limit: 10 });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">{t("nav.analytics")}</h1>

      {/* GMV Summary */}
      {gmvLoading ? (
        <SkeletonGrid count={4} />
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard title={t("analytics.totalGmv")} value={formatCurrency(Number(gmv?.totalGmv ?? 0), locale)} />
          <StatCard title={t("analytics.totalViews")} value={formatCompactNumber(Number(gmv?.totalViews ?? 0), locale)} />
          <StatCard title={t("analytics.conversions")} value={formatCompactNumber(Number(gmv?.totalConversions ?? 0), locale)} />
          <StatCard title={t("analytics.contentCount")} value={String(Number(gmv?.contentCount ?? 0))} />
        </div>
      )}

      {/* Top Creators */}
      <Card>
        <CardHeader>
          <CardTitle>{t("analytics.topCreatorsByGmv")}</CardTitle>
        </CardHeader>
        <CardContent>
          {creatorsLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : (topCreators ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t("common.noData")}
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {(topCreators ?? []).map((creator, i) => (
                <div
                  key={creator.creatorId}
                  className="flex items-center gap-4 rounded-lg border p-3"
                >
                  <span className="text-sm font-medium text-muted-foreground w-6">
                    #{i + 1}
                  </span>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={creator.avatarUrl ?? undefined} />
                    <AvatarFallback>
                      {(creator.displayName ?? creator.username).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {creator.displayName ?? creator.username}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {creator.contentCount} contents ·{" "}
                      {formatCompactNumber(Number(creator.totalViews), locale)} views
                    </p>
                  </div>
                  <span className="text-sm font-mono font-bold">
                    {formatCurrency(Number(creator.totalGmv), locale)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
