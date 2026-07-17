import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { localized } from "@/lib/utils";
import { AccountTabs } from "./account-tabs";

export const dynamic = "force-dynamic";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user) {
    redirect({ href: "/logi-sisse", locale });
  }

  const t = await getTranslations({ locale, namespace: "account" });

  const [user, bids] = await Promise.all([
    db.user.findUnique({ where: { id: session!.user.id } }),
    db.bid.findMany({
      where: { userId: session!.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        auction: {
          select: {
            slug: true,
            title: true,
            status: true,
            currentBid: true,
            finalPrice: true,
          },
        },
      },
    }),
  ]);

  if (!user) {
    redirect({ href: "/logi-sisse", locale });
  }

  // Keep only the user's highest bid per auction
  const bestPerAuction = new Map<string, (typeof bids)[number]>();
  for (const bid of bids) {
    const existing = bestPerAuction.get(bid.auction.slug);
    if (!existing || bid.amount > existing.amount) {
      bestPerAuction.set(bid.auction.slug, bid);
    }
  }

  const serializedBids = Array.from(bestPerAuction.values()).map((bid) => ({
    id: bid.id,
    auctionSlug: bid.auction.slug,
    auctionTitle: localized(bid.auction.title, locale),
    auctionStatus: bid.auction.status,
    amount: bid.amount,
    highestBid: bid.auction.currentBid ?? bid.amount,
    finalPrice: bid.auction.finalPrice,
    createdAt: bid.createdAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-bold">{t("title")}</h1>
      <AccountTabs
        user={{
          name: user!.name ?? "",
          email: user!.email,
          phone: user!.phone ?? "",
          phone2: user!.phone2 ?? "",
          personalId: user!.personalId ?? "",
          company: user!.company ?? "",
          regCode: user!.regCode ?? "",
          vatNo: user!.vatNo ?? "",
          address: user!.address ?? "",
          emailVerified: Boolean(user!.emailVerified),
        }}
        bids={serializedBids}
      />
    </div>
  );
}
