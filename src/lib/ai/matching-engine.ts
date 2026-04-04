/**
 * AI Creator-Product Matching Engine
 *
 * Multi-dimensional scoring that analyzes:
 * 1. Audience fit (demographics overlap)
 * 2. Category expertise
 * 3. Conversion history
 * 4. Content style fit
 * 5. Price tier alignment
 * 6. Brand safety
 * 7. Collaboration saturation
 * 8. Competitive conflict
 * 9. Activity health
 * 10. Response likelihood
 */

export interface ProductProfile {
  id: string;
  name: string;
  category: string;
  price: number;
  currency: string;
  targetGender?: string | null;
  targetAgeMin?: number | null;
  targetAgeMax?: number | null;
  targetKeywords?: string[];
  description?: string | null;
}

export interface CreatorProfile {
  id: string;
  username: string;
  displayName: string | null;
  category: string | null;
  followers: number;
  engagementRate: number;
  gmv: number;
  trustScore: number | null;
  country: string | null;
  language: string | null;
  contentStyles: string[] | null;
  audienceDemographics: {
    genderSplit: { male: number; female: number; other: number };
    ageGroups: Record<string, number>;
    topCountries: Record<string, number>;
  } | null;
  isTiktokShopCreator: boolean;
  activeCollaborations?: number;
  avgConversionRate?: number;
  lastActiveAt?: Date | null;
}

export interface MatchResult {
  creatorId: string;
  creator: CreatorProfile;
  score: number; // 0-100
  breakdown: ScoreBreakdown;
  recommendation: string;
  concerns: string[];
}

export interface ScoreBreakdown {
  audienceFit: number;
  categoryExpertise: number;
  conversionHistory: number;
  contentStyleFit: number;
  priceTierAlignment: number;
  brandSafety: number;
  saturation: number;
  competitiveConflict: number;
  activityHealth: number;
  responseLikelihood: number;
}

const WEIGHTS: Record<keyof ScoreBreakdown, number> = {
  audienceFit: 0.20,
  categoryExpertise: 0.15,
  conversionHistory: 0.15,
  contentStyleFit: 0.10,
  priceTierAlignment: 0.10,
  brandSafety: 0.08,
  saturation: 0.07,
  competitiveConflict: 0.05,
  activityHealth: 0.05,
  responseLikelihood: 0.05,
};

// ── Dimension Scorers ────────────────────────────

function scoreAudienceFit(product: ProductProfile, creator: CreatorProfile): number {
  if (!creator.audienceDemographics) return 50; // Unknown = neutral

  let score = 50;
  const demo = creator.audienceDemographics;

  // Gender fit
  if (product.targetGender) {
    const genderKey = product.targetGender.toLowerCase() as "male" | "female";
    const genderPercent = demo.genderSplit[genderKey] ?? 0;
    if (genderPercent >= 70) score += 25;
    else if (genderPercent >= 50) score += 15;
    else if (genderPercent < 30) score -= 25;
  }

  // Age fit
  if (product.targetAgeMin && product.targetAgeMax) {
    const ageGroups = demo.ageGroups;
    const relevantAge = Object.entries(ageGroups).reduce((sum, [range, pct]) => {
      const [minStr] = range.split("-");
      const min = parseInt(minStr);
      if (min >= (product.targetAgeMin ?? 0) - 5 && min <= (product.targetAgeMax ?? 100)) {
        return sum + pct;
      }
      return sum;
    }, 0);

    if (relevantAge >= 50) score += 25;
    else if (relevantAge >= 30) score += 10;
    else score -= 15;
  }

  return Math.max(0, Math.min(100, score));
}

function scoreCategoryExpertise(product: ProductProfile, creator: CreatorProfile): number {
  if (!creator.category) return 30;

  const productCat = product.category.toLowerCase();
  const creatorCat = creator.category.toLowerCase();

  if (productCat === creatorCat) return 95;

  // Related categories
  const related: Record<string, string[]> = {
    beauty: ["fashion", "skincare", "wellness"],
    fashion: ["beauty", "lifestyle", "luxury"],
    food: ["cooking", "lifestyle", "health"],
    tech: ["gaming", "education", "reviews"],
    fitness: ["health", "wellness", "sports"],
    home: ["lifestyle", "diy", "interior"],
  };

  if (related[productCat]?.includes(creatorCat)) return 65;

  return 20;
}

function scoreConversionHistory(_product: ProductProfile, creator: CreatorProfile): number {
  if (creator.avgConversionRate === undefined) return 50; // No data = neutral

  if (creator.avgConversionRate >= 3) return 95;
  if (creator.avgConversionRate >= 2) return 80;
  if (creator.avgConversionRate >= 1) return 60;
  return 30;
}

function scoreContentStyleFit(product: ProductProfile, creator: CreatorProfile): number {
  if (!creator.contentStyles || creator.contentStyles.length === 0) return 50;

  // Product type → ideal content styles
  const idealStyles: Record<string, string[]> = {
    beauty: ["review", "tutorial", "grwm", "before-after"],
    fashion: ["haul", "grwm", "vlog", "try-on"],
    food: ["review", "recipe", "vlog", "mukbang"],
    tech: ["review", "unboxing", "comparison", "tutorial"],
    fitness: ["tutorial", "transformation", "review", "vlog"],
    home: ["review", "diy", "tutorial", "haul"],
  };

  const productCat = product.category.toLowerCase();
  const ideal = idealStyles[productCat] ?? [];

  const overlap = creator.contentStyles.filter((s) =>
    ideal.includes(s.toLowerCase())
  ).length;

  if (overlap >= 2) return 90;
  if (overlap >= 1) return 70;
  return 35;
}

function scorePriceTierAlignment(product: ProductProfile, creator: CreatorProfile): number {
  // Infer audience spending power from creator's average GMV/sales ratio
  const avgOrderValue = creator.gmv > 0 ? creator.gmv / Math.max(1, creator.followers * 0.001) : 0;

  const price = product.price;

  if (price <= 20) return 80; // Low price = broadly accessible
  if (price <= 50 && avgOrderValue >= 20) return 85;
  if (price <= 100 && avgOrderValue >= 40) return 80;
  if (price > 100 && avgOrderValue < 30) return 30; // Expensive product, low-spending audience

  return 60;
}

function scoreBrandSafety(creator: CreatorProfile): number {
  return creator.trustScore ?? 50;
}

function scoreSaturation(creator: CreatorProfile): number {
  const collabs = creator.activeCollaborations ?? 0;
  if (collabs === 0) return 90;
  if (collabs <= 2) return 75;
  if (collabs <= 5) return 50;
  return 20; // Over-saturated
}

function scoreCompetitiveConflict(): number {
  // Placeholder — requires competitive data integration
  return 80;
}

function scoreActivityHealth(creator: CreatorProfile): number {
  if (!creator.lastActiveAt) return 40;

  const daysSinceActive = Math.floor(
    (Date.now() - new Date(creator.lastActiveAt).getTime()) / 86400000
  );

  if (daysSinceActive <= 3) return 95;
  if (daysSinceActive <= 7) return 80;
  if (daysSinceActive <= 14) return 60;
  if (daysSinceActive <= 30) return 40;
  return 15;
}

function scoreResponseLikelihood(): number {
  // Placeholder — requires outreach response data
  return 60;
}

// ── Main Matching Function ────────────────────────

export function matchCreatorToProduct(
  product: ProductProfile,
  creator: CreatorProfile
): MatchResult {
  const breakdown: ScoreBreakdown = {
    audienceFit: scoreAudienceFit(product, creator),
    categoryExpertise: scoreCategoryExpertise(product, creator),
    conversionHistory: scoreConversionHistory(product, creator),
    contentStyleFit: scoreContentStyleFit(product, creator),
    priceTierAlignment: scorePriceTierAlignment(product, creator),
    brandSafety: scoreBrandSafety(creator),
    saturation: scoreSaturation(creator),
    competitiveConflict: scoreCompetitiveConflict(),
    activityHealth: scoreActivityHealth(creator),
    responseLikelihood: scoreResponseLikelihood(),
  };

  // Weighted total
  const score = Math.round(
    Object.entries(WEIGHTS).reduce(
      (total, [key, weight]) =>
        total + breakdown[key as keyof ScoreBreakdown] * weight,
      0
    )
  );

  // Generate recommendation text
  const concerns: string[] = [];
  if (breakdown.audienceFit < 40) concerns.push("Audience demographics mismatch");
  if (breakdown.categoryExpertise < 40) concerns.push("Not specialized in this category");
  if (breakdown.saturation < 40) concerns.push("Too many active collaborations");
  if (breakdown.brandSafety < 50) concerns.push("Low trust score");
  if (breakdown.activityHealth < 40) concerns.push("Inactive recently");

  const strengths: string[] = [];
  if (breakdown.audienceFit >= 80) strengths.push("strong audience match");
  if (breakdown.categoryExpertise >= 80) strengths.push("category expert");
  if (breakdown.conversionHistory >= 80) strengths.push("high conversion rate");
  if (breakdown.contentStyleFit >= 80) strengths.push("ideal content style");

  const recommendation =
    strengths.length > 0
      ? `Recommended — ${strengths.join(", ")}`
      : concerns.length > 0
        ? `Caution — ${concerns[0]}`
        : "Average fit";

  return {
    creatorId: creator.id,
    creator,
    score,
    breakdown,
    recommendation,
    concerns,
  };
}

export function rankCreatorsForProduct(
  product: ProductProfile,
  creators: CreatorProfile[],
  limit = 20
): MatchResult[] {
  return creators
    .map((creator) => matchCreatorToProduct(product, creator))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
