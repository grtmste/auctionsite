import Link from "next/link";
import { Plus } from "lucide-react";
import type { AuctionStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { formatCurrency, formatDateTime, localized, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AuctionsTable } from "./auctions-table";

export const dynamic = "force-dynamic";

const FILTERS: { key: string; label: string; statuses?: AuctionStatus[] }[] = [
  { key: "all", label: "Kõik" },
  { key: "active", label: "Aktiivsed", statuses: ["ACTIVE", "PHONE_AUCTION"] },
  { key: "ended", label: "Lõppenud", statuses: ["ENDED"] },
  { key: "sold", label: "Müüdud", statuses: ["SOLD"] },
  { key: "draft", label: "Mustandid", statuses: ["DRAFT"] },
];

export default async function AdminAuctionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const active = FILTERS.find((f) => f.key === status) ?? FILTERS[0];

  const where: Prisma.AuctionWhereInput = active.statuses
    ? { status: { in: active.statuses } }
    : {};

  const auctions = await db.auction.findMany({
    where,
    include: {
      _count: { select: { bids: true, phoneBids: true } },
      vendor: { select: { name: true, company: true } },
    },
  });

  // Ordering: live auctions ending soonest first, then SOLD, then ENDED
  // (Lõppenud), then drafts/cancelled.
  const STATUS_RANK: Record<string, number> = {
    ACTIVE: 0,
    PHONE_AUCTION: 0,
    SOLD: 1,
    ENDED: 2,
    DRAFT: 3,
    CANCELLED: 4,
  };
  auctions.sort((a, b) => {
    const ra = STATUS_RANK[a.status] ?? 5;
    const rb = STATUS_RANK[b.status] ?? 5;
    if (ra !== rb) return ra - rb;
    if (ra === 0) return a.auctionEnd.getTime() - b.auctionEnd.getTime(); // soonest first
    if (ra === 1 || ra === 2) return b.auctionEnd.getTime() - a.auctionEnd.getTime(); // most recent
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const rows = auctions.map((auction) => ({
    id: auction.id,
    slug: auction.slug,
    title: localized(auction.title, "et"),
    status: auction.status,
    auctionType: auction.auctionType,
    price: formatCurrency(auction.finalPrice ?? auction.currentBid ?? auction.startingPrice),
    bidCount: auction._count.bids + auction._count.phoneBids,
    vendor: auction.vendor?.company || auction.vendor?.name || null,
    hiddenFromPublic: auction.hiddenFromPublic,
    auctionEnd: formatDateTime(auction.auctionEnd),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Oksjonid</h1>
        <Link href="/admin/oksjonid/uus">
          <Button>
            <Plus className="h-4 w-4" />
            Uus oksjon
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-border">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "all" ? "/admin/oksjonid" : `/admin/oksjonid?status=${f.key}`}
            className={cn(
              "-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              f.key === active.key
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-foreground",
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <AuctionsTable auctions={rows} />
    </div>
  );
}
