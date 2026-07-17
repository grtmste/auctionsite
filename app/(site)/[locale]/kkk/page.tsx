import { getTranslations } from "next-intl/server";
import { HelpCircle } from "lucide-react";
import { getPageContent } from "@/lib/pages";
import { FaqAccordion } from "@/components/faq-accordion";
import { PageShell } from "@/components/page-shell";

export const dynamic = "force-dynamic";

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  const tp = await getTranslations({ locale, namespace: "pages" });
  const html = await getPageContent("kkk", locale);

  return (
    <PageShell title={t("faq")} subtitle={tp("faqSub")} icon={HelpCircle}>
      {html ? <FaqAccordion html={html} /> : <p className="text-muted">…</p>}
    </PageShell>
  );
}
