/**
 * Plan feature limits — matches 12-BILLING.md spec.
 * Used to enforce feature gates based on tenant subscription plan.
 */

export type Plan = "free" | "starter" | "growth" | "enterprise" | "agency";

export interface PlanLimits {
  // Outreach
  dmPerMonth: number;
  emailPerMonth: number;
  collabInvitePerMonth: number;

  // CRM
  crmCreators: number;
  templates: number;

  // AI
  aiMatchPerMonth: number;
  aiMessagePerMonth: number;
  aiVideoPerMonth: number;

  // Features
  sparkCode: boolean;
  competitorMonitoring: boolean;
  contests: boolean;
  dedicatedManager: boolean;
  apiAccess: boolean;
  multiShop: boolean;
  whiteLabel: boolean;

  // Team
  teamMembers: number;

  // Search
  creatorSearchPerDay: number;
}

const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    dmPerMonth: 0,
    emailPerMonth: 0,
    collabInvitePerMonth: 0,
    crmCreators: 50,
    templates: 3,
    aiMatchPerMonth: 5,
    aiMessagePerMonth: 10,
    aiVideoPerMonth: 0,
    sparkCode: false,
    competitorMonitoring: false,
    contests: false,
    dedicatedManager: false,
    apiAccess: false,
    multiShop: false,
    whiteLabel: false,
    teamMembers: 1,
    creatorSearchPerDay: 50,
  },
  starter: {
    dmPerMonth: 10000,
    emailPerMonth: 1000,
    collabInvitePerMonth: 2500,
    crmCreators: 500,
    templates: 20,
    aiMatchPerMonth: 50,
    aiMessagePerMonth: 100,
    aiVideoPerMonth: 1,
    sparkCode: true,
    competitorMonitoring: false,
    contests: false,
    dedicatedManager: false,
    apiAccess: false,
    multiShop: false,
    whiteLabel: false,
    teamMembers: 3,
    creatorSearchPerDay: Infinity,
  },
  growth: {
    dmPerMonth: Infinity,
    emailPerMonth: Infinity,
    collabInvitePerMonth: Infinity,
    crmCreators: Infinity,
    templates: Infinity,
    aiMatchPerMonth: Infinity,
    aiMessagePerMonth: Infinity,
    aiVideoPerMonth: Infinity,
    sparkCode: true,
    competitorMonitoring: true,
    contests: true,
    dedicatedManager: true,
    apiAccess: false,
    multiShop: false,
    whiteLabel: false,
    teamMembers: 10,
    creatorSearchPerDay: Infinity,
  },
  enterprise: {
    dmPerMonth: Infinity,
    emailPerMonth: Infinity,
    collabInvitePerMonth: Infinity,
    crmCreators: Infinity,
    templates: Infinity,
    aiMatchPerMonth: Infinity,
    aiMessagePerMonth: Infinity,
    aiVideoPerMonth: Infinity,
    sparkCode: true,
    competitorMonitoring: true,
    contests: true,
    dedicatedManager: true,
    apiAccess: true,
    multiShop: false,
    whiteLabel: false,
    teamMembers: Infinity,
    creatorSearchPerDay: Infinity,
  },
  agency: {
    dmPerMonth: Infinity,
    emailPerMonth: Infinity,
    collabInvitePerMonth: Infinity,
    crmCreators: Infinity,
    templates: Infinity,
    aiMatchPerMonth: Infinity,
    aiMessagePerMonth: Infinity,
    aiVideoPerMonth: Infinity,
    sparkCode: true,
    competitorMonitoring: true,
    contests: true,
    dedicatedManager: true,
    apiAccess: true,
    multiShop: true,
    whiteLabel: true,
    teamMembers: Infinity,
    creatorSearchPerDay: Infinity,
  },
};

export function getPlanLimits(plan: Plan): PlanLimits {
  return PLAN_LIMITS[plan];
}

/**
 * Check if a numeric usage value is within the plan limit.
 * Returns true if allowed, false if exceeded.
 */
export function checkPlanLimit(
  plan: Plan,
  feature: keyof PlanLimits,
  currentUsage: number
): boolean {
  const limits = PLAN_LIMITS[plan];
  const limit = limits[feature];

  if (typeof limit === "boolean") return limit;
  if (limit === Infinity) return true;
  return currentUsage < limit;
}
