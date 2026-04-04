"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Download } from "lucide-react";
import { CreatorTable } from "./creator-table";
import { formatCompactNumber } from "@/lib/i18n/config";

const CATEGORIES = [
  "Beauty", "Fashion", "Food", "Tech", "Fitness",
  "Home", "Pets", "Gaming", "Travel", "Education",
];

const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "KR", name: "South Korea" },
  { code: "GB", name: "United Kingdom" },
  { code: "JP", name: "Japan" },
  { code: "ID", name: "Indonesia" },
  { code: "TH", name: "Thailand" },
];

interface Filters {
  search: string;
  category: string;
  country: string;
  minFollowers: string;
  sortBy: string;
}

export function CreatorSearchView() {
  const t = useTranslations();
  const [filters, setFilters] = useState<Filters>({
    search: "",
    category: "",
    country: "",
    minFollowers: "",
    sortBy: "followers",
  });
  const [showFilters, setShowFilters] = useState(false);

  function updateFilter(key: keyof Filters, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("creators.search")}
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="mr-2 h-4 w-4" />
          {t("common.filter")}
        </Button>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          {t("common.export")}
        </Button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <Card>
          <CardContent className="grid gap-4 pt-6 md:grid-cols-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">{t("creators.category")}</label>
              <Select
                value={filters.category}
                onValueChange={(v) => updateFilter("category", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">{t("creators.country")}</label>
              <Select
                value={filters.country}
                onValueChange={(v) => updateFilter("country", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">{t("creators.followers")}</label>
              <Select
                value={filters.minFollowers}
                onValueChange={(v) => updateFilter("minFollowers", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="1000">1K+</SelectItem>
                  <SelectItem value="10000">10K+</SelectItem>
                  <SelectItem value="100000">100K+</SelectItem>
                  <SelectItem value="1000000">1M+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Sort by</label>
              <Select
                value={filters.sortBy}
                onValueChange={(v) => updateFilter("sortBy", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="followers">{t("creators.followers")}</SelectItem>
                  <SelectItem value="engagement_rate">{t("creators.engagement")}</SelectItem>
                  <SelectItem value="gmv">{t("creators.gmv")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Filters */}
      {(filters.category || filters.country || filters.minFollowers) && (
        <div className="flex gap-2 flex-wrap">
          {filters.category && filters.category !== "all" && (
            <Badge variant="secondary" className="gap-1">
              {filters.category}
              <button onClick={() => updateFilter("category", "")}>×</button>
            </Badge>
          )}
          {filters.country && filters.country !== "all" && (
            <Badge variant="secondary" className="gap-1">
              {filters.country}
              <button onClick={() => updateFilter("country", "")}>×</button>
            </Badge>
          )}
          {filters.minFollowers && filters.minFollowers !== "any" && (
            <Badge variant="secondary" className="gap-1">
              {formatCompactNumber(Number(filters.minFollowers), "en")}+ followers
              <button onClick={() => updateFilter("minFollowers", "")}>×</button>
            </Badge>
          )}
        </div>
      )}

      {/* Creator Table */}
      <CreatorTable filters={filters} />
    </div>
  );
}
