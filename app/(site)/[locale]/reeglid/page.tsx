import { getTranslations } from "next-intl/server";
import { ContentPage } from "@/components/content-page";

export const dynamic = "force-dynamic";

export default async function RulesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return <ContentPage slug="reeglid" locale={locale} title={t("rules")} />;
}
