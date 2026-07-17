"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { ImageOff, Phone } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { formatCurrency } from "@/lib/utils";
import { getPusherClient } from "@/lib/pusher-client";
import { StatusBadge } from "./status-badge";
import { CountdownTimer } from "./countdown-timer";
import type { AuctionStatus } from "@prisma/client";

export interface AuctionCardProps {
  auction: {
    id: string;
    slug: string;
    title: string;
    status: AuctionStatus;
    currentBid: number | null;
    startingPrice: number;
    finalPrice?: number | null;
    auctionEnd: string;
    imageUrl?: string | null;
    imageAlt?: string | null;
    bidCount: number;
  };
}

export function AuctionCard({ auction }: AuctionCardProps) {
  const t = useTranslations("auction");
  const router = useRouter();
  const isActive = auction.status === "ACTIVE";
  const isPhone = auction.status === "PHONE_AUCTION";

  // Live current bid + bid count, so listings reflect new bids (incl. phone
  // bids entered by an admin) without a manual refresh. Instant via Pusher when
  // configured, with a polling safety net.
  const [liveBid, setLiveBid] = useState(auction.currentBid);
  const [liveCount, setLiveCount] = useState(auction.bidCount);

  useEffect(() => {
    if (auction.status !== "ACTIVE" && auction.status !== "PHONE_AUCTION") return;

    const pusher = getPusherClient();
    let channel: ReturnType<NonNullable<typeof pusher>["subscribe"]> | null = null;
    if (pusher) {
      channel = pusher.subscribe(`auction-${auction.id}`);
      channel.bind("bid-placed", (data: { amount: number; bids?: unknown[] }) => {
        setLiveBid(data.amount);
        if (Array.isArray(data.bids)) setLiveCount(data.bids.length);
      });
    }

    const poll = async () => {
      if (document.hidden) return;
      try {
        const res = await fetch(`/api/auction-state/${auction.id}`, { cache: "no-store" });
        if (!res.ok) return;
        const data: { currentBid: number | null; bids: unknown[] } = await res.json();
        setLiveBid(data.currentBid);
        if (Array.isArray(data.bids)) setLiveCount(data.bids.length);
      } catch {
        // transient error — next tick retries
      }
    };
    const interval = setInterval(poll, pusher ? 45_000 : 20_000);

    return () => {
      if (pusher && channel) {
        channel.unbind_all();
        pusher.unsubscribe(`auction-${auction.id}`);
      }
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auction.id, auction.status]);

  const currentBid = liveBid;
  const bidCount = Math.max(liveCount, auction.bidCount);
  const price =
    auction.status === "SOLD" || auction.status === "ENDED"
      ? auction.finalPrice ?? currentBid
      : currentBid;

  return (
    <Link
      href={`/oksjon/${auction.slug}`}
      className="group overflow-hidden rounded-md border border-border bg-surface transition-all duration-200 hover:-translate-y-1 hover:border-primary/60 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-header">
        {auction.imageUrl ? (
          <Image
            src={auction.imageUrl}
            alt={auction.imageAlt ?? auction.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted">
            <ImageOff className="h-10 w-10" />
          </div>
        )}
        <div className="absolute left-3 top-3">
          <StatusBadge status={auction.status} />
        </div>
      </div>

      <div className="p-4">
        <h3 className="line-clamp-2 font-heading text-base font-semibold leading-snug">
          {auction.title}
        </h3>

        <div className="mt-3 flex items-end justify-between gap-2">
          <div>
            <p className="text-xs text-muted">
              {price != null ? t("currentBid") : t("startingPrice")}
            </p>
            <p className="text-lg font-bold text-primary">
              {formatCurrency(price ?? auction.startingPrice)}
            </p>
          </div>
          <span className="text-xs text-muted">
            {bidCount > 0 ? `${bidCount}×` : t("noBids")}
          </span>
        </div>

        <div className="mt-3 border-t border-border pt-3">
          {isActive ? (
            <CountdownTimer
              endsAt={auction.auctionEnd}
              compact
              onExpire={() => router.refresh()}
            />
          ) : isPhone ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-warning">
              <Phone className="h-3.5 w-3.5" />
              {t("phoneAuctionBanner")}
            </span>
          ) : (
            <span className="text-sm text-muted">{t("auctionEnded")}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
