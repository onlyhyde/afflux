import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateScript, type ScriptRequest } from "./script-generator";

vi.mock("./llm-gateway", () => ({
  generateWithLLM: vi.fn().mockResolvedValue({
    text: "Hook: Did you know this serum can transform your skin?\n\nBody: I've been using this for 2 weeks...\n\nCTA: Link in bio!",
    inputTokens: 200,
    outputTokens: 150,
    model: "claude-sonnet-4-20250514",
    durationMs: 1500,
  }),
}));

describe("Script Generator (F7)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should generate a UGC script with hook, body, and CTA", async () => {
    const request: ScriptRequest = {
      productName: "Vegan Glow Serum",
      productDescription: "Lightweight serum for sensitive skin",
      category: "Beauty",
      targetAudience: "Women 25-35",
      contentStyle: "review",
      duration: 30,
      tenantId: "t1",
      locale: "en",
    };

    const result = await generateScript(request);

    expect(result.script).toContain("Hook");
    expect(result.script).toContain("serum");
    expect(result.locale).toBe("en");
    expect(result.estimatedDuration).toBe(30);
  });

  it("should work with Korean locale", async () => {
    const request: ScriptRequest = {
      productName: "비건 글로우 세럼",
      productDescription: "민감한 피부를 위한 가벼운 세럼",
      category: "Beauty",
      targetAudience: "25-35세 여성",
      contentStyle: "tutorial",
      duration: 60,
      tenantId: "t1",
      locale: "ko",
    };

    const result = await generateScript(request);
    expect(result).toHaveProperty("script");
    expect(result.locale).toBe("ko");
  });
});
