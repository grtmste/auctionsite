import { NextRequest, NextResponse } from "next/server";
import type { AuctionType } from "@prisma/client";
import { listAuctions, parseFilters } from "@/lib/auctions";
import { toCardData } from "@/lib/serialize";

export const dynamic = "force-dynamic";

const TYPES: AuctionType[] = ["REGULAR", "PARTS", "OTHER"];

/** Paginated auction card data for the "Laadi rohkem" button */
export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const type = TYPES.includes(params.type as AuctionType)
    ? (params.type as AuctionType)
    : undefined;
  const locale = params.locale ?? "et";

  const filters = { ...parseFilters(params), auctionType: type };
  const { auctions, total, hasMore } = await listAuctions(filters);

  return NextResponse.json({
    auctions: auctions.map((auction) => toCardData(auction, locale)),
    total,
    hasMore,
  });
}
