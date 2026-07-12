import { db } from "@/lib/db";
import { triggerAuctionEvent } from "@/lib/pusher";
import { sendAuctionWonEmail } from "@/lib/email";
import { localized } from "@/lib/utils";

/**
 * Auto-transitions auction statuses. Called from the Vercel Cron route and
 * opportunistically on listing page loads.
 *
 * ACTIVE + auctionEnd passed  -> PHONE_AUCTION (if phoneAuctionActive) else ENDED
 * PHONE_AUCTION + phoneAuctionEnd passed -> ENDED
 */
export async function runStatusTransitions(): Promise<number> {
  if (!process.env.DATABASE_URL) return 0;
  const now = new Date();
  let transitioned = 0;

  const expired = await db.auction.findMany({
    where: { status: "ACTIVE", auctionEnd: { lte: now } },
    include: {
      bids: { orderBy: { amount: "desc" }, take: 1, include: { user: true } },
    },
  });

  for (const auction of expired) {
    if (auction.phoneAuctionActive) {
      await db.auction.update({
        where: { id: auction.id },
        data: { status: "PHONE_AUCTION" },
      });
      await triggerAuctionEvent(auction.id, "phone-auction-started", {
        auctionId: auction.id,
      });
    } else {
      const topBid = auction.bids[0];
      const reserveMet =
        !auction.reservePrice || (topBid?.amount ?? 0) >= auction.reservePrice;
      await db.auction.update({
        where: { id: auction.id },
        data: {
          status: "ENDED",
          reserveMet,
          finalPrice: reserveMet ? topBid?.amount ?? null : null,
        },
      });
      await triggerAuctionEvent(auction.id, "auction-ended", {
        auctionId: auction.id,
        finalPrice: reserveMet ? topBid?.amount ?? null : null,
      });
      if (topBid && reserveMet) {
        await sendAuctionWonEmail(
          topBid.user.email,
          localized(auction.title, "et"),
          topBid.amount,
          auction.slug
        );
      }
    }
    transitioned++;
  }

  const phoneExpired = await db.auction.findMany({
    where: {
      status: "PHONE_AUCTION",
      phoneAuctionEnd: { not: null, lte: now },
    },
  });
  for (const auction of phoneExpired) {
    await db.auction.update({
      where: { id: auction.id },
      data: { status: "ENDED" },
    });
    await triggerAuctionEvent(auction.id, "auction-ended", {
      auctionId: auction.id,
    });
    transitioned++;
  }

  return transitioned;
}
