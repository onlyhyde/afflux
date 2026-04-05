"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/i18n/routing";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Circle, ArrowRight, Sparkles } from "lucide-react";

const STEPS = ["shop", "product", "strategy", "complete"] as const;
type Step = (typeof STEPS)[number];

const CATEGORIES = [
  "Beauty", "Fashion", "Food", "Tech", "Fitness",
  "Home", "Pets", "Gaming", "Travel", "Education",
];

export default function OnboardingPage() {
  const t = useTranslations();
  const router = useRouter();
  const [step, setStep] = useState<Step>("shop");
  const [shopName, setShopName] = useState("");
  const [category, setCategory] = useState("");
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [budget, setBudget] = useState("");
  const [goal, setGoal] = useState("");

  const currentIndex = STEPS.indexOf(step);

  function nextStep() {
    const next = STEPS[currentIndex + 1];
    if (next) setStep(next);
  }

  return (
    <div className="mx-auto max-w-2xl py-8">
      {/* Progress */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            {i <= currentIndex ? (
              <CheckCircle2 className="h-6 w-6 text-primary" />
            ) : (
              <Circle className="h-6 w-6 text-muted-foreground" />
            )}
            <span className={`text-sm ${i <= currentIndex ? "font-medium" : "text-muted-foreground"}`}>
              {i + 1}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-8 ${i < currentIndex ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Shop */}
      {step === "shop" && (
        <Card>
          <CardHeader>
            <CardTitle>{t("onboarding.shopTitle")}</CardTitle>
            <CardDescription>{t("onboarding.shopDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>{t("onboarding.shopName")}</Label>
              <Input
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder={t("onboarding.shopNamePlaceholder")}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("creators.category")}</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder={t("common.search")} />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={nextStep} disabled={!shopName || !category} className="self-end">
              {t("onboarding.next")} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Product */}
      {step === "product" && (
        <Card>
          <CardHeader>
            <CardTitle>{t("onboarding.productTitle")}</CardTitle>
            <CardDescription>{t("onboarding.productDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>{t("onboarding.productName")}</Label>
              <Input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder={t("onboarding.productNamePlaceholder")}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("onboarding.price")}</Label>
              <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="45.00" />
            </div>
            <Button onClick={nextStep} disabled={!productName || !price} className="self-end">
              {t("onboarding.next")} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Strategy */}
      {step === "strategy" && (
        <Card>
          <CardHeader>
            <CardTitle>{t("onboarding.strategyTitle")}</CardTitle>
            <CardDescription>{t("onboarding.strategyDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>{t("onboarding.budget")}</Label>
              <Select value={budget} onValueChange={setBudget}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="500">{"< $500"}</SelectItem>
                  <SelectItem value="1000">$500 - $1,000</SelectItem>
                  <SelectItem value="5000">$1,000 - $5,000</SelectItem>
                  <SelectItem value="10000">$5,000+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("onboarding.goal")}</Label>
              <Select value={goal} onValueChange={setGoal}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gmv">{t("onboarding.goalGmv")}</SelectItem>
                  <SelectItem value="awareness">{t("onboarding.goalAwareness")}</SelectItem>
                  <SelectItem value="creators">{t("onboarding.goalCreators")}</SelectItem>
                  <SelectItem value="content">{t("onboarding.goalContent")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={nextStep} disabled={!budget || !goal} className="self-end">
              <Sparkles className="mr-2 h-4 w-4" />
              {t("onboarding.generateStrategy")}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Complete */}
      {step === "complete" && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-primary" />
              <div>
                <CardTitle>{t("onboarding.completeTitle")}</CardTitle>
                <CardDescription>{shopName}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="rounded-lg border bg-card p-4 flex flex-col gap-3">
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("creators.category")}</span>
                  <Badge variant="secondary">{category}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("onboarding.productName")}</span>
                  <span>{productName} — ${price}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("onboarding.budget")}</span>
                  <span>${budget}/mo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("onboarding.goal")}</span>
                  <span className="capitalize">{goal}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Circle className="h-4 w-4 text-muted-foreground" />
                  <span>{t(`onboarding.checklist.${i + 1}`)}</span>
                </div>
              ))}
            </div>

            <Button onClick={() => router.push("/dashboard")} className="w-full">
              {t("onboarding.goToDashboard")} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
