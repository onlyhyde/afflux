"use client";

import { useTranslations, useLocale } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus, Eye } from "lucide-react";
import { formatCompactNumber, formatCurrency } from "@/lib/i18n/config";
import { trpc } from "@/lib/trpc/client";
import { Link } from "@/lib/i18n/routing";
import { AddToListDialog } from "./add-to-list-dialog";

interface CreatorTableProps {
  filters: {
    search: string;
    category: string;
    country: string;
    minFollowers: string;
    sortBy: string;
  };
}

export function CreatorTable({ filters }: CreatorTableProps) {
  const t = useTranslations();
  const locale = useLocale();

  const { data, isLoading, error } = trpc.creator.list.useQuery({
    search: filters.search || undefined,
    category: filters.category && filters.category !== "all" ? filters.category : undefined,
    country: filters.country && filters.country !== "all" ? filters.country : undefined,
    minFollowers: filters.minFollowers && filters.minFollowers !== "any"
      ? Number(filters.minFollowers)
      : undefined,
    sortBy: (filters.sortBy as "followers" | "engagement_rate" | "gmv" | "created_at") || "followers",
    sortOrder: "desc",
    page: 1,
    pageSize: 20,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12 text-destructive">
        {t("common.error")}
      </div>
    );
  }

  const creators = data?.items ?? [];

  if (creators.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        {t("creators.noResults")}
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Creator</TableHead>
            <TableHead>{t("creators.category")}</TableHead>
            <TableHead className="text-right">{t("creators.followers")}</TableHead>
            <TableHead className="text-right">{t("creators.engagement")}</TableHead>
            <TableHead className="text-right">{t("creators.gmv")}</TableHead>
            <TableHead className="text-right">Trust</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {creators.map((creator) => (
            <TableRow key={creator.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={creator.avatarUrl ?? undefined} />
                    <AvatarFallback>
                      {(creator.displayName ?? creator.username)
                        .slice(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {creator.displayName ?? creator.username}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      @{creator.username}
                      {creator.isTiktokShopCreator && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Shop
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{creator.category}</Badge>
              </TableCell>
              <TableCell className="text-right font-mono">
                {formatCompactNumber(creator.followers, locale)}
              </TableCell>
              <TableCell className="text-right font-mono">
                {creator.engagementRate}%
              </TableCell>
              <TableCell className="text-right font-mono">
                {formatCurrency(Number(creator.gmv ?? 0), locale)}
              </TableCell>
              <TableCell className="text-right">
                <TrustBadge score={creator.trustScore ?? 0} />
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" title={t("creators.viewProfile")} asChild>
                    <Link href={`/creators/${creator.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <AddToListDialog creatorId={creator.id} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
          <span>
            {data.total} creators, page {data.page}/{data.totalPages}
          </span>
        </div>
      )}
    </div>
  );
}

function TrustBadge({ score }: { score: number }) {
  if (score >= 80)
    return <Badge className="bg-green-600/20 text-green-400">{score}</Badge>;
  if (score >= 50)
    return <Badge className="bg-yellow-600/20 text-yellow-400">{score}</Badge>;
  return <Badge className="bg-red-600/20 text-red-400">{score}</Badge>;
}
