import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, ExternalLink, FileText, FileDown } from "lucide-react";
import { db } from "@/lib/db";
import { serializeStaffBids } from "@/lib/bids";
import { computeTotals, parseLines } from "@/lib/invoices";
import { formatCurrency, formatDateTime, localized } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/admin/status-chip";
import { BidOverview } from "@/components/admin/bid-overview";

export const dynamic = "force-dynamic";

export default async function AdminAuctionOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const auction = await db.auction.findUnique({
    where: { id },
    include: { vendor: { select: { name: true, email: true, company: true } } },
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
          <div className="mb-2 flex items-center gap-3">
            <h1 className="text-2xl font-bold">{localized(auction.title, "et")}</h1>
            <StatusChip status={auction.status} />
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
        </div>
      </div>

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
