import { useTranslations } from "next-intl";
import { CreatorSearchView } from "@/components/creators/creator-search-view";

export default function CreatorsPage() {
  const t = useTranslations("creators");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <CreatorSearchView />
    </div>
  );
}
