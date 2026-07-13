import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getAuctionBySlug } from "@/lib/auctions";
import { runStatusTransitions } from "@/lib/auction-status";
import { serializePublicBids } from "@/lib/bids";
import { localized } from "@/lib/utils";
import { ImageGallery } from "@/components/auction/image-gallery";
import { AttributesTable } from "@/components/auction/attributes-table";
import { BidPanel } from "@/components/auction/bid-panel";
import { PhoneAuctionBanner } from "@/components/auction/phone-auction-banner";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const auction = await getAuctionBySlug(slug).catch(() => null);
  if (!auction) return {};
  return { title: localized(auction.title, locale) };
}

export default async function AuctionPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  await runStatusTransitions().catch(() => 0);

  const [auction, session] = await Promise.all([
    getAuctionBySlug(slug).catch(() => null),
    auth(),
  ]);

  if (!auction || auction.status === "DRAFT") notFound();

  const title = localized(auction.title, locale);
  const description = localized(auction.description, locale);

  // Web bids merged with confirmed phone bids; the best of them is the
  // authoritative current bid shown publicly
  const bids = await serializePublicBids(auction.id);
  const effectiveCurrentBid =
    Math.max(auction.currentBid ?? 0, bids[0]?.amount ?? 0) || null;

  const customAttributes = Array.isArray(auction.customAttributes)
    ? (auction.customAttributes as { key: string; value: string }[])
    : null;

  return (
    <>
      {auction.status === "PHONE_AUCTION" && <PhoneAuctionBanner />}

      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold md:text-3xl">{title}</h1>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Left: gallery + specs + description */}
          <div className="space-y-8 lg:col-span-3">
            <ImageGallery
              images={auction.images.map((image) => ({
                url: image.url,
                thumbUrl: image.thumbUrl,
                alt: image.alt,
              }))}
              title={title}
            />

            {description && (
              <div
                className="rich-text rounded-lg border border-border bg-surface p-5"
                dangerouslySetInnerHTML={{ __html: description }}
              />
            )}

            <AttributesTable
              attributes={{
                vatPercent: auction.vatPercent,
                make: auction.make,
                model: auction.model,
                firstRegDate: auction.firstRegDate,
                regNumber: auction.regNumber,
                vinCode: auction.vinCode,
                fuelType: auction.fuelType,
                engineVolume: auction.engineVolume,
                enginePower: auction.enginePower,
                gearbox: auction.gearbox,
                drivenAxle: auction.drivenAxle,
                odometer: auction.odometer,
                climateControl: auction.climateControl,
                seats: auction.seats,
                color: auction.color,
                condition: auction.condition,
                auctionType: auction.auctionType,
                customAttributes,
              }}
            />
          </div>

          {/* Right: bid panel */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-20">
              <BidPanel
                auction={{
                  id: auction.id,
                  slug: auction.slug,
                  status: auction.status,
                  currentBid: effectiveCurrentBid,
                  startingPrice: auction.startingPrice,
                  bidIncrement: auction.bidIncrement,
                  finalPrice: auction.finalPrice,
                  auctionEnd: auction.auctionEnd.toISOString(),
                  reserveMet: auction.reserveMet,
                }}
                bids={bids}
                viewer={{
                  loggedIn: Boolean(session?.user),
                  verified: Boolean(session?.user?.verified),
                  userId: session?.user?.id,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
