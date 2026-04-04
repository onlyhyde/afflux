/**
 * i18n locale configuration — currency, date format, timezone per locale.
 * Used by formatters throughout the app.
 */

export interface LocaleConfig {
  currency: string;
  dateFormat: string;
  timezone: string;
  direction: "ltr" | "rtl";
}

export const LOCALE_CONFIGS: Record<string, LocaleConfig> = {
  en: {
    currency: "USD",
    dateFormat: "MM/DD/YYYY",
    timezone: "America/New_York",
    direction: "ltr",
  },
  ko: {
    currency: "KRW",
    dateFormat: "YYYY.MM.DD",
    timezone: "Asia/Seoul",
    direction: "ltr",
  },
  ja: {
    currency: "JPY",
    dateFormat: "YYYY/MM/DD",
    timezone: "Asia/Tokyo",
    direction: "ltr",
  },
  id: {
    currency: "IDR",
    dateFormat: "DD/MM/YYYY",
    timezone: "Asia/Jakarta",
    direction: "ltr",
  },
  th: {
    currency: "THB",
    dateFormat: "DD/MM/YYYY",
    timezone: "Asia/Bangkok",
    direction: "ltr",
  },
};

export function formatCurrency(amount: number, locale: string): string {
  const config = LOCALE_CONFIGS[locale] ?? LOCALE_CONFIGS.en;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: config.currency,
    maximumFractionDigits:
      config.currency === "KRW" || config.currency === "JPY" ? 0 : 2,
  }).format(amount);
}

export function formatDate(date: Date, locale: string): string {
  const config = LOCALE_CONFIGS[locale] ?? LOCALE_CONFIGS.en;
  return new Intl.DateTimeFormat(locale, {
    timeZone: config.timezone,
    dateStyle: "medium",
  }).format(date);
}

export function formatNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatCompactNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { notation: "compact" }).format(value);
}
