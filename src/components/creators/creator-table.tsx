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

// Placeholder type until tRPC client is wired
interface Creator {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  followers: number;
  engagementRate: string | null;
  gmv: string | null;
  category: string | null;
  country: string | null;
  isTiktokShopCreator: boolean;
  trustScore: number | null;
}

interface CreatorTableProps {
  filters: {
    search: string;
    category: string;
    country: string;
    minFollowers: string;
    sortBy: string;
  };
}

// Temporary mock data until tRPC client is connected
const MOCK_CREATORS: Creator[] = Array.from({ length: 10 }, (_, i) => ({
  id: `${i + 1}`,
  username: `creator_${i + 1}`,
  displayName: `Creator ${i + 1}`,
  avatarUrl: `https://api.dicebear.com/9.x/avataaars/svg?seed=creator${i + 1}`,
  followers: Math.floor(Math.random() * 1000000) + 1000,
  engagementRate: (Math.random() * 10 + 0.5).toFixed(2),
  gmv: (Math.random() * 100000).toFixed(2),
  category: ["Beauty", "Fashion", "Food", "Tech", "Fitness"][i % 5],
  country: ["US", "KR", "GB", "JP", "ID"][i % 5],
  isTiktokShopCreator: Math.random() > 0.3,
  trustScore: Math.floor(Math.random() * 50) + 50,
}));

export function CreatorTable({ filters }: CreatorTableProps) {
  const t = useTranslations();
  const locale = useLocale();

  // TODO: Replace with tRPC query
  const creators = MOCK_CREATORS;
  const loading = false;

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

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
                  <Button variant="ghost" size="icon" title={t("creators.viewProfile")}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" title={t("creators.addToList")}>
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
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
