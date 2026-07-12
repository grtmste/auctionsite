import { localized } from "@/lib/utils";
import type { AuctionCardData } from "@/lib/auctions";

/** Convert a Prisma auction row into the serializable shape AuctionCard needs */
export function toCardData(auction: AuctionCardData, locale: string) {
  return {
    slug: auction.slug,
    title: localized(auction.title, locale),
    status: auction.status,
    currentBid: auction.currentBid,
    startingPrice: auction.startingPrice,
    finalPrice: auction.finalPrice,
    auctionEnd: auction.auctionEnd.toISOString(),
    imageUrl: auction.images[0]?.url ?? null,
    imageAlt: auction.images[0]?.alt ?? null,
    bidCount: auction._count.bids,
  };
}
