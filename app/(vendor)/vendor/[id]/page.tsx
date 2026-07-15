import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { serializeStaffBids } from "@/lib/bids";
import { formatCurrency, formatDateTime, localized } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/admin/status-chip";
import { BidOverview } from "@/components/admin/bid-overview";

export const dynamic = "force-dynamic";

export default async function VendorAuctionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const vendorId = session!.user.id;

  const auction = await db.auction.findUnique({ where: { id } });
  // A vendor may only see auctions assigned to them.
  if (!auction || auction.vendorId !== vendorId) notFound();

  const bids = await serializeStaffBids(auction.id);
  const isFinished = ["ENDED", "SOLD", "CANCELLED"].includes(auction.status);

  return (
    <div className="space-y-6">
      <Link
        href="/vendor"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Tagasi minu oksjonite juurde
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <h1 className="text-2xl font-bold">{localized(auction.title, "et")}</h1>
            <StatusChip status={auction.status} />
          </div>
          <p className="text-sm text-muted">
            {auction.make} {auction.model}
            {auction.regNumber ? ` · ${auction.regNumber}` : ""} · Lõpeb{" "}
            {formatDateTime(auction.auctionEnd)}
          </p>
        </div>
        <a href={`/oksjon/${auction.slug}`} target="_blank" rel="noreferrer">
          <Button variant="outline" size="sm">
            <ExternalLink className="h-4 w-4" />
            Vaata lehel
          </Button>
        </a>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-border bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Alghind</p>
          <p className="text-lg font-semibold">{formatCurrency(auction.startingPrice)}</p>
        </div>
        <div className="rounded-md border border-border bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-muted">
            {isFinished ? "Lõpphind" : "Praegune hind"}
          </p>
          <p className="text-lg font-semibold text-primary">
            {formatCurrency(
              auction.finalPrice ?? auction.currentBid ?? auction.startingPrice,
            )}
          </p>
        </div>
        <div className="rounded-md border border-border bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Pakkumisi</p>
          <p className="text-lg font-semibold">{bids.length}</p>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Pakkumiste ülevaade</h2>
        <BidOverview bids={bids} />
      </div>
    </div>
  );
}
