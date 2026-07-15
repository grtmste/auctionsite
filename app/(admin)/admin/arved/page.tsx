import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";
import { computeTotals, parseLines } from "@/lib/invoices";
import { Button } from "@/components/ui/button";
import { InvoicesTable } from "./invoices-table";

export const dynamic = "force-dynamic";

export default async function AdminInvoicesPage() {
  const invoices = await db.invoice.findMany({ orderBy: { createdAt: "desc" } });

  const rows = invoices.map((inv) => ({
    id: inv.id,
    number: inv.number,
    buyerName: inv.buyerName,
    issueDate: formatDate(inv.issueDate),
    dueDate: formatDate(inv.dueDate),
    total: formatCurrency(computeTotals(parseLines(inv.lines)).gross),
    status: inv.status,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Arved</h1>
        <Link href="/admin/arved/uus">
          <Button>
            <Plus className="h-4 w-4" />
            Uus arve
          </Button>
        </Link>
      </div>
      <InvoicesTable invoices={rows} />
    </div>
  );
}
