"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Gavel, TriangleAlert } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDateTime, cn } from "@/lib/utils";
import { getPusherClient } from "@/lib/pusher-client";
import { CountdownTimer } from "./countdown-timer";
import { StatusBadge } from "./status-badge";
import type { AuctionStatus } from "@prisma/client";

export interface SerializedBid {
  id: string;
  initials: string;
  amount: number;
  createdAt: string;
}

interface BidPanelProps {
  auction: {
    id: string;
    slug: string;
    status: AuctionStatus;
    currentBid: number | null;
    startingPrice: number;
    finalPrice: number | null;
    auctionEnd: string;
    reserveMet: boolean;
  };
  bids: SerializedBid[];
  minIncrement: number;
  viewer: { loggedIn: boolean; verified: boolean; userId?: string };
}

export function BidPanel({ auction, bids: initialBids, minIncrement, viewer }: BidPanelProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  const [status, setStatus] = useState(auction.status);
  const [currentBid, setCurrentBid] = useState(auction.currentBid);
  const [bids, setBids] = useState(initialBids);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const minBid = (currentBid ?? auction.startingPrice - minIncrement) + minIncrement;
  const isActive = status === "ACTIVE";
  const isPhone = status === "PHONE_AUCTION";

  // Real-time updates via Pusher
  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) return;
    const channel = pusher.subscribe(`auction-${auction.id}`);

    channel.bind(
      "bid-placed",
      (data: { amount: number; bids: SerializedBid[] }) => {
        setCurrentBid(data.amount);
        if (data.bids) setBids(data.bids);
      }
    );
    channel.bind("auction-ended", () => {
      setStatus("ENDED");
      router.refresh();
    });
    channel.bind("phone-auction-started", () => {
      setStatus("PHONE_AUCTION");
      router.refresh();
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`auction-${auction.id}`);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auction.id]);

  async function placeBid(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const value = Number(amount.replace(",", "."));
    if (!Number.isFinite(value) || value < minBid) {
      setMessage({
        type: "error",
        text: t("bid.bidTooLow", { amount: formatCurrency(minBid) }),
      });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/bids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auctionId: auction.id, amount: value }),
      });
      const data = await res.json();
      if (!res.ok) {
        const text =
          data.error === "BID_TOO_LOW"
            ? t("bid.bidTooLow", { amount: formatCurrency(data.minBid ?? minBid) })
            : data.error === "NOT_ACTIVE"
              ? t("bid.auctionNotActive")
              : data.error === "NOT_VERIFIED"
                ? t("bid.verifyToBid")
                : t("bid.bidError");
        setMessage({ type: "error", text });
      } else {
        setCurrentBid(value);
        if (data.bids) setBids(data.bids);
        setAmount("");
        setMessage({ type: "success", text: t("bid.bidSuccess") });
      }
    } catch {
      setMessage({ type: "error", text: t("bid.bidError") });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="flex items-center justify-between">
          <StatusBadge status={status} />
          {isActive && (
            <CountdownTimer
              endsAt={auction.auctionEnd}
              onExpire={() => router.refresh()}
            />
          )}
        </div>

        <div className="mt-5">
          <p className="text-sm text-muted">
            {currentBid != null
              ? isActive || isPhone
                ? t("auction.currentBid")
                : t("auction.bestBid")
              : t("auction.startingPrice")}
          </p>
          <p className="mt-1 font-heading text-4xl font-bold text-primary-hover">
            {formatCurrency(currentBid ?? auction.startingPrice)}
          </p>
          {!isActive && !isPhone && auction.finalPrice == null && currentBid != null && !auction.reserveMet && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-warning">
              <TriangleAlert className="h-4 w-4" />
              {t("auction.reserveNotMet")}
            </p>
          )}
        </div>

        <p className="mt-3 text-xs text-muted">
          {t("auction.endsAt")}: {formatDateTime(auction.auctionEnd, locale)}
        </p>

        {/* Bid form */}
        {isActive && (
          <div className="mt-5 border-t border-border pt-5">
            {!viewer.loggedIn ? (
              <Link href="/logi-sisse">
                <Button className="w-full" size="lg">
                  {t("bid.loginToBid")}
                </Button>
              </Link>
            ) : !viewer.verified ? (
              <div className="rounded-md border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
                {t("bid.verifyToBid")}
              </div>
            ) : (
              <form onSubmit={placeBid} className="space-y-3">
                <div>
                  <label htmlFor="bid-amount" className="mb-1.5 block text-sm text-muted">
                    {t("bid.yourBid")}
                  </label>
                  <Input
                    id="bid-amount"
                    inputMode="decimal"
                    placeholder={String(minBid)}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                  <p className="mt-1.5 text-xs text-muted">
                    {t("bid.minBid", { amount: formatCurrency(minBid) })}
                  </p>
                </div>
                <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                  <Gavel className="h-4 w-4" />
                  {t("bid.placeBid")}
                </Button>
                <p className="text-center text-xs text-muted">{t("bid.mustBe18")}</p>
              </form>
            )}
            {message && (
              <p
                className={cn(
                  "mt-3 rounded-md p-2.5 text-sm",
                  message.type === "success"
                    ? "bg-success/10 text-success"
                    : "bg-primary/10 text-primary-hover"
                )}
              >
                {message.text}
              </p>
            )}
          </div>
        )}

        {isPhone && (
          <div className="mt-5 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
            {t("auction.phoneAuctionNote")}
          </div>
        )}
      </div>

      {/* Bid history */}
      <div className="rounded-lg border border-border bg-surface">
        <h3 className="border-b border-border px-5 py-3 font-heading font-semibold">
          {t("auction.bidHistory")}
        </h3>
        {bids.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted">{t("auction.noBids")}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-2.5 font-medium">{t("auction.bidder")}</th>
                <th className="px-5 py-2.5 font-medium">{t("auction.amount")}</th>
                <th className="px-5 py-2.5 font-medium">{t("auction.time")}</th>
              </tr>
            </thead>
            <tbody>
              {bids.map((bid, index) => (
                <tr key={bid.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-2.5 font-medium">{bid.initials}</td>
                  <td
                    className={cn(
                      "px-5 py-2.5 font-semibold",
                      index === 0 ? "text-success" : "text-foreground"
                    )}
                  >
                    {formatCurrency(bid.amount)}
                  </td>
                  <td className="px-5 py-2.5 text-muted">
                    {formatDateTime(bid.createdAt, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
