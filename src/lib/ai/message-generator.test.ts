import { describe, it, expect } from "vitest";
import { generateMessage, type MessageGenerationInput } from "./message-generator";

const baseInput: MessageGenerationInput = {
  creatorName: "Sarah",
  creatorCategory: "Beauty",
  creatorUsername: "sarahbeauty",
  productName: "Vegan Glow Serum",
  productDescription: "A lightweight serum for sensitive skin",
  commissionRate: 12,
  brandName: "GlowBrand",
  locale: "en",
  tone: "friendly",
  channel: "tiktok_dm",
};

describe("generateMessage", () => {
  it("generates a DM with creator name", () => {
    const result = generateMessage(baseInput);
    expect(result.body).toContain("Sarah");
    expect(result.body).toContain("12%");
    expect(result.body).toContain("Vegan Glow Serum");
    expect(result.characterCount).toBeGreaterThan(0);
  });

  it("generates email with subject line", () => {
    const result = generateMessage({ ...baseInput, channel: "email" });
    expect(result.subject).toBeTruthy();
    expect(result.subject).toContain("GlowBrand");
    expect(result.body).toContain("sarahbeauty");
  });

  it("generates Korean messages when locale is ko", () => {
    const result = generateMessage({ ...baseInput, locale: "ko" });
    expect(result.body).toContain("안녕하세요");
    expect(result.body).toContain("Sarah");
    expect(result.locale).toBe("ko");
  });

  it("falls back to English for unsupported locale", () => {
    const result = generateMessage({ ...baseInput, locale: "ja" });
    expect(result.locale).toBe("en");
  });

  it("keeps TikTok invite messages short", () => {
    const result = generateMessage({ ...baseInput, channel: "tiktok_invite" });
    expect(result.characterCount).toBeLessThan(300);
  });
});
