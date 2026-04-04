"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, Mail, MessageSquare, Plus } from "lucide-react";
import { TemplateEditor } from "./template-editor";

export function OutreachView() {
  const t = useTranslations();
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);

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

        {/* Placeholder campaigns */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <CampaignCard
            name="Beauty Creators Q1"
            channel="tiktok_dm"
            status="active"
            sent={245}
            replied={38}
          />
          <CampaignCard
            name="Tech Review Outreach"
            channel="email"
            status="draft"
            sent={0}
            replied={0}
          />
          <CampaignCard
            name="Fashion Spring Launch"
            channel="tiktok_invite"
            status="completed"
            sent={500}
            replied={87}
          />
        </div>
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
          <StatCard label="Total Sent" value="745" />
          <StatCard label="Delivered" value="720" />
          <StatCard label="Opened" value="412" />
          <StatCard label="Replied" value="125" />
        </div>
      </TabsContent>
    </Tabs>
  );
}

function CampaignCard({
  name,
  channel,
  status,
  sent,
  replied,
}: {
  name: string;
  channel: string;
  status: string;
  sent: number;
  replied: number;
}) {
  const channelIcon =
    channel === "email" ? (
      <Mail className="h-4 w-4" />
    ) : channel === "tiktok_dm" ? (
      <MessageSquare className="h-4 w-4" />
    ) : (
      <Send className="h-4 w-4" />
    );

  const statusColor =
    status === "active"
      ? "bg-green-600/20 text-green-400"
      : status === "completed"
        ? "bg-blue-600/20 text-blue-400"
        : "bg-muted text-muted-foreground";

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{name}</CardTitle>
          <Badge className={statusColor}>{status}</Badge>
        </div>
        <CardDescription className="flex items-center gap-1">
          {channelIcon}
          <span className="capitalize">{channel.replace("_", " ")}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Sent: </span>
            <span className="font-mono font-medium">{sent}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Replied: </span>
            <span className="font-mono font-medium">{replied}</span>
          </div>
          {sent > 0 && (
            <div>
              <span className="text-muted-foreground">Rate: </span>
              <span className="font-mono font-medium">
                {((replied / sent) * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
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
