import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { parseLines } from "@/lib/invoices";
import { InvoiceForm, type InvoiceFormValues } from "@/components/admin/invoice-form";

export const dynamic = "force-dynamic";

function isoDate(d: Date): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Tallinn" }).format(d);
}

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await db.invoice.findUnique({ where: { id } });
  if (!invoice) notFound();

  const initial: InvoiceFormValues = {
    id: invoice.id,
    number: invoice.number,
    auctionId: invoice.auctionId,
    userId: invoice.userId,
    buyerName: invoice.buyerName,
    buyerEmail: invoice.buyerEmail ?? "",
    buyerPhone: invoice.buyerPhone ?? "",
    buyerCompany: invoice.buyerCompany ?? "",
    buyerRegCode: invoice.buyerRegCode ?? "",
    buyerVatNo: invoice.buyerVatNo ?? "",
    buyerPersonalId: invoice.buyerPersonalId ?? "",
    buyerAddress: invoice.buyerAddress ?? "",
    issueDate: isoDate(invoice.issueDate),
    dueDate: isoDate(invoice.dueDate),
    lines: parseLines(invoice.lines),
    notes: invoice.notes ?? "",
    status: invoice.status,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Muuda arvet {invoice.number}</h1>
      <InvoiceForm initial={initial} />
    </div>
  );
}
