"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, Mail, MessageSquare, Plus, Play, Pause } from "lucide-react";
import { TemplateEditor } from "./template-editor";
import { trpc } from "@/lib/trpc/client";

export function OutreachView() {
  const t = useTranslations();
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);

  const { data: campaigns, isLoading: campaignsLoading } =
    trpc.outreach.listCampaigns.useQuery();
  const { data: stats } = trpc.outreach.getMessageStats.useQuery({});

  const startCampaign = trpc.outreach.startCampaign.useMutation({
    onSuccess: (result) => {
      alert(`Campaign started! ${result.queued} messages queued.`);
    },
    onError: (err) => {
      alert(`Failed to start: ${err.message}`);
    },
  });

  const pauseCampaign = trpc.outreach.pauseCampaign.useMutation();

  return (
    <Tabs defaultValue="campaigns" className="flex flex-col gap-4">
      <TabsList className="w-fit">
        <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
        <TabsTrigger value="templates">{t("outreach.templates")}</TabsTrigger>
        <TabsTrigger value="stats">Stats</TabsTrigger>
      </TabsList>

      <TabsContent value="campaigns" className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">
            Create and manage outreach campaigns to connect with creators.
          </p>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        </div>

        {campaignsLoading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        ) : (campaigns ?? []).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No campaigns yet. Create your first outreach campaign.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(campaigns ?? []).map((camp) => (
              <Card key={camp.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{camp.name}</CardTitle>
                    <Badge
                      className={
                        camp.status === "running"
                          ? "bg-green-600/20 text-green-400"
                          : camp.status === "completed"
                            ? "bg-blue-600/20 text-blue-400"
                            : camp.status === "paused"
                              ? "bg-yellow-600/20 text-yellow-400"
                              : "bg-muted text-muted-foreground"
                      }
                    >
                      {camp.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-3">
                    Created {new Date(camp.createdAt).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2">
                    {camp.status === "draft" && (
                      <Button
                        size="sm"
                        onClick={() => startCampaign.mutate({ campaignId: camp.id })}
                        disabled={startCampaign.isPending}
                      >
                        <Play className="mr-1 h-3 w-3" />
                        Start
                      </Button>
                    )}
                    {camp.status === "running" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => pauseCampaign.mutate({ campaignId: camp.id })}
                        disabled={pauseCampaign.isPending}
                      >
                        <Pause className="mr-1 h-3 w-3" />
                        Pause
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="templates" className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">
            Create reusable message templates with variable placeholders.
          </p>
          <Button onClick={() => setShowTemplateEditor(!showTemplateEditor)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("outreach.createTemplate")}
          </Button>
        </div>
        {showTemplateEditor && (
          <TemplateEditor onClose={() => setShowTemplateEditor(false)} />
        )}
      </TabsContent>

      <TabsContent value="stats">
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Total Sent" value={String(Number(stats?.total ?? 0))} />
          <StatCard label="Delivered" value={String(Number(stats?.delivered ?? 0))} />
          <StatCard label="Opened" value={String(Number(stats?.opened ?? 0))} />
          <StatCard label="Replied" value={String(Number(stats?.replied ?? 0))} />
        </div>
      </TabsContent>
    </Tabs>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-mono">{value}</div>
      </CardContent>
    </Card>
  );
}
