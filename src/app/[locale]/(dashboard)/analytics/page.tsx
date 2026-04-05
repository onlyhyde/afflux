"use client";

import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc/client";
import { formatCurrency, formatCompactNumber } from "@/lib/i18n/config";

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
      <div className="grid gap-4 md:grid-cols-4">
        {gmvLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
        ) : (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">{t("analytics.totalGmv")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">
                  {formatCurrency(Number(gmv?.totalGmv ?? 0), locale)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">{t("analytics.totalViews")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">
                  {formatCompactNumber(Number(gmv?.totalViews ?? 0), locale)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">{t("analytics.conversions")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">
                  {formatCompactNumber(Number(gmv?.totalConversions ?? 0), locale)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">{t("analytics.contentCount")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">
                  {Number(gmv?.contentCount ?? 0)}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

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
              {(topCreators ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {t("common.noData")}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
