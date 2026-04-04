import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const LOCALES_DIR = path.join(__dirname, "../../../locales");
const BASE_LOCALE = "en";
const ALL_LOCALES = ["en", "ko", "ja", "id", "th"];

function flattenKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      keys.push(...flattenKeys(value as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

function loadLocale(locale: string): Record<string, unknown> {
  const filePath = path.join(LOCALES_DIR, locale, "common.json");
  if (!fs.existsSync(filePath)) return {};
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

describe("i18n Translation Completeness", () => {
  const baseKeys = flattenKeys(loadLocale(BASE_LOCALE));

  it("should have base locale (en) with all keys", () => {
    expect(baseKeys.length).toBeGreaterThan(0);
  });

  for (const locale of ALL_LOCALES) {
    it(`should have ${locale}/common.json file`, () => {
      const filePath = path.join(LOCALES_DIR, locale, "common.json");
      expect(fs.existsSync(filePath)).toBe(true);
    });

    if (locale !== BASE_LOCALE) {
      it(`should have all base keys in ${locale}`, () => {
        const localeKeys = new Set(flattenKeys(loadLocale(locale)));
        const missing = baseKeys.filter((key) => !localeKeys.has(key));

        if (missing.length > 0) {
          console.warn(
            `[${locale}] Missing ${missing.length} keys:`,
            missing.slice(0, 5).join(", "),
            missing.length > 5 ? `... and ${missing.length - 5} more` : ""
          );
        }

        // All locales MUST have all base keys
        expect(missing).toEqual([]);
      });
    }
  }

  it("should not have keys in non-base locales that are missing from base", () => {
    for (const locale of ALL_LOCALES.filter((l) => l !== BASE_LOCALE)) {
      const localeKeys = flattenKeys(loadLocale(locale));
      const baseKeySet = new Set(baseKeys);
      const extra = localeKeys.filter((key) => !baseKeySet.has(key));

      if (extra.length > 0) {
        console.warn(`[${locale}] Extra keys not in base:`, extra.slice(0, 5).join(", "));
      }

      expect(extra).toEqual([]);
    }
  });
});
