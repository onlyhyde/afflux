import { describe, it, expect } from "vitest";
import { creatorsToCSV } from "./csv";

describe("CSV Export (F1-8)", () => {
  it("should generate valid CSV with headers", () => {
    const creators = [
      {
        username: "sarah_beauty",
        displayName: "Sarah Chen",
        category: "Beauty",
        followers: 250000,
        engagementRate: "4.5",
        gmv: "45000.00",
        country: "US",
        trustScore: 85,
      },
      {
        username: "mike_tech",
        displayName: "Mike Kim",
        category: "Tech",
        followers: 180000,
        engagementRate: "3.2",
        gmv: "32000.00",
        country: "KR",
        trustScore: 72,
      },
    ];

    const csv = creatorsToCSV(creators);
    const lines = csv.split("\n");

    expect(lines[0]).toBe(
      "Username,Display Name,Category,Followers,Engagement Rate,GMV,Country,Trust Score"
    );
    expect(lines[1]).toContain("sarah_beauty");
    expect(lines[1]).toContain("250000");
    expect(lines[2]).toContain("mike_tech");
    expect(lines.length).toBe(3); // header + 2 rows
  });

  it("should handle empty array", () => {
    const csv = creatorsToCSV([]);
    const lines = csv.split("\n");
    expect(lines.length).toBe(1); // header only
  });

  it("should escape commas in display names", () => {
    const creators = [
      {
        username: "test",
        displayName: "Name, With Comma",
        category: "Beauty",
        followers: 1000,
        engagementRate: "1.0",
        gmv: "100.00",
        country: "US",
        trustScore: 50,
      },
    ];

    const csv = creatorsToCSV(creators);
    expect(csv).toContain('"Name, With Comma"');
  });
});
