import { describe, it, expect } from "vitest";
import {
  matchCreatorToProduct,
  rankCreatorsForProduct,
  type ProductProfile,
  type CreatorProfile,
} from "./matching-engine";

const baseProduct: ProductProfile = {
  id: "p1",
  name: "Vegan Glow Serum",
  category: "Beauty",
  price: 45,
  currency: "USD",
  targetGender: "female",
  targetAgeMin: 25,
  targetAgeMax: 40,
};

function makeCreator(overrides: Partial<CreatorProfile> = {}): CreatorProfile {
  return {
    id: "c1",
    username: "testcreator",
    displayName: "Test Creator",
    category: "Beauty",
    followers: 100000,
    engagementRate: 5.0,
    gmv: 50000,
    trustScore: 80,
    country: "US",
    language: "en",
    contentStyles: ["review", "tutorial"],
    audienceDemographics: {
      genderSplit: { male: 20, female: 75, other: 5 },
      ageGroups: { "18-24": 25, "25-34": 40, "35-44": 20, "45+": 15 },
      topCountries: { US: 60, GB: 15 },
    },
    isTiktokShopCreator: true,
    lastActiveAt: new Date(),
    ...overrides,
  };
}

describe("matchCreatorToProduct", () => {
  it("returns a score between 0 and 100", () => {
    const result = matchCreatorToProduct(baseProduct, makeCreator());
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("scores a well-matched creator higher than a mismatched one", () => {
    const goodMatch = matchCreatorToProduct(baseProduct, makeCreator());

    const badMatch = matchCreatorToProduct(
      baseProduct,
      makeCreator({
        category: "Tech",
        audienceDemographics: {
          genderSplit: { male: 80, female: 15, other: 5 },
          ageGroups: { "13-17": 30, "18-24": 40, "25-34": 20, "35-44": 10 },
          topCountries: { US: 50 },
        },
        contentStyles: ["unboxing", "comparison"],
        trustScore: 40,
      })
    );

    expect(goodMatch.score).toBeGreaterThan(badMatch.score);
  });

  it("flags concerns for low trust score", () => {
    const result = matchCreatorToProduct(
      baseProduct,
      makeCreator({ trustScore: 30 })
    );
    expect(result.concerns).toContain("Low trust score");
  });

  it("flags concerns for inactive creator", () => {
    const result = matchCreatorToProduct(
      baseProduct,
      makeCreator({
        lastActiveAt: new Date(Date.now() - 60 * 86400000), // 60 days ago
      })
    );
    expect(result.concerns).toContain("Inactive recently");
  });

  it("flags saturation concern for over-committed creators", () => {
    const result = matchCreatorToProduct(
      baseProduct,
      makeCreator({ activeCollaborations: 8 })
    );
    expect(result.concerns).toContain("Too many active collaborations");
  });

  it("includes positive recommendation for strong matches", () => {
    const result = matchCreatorToProduct(baseProduct, makeCreator());
    expect(result.recommendation).toContain("Recommended");
  });
});

describe("rankCreatorsForProduct", () => {
  it("returns creators sorted by score descending", () => {
    const creators = [
      makeCreator({ id: "c1", category: "Tech", trustScore: 30 }),
      makeCreator({ id: "c2", category: "Beauty", trustScore: 90 }),
      makeCreator({ id: "c3", category: "Fashion", trustScore: 60 }),
    ];

    const results = rankCreatorsForProduct(baseProduct, creators);

    expect(results[0].score).toBeGreaterThanOrEqual(results[1].score);
    expect(results[1].score).toBeGreaterThanOrEqual(results[2].score);
  });

  it("limits results to specified count", () => {
    const creators = Array.from({ length: 50 }, (_, i) =>
      makeCreator({ id: `c${i}` })
    );

    const results = rankCreatorsForProduct(baseProduct, creators, 10);
    expect(results).toHaveLength(10);
  });
});
