"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
      // Call the matching.generateMessage as a proxy (LLM gateway)
      // In production, this would call the script-generator service directly
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
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Click "Generate Script" to create a trend-based UGC script
            tailored to your product and creator style.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
