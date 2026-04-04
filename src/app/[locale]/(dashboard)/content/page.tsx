"use client";

import { useTranslations, useLocale } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc/client";
import { formatCompactNumber, formatCurrency } from "@/lib/i18n/config";
import { FileVideo, Sparkles, Zap } from "lucide-react";

export default function ContentPage() {
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">{t("nav.content")}</h1>

      <Tabs defaultValue="videos">
        <TabsList>
          <TabsTrigger value="videos">
            <FileVideo className="mr-2 h-4 w-4" />
            Videos
          </TabsTrigger>
          <TabsTrigger value="spark-codes">
            <Zap className="mr-2 h-4 w-4" />
            Spark Codes
          </TabsTrigger>
          <TabsTrigger value="ai-scripts">
            <Sparkles className="mr-2 h-4 w-4" />
            AI Scripts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="videos" className="mt-4">
          <VideosTab />
        </TabsContent>
        <TabsContent value="spark-codes" className="mt-4">
          <SparkCodesTab />
        </TabsContent>
        <TabsContent value="ai-scripts" className="mt-4">
          <AiScriptsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function VideosTab() {
  const locale = useLocale();
  const { data: gmv, isLoading } = trpc.analytics.getGmvSummary.useQuery({});

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground">Track creator content performance and engagement.</p>
      {isLoading ? (
        <Skeleton className="h-32" />
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total Content</CardTitle>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold font-mono">{Number(gmv?.contentCount ?? 0)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total Views</CardTitle>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold font-mono">{formatCompactNumber(Number(gmv?.totalViews ?? 0), locale)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Conversions</CardTitle>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold font-mono">{formatCompactNumber(Number(gmv?.totalConversions ?? 0), locale)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total GMV</CardTitle>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold font-mono">{formatCurrency(Number(gmv?.totalGmv ?? 0), locale)}</div></CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function SparkCodesTab() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground">Manage Spark Ads authorization codes from creators.</p>
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Spark Code management connected to TikTok Ads Manager.
          <br />Codes are auto-collected when creators authorize.
        </CardContent>
      </Card>
    </div>
  );
}

function AiScriptsTab() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <p className="text-muted-foreground">Generate UGC scripts and creative briefs with AI.</p>
        <Button>
          <Sparkles className="mr-2 h-4 w-4" />
          Generate Script
        </Button>
      </div>
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          AI script generation uses Claude to create trend-based UGC scripts
          tailored to your product and target creator style.
          <br /><br />
          Enter a product and target style to generate a script.
        </CardContent>
      </Card>
    </div>
  );
}
