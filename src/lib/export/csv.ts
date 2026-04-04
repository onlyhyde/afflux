/**
 * CSV export utilities.
 * F1-8: 크리에이터 검색 결과 CSV/Excel 내보내기
 */

interface CreatorRow {
  username: string;
  displayName: string | null;
  category: string | null;
  followers: number;
  engagementRate: string | null;
  gmv: string | null;
  country: string | null;
  trustScore: number | null;
}

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function creatorsToCSV(creators: CreatorRow[]): string {
  const headers = [
    "Username",
    "Display Name",
    "Category",
    "Followers",
    "Engagement Rate",
    "GMV",
    "Country",
    "Trust Score",
  ];

  const rows = creators.map((c) =>
    [
      escapeCSV(c.username),
      escapeCSV(c.displayName ?? ""),
      escapeCSV(c.category ?? ""),
      String(c.followers),
      c.engagementRate ?? "",
      c.gmv ?? "",
      c.country ?? "",
      String(c.trustScore ?? ""),
    ].join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}
