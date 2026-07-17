import { getTranslations } from "next-intl/server";
import { ShieldCheck } from "lucide-react";
import { ContentPage } from "@/components/content-page";

export const dynamic = "force-dynamic";

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  const tp = await getTranslations({ locale, namespace: "pages" });
  return (
    <ContentPage
      slug="privaatsuspoliitika"
      locale={locale}
      title={t("privacy")}
      subtitle={tp("privacySub")}
      icon={ShieldCheck}
    />
  );
}
