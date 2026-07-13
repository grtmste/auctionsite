import { db } from "@/lib/db";
import { toInitials } from "@/lib/utils";

export interface PublicBid {
  id: string;
  initials: string;
  amount: number;
  createdAt: string;
  channel: "WEB" | "PHONE";
}

/**
 * Public bid history for an auction: online bids merged with CONFIRMED
 * phone-auction bids, sorted by amount descending. Names are reduced to
 * initials for privacy.
 */
export async function serializePublicBids(
  auctionId: string,
  limit = 10
): Promise<PublicBid[]> {
  const [bids, phoneBids] = await Promise.all([
    db.bid.findMany({
      where: { auctionId },
      orderBy: { amount: "desc" },
      take: limit,
      include: { user: { select: { name: true, email: true } } },
    }),
    db.phoneBid.findMany({
      where: { auctionId, status: "CONFIRMED" },
      orderBy: { amount: "desc" },
      take: limit,
    }),
  ]);

  const merged: PublicBid[] = [
    ...bids.map((bid) => ({
      id: bid.id,
      initials: toInitials(bid.user.name ?? bid.user.email),
      amount: bid.amount,
      createdAt: bid.createdAt.toISOString(),
      channel: "WEB" as const,
    })),
    ...phoneBids.map((bid) => ({
      id: bid.id,
      initials: toInitials(bid.bidderName),
      amount: bid.amount,
      createdAt: bid.createdAt.toISOString(),
      channel: "PHONE" as const,
    })),
  ];

  merged.sort((a, b) => b.amount - a.amount);
  return merged.slice(0, limit);
}
