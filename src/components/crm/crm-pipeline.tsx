"use client";

import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, MoreHorizontal } from "lucide-react";
import { formatCompactNumber, formatCurrency } from "@/lib/i18n/config";
import { trpc } from "@/lib/trpc/client";

const STAGES = [
  "discovered",
  "contacted",
  "negotiating",
  "active",
  "inactive",
] as const;

const STAGE_COLORS: Record<string, string> = {
  discovered: "border-t-blue-500",
  contacted: "border-t-yellow-500",
  negotiating: "border-t-orange-500",
  active: "border-t-green-500",
  inactive: "border-t-gray-500",
};

export function CrmPipeline() {
  const t = useTranslations("crm");
  const locale = useLocale();

  // Fetch all CRM relationships (no stage filter → get all)
  const { data, isLoading, error } = trpc.crm.listByStage.useQuery({});

  if (error) {
    return (
      <div className="flex items-center justify-center py-12 text-destructive">
        {t("title")}: Error loading data
      </div>
    );
  }

  // Group by stage
  const grouped: Record<string, typeof data> = {};
  for (const stage of STAGES) {
    grouped[stage] = (data ?? []).filter((r) => r.relationship.stage === stage);
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STAGES.map((stage) => {
        const items = grouped[stage] ?? [];
        return (
          <div key={stage} className="flex w-72 shrink-0 flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t(`stages.${stage}`)}
              </h3>
              <Badge variant="outline">{items.length}</Badge>
            </div>

            <ScrollArea className="h-[calc(100vh-250px)]">
              <div className="flex flex-col gap-3 pr-3">
                {isLoading &&
                  Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}

                {!isLoading &&
                  items.map(({ relationship, creator }) => (
                    <Card
                      key={relationship.id}
                      className={`border-t-2 ${STAGE_COLORS[stage]} cursor-pointer hover:bg-accent/50 transition-colors`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={creator.avatarUrl ?? undefined} />
                            <AvatarFallback>
                              {(creator.displayName ?? creator.username)
                                .slice(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium truncate">
                                {creator.displayName ?? creator.username}
                              </p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                              >
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              @{creator.username}
                            </p>

                            <div className="mt-2 flex gap-3 text-xs">
                              <span className="font-mono">
                                {formatCompactNumber(creator.followers, locale)}{" "}
                                followers
                              </span>
                              <span className="font-mono">
                                {formatCurrency(
                                  Number(creator.gmv ?? 0),
                                  locale
                                )}
                              </span>
                            </div>

                            {relationship.tags &&
                              (relationship.tags as string[]).length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {(relationship.tags as string[]).map(
                                    (tag) => (
                                      <Badge
                                        key={tag}
                                        variant="secondary"
                                        className="text-xs px-1.5 py-0"
                                      >
                                        {tag}
                                      </Badge>
                                    )
                                  )}
                                </div>
                              )}

                            {relationship.lastContactedAt && (
                              <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                Last:{" "}
                                {new Date(
                                  relationship.lastContactedAt
                                ).toLocaleDateString(locale)}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                {!isLoading && items.length === 0 && (
                  <div className="flex items-center justify-center rounded-md border border-dashed p-8 text-sm text-muted-foreground">
                    No creators
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        );
      })}
    </div>
  );
}
