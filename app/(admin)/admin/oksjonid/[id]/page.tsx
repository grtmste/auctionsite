import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  ExternalLink,
  FileText,
  FileDown,
  History,
} from "lucide-react";
import { db } from "@/lib/db";
import { serializeStaffBids } from "@/lib/bids";
import { computeTotals, parseLines } from "@/lib/invoices";
import { formatCurrency, formatDateTime, localized } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/admin/status-chip";
import { BidOverview } from "@/components/admin/bid-overview";
import { RelistButton } from "@/components/admin/relist-button";
import { HideToggle } from "@/components/admin/hide-toggle";

export const dynamic = "force-dynamic";

const ROUND_SELECT = {
  id: true,
  slug: true,
  title: true,
  status: true,
  finalPrice: true,
  currentBid: true,
  startingPrice: true,
  reservePrice: true,
  reserveMet: true,
  auctionEnd: true,
  _count: { select: { bids: true, phoneBids: true } },
} as const;

export default async function AdminAuctionOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const auction = await db.auction.findUnique({
    where: { id },
    include: {
      vendor: { select: { name: true, email: true, company: true } },
      relistedFrom: { select: ROUND_SELECT },
      relists: { select: ROUND_SELECT, orderBy: { createdAt: "asc" } },
    },
  });
  if (!auction) notFound();

  const [bids, invoices] = await Promise.all([
    serializeStaffBids(auction.id),
    db.invoice.findMany({
      where: { auctionId: auction.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const isFinished = ["ENDED", "SOLD", "CANCELLED"].includes(auction.status);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/oksjonid"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Tagasi oksjonite juurde
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold">{localized(auction.title, "et")}</h1>
            <StatusChip status={auction.status} />
            {auction.hiddenFromPublic && <Badge variant="muted">Peidetud</Badge>}
          </div>
          <p className="text-sm text-muted">
            {auction.make} {auction.model}
            {auction.regNumber ? ` · ${auction.regNumber}` : ""} · Lõpeb{" "}
            {formatDateTime(auction.auctionEnd)}
          </p>
          {auction.vendor && (
            <p className="mt-1 text-sm">
              <span className="text-muted">Müüja: </span>
              <span className="font-medium">
                {auction.vendor.company || auction.vendor.name || auction.vendor.email}
              </span>
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/admin/oksjonid/${auction.id}/muuda`}>
            <Button variant="outline" size="sm">
              <Pencil className="h-4 w-4" />
              Muuda
            </Button>
          </Link>
          <a href={`/oksjon/${auction.slug}`} target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4" />
              Vaata lehel
            </Button>
          </a>
          {bids.length > 0 && (
            <Link href={`/admin/arved/uus?auctionId=${auction.id}`}>
              <Button size="sm">
                <FileText className="h-4 w-4" />
                Loo arve
              </Button>
            </Link>
          )}
          <RelistButton auctionId={auction.id} />
          <HideToggle auctionId={auction.id} hidden={auction.hiddenFromPublic} />
        </div>
      </div>

      {/* Relist history: previous and follow-up rounds of this vehicle */}
      {(auction.relistedFrom || auction.relists.length > 0) && (
        <div className="rounded-md border border-border bg-surface p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-medium">
            <History className="h-4 w-4 text-muted" />
            Oksjoni ajalugu
          </p>
          <ol className="space-y-2">
            {auction.relistedFrom && (
              <RoundRow round={auction.relistedFrom} relation="previous" />
            )}
            <li className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-primary/40 bg-primary/5 px-3 py-2 text-sm">
              <Badge variant="default">Praegune</Badge>
              <span className="font-medium">{localized(auction.title, "et")}</span>
              <StatusChip status={auction.status} />
            </li>
            {auction.relists.map((r) => (
              <RoundRow key={r.id} round={r} relation="next" />
            ))}
          </ol>
        </div>
      )}

      {/* Invoices already created for this auction */}
      {invoices.length > 0 && (
        <div className="rounded-md border border-border bg-surface p-4">
          <p className="mb-2 text-sm font-medium">Selle oksjoni arved</p>
          <ul className="divide-y divide-border">
            {invoices.map((inv) => {
              const total = computeTotals(parseLines(inv.lines)).gross;
              return (
                <li
                  key={inv.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
                >
                  <span className="font-medium">
                    {inv.number}
                    <span className="ml-2 font-normal text-muted">{inv.buyerName}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="font-semibold">{formatCurrency(total)}</span>
                    <a href={`/api/arved/${inv.id}/pdf`} target="_blank" rel="noreferrer">
                      <Button variant="ghost" size="icon" title="PDF">
                        <FileDown className="h-4 w-4" />
                      </Button>
                    </a>
                    <Link href={`/admin/arved/${inv.id}/muuda`}>
                      <Button variant="ghost" size="icon" title="Muuda">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-border bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Alghind</p>
          <p className="text-lg font-semibold">{formatCurrency(auction.startingPrice)}</p>
        </div>
        <div className="rounded-md border border-border bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-muted">
            {isFinished ? "Lõpphind" : "Praegune hind"}
          </p>
          <p className="text-lg font-semibold text-primary">
            {formatCurrency(
              auction.finalPrice ?? auction.currentBid ?? auction.startingPrice,
            )}
          </p>
        </div>
        <div className="rounded-md border border-border bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Reservhind</p>
          <p className="text-lg font-semibold">
            {auction.reservePrice != null ? (
              <>
                {formatCurrency(auction.reservePrice)}{" "}
                <Badge variant={auction.reserveMet ? "success" : "muted"} className="ml-1">
                  {auction.reserveMet ? "Täidetud" : "Täitmata"}
                </Badge>
              </>
            ) : (
              "—"
            )}
          </p>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">
          Pakkumiste ülevaade ({bids.length})
        </h2>
        <BidOverview bids={bids} invoiceAuctionId={auction.id} />
      </div>
    </div>
  );
}

interface Round {
  id: string;
  slug: string;
  title: unknown;
  status: string;
  finalPrice: number | null;
  currentBid: number | null;
  startingPrice: number;
  reservePrice: number | null;
  reserveMet: boolean;
  auctionEnd: Date;
  _count: { bids: number; phoneBids: number };
}

/** One row in the relist history chain (a previous or follow-up auction). */
function RoundRow({ round, relation }: { round: Round; relation: "previous" | "next" }) {
  const bidCount = round._count.bids + round._count.phoneBids;
  const price = round.finalPrice ?? round.currentBid ?? round.startingPrice;
  const unsold =
    round.reservePrice != null && !round.reserveMet && round.status !== "SOLD";

  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-border px-3 py-2 text-sm">
      <Badge variant="muted">{relation === "previous" ? "Eelmine" : "Uus"}</Badge>
      <Link
        href={`/admin/oksjonid/${round.id}`}
        className="font-medium hover:text-primary hover:underline"
      >
        {localized(round.title as Record<string, string> | null, "et")}
      </Link>
      <StatusChip status={round.status as never} />
      <span className="text-muted">
        {formatDateTime(round.auctionEnd)} · {bidCount} pakkumist ·{" "}
        {formatCurrency(price)}
      </span>
      {unsold && (
        <Badge variant="warning">Reserv täitmata</Badge>
      )}
    </li>
  );
}
