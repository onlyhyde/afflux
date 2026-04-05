"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc/client";
import { formatCompactNumber, formatCurrency } from "@/lib/i18n/config";
import { FileVideo, Sparkles, Zap } from "lucide-react";
import { StatCard, EmptyState, StatusBadge, DataTable, type DataTableColumn } from "@/components/shared";

export default function ContentPage() {
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">{t("nav.content")}</h1>

      <Tabs defaultValue="videos">
        <TabsList>
          <TabsTrigger value="videos">
            <FileVideo className="mr-2 h-4 w-4" />
            {t("content.videos")}
          </TabsTrigger>
          <TabsTrigger value="spark-codes">
            <Zap className="mr-2 h-4 w-4" />
            {t("content.sparkCodes")}
          </TabsTrigger>
          <TabsTrigger value="ai-scripts">
            <Sparkles className="mr-2 h-4 w-4" />
            {t("content.aiScripts")}
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
  const t = useTranslations();
  const locale = useLocale();
  const { data: gmv, isLoading } = trpc.analytics.getGmvSummary.useQuery({});
  const { data: videos, isLoading: videosLoading } = trpc.content.list.useQuery({});

  type Video = NonNullable<typeof videos>[number];

  const columns: DataTableColumn<Video>[] = [
    { key: "title", header: t("content.title"), render: (v) => <span className="font-medium">{v.title}</span> },
    { key: "creator", header: t("content.creator"), render: (v) => <span className="text-muted-foreground">{v.creatorDisplayName ?? v.creatorUsername ?? "-"}</span> },
    { key: "views", header: t("content.views"), align: "right", className: "font-mono", render: (v) => formatCompactNumber(Number(v.views ?? 0), locale) },
    { key: "likes", header: t("content.likes"), align: "right", className: "font-mono", render: (v) => formatCompactNumber(Number(v.likes ?? 0), locale) },
    { key: "comments", header: t("content.comments"), align: "right", className: "font-mono", render: (v) => formatCompactNumber(Number(v.comments ?? 0), locale) },
    { key: "conversions", header: t("content.conversions"), align: "right", className: "font-mono", render: (v) => String(Number(v.conversions ?? 0)) },
    { key: "gmv", header: t("content.gmv"), align: "right", className: "font-mono", render: (v) => formatCurrency(Number(v.gmv ?? 0), locale) },
    { key: "published", header: t("content.published"), align: "right", render: (v) => <span className="text-muted-foreground">{v.publishedAt ? new Date(v.publishedAt).toLocaleDateString(locale) : "-"}</span> },
  ];

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground">{t("content.trackDescription")}</p>
      {isLoading ? (
        <Skeleton className="h-32" />
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard title={t("content.totalContent")} value={String(Number(gmv?.contentCount ?? 0))} />
          <StatCard title={t("content.totalViews")} value={formatCompactNumber(Number(gmv?.totalViews ?? 0), locale)} />
          <StatCard title={t("content.conversions")} value={formatCompactNumber(Number(gmv?.totalConversions ?? 0), locale)} />
          <StatCard title={t("content.totalGmv")} value={formatCurrency(Number(gmv?.totalGmv ?? 0), locale)} />
        </div>
      )}

      {videosLoading ? (
        <Skeleton className="h-64" />
      ) : (videos ?? []).length === 0 ? (
        <EmptyState message="No video content yet." />
      ) : (
        <DataTable columns={columns} data={videos ?? []} rowKey={(v) => v.id} />
      )}
    </div>
  );
}

function SparkCodesTab() {
  const locale = useLocale();
  const { data: sparkCodes, isLoading } = trpc.content.listSparkCodes.useQuery({});

  type SparkCode = NonNullable<typeof sparkCodes>[number];

  const columns: DataTableColumn<SparkCode>[] = [
    { key: "code", header: "Code", className: "font-mono font-medium", render: (sc) => sc.code },
    { key: "creator", header: "Creator", render: (sc) => <span className="text-muted-foreground">{sc.creatorDisplayName ?? sc.creatorUsername ?? "-"}</span> },
    { key: "status", header: "Status", render: (sc) => <StatusBadge status={sc.status} /> },
    { key: "expires", header: "Expires At", align: "right", render: (sc) => <span className="text-muted-foreground">{sc.expiresAt ? new Date(sc.expiresAt).toLocaleDateString(locale) : "-"}</span> },
  ];

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground">Manage Spark Ads authorization codes from creators.</p>

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : (sparkCodes ?? []).length === 0 ? (
        <EmptyState message="No spark codes yet. Codes are auto-collected when creators authorize." />
      ) : (
        <DataTable columns={columns} data={sparkCodes ?? []} rowKey={(sc) => sc.id} />
      )}
    </div>
  );
}

function AiScriptsTab() {
  const [showForm, setShowForm] = useState(false);
  const [productName, setProductName] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [category, setCategory] = useState("Beauty");
  const [style, setStyle] = useState("review");
  const [generatedScript, setGeneratedScript] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    try {
      setGeneratedScript(
        `🎬 Hook (0-3s):\n"Did you know ${productName} can change your routine?"\n\n` +
        `📹 Body (3-25s):\n[Show product] "I've been testing ${productName} for 2 weeks..."\n` +
        `[Demo application] "The texture is amazing and..."\n\n` +
        `🎯 CTA (25-30s):\n"Link in bio — use code CREATOR for 10% off!"\n\n` +
        `---\nCategory: ${category} | Style: ${style} | Duration: 30s`
      );
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <p className="text-muted-foreground">Generate UGC scripts and creative briefs with AI.</p>
        <Button onClick={() => setShowForm(!showForm)}>
          <Sparkles className="mr-2 h-4 w-4" />
          Generate Script
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-6 flex flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Product Name</label>
                <Input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Vegan Glow Serum" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Category</label>
                <select className="flex h-9 rounded-md border bg-transparent px-3 py-1 text-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
                  {["Beauty","Fashion","Food","Tech","Fitness","Home"].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Product Description</label>
              <Input value={productDesc} onChange={(e) => setProductDesc(e.target.value)} placeholder="Lightweight serum for sensitive skin" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Content Style</label>
              <select className="flex h-9 rounded-md border bg-transparent px-3 py-1 text-sm" value={style} onChange={(e) => setStyle(e.target.value)}>
                {["review","tutorial","unboxing","grwm","comparison","before-after","haul","vlog"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <Button onClick={handleGenerate} disabled={!productName || generating}>
              {generating ? "Generating..." : "Generate Script"}
            </Button>
          </CardContent>
        </Card>
      )}

      {generatedScript && (
        <Card>
          <CardContent className="pt-6">
            <pre className="whitespace-pre-wrap text-sm font-mono bg-muted p-4 rounded-lg">
              {generatedScript}
            </pre>
          </CardContent>
        </Card>
      )}

      {!showForm && !generatedScript && (
        <EmptyState message='Click "Generate Script" to create a trend-based UGC script tailored to your product and creator style.' />
      )}
    </div>
  );
}
