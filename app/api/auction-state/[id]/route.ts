import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializePublicBids } from "@/lib/bids";

export const dynamic = "force-dynamic";

/**
 * Lightweight live state for an auction — polled by the bid panel when
 * Pusher is not configured (and as a safety net when it is), so the
 * current bid and history update without a manual refresh.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auction = await db.auction.findUnique({
    where: { id },
    select: { status: true, currentBid: true, bidIncrement: true },
  });
  if (!auction) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const bids = await serializePublicBids(id);
  const currentBid =
    Math.max(auction.currentBid ?? 0, bids[0]?.amount ?? 0) || null;

  return NextResponse.json(
    { status: auction.status, currentBid, bids },
    { headers: { "Cache-Control": "no-store" } }
  );
}
