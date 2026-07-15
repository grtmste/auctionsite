import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatCurrency, formatDate, formatDateTime, localized } from "@/lib/utils";
import { StatusChip } from "@/components/admin/status-chip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function VendorDashboardPage() {
  const session = await auth();
  const vendorId = session!.user.id;

  const auctions = await db.auction.findMany({
    where: { vendorId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { bids: true, phoneBids: true } } },
  });

  const rows = auctions.map((a) => ({
    id: a.id,
    title: localized(a.title, "et"),
    status: a.status,
    make: a.make,
    model: a.model,
    added: formatDate(a.createdAt),
    ends: formatDateTime(a.auctionEnd),
    price: formatCurrency(a.finalPrice ?? a.currentBid ?? a.startingPrice),
    bidCount: a._count.bids + a._count.phoneBids,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Minu oksjonid</h1>
        <p className="mt-1 text-sm text-muted">
          Siin näed enda sõidukite oksjoneid ja nende pakkumisi.
        </p>
      </div>

      <div className="overflow-x-auto rounded-md border border-border bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sõiduk</TableHead>
              <TableHead>Staatus</TableHead>
              <TableHead>Lisatud</TableHead>
              <TableHead>Lõpeb</TableHead>
              <TableHead>Hind</TableHead>
              <TableHead>Pakkumisi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted">
                  Sulle pole veel ühtegi oksjonit määratud.
                </TableCell>
              </TableRow>
            )}
            {rows.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">
                  <Link href={`/vendor/${a.id}`} className="hover:text-primary hover:underline">
                    {a.title}
                  </Link>
                  <span className="mt-0.5 block text-xs font-normal text-muted">
                    {a.make} {a.model}
                  </span>
                </TableCell>
                <TableCell>
                  <StatusChip status={a.status} />
                </TableCell>
                <TableCell className="text-muted">{a.added}</TableCell>
                <TableCell className="text-muted">{a.ends}</TableCell>
                <TableCell className="font-semibold">{a.price}</TableCell>
                <TableCell>{a.bidCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
