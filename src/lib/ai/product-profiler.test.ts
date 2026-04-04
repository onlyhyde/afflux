import { describe, it, expect } from "vitest";
import { profileProduct } from "./product-profiler";

describe("profileProduct", () => {
  it("classifies price segment correctly", () => {
    const budget = profileProduct({ name: "Lip Gloss", category: "Beauty", price: 8 });
    expect(budget.priceSegment).toBe("budget");

    const mid = profileProduct({ name: "Face Cream", category: "Beauty", price: 25 });
    expect(mid.priceSegment).toBe("mid");

    const premium = profileProduct({ name: "Luxury Serum", category: "Beauty", price: 120 });
    expect(premium.priceSegment).toBe("premium");
  });

  it("uses category defaults for target demographics", () => {
    const result = profileProduct({ name: "Mascara", category: "Beauty", price: 20 });
    expect(result.targetGender).toBe("female");
    expect(result.targetAgeRange.min).toBeLessThanOrEqual(25);
  });

  it("respects explicit target overrides", () => {
    const result = profileProduct({
      name: "Men's Moisturizer",
      category: "Beauty",
      price: 30,
      targetGender: "male",
      targetAgeMin: 20,
      targetAgeMax: 50,
    });
    expect(result.targetGender).toBe("male");
    expect(result.targetAgeRange.min).toBe(20);
    expect(result.targetAgeRange.max).toBe(50);
  });

  it("extracts keywords from name and description", () => {
    const result = profileProduct({
      name: "Vegan Glow Serum",
      category: "Beauty",
      price: 45,
      description: "A lightweight serum for sensitive skin",
    });
    expect(result.keywords).toContain("vegan");
    expect(result.keywords).toContain("serum");
    expect(result.keywords).toContain("sensitive");
  });

  it("provides ideal content formats per category", () => {
    const beauty = profileProduct({ name: "Test", category: "Beauty", price: 20 });
    expect(beauty.idealContentFormats).toContain("review");
    expect(beauty.idealContentFormats).toContain("tutorial");

    const tech = profileProduct({ name: "Test", category: "Tech", price: 100 });
    expect(tech.idealContentFormats).toContain("unboxing");
  });
});
