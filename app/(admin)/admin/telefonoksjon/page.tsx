import Link from "next/link";
import { Phone } from "lucide-react";
import { db } from "@/lib/db";
import { formatDateTime, localized } from "@/lib/utils";
import { runStatusTransitions } from "@/lib/auction-status";
import { cn } from "@/lib/utils";
import { PhoneAuctionModule } from "./phone-auction-module";

export const dynamic = "force-dynamic";

export default async function PhoneAuctionPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  await runStatusTransitions().catch(() => 0);
  const { id } = await searchParams;

  const phoneAuctions = await db.auction.findMany({
    where: { status: "PHONE_AUCTION" },
    orderBy: { auctionEnd: "desc" },
    select: {
      id: true,
      title: true,
      auctionEnd: true,
      phoneAuctionEnd: true,
      currentBid: true,
      startingPrice: true,
    },
  });

  const selectedId = id ?? phoneAuctions[0]?.id;
  const selected = selectedId
    ? await db.auction.findUnique({
        where: { id: selectedId },
        include: {
          bids: {
            orderBy: { amount: "desc" },
            include: {
              user: { select: { id: true, name: true, email: true, phone: true } },
            },
          },
          phoneBids: { orderBy: { createdAt: "desc" } },
        },
      })
    : null;

  // Best online bid per user, sorted descending — the call list
  const topBidders: {
    userId: string;
    name: string;
    email: string;
    phone: string | null;
    amount: number;
  }[] = [];
  if (selected) {
    const seen = new Set<string>();
    for (const bid of selected.bids) {
      if (seen.has(bid.user.id)) continue;
      seen.add(bid.user.id);
      topBidders.push({
        userId: bid.user.id,
        name: bid.user.name ?? bid.user.email,
        email: bid.user.email,
        phone: bid.user.phone,
        amount: bid.amount,
      });
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Telefonioksjonid</h1>

      <div className="flex flex-col gap-6 xl:flex-row">
        {/* Sidebar: auctions in PHONE_AUCTION status */}
        <aside className="w-full shrink-0 xl:w-72">
          <div className="rounded-lg border border-border bg-surface">
            <h2 className="flex items-center gap-2 border-b border-border px-4 py-3 text-sm font-semibold">
              <Phone className="h-4 w-4 text-warning" />
              Käimasolevad telefonioksjonid
            </h2>
            {phoneAuctions.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted">
                Ühtegi telefonioksjonit ei ole hetkel käimas.
              </p>
            ) : (
              <ul>
                {phoneAuctions.map((auction) => (
                  <li key={auction.id}>
                    <Link
                      href={`/admin/telefonoksjon?id=${auction.id}`}
                      className={cn(
                        "block border-b border-border px-4 py-3 text-sm last:border-0 hover:bg-surface-hover",
                        auction.id === selectedId && "border-l-2 border-l-warning bg-surface-hover"
                      )}
                    >
                      <span className="font-medium">{localized(auction.title, "et")}</span>
                      <span className="mt-1 block text-xs text-muted">
                        Online lõppes: {formatDateTime(auction.auctionEnd)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* Main panel */}
        {selected ? (
          <PhoneAuctionModule
            auction={{
              id: selected.id,
              title: localized(selected.title, "et"),
              currentBid: selected.currentBid,
              startingPrice: selected.startingPrice,
              reservePrice: selected.reservePrice,
              phoneAuctionEnd: selected.phoneAuctionEnd?.toISOString() ?? null,
            }}
            topBidders={topBidders}
            phoneBids={selected.phoneBids.map((bid) => ({
              id: bid.id,
              bidderName: bid.bidderName,
              bidderPhone: bid.bidderPhone,
              bidderUserId: bid.bidderUserId,
              amount: bid.amount,
              status: bid.status,
              notes: bid.notes,
              recordedBy: bid.recordedBy,
              createdAt: bid.createdAt.toISOString(),
            }))}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-border bg-surface py-24 text-muted">
            Vali vasakult telefonioksjon või oota, kuni mõni oksjon jõuab
            telefonioksjoni faasi.
          </div>
        )}
      </div>
    </div>
  );
}
