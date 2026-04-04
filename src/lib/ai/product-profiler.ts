/**
 * AI Product Profiler
 *
 * Analyzes product information to automatically determine:
 * - Target demographics (gender, age range)
 * - Optimal content formats
 * - Seasonal factors
 * - Price segment classification
 */

export interface ProductAnalysis {
  category: string;
  priceSegment: "budget" | "mid" | "mid-premium" | "premium" | "luxury";
  targetGender: "male" | "female" | "unisex";
  targetAgeRange: { min: number; max: number };
  idealContentFormats: string[];
  seasonalPeak: string[];
  keywords: string[];
}

const CATEGORY_DEFAULTS: Record<string, Partial<ProductAnalysis>> = {
  beauty: {
    targetGender: "female",
    targetAgeRange: { min: 18, max: 45 },
    idealContentFormats: ["review", "tutorial", "grwm", "before-after"],
    seasonalPeak: ["spring", "fall"],
  },
  skincare: {
    targetGender: "female",
    targetAgeRange: { min: 20, max: 50 },
    idealContentFormats: ["review", "routine", "tutorial", "before-after"],
    seasonalPeak: ["spring", "fall"],
  },
  fashion: {
    targetGender: "unisex",
    targetAgeRange: { min: 16, max: 40 },
    idealContentFormats: ["haul", "try-on", "grwm", "vlog"],
    seasonalPeak: ["spring", "fall"],
  },
  tech: {
    targetGender: "male",
    targetAgeRange: { min: 18, max: 45 },
    idealContentFormats: ["review", "unboxing", "comparison", "tutorial"],
    seasonalPeak: ["holiday", "back-to-school"],
  },
  fitness: {
    targetGender: "unisex",
    targetAgeRange: { min: 18, max: 40 },
    idealContentFormats: ["review", "transformation", "tutorial", "vlog"],
    seasonalPeak: ["january", "spring"],
  },
  food: {
    targetGender: "unisex",
    targetAgeRange: { min: 18, max: 55 },
    idealContentFormats: ["review", "recipe", "mukbang", "vlog"],
    seasonalPeak: ["holiday", "summer"],
  },
  home: {
    targetGender: "unisex",
    targetAgeRange: { min: 25, max: 55 },
    idealContentFormats: ["review", "haul", "diy", "transformation"],
    seasonalPeak: ["spring", "fall"],
  },
  gaming: {
    targetGender: "male",
    targetAgeRange: { min: 13, max: 35 },
    idealContentFormats: ["review", "unboxing", "gameplay", "comparison"],
    seasonalPeak: ["holiday", "summer"],
  },
  pets: {
    targetGender: "unisex",
    targetAgeRange: { min: 20, max: 50 },
    idealContentFormats: ["review", "vlog", "tutorial", "before-after"],
    seasonalPeak: ["holiday"],
  },
};

function classifyPriceSegment(
  price: number,
  category: string
): ProductAnalysis["priceSegment"] {
  // Category-adjusted thresholds
  const thresholds: Record<string, number[]> = {
    beauty: [15, 35, 75, 150],
    fashion: [25, 60, 150, 500],
    tech: [30, 100, 300, 1000],
    food: [10, 25, 50, 100],
    default: [20, 50, 100, 300],
  };

  const t = thresholds[category.toLowerCase()] ?? thresholds.default;

  if (price <= t[0]) return "budget";
  if (price <= t[1]) return "mid";
  if (price <= t[2]) return "mid-premium";
  if (price <= t[3]) return "premium";
  return "luxury";
}

function extractKeywords(name: string, description: string | null): string[] {
  const text = `${name} ${description ?? ""}`.toLowerCase();
  const stopwords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to",
    "for", "of", "with", "by", "is", "it", "this", "that", "from",
  ]);

  return text
    .replace(/[^a-z0-9\s-]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopwords.has(word))
    .slice(0, 10);
}

export function profileProduct(input: {
  name: string;
  category: string;
  price: number;
  description?: string | null;
  targetGender?: string | null;
  targetAgeMin?: number | null;
  targetAgeMax?: number | null;
}): ProductAnalysis {
  const categoryLower = input.category.toLowerCase();
  const defaults = CATEGORY_DEFAULTS[categoryLower] ?? {};

  return {
    category: input.category,
    priceSegment: classifyPriceSegment(input.price, input.category),
    targetGender: (input.targetGender as ProductAnalysis["targetGender"]) ??
      defaults.targetGender ?? "unisex",
    targetAgeRange: {
      min: input.targetAgeMin ?? defaults.targetAgeRange?.min ?? 18,
      max: input.targetAgeMax ?? defaults.targetAgeRange?.max ?? 45,
    },
    idealContentFormats: defaults.idealContentFormats ?? ["review", "vlog"],
    seasonalPeak: defaults.seasonalPeak ?? [],
    keywords: extractKeywords(input.name, input.description ?? null),
  };
}
