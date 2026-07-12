import { getTranslations } from "next-intl/server";
import { getPageContent } from "@/lib/pages";
import { FaqAccordion } from "@/components/faq-accordion";

export const dynamic = "force-dynamic";

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  const html = await getPageContent("kkk", locale);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-bold">{t("faq")}</h1>
      {html ? <FaqAccordion html={html} /> : <p className="text-muted">…</p>}
    </div>
  );
}
