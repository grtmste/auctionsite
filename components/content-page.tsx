import { getPageContent } from "@/lib/pages";

interface ContentPageProps {
  slug: string;
  locale: string;
  title: string;
}

export async function ContentPage({ slug, locale, title }: ContentPageProps) {
  const html = await getPageContent(slug, locale);
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-bold">{title}</h1>
      {html ? (
        <div className="rich-text" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <p className="text-muted">…</p>
      )}
    </div>
  );
}
