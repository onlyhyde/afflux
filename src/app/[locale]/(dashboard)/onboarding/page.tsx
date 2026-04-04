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

  function handleComplete() {
    router.push("/dashboard");
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
              {s === "shop" && "Shop"}
              {s === "product" && "Product"}
              {s === "strategy" && "Strategy"}
              {s === "complete" && "Done"}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-8 ${i < currentIndex ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Shop Info */}
      {step === "shop" && (
        <Card>
          <CardHeader>
            <CardTitle>Tell us about your shop</CardTitle>
            <CardDescription>
              We'll use this to find the best creators for your brand.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Shop Name</Label>
              <Input
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="Your TikTok Shop name"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("creators.category")}</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={nextStep} disabled={!shopName || !category} className="self-end">
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Product */}
      {step === "product" && (
        <Card>
          <CardHeader>
            <CardTitle>Add your first product</CardTitle>
            <CardDescription>
              Our AI will analyze this to recommend the best creators.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Product Name</Label>
              <Input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g., Vegan Glow Serum"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Price (USD)</Label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="45.00"
              />
            </div>
            <Button onClick={nextStep} disabled={!productName || !price} className="self-end">
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Strategy */}
      {step === "strategy" && (
        <Card>
          <CardHeader>
            <CardTitle>Define your goals</CardTitle>
            <CardDescription>
              We'll create a personalized playbook for your launch.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Monthly Budget</Label>
              <Select value={budget} onValueChange={setBudget}>
                <SelectTrigger>
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="500">Under $500</SelectItem>
                  <SelectItem value="1000">$500 - $1,000</SelectItem>
                  <SelectItem value="5000">$1,000 - $5,000</SelectItem>
                  <SelectItem value="10000">$5,000+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Primary Goal</Label>
              <Select value={goal} onValueChange={setGoal}>
                <SelectTrigger>
                  <SelectValue placeholder="What matters most?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gmv">Maximize GMV</SelectItem>
                  <SelectItem value="awareness">Brand Awareness</SelectItem>
                  <SelectItem value="creators">Build Creator Network</SelectItem>
                  <SelectItem value="content">Generate Content</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={nextStep} disabled={!budget || !goal} className="self-end">
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Strategy
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
                <CardTitle>Your playbook is ready!</CardTitle>
                <CardDescription>
                  Here's your recommended strategy for {shopName}.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {/* Strategy Summary */}
            <div className="rounded-lg border bg-card p-4 flex flex-col gap-3">
              <h3 className="font-semibold">Recommended Strategy</h3>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <Badge variant="secondary">{category}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Product</span>
                  <span>{productName} — ${price}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Budget</span>
                  <span>${budget}/mo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Goal</span>
                  <span className="capitalize">{goal?.replace("_", " ")}</span>
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div className="flex flex-col gap-2">
              <h3 className="font-semibold">Your Launch Checklist</h3>
              {[
                "Set up your TikTok Shop profile",
                "Add your first product with images and description",
                "Search for creators in your category",
                "Send your first 10 outreach messages",
                "Follow up with responsive creators",
                "Ship product samples to interested creators",
                "Monitor first content uploads",
                "Track GMV and optimize",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Circle className="h-4 w-4 text-muted-foreground" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <Button onClick={handleComplete} className="w-full">
              Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
