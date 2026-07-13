import { localized } from "@/lib/utils";
import type { AuctionCardData } from "@/lib/auctions";

/** Convert a Prisma auction row into the serializable shape AuctionCard needs */
export function toCardData(auction: AuctionCardData, locale: string) {
  // The effective current bid includes confirmed phone bids, so the public
  // listing always reflects the best bid regardless of channel
  const bestPhone = auction.phoneBids?.[0]?.amount ?? 0;
  const effectiveBid = Math.max(auction.currentBid ?? 0, bestPhone) || null;
  return {
    slug: auction.slug,
    title: localized(auction.title, locale),
    status: auction.status,
    currentBid: effectiveBid,
    startingPrice: auction.startingPrice,
    finalPrice: auction.finalPrice,
    auctionEnd: auction.auctionEnd.toISOString(),
    imageUrl: auction.images[0]?.url ?? null,
    imageAlt: auction.images[0]?.alt ?? null,
    bidCount: auction._count.bids,
  };
}
