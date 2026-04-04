/**
 * F4-2: Sample auto-approval rules engine.
 *
 * Evaluates whether a creator meets the configured thresholds
 * for automatic sample approval without manual review.
 */

export interface AutoApprovalRules {
  minFollowers: number;
  minEngagementRate: number;
  minTrustScore: number;
  requireTiktokShop: boolean;
}

export interface CreatorMetrics {
  followers: number;
  engagementRate: number;
  trustScore: number | null;
  isTiktokShopCreator: boolean;
}

export interface ApprovalResult {
  approved: boolean;
  reasons: string[];
}

export function evaluateAutoApproval(
  creator: CreatorMetrics,
  rules: AutoApprovalRules
): ApprovalResult {
  const reasons: string[] = [];

  if (creator.followers < rules.minFollowers) {
    reasons.push(
      `Followers below minimum (${creator.followers} < ${rules.minFollowers})`
    );
  }

  if (creator.engagementRate < rules.minEngagementRate) {
    reasons.push(
      `Engagement rate below minimum (${creator.engagementRate} < ${rules.minEngagementRate})`
    );
  }

  if ((creator.trustScore ?? 0) < rules.minTrustScore) {
    reasons.push(
      `Trust score below minimum (${creator.trustScore ?? 0} < ${rules.minTrustScore})`
    );
  }

  if (rules.requireTiktokShop && !creator.isTiktokShopCreator) {
    reasons.push("Not a TikTok Shop creator");
  }

  return {
    approved: reasons.length === 0,
    reasons,
  };
}
