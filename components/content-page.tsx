import type { LucideIcon } from "lucide-react";
import { getPageContent } from "@/lib/pages";
import { PageShell } from "@/components/page-shell";

interface ContentPageProps {
  slug: string;
  locale: string;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
}

export async function ContentPage({
  slug,
  locale,
  title,
  subtitle,
  icon,
}: ContentPageProps) {
  const html = await getPageContent(slug, locale);
  return (
    <PageShell title={title} subtitle={subtitle} icon={icon}>
      {html ? (
        <div
          className="rich-text rounded-lg border border-border bg-surface p-6 shadow-sm md:p-8"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <p className="text-muted">…</p>
      )}
    </PageShell>
  );
}
