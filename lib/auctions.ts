import { Prisma, AuctionStatus, AuctionType } from "@prisma/client";
import { db } from "@/lib/db";

export const PAGE_SIZE = 12;

export interface AuctionFilters {
  auctionType?: AuctionType;
  make?: string;
  fuelType?: string;
  gearbox?: string;
  yearFrom?: number;
  yearTo?: number;
  priceFrom?: number;
  priceTo?: number;
  sort?: "end" | "priceAsc" | "priceDesc" | "newest";
  page?: number;
}

/** Public listing order: ACTIVE (ending soonest first) -> PHONE_AUCTION -> ENDED/SOLD */
const STATUS_ORDER: AuctionStatus[] = ["ACTIVE", "PHONE_AUCTION", "ENDED", "SOLD"];

export function parseFilters(params: Record<string, string | undefined>): AuctionFilters {
  const num = (v?: string) => {
    const n = Number(v);
    return v && Number.isFinite(n) ? n : undefined;
  };
  const sort = params.sort;
  return {
    make: params.make || undefined,
    fuelType: params.fuelType || undefined,
    gearbox: params.gearbox || undefined,
    yearFrom: num(params.yearFrom),
    yearTo: num(params.yearTo),
    priceFrom: num(params.priceFrom),
    priceTo: num(params.priceTo),
    sort:
      sort === "priceAsc" || sort === "priceDesc" || sort === "newest"
        ? sort
        : "end",
    page: Math.max(1, num(params.page) ?? 1),
  };
}

function buildWhere(filters: AuctionFilters): Prisma.AuctionWhereInput {
  const where: Prisma.AuctionWhereInput = {
    status: { in: STATUS_ORDER },
  };
  if (filters.auctionType) where.auctionType = filters.auctionType;
  if (filters.make) where.make = { equals: filters.make, mode: "insensitive" };
  if (filters.fuelType)
    where.fuelType = { equals: filters.fuelType, mode: "insensitive" };
  if (filters.gearbox)
    where.gearbox = { equals: filters.gearbox, mode: "insensitive" };
  if (filters.yearFrom || filters.yearTo) {
    where.year = {
      ...(filters.yearFrom ? { gte: filters.yearFrom } : {}),
      ...(filters.yearTo ? { lte: filters.yearTo } : {}),
    };
  }
  if (filters.priceFrom || filters.priceTo) {
    // Filter on the effective price (current bid, falling back to starting price)
    where.OR = [
      {
        currentBid: {
          ...(filters.priceFrom ? { gte: filters.priceFrom } : {}),
          ...(filters.priceTo ? { lte: filters.priceTo } : {}),
        },
      },
      {
        currentBid: null,
        startingPrice: {
          ...(filters.priceFrom ? { gte: filters.priceFrom } : {}),
          ...(filters.priceTo ? { lte: filters.priceTo } : {}),
        },
      },
    ];
  }
  return where;
}

export async function listAuctions(filters: AuctionFilters) {
  const where = buildWhere(filters);
  const page = filters.page ?? 1;

  const [rows, total] = await Promise.all([
    db.auction.findMany({
      where,
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        phoneBids: {
          where: { status: "CONFIRMED" },
          orderBy: { amount: "desc" },
          take: 1,
        },
        _count: { select: { bids: true } },
      },
    }),
    db.auction.count({ where }),
  ]);

  // Sort in memory: status group order first, then the chosen sort inside groups
  const statusRank = (s: AuctionStatus) => {
    const index = STATUS_ORDER.indexOf(s);
    return index === -1 ? 99 : index === 3 ? 2 : index; // ENDED and SOLD share a group
  };
  const price = (a: (typeof rows)[number]) =>
    Math.max(a.currentBid ?? 0, a.phoneBids[0]?.amount ?? 0) || a.startingPrice;

  rows.sort((a, b) => {
    const rank = statusRank(a.status) - statusRank(b.status);
    if (rank !== 0) return rank;
    switch (filters.sort) {
      case "priceAsc":
        return price(a) - price(b);
      case "priceDesc":
        return price(b) - price(a);
      case "newest":
        return b.createdAt.getTime() - a.createdAt.getTime();
      default:
        return a.auctionEnd.getTime() - b.auctionEnd.getTime();
    }
  });

  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  return { auctions: paged, total, hasMore: page * PAGE_SIZE < rows.length };
}

/** Distinct makes/fuel types for the filter sidebar */
export async function getFilterOptions(auctionType?: AuctionType) {
  const where: Prisma.AuctionWhereInput = {
    status: { in: STATUS_ORDER },
    ...(auctionType ? { auctionType } : {}),
  };
  const [makes, fuels, gearboxRows] = await Promise.all([
    db.auction.findMany({ where, select: { make: true }, distinct: ["make"] }),
    db.auction.findMany({
      where: { ...where, fuelType: { not: null } },
      select: { fuelType: true },
      distinct: ["fuelType"],
    }),
    db.auction.findMany({
      where: { ...where, gearbox: { not: null } },
      select: { gearbox: true },
      distinct: ["gearbox"],
    }),
  ]);
  return {
    makes: makes.map((m) => m.make).filter(Boolean).sort(),
    fuelTypes: fuels.map((f) => f.fuelType!).filter(Boolean).sort(),
    gearboxes: gearboxRows.map((g) => g.gearbox!).filter(Boolean).sort(),
  };
}

export async function getAuctionBySlug(slug: string) {
  return db.auction.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      bids: {
        orderBy: { amount: "desc" },
        take: 10,
        include: { user: { select: { name: true, email: true } } },
      },
      _count: { select: { bids: true } },
    },
  });
}

export type AuctionCardData = Awaited<
  ReturnType<typeof listAuctions>
>["auctions"][number];
