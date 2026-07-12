"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AuctionCard, type AuctionCardProps } from "./auction-card";

type CardData = AuctionCardProps["auction"];

interface AuctionGridProps {
  initialAuctions: CardData[];
  initialHasMore: boolean;
  auctionType?: string;
}

export function AuctionGrid({
  initialAuctions,
  initialHasMore,
  auctionType,
}: AuctionGridProps) {
  const t = useTranslations("auctions");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [auctions, setAuctions] = useState(initialAuctions);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  async function loadMore() {
    setLoading(true);
    try {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(page + 1));
      params.set("locale", locale);
      if (auctionType) params.set("type", auctionType);
      const res = await fetch(`/api/auctions?${params.toString()}`);
      if (!res.ok) throw new Error("load failed");
      const data: { auctions: CardData[]; hasMore: boolean } = await res.json();
      setAuctions((prev) => [...prev, ...data.auctions]);
      setHasMore(data.hasMore);
      setPage((p) => p + 1);
    } catch {
      // keep the button so the user can retry
    } finally {
      setLoading(false);
    }
  }

  if (auctions.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-lg border border-border bg-surface py-24 text-muted">
        {t("noResults")}
      </div>
    );
  }

  return (
    <div className="flex-1">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {auctions.map((auction) => (
          <AuctionCard key={auction.slug} auction={auction} />
        ))}
      </div>
      {hasMore && (
        <div className="mt-8 flex justify-center">
          <Button variant="secondary" size="lg" onClick={loadMore} disabled={loading}>
            {loading ? "…" : t("loadMore")}
          </Button>
        </div>
      )}
    </div>
  );
}
