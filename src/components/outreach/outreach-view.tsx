"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Play, Pause, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { TemplateEditor } from "./template-editor";
import { CampaignCreateForm } from "./campaign-create-form";
import { trpc } from "@/lib/trpc/client";
import { StatCard, EmptyState, StatusBadge, SkeletonGrid } from "@/components/shared";

export function OutreachView() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const creatorId = searchParams.get("creatorId");
  const creatorName = searchParams.get("creatorName");
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [expandedStatsId, setExpandedStatsId] = useState<string | null>(null);
  const utils = trpc.useUtils();

  useEffect(() => {
    if (creatorId) {
      setShowCampaignForm(true);
    }
  }, [creatorId]);

  const { data: campaigns, isLoading: campaignsLoading } =
    trpc.outreach.listCampaigns.useQuery();
  const { data: stats } = trpc.outreach.getMessageStats.useQuery({});

  const startCampaign = trpc.outreach.startCampaign.useMutation({
    onSuccess: (result) => {
      toast.success(`Campaign started! ${result.queued} messages queued.`);
    },
    onError: (err) => {
      toast.error(`Failed to start: ${err.message}`);
    },
  });

  const pauseCampaign = trpc.outreach.pauseCampaign.useMutation();

  return (
    <Tabs defaultValue="campaigns" className="flex flex-col gap-4">
      <TabsList className="w-fit">
        <TabsTrigger value="campaigns">{t("outreach.campaigns")}</TabsTrigger>
        <TabsTrigger value="templates">{t("outreach.templates")}</TabsTrigger>
        <TabsTrigger value="stats">{t("outreach.statsTab")}</TabsTrigger>
      </TabsList>

      <TabsContent value="campaigns" className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">
            {t("outreach.campaignDescription")}
          </p>
          <Button onClick={() => setShowCampaignForm(!showCampaignForm)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("outreach.newCampaign")}
          </Button>
        </div>

        {showCampaignForm && (
          <CampaignCreateForm
            onClose={() => setShowCampaignForm(false)}
            onCreated={() => utils.outreach.listCampaigns.invalidate()}
            creatorId={creatorId ?? undefined}
            creatorName={creatorName ?? undefined}
          />
        )}

        {campaignsLoading ? (
          <SkeletonGrid count={3} height="h-40" columns={3} />
        ) : (campaigns ?? []).length === 0 ? (
          <EmptyState message="No campaigns yet. Create your first outreach campaign." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(campaigns ?? []).map((camp) => (
              <Card key={camp.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{camp.name}</CardTitle>
                    <StatusBadge status={camp.status} />
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
                        {t("outreach.start")}
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
                        {t("outreach.pause")}
                      </Button>
                    )}
                    {(camp.status === "completed" || camp.status === "paused") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setExpandedStatsId(
                            expandedStatsId === camp.id ? null : camp.id
                          )
                        }
                      >
                        <BarChart3 className="mr-1 h-3 w-3" />
                        {t("outreach.viewResults")}
                      </Button>
                    )}
                  </div>
                  {expandedStatsId === camp.id && (
                    <CampaignStatsInline campaignId={camp.id} />
                  )}
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
        <TemplateList />
      </TabsContent>

      <TabsContent value="stats">
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard title={t("outreach.totalSent")} value={String(Number(stats?.total ?? 0))} />
          <StatCard title={t("outreach.delivered")} value={String(Number(stats?.delivered ?? 0))} />
          <StatCard title={t("outreach.opened")} value={String(Number(stats?.opened ?? 0))} />
          <StatCard title={t("outreach.replied")} value={String(Number(stats?.replied ?? 0))} />
        </div>
      </TabsContent>
    </Tabs>
  );
}

function TemplateList() {
  const { data: templates, isLoading } = trpc.outreach.listTemplates.useQuery({});

  if (isLoading) return <Skeleton className="h-32" />;
  if (!templates || templates.length === 0) {
    return <EmptyState message="No templates yet. Create your first template above." />;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {templates.map((tmpl) => (
        <Card key={tmpl.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{tmpl.name}</span>
              <div className="flex gap-1">
                <Badge variant="outline">{tmpl.channel.replace("_", " ")}</Badge>
                <Badge variant="secondary">{tmpl.locale}</Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {tmpl.body.slice(0, 120)}...
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CampaignStatsInline({ campaignId }: { campaignId: string }) {
  const { data, isLoading } = trpc.outreach.getCampaignStats.useQuery({
    campaignId,
  });

  if (isLoading) return <Skeleton className="h-8 mt-2" />;
  if (!data) return null;

  const items = [
    { label: "Sent", value: data.sent, className: "bg-muted text-muted-foreground" },
    { label: "Delivered", value: data.delivered, className: "bg-green-600/20 text-green-400" },
    { label: "Opened", value: data.opened, className: "bg-blue-600/20 text-blue-400" },
    { label: "Replied", value: data.replied, className: "bg-purple-600/20 text-purple-400" },
    { label: "Failed", value: data.failed, className: "bg-red-600/20 text-red-400" },
  ];

  return (
    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border">
      {items.map((item) => (
        <Badge key={item.label} className={item.className}>
          {item.label}: {Number(item.value)}
        </Badge>
      ))}
    </div>
  );
}
