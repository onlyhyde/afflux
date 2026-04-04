import { describe, it, expect } from "vitest";
import { evaluateAutoApproval, type AutoApprovalRules } from "./sample-auto-approve";

const defaultRules: AutoApprovalRules = {
  minFollowers: 10000,
  minEngagementRate: 2.0,
  minTrustScore: 60,
  requireTiktokShop: true,
};

describe("Sample Auto-Approval (F4-2)", () => {
  it("should approve when all criteria met", () => {
    const result = evaluateAutoApproval(
      {
        followers: 50000,
        engagementRate: 4.5,
        trustScore: 85,
        isTiktokShopCreator: true,
      },
      defaultRules
    );

    expect(result.approved).toBe(true);
    expect(result.reasons).toHaveLength(0);
  });

  it("should reject when followers below minimum", () => {
    const result = evaluateAutoApproval(
      {
        followers: 5000,
        engagementRate: 4.5,
        trustScore: 85,
        isTiktokShopCreator: true,
      },
      defaultRules
    );

    expect(result.approved).toBe(false);
    expect(result.reasons).toContain("Followers below minimum (5000 < 10000)");
  });

  it("should reject when engagement rate too low", () => {
    const result = evaluateAutoApproval(
      {
        followers: 50000,
        engagementRate: 1.0,
        trustScore: 85,
        isTiktokShopCreator: true,
      },
      defaultRules
    );

    expect(result.approved).toBe(false);
    expect(result.reasons).toContain("Engagement rate below minimum (1 < 2)");
  });

  it("should reject when trust score too low", () => {
    const result = evaluateAutoApproval(
      {
        followers: 50000,
        engagementRate: 4.5,
        trustScore: 40,
        isTiktokShopCreator: true,
      },
      defaultRules
    );

    expect(result.approved).toBe(false);
    expect(result.reasons).toContain("Trust score below minimum (40 < 60)");
  });

  it("should reject when not a TikTok Shop creator", () => {
    const result = evaluateAutoApproval(
      {
        followers: 50000,
        engagementRate: 4.5,
        trustScore: 85,
        isTiktokShopCreator: false,
      },
      defaultRules
    );

    expect(result.approved).toBe(false);
    expect(result.reasons).toContain("Not a TikTok Shop creator");
  });

  it("should collect multiple rejection reasons", () => {
    const result = evaluateAutoApproval(
      {
        followers: 500,
        engagementRate: 0.5,
        trustScore: 20,
        isTiktokShopCreator: false,
      },
      defaultRules
    );

    expect(result.approved).toBe(false);
    expect(result.reasons.length).toBe(4);
  });

  it("should skip TikTok Shop check when not required", () => {
    const result = evaluateAutoApproval(
      {
        followers: 50000,
        engagementRate: 4.5,
        trustScore: 85,
        isTiktokShopCreator: false,
      },
      { ...defaultRules, requireTiktokShop: false }
    );

    expect(result.approved).toBe(true);
  });
});
