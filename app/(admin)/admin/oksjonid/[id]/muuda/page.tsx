import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import {
  AuctionForm,
  EMPTY_AUCTION,
  type AuctionFormValues,
} from "@/components/admin/auction-form";

export const dynamic = "force-dynamic";

/** Format a Date for a datetime-local input in Estonian local time */
function toLocalInput(date: Date | null): string {
  if (!date) return "";
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Tallinn",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  return parts.replace(" ", "T");
}

export default async function EditAuctionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const auction = await db.auction.findUnique({
    where: { id },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });
  if (!auction) notFound();

  const asRecord = (value: unknown): Record<string, string> => {
    const base: Record<string, string> = { et: "", en: "", ru: "", lv: "", lt: "" };
    if (value && typeof value === "object") {
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        if (typeof v === "string") base[k] = v;
      }
    }
    return base;
  };

  const initial: AuctionFormValues = {
    ...EMPTY_AUCTION,
    id: auction.id,
    status: auction.status,
    auctionType: auction.auctionType,
    title: asRecord(auction.title),
    description: asRecord(auction.description),
    make: auction.make,
    model: auction.model,
    year: auction.year?.toString() ?? "",
    firstRegDate: auction.firstRegDate ?? "",
    regNumber: auction.regNumber ?? "",
    vinCode: auction.vinCode ?? "",
    fuelType: auction.fuelType ?? "",
    engineVolume: auction.engineVolume?.toString() ?? "",
    enginePower: auction.enginePower?.toString() ?? "",
    gearbox: auction.gearbox ?? "",
    drivenAxle: auction.drivenAxle ?? "",
    odometer: auction.odometer?.toString() ?? "",
    climateControl: auction.climateControl ?? "",
    seats: auction.seats?.toString() ?? "",
    color: auction.color ?? "",
    condition: auction.condition ?? "",
    vatPercent: auction.vatPercent.toString(),
    customAttributes: Array.isArray(auction.customAttributes)
      ? (auction.customAttributes as { key: string; value: string }[])
      : [],
    startingPrice: auction.startingPrice.toString(),
    reservePrice: auction.reservePrice?.toString() ?? "",
    auctionStart: toLocalInput(auction.auctionStart),
    auctionEnd: toLocalInput(auction.auctionEnd),
    phoneAuctionActive: auction.phoneAuctionActive,
    phoneAuctionEnd: toLocalInput(auction.phoneAuctionEnd),
    images: auction.images.map((image) => ({ url: image.url, alt: image.alt ?? "" })),
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Muuda oksjonit</h1>
      <AuctionForm initial={initial} />
    </div>
  );
}
