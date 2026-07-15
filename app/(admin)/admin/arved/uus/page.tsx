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
  searchParams: Promise<{ auctionId?: string; webBidId?: string; phoneBidId?: string }>;
}) {
  const { auctionId, webBidId, phoneBidId } = await searchParams;
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
      // Resolve the buyer + price. A specific bid may be targeted from the bid
      // overview (e.g. to invoice a runner-up when the winner backs out);
      // otherwise fall back to the highest bidder.
      let buyerName = "";
      let buyerEmail = "";
      let buyerPhone = "";
      let buyerCompany = "";
      let buyerUserId: string | null = null;
      let price = 0;

      if (webBidId) {
        const bid = await db.bid.findFirst({
          where: { id: webBidId, auctionId: auction.id },
          include: { user: true },
        });
        if (bid) {
          buyerUserId = bid.user.id;
          buyerName = bid.user.name ?? bid.user.email;
          buyerEmail = bid.user.email;
          buyerPhone = bid.user.phone ?? "";
          buyerCompany = bid.user.company ?? "";
          price = bid.amount;
        }
      } else if (phoneBidId) {
        const bid = await db.phoneBid.findFirst({
          where: { id: phoneBidId, auctionId: auction.id },
        });
        if (bid) {
          const linked = bid.bidderUserId
            ? await db.user.findUnique({ where: { id: bid.bidderUserId } })
            : null;
          buyerUserId = linked?.id ?? null;
          buyerName = linked?.name ?? bid.bidderName;
          buyerEmail = linked?.email ?? "";
          buyerPhone = linked?.phone ?? bid.bidderPhone ?? "";
          buyerCompany = linked?.company ?? "";
          price = bid.amount;
        }
      }

      if (price === 0) {
        // No specific bid targeted (or it was missing): use the winner.
        const topWeb = auction.bids[0];
        const topPhone = auction.phoneBids[0];
        const phoneWins = (topPhone?.amount ?? 0) > (topWeb?.amount ?? 0);
        price =
          auction.finalPrice ??
          (Math.max(topWeb?.amount ?? 0, topPhone?.amount ?? 0) ||
            auction.startingPrice);
        const winnerUser = phoneWins
          ? topPhone?.bidderUserId
            ? await db.user.findUnique({ where: { id: topPhone.bidderUserId } })
            : null
          : topWeb?.user ?? null;
        buyerUserId = winnerUser?.id ?? null;
        buyerName = winnerUser?.name ?? (phoneWins ? topPhone?.bidderName ?? "" : "");
        buyerEmail = winnerUser?.email ?? "";
        buyerPhone =
          winnerUser?.phone ?? (phoneWins ? topPhone?.bidderPhone ?? "" : "");
        buyerCompany = winnerUser?.company ?? "";
      }

      const line: InvoiceLine = {
        description: `${localized(auction.title, "et")} (oksjon nr ${auction.slug})`,
        qty: 1,
        unit: "tk",
        unitPrice: price,
        vatRate: auction.vatPercent,
      };

      base.auctionId = auction.id;
      base.userId = buyerUserId;
      base.buyerName = buyerName;
      base.buyerEmail = buyerEmail;
      base.buyerPhone = buyerPhone;
      base.buyerCompany = buyerCompany;
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
