"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Pencil, Trash2, FileDown } from "lucide-react";
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
import { deleteInvoice } from "../actions";
import type { InvoiceStatus } from "@prisma/client";

interface Row {
  id: string;
  number: string;
  buyerName: string;
  issueDate: string;
  dueDate: string;
  total: string;
  status: InvoiceStatus;
}

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  DRAFT: "Mustand",
  UNPAID: "Maksmata",
  PAID: "Makstud",
  CANCELLED: "Tühistatud",
};

const STATUS_VARIANTS: Record<
  InvoiceStatus,
  "success" | "warning" | "muted" | "destructive"
> = {
  DRAFT: "muted",
  UNPAID: "warning",
  PAID: "success",
  CANCELLED: "destructive",
};

export function InvoicesTable({ invoices }: { invoices: Row[] }) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const target = invoices.find((i) => i.id === confirmId);

  function remove() {
    if (!confirmId) return;
    startTransition(async () => {
      await deleteInvoice(confirmId);
      setConfirmId(null);
    });
  }

  return (
    <div className="rounded-md border border-border bg-surface">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Number</TableHead>
            <TableHead>Ostja</TableHead>
            <TableHead>Kuupäev</TableHead>
            <TableHead>Tähtaeg</TableHead>
            <TableHead>Summa</TableHead>
            <TableHead>Staatus</TableHead>
            <TableHead className="text-right">Tegevused</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="py-10 text-center text-muted">
                Arveid pole. Loo esimene arve.
              </TableCell>
            </TableRow>
          )}
          {invoices.map((inv) => (
            <TableRow key={inv.id}>
              <TableCell className="font-medium">{inv.number}</TableCell>
              <TableCell>{inv.buyerName}</TableCell>
              <TableCell className="text-muted">{inv.issueDate}</TableCell>
              <TableCell className="text-muted">{inv.dueDate}</TableCell>
              <TableCell className="font-semibold">{inv.total}</TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANTS[inv.status]}>
                  {STATUS_LABELS[inv.status]}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
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
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Kustuta"
                    onClick={() => setConfirmId(inv.id)}
                  >
                    <Trash2 className="h-4 w-4 text-danger" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={confirmId !== null} onClose={() => setConfirmId(null)} title="Kustuta arve">
        <p className="text-sm text-muted">
          Kas oled kindel, et soovid kustutada arve{" "}
          <strong className="text-foreground">{target?.number}</strong>?
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
