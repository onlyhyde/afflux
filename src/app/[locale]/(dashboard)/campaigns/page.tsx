"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc/client";
import { Package, Trophy, Eye, Plus } from "lucide-react";

export default function CampaignsPage() {
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">{t("nav.campaigns")}</h1>

      <Tabs defaultValue="samples">
        <TabsList>
          <TabsTrigger value="samples">
            <Package className="mr-2 h-4 w-4" />
            Samples
          </TabsTrigger>
          <TabsTrigger value="contests">
            <Trophy className="mr-2 h-4 w-4" />
            Contests
          </TabsTrigger>
          <TabsTrigger value="competitors">
            <Eye className="mr-2 h-4 w-4" />
            Competitors
          </TabsTrigger>
        </TabsList>

        <TabsContent value="samples" className="mt-4">
          <SamplesTab />
        </TabsContent>
        <TabsContent value="contests" className="mt-4">
          <ContestsTab />
        </TabsContent>
        <TabsContent value="competitors" className="mt-4">
          <CompetitorsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SamplesTab() {
  const { data, isLoading } = trpc.campaign.listSamples.useQuery({ page: 1, pageSize: 20 });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <p className="text-muted-foreground">Manage product sample requests from creators.</p>
      </div>
      {isLoading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : (data ?? []).length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No sample requests yet</CardContent></Card>
      ) : (
        <div className="flex flex-col gap-3">
          {(data ?? []).map((sample) => (
            <Card key={sample.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">Sample #{sample.id.slice(0, 8)}</p>
                  <p className="text-sm text-muted-foreground">
                    Product: {sample.productId?.slice(0, 8)} · Creator: {sample.creatorId.slice(0, 8)}
                  </p>
                </div>
                <Badge variant={
                  sample.status === "approved" ? "default" :
                  sample.status === "rejected" ? "destructive" : "secondary"
                }>{sample.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ContestsTab() {
  const t = useTranslations("common");
  const { data, isLoading } = trpc.campaign.listContests.useQuery({ page: 1, pageSize: 10 });
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const utils = trpc.useUtils();

  const createContest = trpc.campaign.createContest.useMutation({
    onSuccess: () => {
      setShowForm(false);
      setName("");
      utils.campaign.listContests.invalidate();
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <p className="text-muted-foreground">Run creator contests to boost engagement.</p>
        <Button onClick={() => setShowForm(!showForm)}><Plus className="mr-2 h-4 w-4" />New Contest</Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Contest Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Beauty Creator Challenge Q2" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label>Start Date</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>End Date</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>{t("cancel")}</Button>
              <Button
                onClick={() => createContest.mutate({
                  name,
                  startDate: new Date(startDate),
                  endDate: new Date(endDate),
                  rankingMetric: "gmv",
                })}
                disabled={!name || !startDate || !endDate || createContest.isPending}
              >
                {createContest.isPending ? t("loading") : t("create")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {isLoading ? (
        <Skeleton className="h-32" />
      ) : (data ?? []).length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No contests created yet</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(data ?? []).map((contest) => (
            <Card key={contest.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{contest.name}</CardTitle>
                  <Badge>{contest.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {contest.startDate && new Date(contest.startDate).toLocaleDateString()} →{" "}
                {contest.endDate && new Date(contest.endDate).toLocaleDateString()}
                <br />Metric: {contest.rankingMetric}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function CompetitorsTab() {
  const { data, isLoading } = trpc.campaign.listCompetitors.useQuery();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <p className="text-muted-foreground">Monitor competitor brands and their creator partnerships.</p>
        <Button><Plus className="mr-2 h-4 w-4" />Add Competitor</Button>
      </div>
      {isLoading ? (
        <Skeleton className="h-32" />
      ) : (data ?? []).length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No competitors tracked yet</CardContent></Card>
      ) : (
        <div className="flex flex-col gap-3">
          {(data ?? []).map((brand) => (
            <Card key={brand.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{brand.name}</p>
                  <p className="text-sm text-muted-foreground">{brand.category} · {brand.tiktokShopUrl ?? "No URL"}</p>
                </div>
                <Badge variant="outline">{brand.isActive ? "Active" : "Inactive"}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
