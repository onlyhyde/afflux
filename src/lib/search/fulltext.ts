/**
 * Full-text search utilities for PostgreSQL tsvector.
 * Used by creator search to replace ILIKE with indexed search.
 */

/**
 * Sanitize user search input — remove special characters that could
 * break tsquery parsing or enable injection.
 */
export function sanitizeSearchInput(input: string): string {
  return input
    .replace(/[&|!:*()'";<>\\-]/g, "") // Remove tsquery special chars + SQL chars + dashes
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Convert space-separated search terms into a PostgreSQL tsquery string.
 * "beauty skincare" → "beauty & skincare"
 */
export function buildSearchQuery(input: string): string {
  const sanitized = sanitizeSearchInput(input);
  if (!sanitized) return "";

  return sanitized
    .split(" ")
    .filter((word) => word.length > 0)
    .join(" & ");
}
