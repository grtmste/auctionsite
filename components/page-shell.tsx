import type { LucideIcon } from "lucide-react";

/**
 * Shared header + body wrapper for content pages (services, rules, FAQ,
 * privacy). Gives them a branded gradient header band instead of a bare title.
 */
export function PageShell({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border bg-header">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 78% 15%, rgba(232,131,12,0.16), transparent 55%)",
          }}
        />
        <div className="relative mx-auto max-w-4xl px-4 py-12 md:py-16">
          {Icon && (
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary rise-in">
              <Icon className="h-6 w-6" />
            </div>
          )}
          <h1 className="rise-in text-3xl font-bold tracking-tight md:text-4xl">
            {title}
          </h1>
          {subtitle && (
            <p
              className="rise-in mt-3 max-w-2xl text-lg text-muted"
              style={{ animationDelay: "0.07s" }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </section>
      <div className="mx-auto max-w-4xl px-4 py-10">{children}</div>
    </>
  );
}
