import { describe, it, expect } from "vitest";
import { getPlanLimits, checkPlanLimit, type Plan } from "./plan-limits";

describe("Plan Limits", () => {
  describe("getPlanLimits", () => {
    it("should return correct limits for free plan", () => {
      const limits = getPlanLimits("free");
      expect(limits.dmPerMonth).toBe(0);
      expect(limits.emailPerMonth).toBe(0);
      expect(limits.crmCreators).toBe(50);
      expect(limits.teamMembers).toBe(1);
      expect(limits.aiMatchPerMonth).toBe(5);
    });

    it("should return correct limits for starter plan", () => {
      const limits = getPlanLimits("starter");
      expect(limits.dmPerMonth).toBe(10000);
      expect(limits.emailPerMonth).toBe(1000);
      expect(limits.crmCreators).toBe(500);
      expect(limits.teamMembers).toBe(3);
    });

    it("should return Infinity for growth plan unlimited features", () => {
      const limits = getPlanLimits("growth");
      expect(limits.dmPerMonth).toBe(Infinity);
      expect(limits.emailPerMonth).toBe(Infinity);
      expect(limits.crmCreators).toBe(Infinity);
    });

    it("should return correct limits for agency plan", () => {
      const limits = getPlanLimits("agency");
      expect(limits.multiShop).toBe(true);
      expect(limits.whiteLabel).toBe(true);
      expect(limits.teamMembers).toBe(Infinity);
    });
  });

  describe("checkPlanLimit", () => {
    it("should return true when usage is below limit", () => {
      expect(checkPlanLimit("starter", "dmPerMonth", 5000)).toBe(true);
    });

    it("should return false when usage exceeds limit", () => {
      expect(checkPlanLimit("starter", "dmPerMonth", 15000)).toBe(false);
    });

    it("should return true for Infinity limits", () => {
      expect(checkPlanLimit("growth", "dmPerMonth", 999999)).toBe(true);
    });

    it("should return false for free plan DM sending", () => {
      expect(checkPlanLimit("free", "dmPerMonth", 1)).toBe(false);
    });
  });
});
