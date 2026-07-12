import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getMinBidIncrement } from "@/lib/settings";
import { triggerAuctionEvent } from "@/lib/pusher";
import { sendOutbidEmail } from "@/lib/email";
import { localized, toInitials } from "@/lib/utils";

export const dynamic = "force-dynamic";

const bidSchema = z.object({
  auctionId: z.string().min(1),
  amount: z.number().positive().finite(),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  // Only verified, enabled accounts may bid
  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.disabled) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  if (!user.emailVerified) {
    return NextResponse.json({ error: "NOT_VERIFIED" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bidSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID" }, { status: 400 });
  }
  const { auctionId } = parsed.data;
  // Bids are whole-cent amounts
  const amount = Math.round(parsed.data.amount * 100) / 100;

  const minIncrement = await getMinBidIncrement();

  try {
    const result = await db.$transaction(async (tx) => {
      // Lock the auction row to serialize concurrent bids
      await tx.$queryRaw`SELECT id FROM "Auction" WHERE id = ${auctionId} FOR UPDATE`;
      const auction = await tx.auction.findUnique({
        where: { id: auctionId },
        include: {
          bids: {
            orderBy: { amount: "desc" },
            take: 1,
            include: { user: { select: { id: true, email: true } } },
          },
        },
      });

      if (!auction) throw new BidError("NOT_FOUND", 404);
      const now = new Date();
      if (
        auction.status !== "ACTIVE" ||
        auction.auctionStart > now ||
        auction.auctionEnd <= now
      ) {
        throw new BidError("NOT_ACTIVE", 409);
      }

      const minBid = auction.currentBid
        ? auction.currentBid + minIncrement
        : auction.startingPrice;
      if (amount < minBid) {
        throw new BidError("BID_TOO_LOW", 409, { minBid });
      }

      const previousTop = auction.bids[0];

      await tx.bid.create({
        data: { auctionId, userId: user.id, amount },
      });
      await tx.auction.update({
        where: { id: auctionId },
        data: {
          currentBid: amount,
          reserveMet: !auction.reservePrice || amount >= auction.reservePrice,
        },
      });

      return { auction, previousTop };
    });

    // Latest bid history for real-time subscribers (initials only)
    const latestBids = await db.bid.findMany({
      where: { auctionId },
      orderBy: { amount: "desc" },
      take: 10,
      include: { user: { select: { name: true, email: true } } },
    });
    const serialized = latestBids.map((bid) => ({
      id: bid.id,
      initials: toInitials(bid.user.name ?? bid.user.email),
      amount: bid.amount,
      createdAt: bid.createdAt.toISOString(),
    }));

    await triggerAuctionEvent(auctionId, "bid-placed", {
      amount,
      bids: serialized,
    });

    // Outbid notification for the previous highest bidder
    const { auction, previousTop } = result;
    if (previousTop && previousTop.user.id !== user.id) {
      await sendOutbidEmail(
        previousTop.user.email,
        localized(auction.title, "et"),
        amount,
        auction.slug
      );
    }

    return NextResponse.json({ ok: true, amount, bids: serialized });
  } catch (error) {
    if (error instanceof BidError) {
      return NextResponse.json(
        { error: error.code, ...error.extra },
        { status: error.status }
      );
    }
    console.error("Bid failed", error);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}

class BidError extends Error {
  constructor(
    public code: string,
    public status: number,
    public extra: Record<string, unknown> = {}
  ) {
    super(code);
  }
}
