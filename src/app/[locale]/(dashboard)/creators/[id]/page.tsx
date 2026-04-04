"use client";

import { useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc/client";
import { formatCompactNumber, formatCurrency } from "@/lib/i18n/config";
import { Link } from "@/lib/i18n/routing";
import { ArrowLeft, Send, UserPlus, ExternalLink } from "lucide-react";

export default function CreatorDetailPage() {
  const params = useParams();
  const t = useTranslations();
  const locale = useLocale();
  const creatorId = params.id as string;

  const { data: creator, isLoading } = trpc.creator.getById.useQuery(
    { id: creatorId },
    { enabled: !!creatorId }
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">Creator not found</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/creators">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Search
          </Link>
        </Button>
      </div>
    );
  }

  const demographics = creator.audienceDemographics as {
    genderSplit?: { male: number; female: number; other: number };
    ageGroups?: Record<string, number>;
    topCountries?: Record<string, number>;
  } | null;

  return (
    <div className="flex flex-col gap-6">
      {/* Back button */}
      <Button asChild variant="ghost" className="w-fit">
        <Link href="/creators">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("creators.title")}
        </Link>
      </Button>

      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={creator.avatarUrl ?? undefined} />
              <AvatarFallback className="text-2xl">
                {(creator.displayName ?? creator.username).slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">
                  {creator.displayName ?? creator.username}
                </h1>
                {creator.isTiktokShopCreator && (
                  <Badge>TikTok Shop</Badge>
                )}
                {creator.trustScore && (
                  <Badge
                    className={
                      creator.trustScore >= 80
                        ? "bg-green-600/20 text-green-400"
                        : creator.trustScore >= 50
                          ? "bg-yellow-600/20 text-yellow-400"
                          : "bg-red-600/20 text-red-400"
                    }
                  >
                    Trust: {creator.trustScore}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">@{creator.username}</p>
              {creator.bio && (
                <p className="mt-2 text-sm max-w-2xl">{creator.bio}</p>
              )}
              <div className="mt-4 flex gap-2">
                <Button size="sm">
                  <Send className="mr-2 h-4 w-4" />
                  Send Outreach
                </Button>
                <Button size="sm" variant="outline">
                  <UserPlus className="mr-2 h-4 w-4" />
                  {t("creators.addToList")}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-5">
        <StatCard label={t("creators.followers")} value={formatCompactNumber(creator.followers, locale)} />
        <StatCard label={t("creators.engagement")} value={`${creator.engagementRate ?? 0}%`} />
        <StatCard label={t("creators.gmv")} value={formatCurrency(Number(creator.gmv ?? 0), locale)} />
        <StatCard label="Avg Views" value={formatCompactNumber(creator.avgViews ?? 0, locale)} />
        <StatCard label="Total Videos" value={String(creator.totalVideos ?? 0)} />
      </div>

      {/* Details */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Audience Demographics */}
        {demographics && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Audience Demographics</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {demographics.genderSplit && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Gender</p>
                  <div className="flex gap-4 text-sm">
                    <span>Male: {demographics.genderSplit.male}%</span>
                    <span>Female: {demographics.genderSplit.female}%</span>
                    <span>Other: {demographics.genderSplit.other}%</span>
                  </div>
                </div>
              )}
              {demographics.ageGroups && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Age Groups</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(demographics.ageGroups).map(([range, pct]) => (
                      <Badge key={range} variant="secondary">
                        {range}: {pct}%
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {demographics.topCountries && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Top Countries</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(demographics.topCountries).map(([country, pct]) => (
                      <Badge key={country} variant="outline">
                        {country}: {pct}%
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Content Styles & Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Creator Info</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("creators.category")}</span>
              <Badge variant="secondary">{creator.category ?? "—"}</Badge>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("creators.country")}</span>
              <span>{creator.country ?? "—"}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Language</span>
              <span>{creator.language ?? "—"}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span>{creator.email ?? "—"}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Content Styles</span>
              <div className="flex gap-1">
                {((creator.contentStyles as string[]) ?? []).map((style) => (
                  <Badge key={style} variant="outline" className="text-xs">
                    {style}
                  </Badge>
                ))}
              </div>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Active</span>
              <span>
                {creator.lastActiveAt
                  ? new Date(creator.lastActiveAt).toLocaleDateString(locale)
                  : "—"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold font-mono mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}
