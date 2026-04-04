import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/routing";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const t = useTranslations();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          {t("app.name")}
        </h1>
        <p className="max-w-md text-lg text-muted-foreground">
          {t("app.tagline")}
        </p>
      </div>

      <div className="flex gap-4">
        <Button asChild>
          <Link href="/dashboard">{t("nav.dashboard")}</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/creators">{t("nav.creators")}</Link>
        </Button>
      </div>
    </div>
  );
}
