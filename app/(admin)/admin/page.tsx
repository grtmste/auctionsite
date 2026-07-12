import Link from "next/link";
import { Gavel, Users, TrendingUp, CalendarClock, Layers } from "lucide-react";
import { db } from "@/lib/db";
import { formatCurrency, formatDateTime, localized, toInitials } from "@/lib/utils";
import { runStatusTransitions } from "@/lib/auction-status";
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

export default async function AdminDashboard() {
  await runStatusTransitions().catch(() => 0);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const [activeCount, totalCount, userCount, bidCount, endingToday, recentBids, endingSoon] =
    await Promise.all([
      db.auction.count({ where: { status: "ACTIVE" } }),
      db.auction.count(),
      db.user.count(),
      db.bid.count(),
      db.auction.count({
        where: { status: "ACTIVE", auctionEnd: { gte: startOfDay, lt: endOfDay } },
      }),
      db.bid.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          user: { select: { name: true, email: true } },
          auction: { select: { title: true, slug: true } },
        },
      }),
      db.auction.findMany({
        where: { status: "ACTIVE" },
        orderBy: { auctionEnd: "asc" },
        take: 6,
        select: {
          id: true,
          title: true,
          auctionEnd: true,
          currentBid: true,
          startingPrice: true,
          status: true,
        },
      }),
    ]);

  const stats = [
    { label: "Aktiivsed oksjonid", value: activeCount, icon: Gavel },
    { label: "Oksjoneid kokku", value: totalCount, icon: Layers },
    { label: "Kasutajad", value: userCount, icon: Users },
    { label: "Pakkumised", value: bidCount, icon: TrendingUp },
    { label: "Lõpeb täna", value: endingToday, icon: CalendarClock },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Töölaud</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-border bg-surface p-5">
            <stat.icon className="h-5 w-5 text-primary" />
            <p className="mt-3 text-3xl font-bold">{stat.value}</p>
            <p className="mt-1 text-xs text-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface">
          <h2 className="border-b border-border px-5 py-4 font-semibold">
            Viimased pakkumised
          </h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Oksjon</TableHead>
                <TableHead>Pakkuja</TableHead>
                <TableHead>Summa</TableHead>
                <TableHead>Aeg</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentBids.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted">
                    Pakkumisi pole
                  </TableCell>
                </TableRow>
              )}
              {recentBids.map((bid) => (
                <TableRow key={bid.id}>
                  <TableCell>
                    <Link
                      href={`/oksjon/${bid.auction.slug}`}
                      className="hover:text-primary-hover"
                    >
                      {localized(bid.auction.title, "et")}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {bid.user.name ?? toInitials(bid.user.email)}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatCurrency(bid.amount)}
                  </TableCell>
                  <TableCell className="text-muted">
                    {formatDateTime(bid.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="rounded-lg border border-border bg-surface">
          <h2 className="border-b border-border px-5 py-4 font-semibold">
            Peagi lõppevad oksjonid
          </h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Oksjon</TableHead>
                <TableHead>Staatus</TableHead>
                <TableHead>Hind</TableHead>
                <TableHead>Lõpeb</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {endingSoon.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted">
                    Aktiivseid oksjoneid pole
                  </TableCell>
                </TableRow>
              )}
              {endingSoon.map((auction) => (
                <TableRow key={auction.id}>
                  <TableCell>
                    <Link
                      href={`/admin/oksjonid/${auction.id}/muuda`}
                      className="hover:text-primary-hover"
                    >
                      {localized(auction.title, "et")}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <StatusChip status={auction.status} />
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatCurrency(auction.currentBid ?? auction.startingPrice)}
                  </TableCell>
                  <TableCell className="text-muted">
                    {formatDateTime(auction.auctionEnd)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
