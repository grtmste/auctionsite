import { getTranslations } from "next-intl/server";
import { ContentPage } from "@/components/content-page";

export const dynamic = "force-dynamic";

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return (
    <ContentPage slug="privaatsuspoliitika" locale={locale} title={t("privacy")} />
  );
}
