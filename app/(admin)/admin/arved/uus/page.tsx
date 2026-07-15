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
    buyerVatNo: "",
    buyerPersonalId: "",
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
      let buyerPhone = "";
      // Buyer account (when the bidder has one) carries the full company /
      // personal details we want on the invoice.
      let buyerUser: {
        id: string;
        name: string | null;
        email: string;
        phone: string | null;
        company: string | null;
        regCode: string | null;
        vatNo: string | null;
        personalId: string | null;
        address: string | null;
      } | null = null;
      let price = 0;

      if (webBidId) {
        const bid = await db.bid.findFirst({
          where: { id: webBidId, auctionId: auction.id },
          include: { user: true },
        });
        if (bid) {
          buyerUser = bid.user;
          buyerName = bid.user.name ?? bid.user.email;
          price = bid.amount;
        }
      } else if (phoneBidId) {
        const bid = await db.phoneBid.findFirst({
          where: { id: phoneBidId, auctionId: auction.id },
        });
        if (bid) {
          buyerUser = bid.bidderUserId
            ? await db.user.findUnique({ where: { id: bid.bidderUserId } })
            : null;
          buyerName = buyerUser?.name ?? bid.bidderName;
          buyerPhone = buyerUser?.phone ?? bid.bidderPhone ?? "";
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
        buyerUser = phoneWins
          ? topPhone?.bidderUserId
            ? await db.user.findUnique({ where: { id: topPhone.bidderUserId } })
            : null
          : topWeb?.user ?? null;
        buyerName = buyerUser?.name ?? (phoneWins ? topPhone?.bidderName ?? "" : "");
        buyerPhone =
          buyerUser?.phone ?? (phoneWins ? topPhone?.bidderPhone ?? "" : "");
      }

      const line: InvoiceLine = {
        description: `${localized(auction.title, "et")} (oksjon nr ${auction.slug})`,
        qty: 1,
        unit: "tk",
        unitPrice: price,
        vatRate: auction.vatPercent,
      };

      base.auctionId = auction.id;
      base.userId = buyerUser?.id ?? null;
      base.buyerName = buyerName;
      base.buyerEmail = buyerUser?.email ?? "";
      base.buyerPhone = buyerUser?.phone ?? buyerPhone;
      base.buyerCompany = buyerUser?.company ?? "";
      base.buyerRegCode = buyerUser?.regCode ?? "";
      base.buyerVatNo = buyerUser?.vatNo ?? "";
      base.buyerPersonalId = buyerUser?.personalId ?? "";
      base.buyerAddress = buyerUser?.address ?? "";
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
