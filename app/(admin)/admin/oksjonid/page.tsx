import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { formatCurrency, formatDateTime, localized } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AuctionsTable } from "./auctions-table";

export const dynamic = "force-dynamic";

export default async function AdminAuctionsPage() {
  const auctions = await db.auction.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { bids: true } } },
  });

  const rows = auctions.map((auction) => ({
    id: auction.id,
    slug: auction.slug,
    title: localized(auction.title, "et"),
    status: auction.status,
    auctionType: auction.auctionType,
    price: formatCurrency(auction.currentBid ?? auction.startingPrice),
    bidCount: auction._count.bids,
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
      <AuctionsTable auctions={rows} />
    </div>
  );
}
