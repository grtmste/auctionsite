"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Pencil,
  Trash2,
  ExternalLink,
  FileText,
  ListChecks,
  Eye,
  EyeOff,
} from "lucide-react";
import { StatusChip } from "@/components/admin/status-chip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteAuction, setAuctionHidden } from "../actions";
import { RelistButton } from "@/components/admin/relist-button";
import type { AuctionStatus, AuctionType } from "@prisma/client";

interface Row {
  id: string;
  slug: string;
  title: string;
  status: AuctionStatus;
  auctionType: AuctionType;
  price: string;
  bidCount: number;
  vendor: string | null;
  hiddenFromPublic: boolean;
  auctionEnd: string;
}

const TYPE_LABELS: Record<AuctionType, string> = {
  REGULAR: "Sõiduk",
  PARTS: "Varuosa",
  OTHER: "Muu",
};

export function AuctionsTable({ auctions }: { auctions: Row[] }) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const confirmTarget = auctions.find((a) => a.id === confirmId);

  function remove() {
    if (!confirmId) return;
    startTransition(async () => {
      await deleteAuction(confirmId);
      setConfirmId(null);
    });
  }

  function toggleHidden(id: string, hidden: boolean) {
    startTransition(() => setAuctionHidden(id, hidden).then(() => {}));
  }

  return (
    <div className="rounded-lg border border-border bg-surface">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pealkiri</TableHead>
            <TableHead>Tüüp</TableHead>
            <TableHead>Müüja</TableHead>
            <TableHead>Staatus</TableHead>
            <TableHead>Hind</TableHead>
            <TableHead>Pakkumisi</TableHead>
            <TableHead>Lõpeb</TableHead>
            <TableHead className="text-right">Tegevused</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {auctions.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="py-10 text-center text-muted">
                Oksjoneid pole. Loo esimene oksjon!
              </TableCell>
            </TableRow>
          )}
          {auctions.map((auction) => (
            <TableRow key={auction.id}>
              <TableCell className="max-w-64 truncate font-medium">
                <Link
                  href={`/admin/oksjonid/${auction.id}`}
                  className="hover:text-primary hover:underline"
                >
                  {auction.title}
                </Link>
                {auction.hiddenFromPublic && (
                  <Badge variant="muted" className="ml-2 align-middle">
                    Peidetud
                  </Badge>
                )}
              </TableCell>
              <TableCell>{TYPE_LABELS[auction.auctionType]}</TableCell>
              <TableCell className="text-muted">{auction.vendor ?? "—"}</TableCell>
              <TableCell>
                <StatusChip status={auction.status} />
              </TableCell>
              <TableCell className="font-semibold">{auction.price}</TableCell>
              <TableCell>{auction.bidCount}</TableCell>
              <TableCell className="text-muted">{auction.auctionEnd}</TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Link href={`/admin/oksjonid/${auction.id}`}>
                    <Button variant="ghost" size="icon" title="Pakkumiste ülevaade">
                      <ListChecks className="h-4 w-4" />
                    </Button>
                  </Link>
                  <a href={`/oksjon/${auction.slug}`} target="_blank" rel="noreferrer">
                    <Button variant="ghost" size="icon" title="Vaata">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                  <Link href={`/admin/oksjonid/${auction.id}/muuda`}>
                    <Button variant="ghost" size="icon" title="Muuda">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    title={
                      auction.hiddenFromPublic
                        ? "Kuva avalikul lehel"
                        : "Peida avalikult lehelt"
                    }
                    disabled={pending}
                    onClick={() => toggleHidden(auction.id, !auction.hiddenFromPublic)}
                  >
                    {auction.hiddenFromPublic ? (
                      <EyeOff className="h-4 w-4 text-primary" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  {(auction.status === "SOLD" || auction.status === "ENDED") && (
                    <Link href={`/admin/arved/uus?auctionId=${auction.id}`}>
                      <Button variant="ghost" size="icon" title="Loo arve võitjale">
                        <FileText className="h-4 w-4 text-primary" />
                      </Button>
                    </Link>
                  )}
                  {(auction.status === "ENDED" ||
                    auction.status === "SOLD" ||
                    auction.status === "CANCELLED") && (
                    <RelistButton
                      auctionId={auction.id}
                      size="icon"
                      variant="ghost"
                      iconOnly
                    />
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Kustuta"
                    onClick={() => setConfirmId(auction.id)}
                  >
                    <Trash2 className="h-4 w-4 text-primary" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog
        open={confirmId !== null}
        onClose={() => setConfirmId(null)}
        title="Kustuta oksjon"
      >
        <p className="text-sm text-muted">
          Kas oled kindel, et soovid kustutada oksjoni{" "}
          <strong className="text-foreground">{confirmTarget?.title}</strong>? Kõik
          pakkumised kustutatakse. Seda toimingut ei saa tagasi võtta.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmId(null)}>
            Tühista
          </Button>
          <Button variant="destructive" onClick={remove} disabled={pending}>
            Kustuta
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
