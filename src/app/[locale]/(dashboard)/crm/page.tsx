import { useTranslations } from "next-intl";
import { CrmPipeline } from "@/components/crm/crm-pipeline";

export default function CrmPage() {
  const t = useTranslations("crm");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <CrmPipeline />
    </div>
  );
}
