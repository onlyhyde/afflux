import { describe, it, expect } from "vitest";
import { buildSearchQuery, sanitizeSearchInput } from "./fulltext";

describe("Full-text Search (tsvector)", () => {
  describe("sanitizeSearchInput", () => {
    it("should remove special characters", () => {
      expect(sanitizeSearchInput("beauty & skincare")).toBe("beauty skincare");
    });

    it("should trim whitespace", () => {
      expect(sanitizeSearchInput("  beauty  ")).toBe("beauty");
    });

    it("should handle empty input", () => {
      expect(sanitizeSearchInput("")).toBe("");
    });

    it("should remove SQL injection attempts", () => {
      expect(sanitizeSearchInput("'; DROP TABLE--")).toBe("DROP TABLE");
    });
  });

  describe("buildSearchQuery", () => {
    it("should convert space-separated words to tsquery format", () => {
      expect(buildSearchQuery("beauty skincare")).toBe("beauty & skincare");
    });

    it("should handle single word", () => {
      expect(buildSearchQuery("beauty")).toBe("beauty");
    });

    it("should filter empty tokens", () => {
      expect(buildSearchQuery("beauty  skincare")).toBe("beauty & skincare");
    });
  });
});
