import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { nextInvoiceNumber, type InvoiceLine } from "@/lib/invoices";
import { localized } from "@/lib/utils";
import { InvoiceForm, type InvoiceFormValues } from "@/components/admin/invoice-form";

export const dynamic = "force-dynamic";

/** yyyy-mm-dd in Europe/Tallinn */
function isoDate(d: Date): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Tallinn" }).format(d);
}

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ auctionId?: string }>;
}) {
  const { auctionId } = await searchParams;
  const [number, settings] = await Promise.all([nextInvoiceNumber(), getSettings()]);

  const dueDays = Number(settings.invoice_due_days) || 7;
  const today = new Date();
  const due = new Date(today);
  due.setDate(due.getDate() + dueDays);

  const base: InvoiceFormValues = {
    number,
    auctionId: null,
    userId: null,
    buyerName: "",
    buyerEmail: "",
    buyerPhone: "",
    buyerCompany: "",
    buyerRegCode: "",
    buyerAddress: "",
    issueDate: isoDate(today),
    dueDate: isoDate(due),
    lines: [
      {
        description: "",
        qty: 1,
        unit: "tk",
        unitPrice: 0,
        vatRate: Number(settings.invoice_default_vat) || 0,
      },
    ],
    notes: "",
    status: "UNPAID",
  };

  // Prefill from a won auction
  if (auctionId) {
    const auction = await db.auction.findUnique({
      where: { id: auctionId },
      include: {
        bids: {
          orderBy: { amount: "desc" },
          take: 1,
          include: { user: true },
        },
        phoneBids: {
          where: { status: "CONFIRMED" },
          orderBy: { amount: "desc" },
          take: 1,
        },
      },
    });

    if (auction) {
      const topWeb = auction.bids[0];
      const topPhone = auction.phoneBids[0];
      const phoneWins = (topPhone?.amount ?? 0) > (topWeb?.amount ?? 0);
      const finalPrice =
        auction.finalPrice ??
        (Math.max(topWeb?.amount ?? 0, topPhone?.amount ?? 0) ||
          auction.startingPrice);

      // Buyer: prefer the winning bidder's account details
      const winnerUser = phoneWins
        ? topPhone?.bidderUserId
          ? await db.user.findUnique({ where: { id: topPhone.bidderUserId } })
          : null
        : topWeb?.user ?? null;

      const line: InvoiceLine = {
        description: `${localized(auction.title, "et")} (oksjon nr ${auction.slug})`,
        qty: 1,
        unit: "tk",
        unitPrice: finalPrice,
        vatRate: auction.vatPercent,
      };

      base.auctionId = auction.id;
      base.userId = winnerUser?.id ?? null;
      base.buyerName =
        winnerUser?.name ?? (phoneWins ? topPhone?.bidderName ?? "" : "");
      base.buyerEmail = winnerUser?.email ?? "";
      base.buyerPhone =
        winnerUser?.phone ?? (phoneWins ? topPhone?.bidderPhone ?? "" : "");
      base.buyerCompany = winnerUser?.company ?? "";
      base.lines = [line];
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Uus arve</h1>
      <InvoiceForm initial={base} />
    </div>
  );
}
