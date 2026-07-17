import { getTranslations } from "next-intl/server";
import { ScrollText } from "lucide-react";
import { ContentPage } from "@/components/content-page";

export const dynamic = "force-dynamic";

export default async function RulesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  const tp = await getTranslations({ locale, namespace: "pages" });
  return (
    <ContentPage
      slug="reeglid"
      locale={locale}
      title={t("rules")}
      subtitle={tp("rulesSub")}
      icon={ScrollText}
    />
  );
}
