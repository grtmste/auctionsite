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

export interface StaffBid {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  amount: number;
  createdAt: string;
  channel: "WEB" | "PHONE";
  /** Phone bids carry a follow-up status; web bids are always null. */
  status: "CONTACTED" | "CONFIRMED" | "DECLINED" | "NO_ANSWER" | null;
  notes: string | null;
  /** Who recorded a phone bid (admin name); null for web bids. */
  recordedBy: string | null;
}

/**
 * Full bid history for staff (admin / the auction's vendor): every online bid
 * plus every phone bid, with real names and contact details. Unlike the public
 * feed this is NOT anonymised and includes non-confirmed phone bids. Sorted by
 * amount descending.
 */
export async function serializeStaffBids(auctionId: string): Promise<StaffBid[]> {
  const [bids, phoneBids] = await Promise.all([
    db.bid.findMany({
      where: { auctionId },
      orderBy: { amount: "desc" },
      include: { user: { select: { name: true, email: true, phone: true } } },
    }),
    db.phoneBid.findMany({
      where: { auctionId },
      orderBy: { amount: "desc" },
    }),
  ]);

  const merged: StaffBid[] = [
    ...bids.map((bid) => ({
      id: bid.id,
      name: bid.user.name ?? bid.user.email,
      email: bid.user.email,
      phone: bid.user.phone,
      amount: bid.amount,
      createdAt: bid.createdAt.toISOString(),
      channel: "WEB" as const,
      status: null,
      notes: null,
      recordedBy: null,
    })),
    ...phoneBids.map((bid) => ({
      id: bid.id,
      name: bid.bidderName,
      email: null,
      phone: bid.bidderPhone,
      amount: bid.amount,
      createdAt: bid.createdAt.toISOString(),
      channel: "PHONE" as const,
      status: bid.status,
      notes: bid.notes,
      recordedBy: bid.recordedBy,
    })),
  ];

  merged.sort((a, b) => b.amount - a.amount);
  return merged;
}
