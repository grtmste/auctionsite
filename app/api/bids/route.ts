import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { triggerAuctionEvent } from "@/lib/pusher";
import { sendOutbidEmail } from "@/lib/email";
import { localized } from "@/lib/utils";
import { serializePublicBids } from "@/lib/bids";

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
  const amount = Math.round(parsed.data.amount * 100) / 100;

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

      const previousTop = auction.bids[0];

      // A user cannot outbid themselves
      if (previousTop && previousTop.user.id === user.id) {
        throw new BidError("YOU_ARE_HIGHEST", 409);
      }

      // Bids advance in fixed steps: exactly current bid + increment
      // (first bid: starting price + increment) — nothing more, nothing less
      const increment = auction.bidIncrement;
      const requiredBid = (auction.currentBid ?? auction.startingPrice) + increment;
      if (Math.abs(amount - requiredBid) > 0.001) {
        throw new BidError("BID_STEP", 409, { requiredBid });
      }

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

      return { auction, previousTop, nextBid: amount + increment };
    });

    // Latest public bid history (web + confirmed phone bids, initials only)
    const serialized = await serializePublicBids(auctionId);

    await triggerAuctionEvent(auctionId, "bid-placed", {
      amount,
      nextBid: result.nextBid,
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

    return NextResponse.json({
      ok: true,
      amount,
      nextBid: result.nextBid,
      bids: serialized,
    });
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
