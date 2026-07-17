import { getTranslations } from "next-intl/server";
import { Wrench } from "lucide-react";
import { ContentPage } from "@/components/content-page";

export const dynamic = "force-dynamic";

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  const tp = await getTranslations({ locale, namespace: "pages" });
  return (
    <ContentPage
      slug="teenused"
      locale={locale}
      title={t("services")}
      subtitle={tp("servicesSub")}
      icon={Wrench}
    />
  );
}
