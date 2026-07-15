import { getTranslations, setRequestLocale } from "next-intl/server";
import { Car, Cog, Package, Phone, Mail, MapPin, Clock } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { runStatusTransitions } from "@/lib/auction-status";
import { toCardData } from "@/lib/serialize";
import { AuctionCard } from "@/components/auction/auction-card";

export const dynamic = "force-dynamic";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const settings = await getSettings();

  await runStatusTransitions().catch(() => 0);

  let activeAuctions: ReturnType<typeof toCardData>[] = [];
  try {
    const rows = await db.auction.findMany({
      where: { status: "ACTIVE" },
      orderBy: { auctionEnd: "asc" },
      take: 6,
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        phoneBids: {
          where: { status: "CONFIRMED" },
          orderBy: { amount: "desc" },
          take: 1,
        },
        _count: { select: { bids: true } },
      },
    });
    activeAuctions = rows.map((row) => toCardData(row, locale));
  } catch {
    activeAuctions = [];
  }

  const categories = [
    {
      href: "/autooksjonid",
      icon: Car,
      title: t("home.catCars"),
      desc: t("home.catCarsDesc"),
    },
    {
      href: "/varuosad",
      icon: Cog,
      title: t("home.catParts"),
      desc: t("home.catPartsDesc"),
    },
    {
      href: "/muud",
      icon: Package,
      title: t("home.catOther"),
      desc: t("home.catOtherDesc"),
    },
  ] as const;

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-header">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 70% 20%, rgba(232,131,12,0.18), transparent 55%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-20 md:py-28">
          <h1 className="rise-in max-w-3xl text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
            {t("home.heroTitle")}
          </h1>
          <p
            className="rise-in mt-5 max-w-2xl text-lg text-muted"
            style={{ animationDelay: "0.08s" }}
          >
            {t("home.heroSubtitle")}
          </p>
          <Link
            href="/autooksjonid"
            className="rise-in mt-8 inline-block"
            style={{ animationDelay: "0.16s" }}
          >
            <Button size="lg">{t("home.heroCta")}</Button>
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <h2 className="mb-8 text-2xl font-bold">{t("home.categoriesTitle")}</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.href}
              href={category.href}
              className="group rounded-md border border-border bg-surface p-8 transition-all duration-200 hover:-translate-y-1 hover:border-primary/60 hover:shadow-lg"
            >
              <category.icon className="h-10 w-10 text-primary transition-transform group-hover:scale-110" />
              <h3 className="mt-5 text-xl font-semibold">{category.title}</h3>
              <p className="mt-2 text-sm text-muted">{category.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Active auctions */}
      <section className="mx-auto max-w-7xl px-4 py-6 pb-14">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold">{t("home.activeAuctions")}</h2>
          <Link
            href="/autooksjonid"
            className="text-sm font-medium text-primary-hover hover:underline"
          >
            {t("home.viewAll")} →
          </Link>
        </div>
        {activeAuctions.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {activeAuctions.map((auction) => (
              <AuctionCard key={auction.slug} auction={auction} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-surface py-16 text-center text-muted">
            {t("home.noActive")}
          </div>
        )}
      </section>

      {/* Contact block */}
      <section className="border-t border-border bg-header">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <h2 className="mb-8 text-2xl font-bold">{t("home.contactTitle")}</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-border bg-surface p-5">
              <Phone className="h-6 w-6 text-primary" />
              <p className="mt-3 text-sm text-muted">{t("contact.infoPhone")}</p>
              <a
                href={`tel:${settings.contact_phone_info.replace(/\s/g, "")}`}
                className="font-semibold hover:text-primary-hover"
              >
                {settings.contact_phone_info}
              </a>
            </div>
            <div className="rounded-lg border border-border bg-surface p-5">
              <Phone className="h-6 w-6 text-warning" />
              <p className="mt-3 text-sm text-muted">{t("contact.towPhone")}</p>
              <a
                href={`tel:${settings.contact_phone_tow.replace(/\s/g, "")}`}
                className="font-semibold hover:text-primary-hover"
              >
                {settings.contact_phone_tow}
              </a>
            </div>
            <div className="rounded-lg border border-border bg-surface p-5">
              <Mail className="h-6 w-6 text-primary" />
              <p className="mt-3 text-sm text-muted">{t("contact.email")}</p>
              <a
                href={`mailto:${settings.contact_email}`}
                className="font-semibold hover:text-primary-hover"
              >
                {settings.contact_email}
              </a>
            </div>
            <div className="rounded-lg border border-border bg-surface p-5">
              <MapPin className="h-6 w-6 text-primary" />
              <p className="mt-3 text-sm text-muted">{t("contact.address")}</p>
              <p className="font-semibold">{settings.business_address}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                <Clock className="h-3 w-3" /> {settings.business_hours}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
