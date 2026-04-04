import { useTranslations } from "next-intl";
import { OutreachView } from "@/components/outreach/outreach-view";

export default function OutreachPage() {
  const t = useTranslations("outreach");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <OutreachView />
    </div>
  );
}
