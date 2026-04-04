"use client";

import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Tag, MoreHorizontal } from "lucide-react";
import { formatCompactNumber, formatCurrency } from "@/lib/i18n/config";

interface PipelineCreator {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
  followers: number;
  gmv: number;
  category: string;
  tags: string[];
  lastContactedAt: string | null;
}

const STAGES = [
  "discovered",
  "contacted",
  "negotiating",
  "active",
  "inactive",
] as const;

// Mock data for each stage
const MOCK_PIPELINE: Record<string, PipelineCreator[]> = {
  discovered: [
    { id: "1", name: "Sarah Chen", username: "sarahbeauty", avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=sarah", followers: 250000, gmv: 45000, category: "Beauty", tags: ["skincare", "vegan"], lastContactedAt: null },
    { id: "2", name: "Mike Kim", username: "techmikekim", avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=mike", followers: 180000, gmv: 32000, category: "Tech", tags: ["gadgets"], lastContactedAt: null },
  ],
  contacted: [
    { id: "3", name: "Luna Park", username: "lunalifestyle", avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=luna", followers: 500000, gmv: 120000, category: "Fashion", tags: ["luxury", "streetwear"], lastContactedAt: "2026-04-01" },
  ],
  negotiating: [
    { id: "4", name: "Jake Torres", username: "fitjakee", avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=jake", followers: 320000, gmv: 78000, category: "Fitness", tags: ["supplements"], lastContactedAt: "2026-03-28" },
  ],
  active: [
    { id: "5", name: "Yuna Lee", username: "yunafoodie", avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=yuna", followers: 890000, gmv: 250000, category: "Food", tags: ["korean-food", "recipe"], lastContactedAt: "2026-04-03" },
    { id: "6", name: "Alex Rivera", username: "alexgaming", avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=alex", followers: 1200000, gmv: 380000, category: "Gaming", tags: ["console", "streaming"], lastContactedAt: "2026-04-02" },
  ],
  inactive: [
    { id: "7", name: "Emma Wilson", username: "emmastyle", avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=emma", followers: 150000, gmv: 15000, category: "Fashion", tags: ["vintage"], lastContactedAt: "2026-02-15" },
  ],
};

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

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STAGES.map((stage) => {
        const creators = MOCK_PIPELINE[stage] ?? [];
        return (
          <div key={stage} className="flex w-72 shrink-0 flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t(`stages.${stage}`)}
              </h3>
              <Badge variant="outline">{creators.length}</Badge>
            </div>

            <ScrollArea className="h-[calc(100vh-250px)]">
              <div className="flex flex-col gap-3 pr-3">
                {creators.map((creator) => (
                  <Card
                    key={creator.id}
                    className={`border-t-2 ${STAGE_COLORS[stage]} cursor-pointer hover:bg-accent/50 transition-colors`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={creator.avatarUrl} />
                          <AvatarFallback>
                            {creator.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium truncate">{creator.name}</p>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            @{creator.username}
                          </p>

                          <div className="mt-2 flex gap-3 text-xs">
                            <span className="font-mono">
                              {formatCompactNumber(creator.followers, locale)} followers
                            </span>
                            <span className="font-mono">
                              {formatCurrency(creator.gmv, locale)}
                            </span>
                          </div>

                          <div className="mt-2 flex flex-wrap gap-1">
                            {creator.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-xs px-1.5 py-0"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>

                          {creator.lastContactedAt && (
                            <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              Last: {creator.lastContactedAt}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {creators.length === 0 && (
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
