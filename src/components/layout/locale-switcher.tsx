"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/lib/i18n/routing";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";

const localeLabels: Record<string, string> = {
  en: "English",
  ko: "한국어",
};

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function handleSwitch() {
    const nextLocale = locale === "en" ? "ko" : "en";
    router.replace(pathname, { locale: nextLocale });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleSwitch}
      className="w-full justify-start gap-2"
    >
      <Languages className="h-4 w-4" />
      <span>{localeLabels[locale]}</span>
    </Button>
  );
}
