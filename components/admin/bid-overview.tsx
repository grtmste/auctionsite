import { Globe, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { StaffBid } from "@/lib/bids";

const PHONE_STATUS_LABELS: Record<string, string> = {
  CONTACTED: "Kontakteeritud",
  CONFIRMED: "Kinnitatud",
  DECLINED: "Loobus",
  NO_ANSWER: "Ei vastanud",
};

const PHONE_STATUS_VARIANTS: Record<
  string,
  "success" | "warning" | "muted" | "destructive"
> = {
  CONTACTED: "warning",
  CONFIRMED: "success",
  DECLINED: "destructive",
  NO_ANSWER: "muted",
};

/**
 * Full bid history for staff (admin / vendor). Shows the winning bid, the
 * channel each bid came through (web vs phone) and the real bidder identity.
 */
export function BidOverview({ bids }: { bids: StaffBid[] }) {
  if (bids.length === 0) {
    return (
      <div className="rounded-md border border-border bg-surface p-8 text-center text-sm text-muted">
        Sellel oksjonil pole veel ühtegi pakkumist.
      </div>
    );
  }

  const winner = bids[0];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-md border border-primary/30 bg-primary/5 px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">Kõrgeim pakkumine</p>
          <p className="text-lg font-bold text-primary">{formatCurrency(winner.amount)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">Pakkuja</p>
          <p className="font-medium">{winner.name}</p>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-muted">
          {winner.channel === "PHONE" ? (
            <Phone className="h-4 w-4" />
          ) : (
            <Globe className="h-4 w-4" />
          )}
          {winner.channel === "PHONE" ? "Telefon" : "Veeb"}
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border border-border bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Pakkuja</TableHead>
              <TableHead>Kontakt</TableHead>
              <TableHead>Kanal</TableHead>
              <TableHead className="text-right">Summa</TableHead>
              <TableHead>Aeg</TableHead>
              <TableHead>Staatus</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bids.map((bid, index) => (
              <TableRow key={`${bid.channel}-${bid.id}`}>
                <TableCell className="text-muted">{index + 1}</TableCell>
                <TableCell className="font-medium">
                  {bid.name}
                  {bid.notes && (
                    <span className="mt-0.5 block text-xs font-normal text-muted">
                      {bid.notes}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted">
                  <div className="flex flex-col">
                    {bid.email && <span>{bid.email}</span>}
                    {bid.phone && <span>{bid.phone}</span>}
                    {!bid.email && !bid.phone && "—"}
                  </div>
                </TableCell>
                <TableCell>
                  {bid.channel === "PHONE" ? (
                    <span className="inline-flex items-center gap-1 text-sm">
                      <Phone className="h-3.5 w-3.5 text-warning" /> Telefon
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-sm">
                      <Globe className="h-3.5 w-3.5 text-primary" /> Veeb
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(bid.amount)}
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm text-muted">
                  {formatDateTime(bid.createdAt)}
                </TableCell>
                <TableCell>
                  {bid.status ? (
                    <Badge variant={PHONE_STATUS_VARIANTS[bid.status]}>
                      {PHONE_STATUS_LABELS[bid.status]}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
